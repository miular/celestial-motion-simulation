import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BodyPanel } from "./components/BodyPanel";
import { BottomControls } from "./components/BottomControls";
import { Scene3D } from "./components/Scene3D";
import { SYSTEM_OPTIONS, SYSTEMS } from "./data/systems";
import { useSimulation } from "./hooks/useSimulation";

const DEFAULT_SYSTEM = SYSTEMS.inclined_triple ? "inclined_triple" : SYSTEM_OPTIONS[0].key;

export default function App() {
  const [systemKey, setSystemKey] = useState(DEFAULT_SYSTEM);
  const [running, setRunning] = useState(true);
  const [speedFactor, setSpeedFactor] = useState(24);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showTrails, setShowTrails] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [panelOpen, setPanelOpen] = useState(() => window.matchMedia("(min-width: 781px)").matches);

  const initialBodies = useMemo(() => SYSTEMS[systemKey], [systemKey]);
  const { snapshot, error, reset, advanceOnce, trailEpoch } = useSimulation(initialBodies, running, speedFactor);
  const bodies = snapshot?.bodies ?? initialBodies.map((body) => ({ ...body, acceleration: [0, 0, 0] as [number, number, number] }));
  const elapsedSeconds = snapshot?.elapsedSeconds ?? 0;

  useEffect(() => setSelectedIndex(0), [systemKey]);

  return (
    <main className={`app-shell ${panelOpen ? "panel-open" : "panel-closed"}`}>
      <section className="viewport" aria-label="三维轨道观测区">
        <Scene3D
          bodies={bodies}
          initialBodies={initialBodies}
          systemKey={systemKey}
          selectedIndex={selectedIndex}
          showGrid={showGrid}
          showLabels={showLabels}
          showTrails={showTrails}
          trailEpoch={trailEpoch}
          onSelect={setSelectedIndex}
        />
        {error && <div className="error-banner" role="alert">Simulation error: {error}</div>}
      </section>

      <AppHeader
        systemKey={systemKey}
        systems={SYSTEM_OPTIONS}
        elapsedSeconds={elapsedSeconds}
        panelOpen={panelOpen}
        onSystemChange={setSystemKey}
        onTogglePanel={() => setPanelOpen((value) => !value)}
      />

      <div
        className="body-panel-wrapper"
        aria-hidden={!panelOpen}
        {...(!panelOpen ? { inert: "" } : {})}
      >
        <BodyPanel bodies={bodies} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      </div>

      <BottomControls
        running={running}
        speedFactor={speedFactor}
        showTrails={showTrails}
        showLabels={showLabels}
        showGrid={showGrid}
        onRunningChange={setRunning}
        onSpeedChange={setSpeedFactor}
        onReset={reset}
        onStep={advanceOnce}
        onTrailsChange={setShowTrails}
        onLabelsChange={setShowLabels}
        onGridChange={setShowGrid}
      />
    </main>
  );
}
