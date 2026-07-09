import './App.css';

const launcherStyles = `
  :root {
    color-scheme: dark;
    font-family: Inter, system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.22), transparent 28%),
      radial-gradient(circle at top right, rgba(245, 158, 11, 0.18), transparent 24%),
      linear-gradient(180deg, #050816 0%, #0b1220 44%, #04070d 100%);
    color: #f8fafc;
  }
  .launcher {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .panel {
    width: min(920px, 100%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 28px;
    background: rgba(15, 23, 42, 0.74);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 90px rgba(0,0,0,0.35);
    padding: 28px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(56,189,248,0.22);
    background: rgba(56,189,248,0.12);
    color: #d8f3ff;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    letter-spacing: .18em;
    text-transform: uppercase;
  }
  h1 {
    margin: 18px 0 12px;
    font-size: clamp(2.3rem, 5vw, 4.8rem);
    line-height: .95;
    letter-spacing: -0.06em;
  }
  .lead {
    max-width: 60ch;
    color: rgba(226,232,240,.76);
    line-height: 1.7;
    font-size: 1rem;
  }
  .grid {
    display: grid;
    gap: 16px;
    margin-top: 28px;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  }
  .card {
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(2, 6, 23, 0.56);
    border-radius: 22px;
    padding: 18px;
  }
  .card h2 { margin: 0 0 8px; font-size: 1rem; }
  .card p { margin: 0; color: rgba(226,232,240,.7); line-height: 1.6; font-size: .95rem; }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 28px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 18px;
    border-radius: 16px;
    font-weight: 700;
    text-decoration: none;
  }
  .btn.primary {
    background: linear-gradient(135deg, #fbbf24, #fb923c);
    color: #08111f;
  }
  .btn.secondary {
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.04);
    color: #f8fafc;
  }
  .meta {
    margin-top: 18px;
    color: rgba(148,163,184,.92);
    font-size: .9rem;
    line-height: 1.65;
  }
`;

function App() {
  return (
    <main className="launcher">
      <style>{launcherStyles}</style>
      <section className="panel">
        <div className="badge">Anthola starter window</div>
        <h1>Open the real Anthola booking app</h1>
        <p className="lead">
          This nested project is a lightweight launcher. The full register, login, bus booking,
          tour package, payment upload, and admin verification flow lives in the main Anthola app
          served by the backend.
        </p>

        <div className="actions">
          <a className="btn primary" href="http://localhost:5000/" target="_blank" rel="noreferrer">
            Open Main App
          </a>
          <a className="btn secondary" href="http://localhost:5000/admin" target="_blank" rel="noreferrer">
            Open Admin
          </a>
        </div>

        <div className="grid">
          <div className="card">
            <h2>Default accounts</h2>
            <p>
              Admin: <strong>admin / admin123</strong>
              <br />
              Owner: <strong>owner / owner123</strong>
            </p>
          </div>
          <div className="card">
            <h2>Register users</h2>
            <p>Use the main app to create customer accounts, book seats, and upload payment proof.</p>
          </div>
          <div className="card">
            <h2>Friendly errors</h2>
            <p>409 now means a duplicate account or booking, and 401 means the credentials need another look.</p>
          </div>
        </div>

        <p className="meta">
          If you want the nested app to become the full app too, I can wire it to the same root
          frontend next. For now this keeps the launcher simple and buildable on its own.
        </p>
      </section>
    </main>
  );
}

export default App;
