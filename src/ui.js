import { T, F } from "./theme";

export const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:T.card,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:20,border:`0.5px solid ${T.glassBorder}`,boxShadow:T.s2,...style,cursor:onClick?"pointer":"default"}}>{children}</div>
);

export const Row = ({children,last,onClick,style={}}) => (
  <div onClick={onClick} style={{padding:"13px 16px",display:"flex",alignItems:"center",borderBottom:last?"none":`0.5px solid ${T.sep}`,background:T.white,cursor:onClick?"pointer":"default",...style}}>{children}</div>
);

export const Ring = ({pct,size=72,stroke=6}) => {
  const r=(size-stroke*2)/2, c=2*Math.PI*r;
  const col=pct>=80?T.green:pct>=40?T.orange:T.red;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.sep} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} strokeLinecap="round"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:size>60?14:11,fontWeight:700,color:T.label,fontFamily:F}}>{pct}%</span>
      </div>
    </div>
  );
};

// Feste Kopfzeile: Fahrschul-Name links, optional "Zurück", immer "Abmelden" rechts.
// fahrschuleName kommt dynamisch aus der geladenen Fahrschule (TenantApp.js).
export const TopBar = ({isLehrer,onBack,onLogout,fahrschuleName}) => (
  <div style={{position:"sticky",top:0,zIndex:100,background:T.navBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`0.5px solid ${T.sep}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:F}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {onBack&&<button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:T.blue,fontSize:15,fontWeight:500,fontFamily:F,padding:"6px 10px 6px 0"}}>← Zurück</button>}
      {!onBack&&<>
        <span style={{fontSize:20,fontWeight:700,color:T.label,letterSpacing:-0.3}}>{fahrschuleName||"Fahrschule"}</span>
        <span style={{background:isLehrer?T.red:T.blue,color:"#fff",borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:0.3}}>{isLehrer?"LEHRER":"SCHÜLER"}</span>
      </>}
    </div>
    <button onClick={onLogout} style={{background:"#fff",border:`0.5px solid ${T.sep}`,borderRadius:999,padding:"8px 16px",fontSize:14,fontWeight:600,cursor:"pointer",color:T.red,fontFamily:F,boxShadow:T.s1}}>Abmelden</button>
  </div>
);

// Zentrierter Content-Container statt volle Bildschirmbreite
export const Page = ({children}) => (
  <div style={{maxWidth:880,margin:"0 auto",padding:"20px 20px 40px"}}>{children}</div>
);
