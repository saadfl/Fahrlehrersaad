import { useState } from "react";
import { supabase } from "./supabase";

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
    setUser({ rolle: "schueler", name: data.name });
  };

  if (user) return (
    <div style={{ minHeight: "100vh", background: "#0f1923", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Fahrlehrer Saad</h1>
        <p style={{ color: "#8fa3b8", marginBottom: 24 }}>Hallo, {user.rolle === "lehrer" ? "Fahrlehrer Saad" : user.name}!</p>
        <p style={{ color: "#10b981", marginBottom: 24 }}>App läuft erfolgreich!</p>
        <button onClick={() => setUser(null)} style={{ background: "#e63946", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 14 }}>Abmelden</button>
      </div>
    </div>
  );

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
