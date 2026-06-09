const panels = [
  "Platform overview",
  "User moderation",
  "Feed operations",
  "Notifications",
  "Media pipelines",
  "Search health",
];

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Dashboard Scaffold</p>
        <h1>Control plane for your X-like platform.</h1>
        <p className="lede">
          This Vite app is intentionally light on product logic and ready for platform modules,
          moderation tooling, and service observability views.
        </p>
      </section>
      <section className="grid">
        {panels.map((panel) => (
          <article className="card" key={panel}>
            <h2>{panel}</h2>
            <p>Template module placeholder for future implementation.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
