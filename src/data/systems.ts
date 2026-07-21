import galaxyData from "../../galaxy.json";
import type { BodyConfig, SystemCatalog, Vec3 } from "../types";

const DISPLAY_NAMES: Record<string, string> = {
  inclined_triple: "Inclined Triple",
  figure_eight_three_body: "Figure Eight",
  sun_earth_moon: "Sun · Earth · Moon",
  inner_planets: "Inner Planets",
  binary_star: "Binary Star",
  trojan_asteroids: "Trojan Asteroids",
  circumbinary_planet: "Circumbinary",
  rosette_ring: "Rosette Ring",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid numeric field: ${key}`);
  }
  return value;
}

function vector3(value: unknown, key: string): Vec3 {
  if (!Array.isArray(value) || value.length < 2 || value.length > 3) {
    throw new Error(`${key} must contain two or three numbers`);
  }
  if (!value.every((component) => typeof component === "number" && Number.isFinite(component))) {
    throw new Error(`${key} contains a non-numeric component`);
  }
  return [value[0], value[1], value[2] ?? 0];
}

function normalizeBody(value: unknown): BodyConfig {
  if (!isRecord(value)) {
    throw new Error("Body configuration must be an object");
  }
  const { name, color } = value;
  if (typeof name !== "string" || typeof color !== "string") {
    throw new Error("Body name and color must be strings");
  }
  return {
    name,
    color,
    mass: numberField(value, "mass"),
    size: numberField(value, "size"),
    position: vector3(value.position, "position"),
    velocity: vector3(value.velocity, "velocity"),
  };
}

function normalizeCatalog(value: unknown): SystemCatalog {
  if (!isRecord(value)) {
    throw new Error("Galaxy catalog must be an object");
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, bodies]) => {
      if (!Array.isArray(bodies) || bodies.length === 0) {
        throw new Error(`System ${key} must contain at least one body`);
      }
      return [key, bodies.map(normalizeBody)];
    }),
  );
}

export const SYSTEMS = normalizeCatalog(galaxyData);

export const SYSTEM_OPTIONS = Object.keys(SYSTEMS).map((key) => ({
  key,
  label: DISPLAY_NAMES[key] ?? key.replaceAll("_", " "),
}));
