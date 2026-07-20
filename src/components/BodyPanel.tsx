import type { BodyState } from "../types";

const AU = 1.495978707e11;

interface BodyPanelProps {
  bodies: BodyState[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function massLabel(mass: number): string {
  return `${mass.toExponential(3)} kg`;
}

function speedLabel(body: BodyState): string {
  return `${(Math.hypot(...body.velocity) / 1_000).toFixed(3)} km/s`;
}

export function BodyPanel({ bodies, selectedIndex, onSelect }: BodyPanelProps) {
  const body = bodies[selectedIndex];
  if (!body) return null;

  return (
    <aside className="body-panel" aria-label="天体信息">
      <section className="selected-body">
        <h2>Selected body</h2>
        <div className="selected-name">
          <span className="body-dot" style={{ backgroundColor: body.color }} />
          <strong>{body.name}</strong>
        </div>
        <dl>
          <div>
            <dt>Mass</dt>
            <dd>{massLabel(body.mass)}</dd>
          </div>
          <div>
            <dt>Speed</dt>
            <dd>{speedLabel(body)}</dd>
          </div>
          <div className="position-data">
            <dt>Position</dt>
            <dd>
              <span><b>X</b>{(body.position[0] / AU).toFixed(4)} AU</span>
              <span><b>Y</b>{(body.position[1] / AU).toFixed(4)} AU</span>
              <span><b>Z</b>{(body.position[2] / AU).toFixed(4)} AU</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="body-browser">
        <h2>Bodies</h2>
        <div className="body-list">
          {bodies.map((item, index) => (
            <button
              key={item.name}
              className={index === selectedIndex ? "selected" : ""}
              onClick={() => onSelect(index)}
              aria-pressed={index === selectedIndex}
            >
              <span className="body-dot" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
              <small>{(item.mass / 1.989e30).toPrecision(2)} M☉</small>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
