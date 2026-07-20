import { Check, Pause, Play, RotateCcw, StepForward } from "lucide-react";

const SPEEDS = [1, 6, 24, 96] as const;

interface BottomControlsProps {
  running: boolean;
  speedFactor: number;
  showTrails: boolean;
  showLabels: boolean;
  showGrid: boolean;
  onRunningChange: (value: boolean) => void;
  onSpeedChange: (value: number) => void;
  onReset: () => void;
  onStep: () => void;
  onTrailsChange: (value: boolean) => void;
  onLabelsChange: (value: boolean) => void;
  onGridChange: (value: boolean) => void;
}

export function BottomControls(props: BottomControlsProps) {
  return (
    <div className="bottom-controls" aria-label="模拟控制">
      <div className="transport-controls">
        <button className="control-button" onClick={() => props.onRunningChange(!props.running)}>
          {props.running ? <Pause /> : <Play />}
          <span>{props.running ? "Pause" : "Play"}</span>
        </button>
        <button className="control-button compact" onClick={props.onStep} disabled={props.running}>
          <StepForward />
          <span>Step</span>
        </button>
        <button className="control-button compact" onClick={props.onReset}>
          <RotateCcw />
          <span>Reset</span>
        </button>
      </div>

      <div className="control-divider" />

      <div className="speed-controls" aria-label="模拟速度">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            className={props.speedFactor === speed ? "selected" : ""}
            onClick={() => props.onSpeedChange(speed)}
            aria-pressed={props.speedFactor === speed}
          >
            {speed}×
          </button>
        ))}
      </div>

      <div className="control-divider" />

      <div className="display-controls">
        <button className={props.showTrails ? "active" : ""} onClick={() => props.onTrailsChange(!props.showTrails)} aria-pressed={props.showTrails}>
          <Check /> Trails
        </button>
        <button className={props.showLabels ? "active" : ""} onClick={() => props.onLabelsChange(!props.showLabels)} aria-pressed={props.showLabels}>
          <Check /> Labels
        </button>
        <button className={props.showGrid ? "active" : ""} onClick={() => props.onGridChange(!props.showGrid)} aria-pressed={props.showGrid}>
          <Check /> Grid
        </button>
      </div>
    </div>
  );
}
