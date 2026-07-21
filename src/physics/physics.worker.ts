/// <reference lib="webworker" />

import { createState, stepVelocityVerlet } from "./engine";
import type { BodyConfig, BodyState, WorkerCommand, WorkerResponse } from "../types";

const workerScope = self as unknown as DedicatedWorkerGlobalScope;
let initialBodies: BodyConfig[] = [];
let bodies: BodyState[] = [];
let elapsedSeconds = 0;
let dt = 900;

function respond(message: WorkerResponse): void {
  workerScope.postMessage(message);
}

function snapshot(): void {
  respond({ type: "snapshot", snapshot: { bodies, elapsedSeconds } });
}

workerScope.onmessage = (event: MessageEvent<WorkerCommand>) => {
  try {
    const command = event.data;
    if (command.type === "init") {
      initialBodies = command.bodies;
      bodies = createState(initialBodies);
      dt = command.dt;
      elapsedSeconds = 0;
      snapshot();
      return;
    }
    if (command.type === "reset") {
      bodies = createState(initialBodies);
      elapsedSeconds = 0;
      snapshot();
      return;
    }
    if (command.type === "advance") {
      const steps = Math.max(1, Math.min(command.steps, 256));
      for (let index = 0; index < steps; index += 1) {
        bodies = stepVelocityVerlet(bodies, dt);
      }
      elapsedSeconds += steps * dt;
      snapshot();
    }
  } catch (error: unknown) {
    respond({ type: "error", message: error instanceof Error ? error.message : "Physics worker failed" });
  }
};
