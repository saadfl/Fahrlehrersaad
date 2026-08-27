import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const COLORS = {
  bg: "#0f1923",
  card: "#1a2638",
  border: "#2a3f5a",
  muted: "#8fa3b8",
  accent: "#e63946",
  success: "#10b981",
};

function DashboardShell({ title, subtitle, onLogout, children }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "sans-serif", color: "#fff" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>🚗</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: COLORS.muted }}>{subtitle}</div>}
          </div>
        </div>
        <button onClick={onLogout} style={{ background: "transparent", color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
          Abmelden
        </button>
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}

function LehrerDashboard({ onLogout }) {
  const tabs = ["Schüler", "Termine", "Einstellungen"];
  const [active, setActive] = useState(tabs[0]);

  return (
    <DashboardShell title="Fahrlehrer Saad" subtitle="Lehrer-Bereich" onLogout={onLogout}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}` }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActive(tab)}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: active === tab ? "#fff" : COLORS.muted,
              borderBottom: active === tab ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              padding: "10px 4px", fontSize: 14, fontWeight: active === tab ? 700 : 400,
            }}>
            {tab}
          </button>
        ))}
      </div>
      <div style={{ background: COLORS.card, borderRadius: 12, padding: 32, textAlign: "center", color: COLORS.muted }}>
        {active} – bald verfügbar
      </div>
    </DashboardShell>
  );
}

function SchuelerDashboard({ user, onLogout }) {
  const [fortschritt, setFortschritt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ausbildungsfortschritt")
        .select("*")
        .eq("schueler_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setFortschritt(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  const einträge = fortschritt
    ? Object.entries(fortschritt).filter(([key]) => !["id", "schueler_id"].includes(key))
    : [];

  return (
    <DashboardShell title="Fahrlehrer Saad" subtitle={`Hallo, ${user.name}!`} onLogout={onLogout}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Mein Ausbildungsfortschritt</h2>
      {loading && <div style={{ color: COLORS.muted }}>Lade Fortschritt …</div>}
      {!loading && einträge.length === 0 && (
        <div style={{ background: COLORS.card, borderRadius: 12, padding: 32, textAlign: "center", color: COLORS.muted }}>
          Noch keine Fortschrittsdaten vorhanden.
        </div>
      )}
      {!loading && einträge.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {einträge.map(([key, value]) => (
            <div key={key} style={{ background: COLORS.card, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6, textTransform: "capitalize" }}>
                {key.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.success }}>{String(value)}</div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

export default function App() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);

  const login = async () => {
    setErr("");
    if (name.trim().toLowerCase() === "lehrer" && pin === "9999") {
      setUser({ rolle: "lehrer" });
      return;
    }
    const { data, error } = await supabase
      .from("schueler")
      .select("*")
      .ilike("name", name.trim())
      .eq("pin", pin)
      .single();
    if (error || !data) { setErr("Name oder PIN falsch."); return; }
    setUser({ rolle: "schueler", name: data.name, id: data.id });
  };

  if (user?.rolle === "lehrer") return <LehrerDashboard onLogout={() => setUser(null)} />;
  if (user?.rolle === "schueler") return <SchuelerDashboard user={user} onLogout={() => setUser(null)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#0f1923", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#fff" }}>
      <div style={{ background: "#1a2638", borderRadius: 20, padding: 32, width: 320, boxShadow: "0 12px 48px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🚗</div>
          <h1 style={{ fontSize: 24, marginTop: 8 }}>Fahrlehrer <span style={{ color: "#e63946" }}>Saad</span></h1>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: "#8fa3b8", display: "block", marginBottom: 6 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name oder Lehrer"
            style={{ width: "100%", boxSizing: "border-box", background: "#0f1923", border: "1.5px solid #2a3f5a", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none" }}
            onKeyDown={e => e.key === "Enter" && login()} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: "#8fa3b8", display: "block", marginBottom: 6 }}>PIN</label>
          <input value={pin} onChange={e => setPin(e.target.value)} type="password" maxLength={8}
            style={{ width: "100%", boxSizing: "border-box", background: "#0f1923", border: "1.5px solid #2a3f5a", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, letterSpacing: 4, outline: "none" }}
            onKeyDown={e => e.key === "Enter" && login()} />
        </div>
        {err && <div style={{ background: "#fde8ea", color: "#e63946", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <button onClick={login} style={{ width: "100%", background: "#e63946", color: "#fff", border: "none", borderRadius: 8, padding: 13, fontSize: 16, cursor: "pointer", fontWeight: 700 }}>
          Anmelden →
        </button>
      </div>
    </div>
  );
}
