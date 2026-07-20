export type Vec3 = [number, number, number];

export interface BodyConfig {
  name: string;
  mass: number;
  position: Vec3;
  velocity: Vec3;
  color: string;
  size: number;
}

export interface BodyState extends BodyConfig {
  acceleration: Vec3;
}

export interface SimulationSnapshot {
  bodies: BodyState[];
  elapsedSeconds: number;
}

export type SystemCatalog = Record<string, BodyConfig[]>;

export type WorkerCommand =
  | { type: "init"; bodies: BodyConfig[]; dt: number }
  | { type: "advance"; steps: number }
  | { type: "reset" };

export type WorkerResponse =
  | { type: "snapshot"; snapshot: SimulationSnapshot }
  | { type: "error"; message: string };
