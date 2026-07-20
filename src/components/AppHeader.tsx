import { PanelRight } from "lucide-react";

interface AppHeaderProps {
  systemKey: string;
  systems: { key: string; label: string }[];
  elapsedSeconds: number;
  panelOpen: boolean;
  onSystemChange: (key: string) => void;
  onTogglePanel: () => void;
}

export function AppHeader({
  systemKey,
  systems,
  elapsedSeconds,
  panelOpen,
  onSystemChange,
  onTogglePanel,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <h1>Celestial Motion</h1>
      <div className="header-actions">
        <time>Day {(elapsedSeconds / 86_400).toFixed(1)}</time>
        <select
          value={systemKey}
          onChange={(event) => onSystemChange(event.target.value)}
          aria-label="选择星系"
        >
          {systems.map((system) => (
            <option key={system.key} value={system.key}>{system.label}</option>
          ))}
        </select>
        <button
          className={panelOpen ? "panel-toggle active" : "panel-toggle"}
          onClick={onTogglePanel}
          aria-expanded={panelOpen}
          aria-label="显示或隐藏天体信息"
        >
          <PanelRight />
        </button>
      </div>
    </header>
  );
}
