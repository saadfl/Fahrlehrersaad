import { T, F } from "../theme";

// Platzhalter fuer die zukuenftige Verkaufs-/Marketing-Landingpage auf
// der Root-Domain (fahrschulmanager.de ohne Pfad). Wird spaeter durch
// die eigentliche Landingpage ersetzt, in der du deinen Service
// vorstellst. Fuer jetzt reicht ein einfacher Hinweis, damit die Route
// nicht "leer" ist.
export default function Landing() {
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:F,textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>🚗</div>
      <div style={{fontSize:28,fontWeight:700,color:T.label,marginBottom:8}}>Fahrschulmanager</div>
      <div style={{fontSize:15,color:T.label2,maxWidth:400}}>
        Hier entsteht die Vorstellungsseite. Fahrschulen erreichst du unter
        ihrem eigenen Pfad, z.B. <code>/saad</code>.
      </div>
    </div>
  );
}
