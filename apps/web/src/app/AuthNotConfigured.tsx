export function AuthNotConfigured() {
  return (
    <main className="app-shell">
      <section className="intro" aria-labelledby="auth-title">
        <p className="status">Production Safe State</p>
        <h1 id="auth-title">Authentication is not configured.</h1>
        <p className="subtitle">No development identity or demo data is active in this build.</p>
      </section>
    </main>
  );
}
