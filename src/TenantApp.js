import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./supabase";
import { applyBranding, T, F } from "./theme";
import { tenantState } from "./tenant";
import { TenantRoot } from "./TenantScreens";

// Laedt die Fahrschule anhand des :slug aus der URL (z.B. /fahrwerk),
// setzt Branding + tenantState.current, und rendert erst DANACH die
// eigentliche App (Login/LehrerApp/SchuelerApp). Solange geladen wird
// oder der Slug nicht existiert, wird ein passender Zustand angezeigt.
export default function TenantApp() {
  const { slug } = useParams();
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | "notfound"

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    (async () => {
      const { data, error } = await supabase
        .from("fahrschulen")
        .select("*")
        .eq("slug", slug)
        .eq("aktiv", true)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setStatus("notfound");
        return;
      }
      tenantState.current = data;
      applyBranding(data);
      setStatus("ok");
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (status === "loading") {
    return (
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F}}>
        <span style={{fontSize:40}}>⏳</span>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:F,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🔍</div>
        <div style={{fontSize:22,fontWeight:700,color:T.label,marginBottom:8}}>Fahrschule nicht gefunden</div>
        <div style={{fontSize:15,color:T.label2}}>Unter „/{slug}" ist keine aktive Fahrschule hinterlegt.</div>
      </div>
    );
  }

  return <TenantRoot/>;
}
