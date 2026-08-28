import { T, F } from "../theme";
import { H1 } from "../ui";

// Platzhalter fuer die zukuenftige Verkaufs-/Marketing-Landingpage auf
// der Root-Domain (fahrschulmanager.de ohne Pfad). Wird spaeter durch
// die eigentliche Landingpage ersetzt, in der du deinen Service
// vorstellst. Fuer jetzt reicht ein einfacher Hinweis, damit die Route
// nicht "leer" ist.
export default function Landing() {
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:F,textAlign:"center"}}>
      <div style={{width:56,height:56,background:T.accent,display:"flex",alignItems:"flex-end",padding:6,boxSizing:"border-box",marginBottom:20}}>
        <span style={{fontWeight:800,fontSize:22,color:T.bg,lineHeight:1}}>F</span>
      </div>
      <H1 style={{fontSize:28,marginBottom:10}}>Fahrschulmanager</H1>
      <div style={{fontSize:14,color:T.label2,maxWidth:400,lineHeight:1.5}}>
        Hier entsteht die Vorstellungsseite. Fahrschulen erreichst du unter
        ihrem eigenen Pfad, z.B. <code>/saad</code>.
      </div>
    </div>
  );
}
