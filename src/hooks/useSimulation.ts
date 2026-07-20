import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_DT } from "../physics/engine";
import type { BodyConfig, SimulationSnapshot, WorkerCommand, WorkerResponse } from "../types";

interface SimulationControls {
  snapshot: SimulationSnapshot | null;
  error: string | null;
  reset: () => void;
  advanceOnce: () => void;
  trailEpoch: number;
}

export function useSimulation(
  initialBodies: BodyConfig[],
  running: boolean,
  speedFactor: number,
): SimulationControls {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(false);
  const resetPendingRef = useRef(false);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trailEpoch, setTrailEpoch] = useState(0);

  useEffect(() => {
    const worker = new Worker(new URL("../physics/physics.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    pendingRef.current = false;
    resetPendingRef.current = false;
    setSnapshot(null);
    setError(null);
    setTrailEpoch((value) => value + 1);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === "error") {
        pendingRef.current = false;
        resetPendingRef.current = false;
        setError(event.data.message);
        return;
      }

      // An advance may already be queued when Reset is clicked. Ignore that
      // stale snapshot so the scene never jumps away from the reset origin.
      if (resetPendingRef.current && event.data.snapshot.elapsedSeconds !== 0) {
        return;
      }

      pendingRef.current = false;
      resetPendingRef.current = false;
      setSnapshot(event.data.snapshot);
    };

    const command: WorkerCommand = { type: "init", bodies: initialBodies, dt: DEFAULT_DT };
    worker.postMessage(command);

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [initialBodies]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      if (!workerRef.current || pendingRef.current || resetPendingRef.current) return;
      pendingRef.current = true;
      const command: WorkerCommand = { type: "advance", steps: speedFactor };
      workerRef.current.postMessage(command);
    }, 40);
    return () => window.clearInterval(timer);
  }, [running, speedFactor]);

  const reset = useCallback(() => {
    if (!workerRef.current) return;
    pendingRef.current = true;
    resetPendingRef.current = true;
    setSnapshot(null);
    setTrailEpoch((value) => value + 1);
    const command: WorkerCommand = { type: "reset" };
    workerRef.current.postMessage(command);
  }, []);

  const advanceOnce = useCallback(() => {
    if (!workerRef.current || pendingRef.current) return;
    pendingRef.current = true;
    const command: WorkerCommand = { type: "advance", steps: 1 };
    workerRef.current.postMessage(command);
  }, []);

  return { snapshot, error, reset, advanceOnce, trailEpoch };
}
