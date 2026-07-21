import type { BodyConfig, BodyState, Vec3 } from "../types";

export const G = 6.6743e-11;
export const DEFAULT_DT = 900;
const SOFTENING_METERS = 1_000;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (vector: Vec3, factor: number): Vec3 => [
  vector[0] * factor,
  vector[1] * factor,
  vector[2] * factor,
];

export function createState(configs: BodyConfig[]): BodyState[] {
  return configs.map((body) => ({
    ...body,
    position: [...body.position],
    velocity: [...body.velocity],
    acceleration: [0, 0, 0],
  }));
}

export function calculateAccelerations(bodies: BodyState[]): Vec3[] {
  const accelerations = bodies.map<Vec3>(() => [0, 0, 0]);

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const delta: Vec3 = [
        bodies[j].position[0] - bodies[i].position[0],
        bodies[j].position[1] - bodies[i].position[1],
        bodies[j].position[2] - bodies[i].position[2],
      ];
      const distanceSquared =
        delta[0] ** 2 + delta[1] ** 2 + delta[2] ** 2 + SOFTENING_METERS ** 2;
      const inverseDistanceCubed = 1 / (distanceSquared * Math.sqrt(distanceSquared));
      const accelerationI = G * bodies[j].mass * inverseDistanceCubed;
      const accelerationJ = G * bodies[i].mass * inverseDistanceCubed;

      accelerations[i][0] += delta[0] * accelerationI;
      accelerations[i][1] += delta[1] * accelerationI;
      accelerations[i][2] += delta[2] * accelerationI;
      accelerations[j][0] -= delta[0] * accelerationJ;
      accelerations[j][1] -= delta[1] * accelerationJ;
      accelerations[j][2] -= delta[2] * accelerationJ;
    }
  }

  return accelerations;
}

export function stepVelocityVerlet(bodies: BodyState[], dt: number): BodyState[] {
  const accelerationBefore = calculateAccelerations(bodies);
  const nextBodies = bodies.map((body, index) => {
    const velocityTerm = scale(body.velocity, dt);
    const accelerationTerm = scale(accelerationBefore[index], 0.5 * dt * dt);
    return {
      ...body,
      position: add(body.position, add(velocityTerm, accelerationTerm)),
      velocity: [...body.velocity] as Vec3,
      acceleration: accelerationBefore[index],
    };
  });

  const accelerationAfter = calculateAccelerations(nextBodies);
  return nextBodies.map((body, index) => ({
    ...body,
    velocity: add(body.velocity, scale(add(accelerationBefore[index], accelerationAfter[index]), 0.5 * dt)),
    acceleration: accelerationAfter[index],
  }));
}

export function totalEnergy(bodies: BodyState[]): number {
  let kinetic = 0;
  let potential = 0;
  for (let i = 0; i < bodies.length; i += 1) {
    const [vx, vy, vz] = bodies[i].velocity;
    kinetic += 0.5 * bodies[i].mass * (vx * vx + vy * vy + vz * vz);
    for (let j = i + 1; j < bodies.length; j += 1) {
      const dx = bodies[j].position[0] - bodies[i].position[0];
      const dy = bodies[j].position[1] - bodies[i].position[1];
      const dz = bodies[j].position[2] - bodies[i].position[2];
      potential -= (G * bodies[i].mass * bodies[j].mass) / Math.hypot(dx, dy, dz);
    }
  }
  return kinetic + potential;
}
