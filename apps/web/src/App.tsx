import './styles.css';

const pillars = ['Connect', 'Manage', 'Capture'];

export function App() {
  return (
    <main className="app-shell">
      <section className="intro" aria-labelledby="app-title">
        <p className="status">Development Build</p>
        <h1 id="app-title">AI School Platform</h1>
        <div className="pillars" aria-label="Product pillars">
          {pillars.map((pillar) => (
            <span key={pillar}>{pillar}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
