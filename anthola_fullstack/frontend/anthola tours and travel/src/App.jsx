import './App.css';

const destinations = [
  { name: 'Kathmandu', subtitle: 'Temple streets & mountain air' },
  { name: 'Pokhara', subtitle: 'Lake views & sunrise escapes' },
  { name: 'Chitwan', subtitle: 'Wildlife and warm hospitality' },
];

const stats = [
  { label: 'Trusted rides', value: '24k+' },
  { label: 'Happy travellers', value: '98%' },
  { label: 'Live routes', value: '180+' },
];

function App() {
  return (
    <main className="anthola-shell">
      <section className="hero-panel">
        <nav className="topbar">
          <div className="brand">Anthola</div>
          <div className="nav-links">
            <a href="#destinations">Destinations</a>
            <a href="#experience">Experience</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="pill">Nepal-inspired luxury travel</span>
            <h1>Book the scenic route in minutes.</h1>
            <p>
              Discover premium buses, flexible tours, and real-time seat availability across the
              Himalayas and beyond.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="http://localhost:5000/">Explore journeys</a>
              <a className="btn btn-secondary" href="http://localhost:5000/admin">Owner dashboard</a>
            </div>
            <div className="hero-stats">
              {stats.map((item) => (
                <div key={item.label} className="stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="glow glow-one" />
            <div className="glow glow-two" />
            <div className="bus-card">
              <div className="bus-top" />
              <div className="bus-body" />
              <div className="bus-wheel left" />
              <div className="bus-wheel right" />
            </div>
            <div className="mountain mountain-one" />
            <div className="mountain mountain-two" />
          </div>
        </div>
      </section>

      <section id="destinations" className="content-section">
        <div className="section-title">
          <span className="pill">Smart search</span>
          <h2>Popular destinations</h2>
        </div>
        <div className="card-grid">
          {destinations.map((item) => (
            <article className="info-card" key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="experience" className="content-section two-column">
        <div className="info-card large">
          <span className="pill">Why Anthola</span>
          <h2>Modern booking crafted for every traveller.</h2>
          <p>
            This experience now showcases the premium positioning of the platform while keeping the
            main booking flow intact in the production app.
          </p>
        </div>
        <div className="info-card large">
          <span className="pill">Included</span>
          <ul className="feature-list">
            <li>Live seat updates</li>
            <li>Tour packages and guides</li>
            <li>Secure payments and receipts</li>
            <li>Owner analytics and fleet insights</li>
          </ul>
        </div>
      </section>

      <section id="contact" className="content-section footer-cta">
        <h2>Ready for the next journey?</h2>
        <p>Open the main app to continue booking, managing tours, and operating your fleet.</p>
      </section>
    </main>
  );
}

export default App;
