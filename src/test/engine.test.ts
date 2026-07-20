import { describe, expect, it } from "vitest";
import { calculateAccelerations, createState, stepVelocityVerlet, totalEnergy } from "../physics/engine";
import type { BodyConfig } from "../types";

const binary: BodyConfig[] = [
  {
    name: "A",
    mass: 1e26,
    position: [-1e8, 0, 2e7],
    velocity: [0, -4_085, 500],
    color: "#ffffff",
    size: 10,
  },
  {
    name: "B",
    mass: 1e26,
    position: [1e8, 0, -2e7],
    velocity: [0, 4_085, -500],
    color: "#ffffff",
    size: 10,
  },
];

describe("three-dimensional gravity engine", () => {
  it("produces equal and opposite accelerations for equal masses", () => {
    const acceleration = calculateAccelerations(createState(binary));
    expect(acceleration[0][0]).toBeCloseTo(-acceleration[1][0], 12);
    expect(acceleration[0][2]).toBeCloseTo(-acceleration[1][2], 12);
  });

  it("integrates a non-planar orbit without flattening z", () => {
    const initial = createState(binary);
    const next = stepVelocityVerlet(initial, 10);
    expect(next[0].position[2]).not.toBe(initial[0].position[2]);
    expect(next[1].velocity[2]).not.toBe(initial[1].velocity[2]);
  });

  it("keeps short-run energy drift bounded", () => {
    let state = createState(binary);
    const startEnergy = totalEnergy(state);
    for (let index = 0; index < 2_000; index += 1) {
      state = stepVelocityVerlet(state, 10);
    }
    const relativeDrift = Math.abs((totalEnergy(state) - startEnergy) / startEnergy);
    expect(relativeDrift).toBeLessThan(1e-5);
  });
});
