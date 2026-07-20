import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { BodyConfig, BodyState } from "../types";

interface Scene3DProps {
  bodies: BodyState[];
  initialBodies: BodyConfig[];
  systemKey: string;
  selectedIndex: number;
  showGrid: boolean;
  showLabels: boolean;
  showTrails: boolean;
  trailEpoch: number;
  onSelect: (index: number) => void;
}

const MAX_TRAIL_POINTS = 1_200;

function createGlowTexture(color: THREE.Color): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const gradient = context.createRadialGradient(64, 64, 3, 64, 64, 62);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.88)`);
  gradient.addColorStop(0.42, `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.18)`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function createStarField(): THREE.Points {
  const count = 1_400;
  const values = new Float32Array(count * 3);
  let seed = 0x1a2b3c4d;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let index = 0; index < count; index += 1) {
    const radius = 28 + random() * 65;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    values[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    values[index * 3 + 1] = radius * Math.cos(phi);
    values[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(values, 3));
  const material = new THREE.PointsMaterial({ color: 0xb9d2ca, size: 0.035, transparent: true, opacity: 0.72 });
  return new THREE.Points(geometry, material);
}

function worldScaleFor(bodies: BodyConfig[]): number {
  const furthest = Math.max(...bodies.map((body) => Math.hypot(...body.position)), 1);
  return 6.2 / furthest;
}

function toWorld(position: readonly number[], scale: number): THREE.Vector3 {
  return new THREE.Vector3(position[0] * scale, position[2] * scale, position[1] * scale);
}

function writeTrail(line: THREE.Line, points: THREE.Vector3[]): void {
  const attribute = line.geometry.getAttribute("position") as THREE.BufferAttribute;
  points.forEach((point, index) => attribute.setXYZ(index, point.x, point.y, point.z));
  attribute.needsUpdate = true;
  line.geometry.setDrawRange(0, points.length);
}

export function Scene3D({
  bodies,
  initialBodies,
  systemKey,
  selectedIndex,
  showGrid,
  showLabels,
  showTrails,
  trailEpoch,
  onSelect,
}: Scene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const bodyMeshesRef = useRef<THREE.Mesh[]>([]);
  const trailLinesRef = useRef<THREE.Line[]>([]);
  const trailPointsRef = useRef<THREE.Vector3[][]>([]);
  const labelElementsRef = useRef<HTMLSpanElement[]>([]);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldScaleRef = useRef(worldScaleFor(initialBodies));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030608);
    scene.fog = new THREE.FogExp2(0x030608, 0.015);

    const camera = new THREE.PerspectiveCamera(44, mount.clientWidth / mount.clientHeight, 0.05, 180);
    camera.position.set(10, 7.5, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 3;
    controls.maxDistance = 48;
    controls.target.set(0, 0, 0);

    const grid = new THREE.GridHelper(22, 22, 0x4ea78f, 0x16342f);
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.22;
    scene.add(grid);
    gridRef.current = grid;

    const axes = new THREE.AxesHelper(4.5);
    const axesMaterial = axes.material as THREE.Material;
    axesMaterial.transparent = true;
    axesMaterial.opacity = 0.42;
    scene.add(axes);
    scene.add(createStarField());

    const scale = worldScaleFor(initialBodies);
    worldScaleRef.current = scale;
    bodyMeshesRef.current = [];
    trailLinesRef.current = [];
    trailPointsRef.current = [];
    labelElementsRef.current = [];

    const glowTextures: THREE.Texture[] = [];
    initialBodies.forEach((body, index) => {
      const color = new THREE.Color(body.color);
      const radius = Math.max(0.085, Math.min(0.28, body.size / 520));
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 24),
        new THREE.MeshBasicMaterial({ color }),
      );
      sphere.position.copy(toWorld(body.position, scale));
      sphere.userData.bodyIndex = index;
      scene.add(sphere);
      bodyMeshesRef.current.push(sphere);

      const glowTexture = createGlowTexture(color);
      glowTextures.push(glowTexture);
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      glow.scale.setScalar(radius * 7.5);
      sphere.add(glow);

      const trailMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const firstPoint = toWorld(body.position, scale);
      const trailGeometry = new THREE.BufferGeometry();
      const trailAttribute = new THREE.BufferAttribute(new Float32Array(MAX_TRAIL_POINTS * 3), 3);
      trailAttribute.setUsage(THREE.DynamicDrawUsage);
      trailGeometry.setAttribute("position", trailAttribute);
      const line = new THREE.Line(trailGeometry, trailMaterial);
      writeTrail(line, [firstPoint]);
      line.add(new THREE.Points(
        trailGeometry,
        new THREE.PointsMaterial({
          color,
          size: 0.032,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ));
      line.frustumCulled = false;
      scene.add(line);
      trailLinesRef.current.push(line);
      trailPointsRef.current.push([firstPoint]);

      const label = document.createElement("span");
      label.className = "body-label";
      label.textContent = body.name;
      mount.appendChild(label);
      labelElementsRef.current.push(label);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(bodyMeshesRef.current, false)[0];
      if (hit) onSelect(Number(hit.object.userData.bodyIndex));
    };
    renderer.domElement.addEventListener("pointerdown", handlePointer);

    const resizeObserver = new ResizeObserver(() => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    });
    resizeObserver.observe(mount);

    let animationFrame = 0;
    const render = () => {
      controls.update();
      bodyMeshesRef.current.forEach((mesh, index) => {
        const projected = mesh.position.clone().project(camera);
        const label = labelElementsRef.current[index];
        const visible = projected.z < 1;
        const labelOffsetY = ((index % 3) - 1) * 18;
        label.style.transform = `translate(${(projected.x * 0.5 + 0.5) * mount.clientWidth}px, ${(-projected.y * 0.5 + 0.5) * mount.clientHeight}px) translate(10px, ${labelOffsetY}px)`;
        label.dataset.visible = visible ? "true" : "false";
      });
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointer);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      glowTextures.forEach((texture) => texture.dispose());
      labelElementsRef.current.forEach((label) => label.remove());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [initialBodies, onSelect, systemKey]);

  useEffect(() => {
    const scale = worldScaleRef.current;
    bodies.forEach((body, index) => {
      const position = toWorld(body.position, scale);
      bodyMeshesRef.current[index]?.position.copy(position);
      const points = trailPointsRef.current[index];
      if (!points) return;
      const last = points.at(-1);
      if (!last || last.distanceToSquared(position) > 0.00004) {
        points.push(position.clone());
        if (points.length > MAX_TRAIL_POINTS) points.shift();
        const line = trailLinesRef.current[index];
        if (line) writeTrail(line, points);
      }
    });
  }, [bodies]);

  useEffect(() => {
    trailPointsRef.current.forEach((points, index) => {
      const mesh = bodyMeshesRef.current[index];
      if (!mesh) return;
      const origin = mesh.position.clone();
      points.splice(0, points.length, origin);
      const line = trailLinesRef.current[index];
      if (line) writeTrail(line, points);
    });
  }, [trailEpoch]);

  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    trailLinesRef.current.forEach((line) => { line.visible = showTrails; });
  }, [showTrails]);

  useEffect(() => {
    labelElementsRef.current.forEach((label) => { label.hidden = !showLabels; });
  }, [showLabels]);

  useEffect(() => {
    bodyMeshesRef.current.forEach((mesh, index) => {
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = index === selectedIndex ? 1 : 0.72;
      material.transparent = index !== selectedIndex;
      mesh.scale.setScalar(index === selectedIndex ? 1.28 : 1);
    });
  }, [selectedIndex]);

  return <div className="scene-mount" ref={mountRef} role="img" aria-label="可旋转的三维天体轨道模拟场景" />;
}
