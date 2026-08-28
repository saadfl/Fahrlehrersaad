import { T, F } from "./theme";

// ── GRUNDBAUSTEINE ("Modernist": flach, 0px Ecken, Linien statt Schatten) ──

export const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:T.card,border:`1px solid ${T.sep}`,borderRadius:0,...style,cursor:onClick?"pointer":"default"}}>{children}</div>
);

export const Row = ({children,last,onClick,style={}}) => (
  <div onClick={onClick} style={{padding:"12px 0",display:"flex",alignItems:"center",gap:10,borderBottom:last?"none":`1px solid ${T.sep}`,background:"transparent",cursor:onClick?"pointer":"default",fontFamily:F,color:T.label,...style}}>{children}</div>
);

export const Ring = ({pct,size=72,stroke=8}) => {
  const r=(size-stroke*2)/2, c=2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(32,30,29,.14)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.accent} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} strokeLinecap="butt"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontWeight:800,fontSize:size>60?24:14,letterSpacing:"-.03em",color:T.label,fontFamily:F,lineHeight:1}}>{pct}%</span>
      </div>
    </div>
  );
};

// Feste Kopfzeile: Fahrschul-Name links, optional "Zurück", immer "Abmelden" rechts.
// fahrschuleName kommt dynamisch aus der geladenen Fahrschule (TenantApp.js).
export const TopBar = ({onBack,onLogout,fahrschuleName}) => (
  <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(243,242,242,.94)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",borderBottom:`2px solid ${T.sep2}`,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,fontFamily:F}}>
    {onBack&&<button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",color:T.accent,fontSize:13,fontWeight:800,fontFamily:F,padding:0}}>‹ Zurück</button>}
    <span style={{fontSize:11,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:T.label}}>{fahrschuleName||"Fahrschule"}</span>
    <button onClick={onLogout} style={{marginLeft:"auto",background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:F,fontSize:12,fontWeight:600,color:T.label2}}>Abmelden</button>
  </div>
);

// Zentrierter Content-Container statt volle Bildschirmbreite
export const Page = ({children,style={}}) => (
  <div style={{maxWidth:880,margin:"0 auto",padding:"22px 20px 100px",...style}}>{children}</div>
);

// ── TEXT / TYPOGRAFIE ──────────────────────────────────
export const Eyebrow = ({children,color}) => (
  <div style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",color:color||T.label2,fontFamily:F}}>{children}</div>
);
export const H1 = ({children,style={}}) => (
  <h1 style={{fontWeight:800,fontSize:34,lineHeight:1.02,letterSpacing:"-.035em",margin:0,color:T.label,fontFamily:F,...style}}>{children}</h1>
);
export const SectionLabel = ({children,right}) => (
  <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",margin:"26px 0 10px"}}>
    <h2 style={{fontWeight:800,fontSize:13,letterSpacing:".1em",textTransform:"uppercase",margin:0,color:T.label,fontFamily:F}}>{children}</h2>
    {right&&<span style={{fontSize:11,color:T.label2,fontFamily:F}}>{right}</span>}
  </div>
);
// Liste mit dicker oberer Trennlinie (folgt typischerweise auf SectionLabel)
export const RuleList = ({children,style={}}) => (
  <div style={{borderTop:`2px solid ${T.sep2}`,...style}}>{children}</div>
);

// ── FORMULARE ───────────────────────────────────────────
export const inputStyle = {width:"100%",boxSizing:"border-box",minHeight:44,padding:"8px 12px",fontFamily:F,fontSize:15,background:T.card,border:`1px solid ${T.sep2}`,borderRadius:0,color:T.label,outline:"none"};
export const Field = ({label,children}) => (
  <div>
    <label style={{display:"block",fontSize:11,letterSpacing:".08em",textTransform:"uppercase",color:T.label2,marginBottom:5,fontFamily:F}}>{label}</label>
    {children}
  </div>
);

// ── BUTTONS ─────────────────────────────────────────────
export const PrimaryButton = ({children,onClick,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{width:"100%",minHeight:48,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 16px",border:"none",borderRadius:0,cursor:disabled?"default":"pointer",fontFamily:F,fontWeight:800,fontSize:15,background:T.accent,color:T.bg,opacity:disabled?.6:1,...style}}>{children}</button>
);
export const GhostButton = ({children,onClick,disabled,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{minHeight:46,padding:"0 16px",background:"transparent",border:`1px solid ${T.sep2}`,borderRadius:0,cursor:disabled?"default":"pointer",fontFamily:F,fontWeight:600,fontSize:14,color:T.label,opacity:disabled?.6:1,...style}}>{children}</button>
);
export const TextButton = ({children,onClick,style={}}) => (
  <button onClick={onClick} style={{background:"transparent",border:"none",padding:0,cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:13,color:T.accent,...style}}>{children}</button>
);

// ── CHIPS (Status) ─────────────────────────────────────
// tone: "accent" (aktiv/hervorgehoben) · "ink" (fertig/abgeschlossen)
// "warn" (in Arbeit/Warnung) · "neutral" (offen/archiviert) · "danger"
const CHIP_TONES = {
  accent:{bg:()=>T.accent,fg:()=>T.bg},
  ink:{bg:()=>T.ink,fg:()=>T.bg},
  warn:{bg:()=>T.warnBg,fg:()=>T.warnText},
  neutral:{bg:()=>T.neutralBg,fg:()=>T.neutralText},
  danger:{bg:()=>"#FFE0D9",fg:()=>T.redDark},
};
export const Chip = ({children,tone="neutral"}) => {
  const c = CHIP_TONES[tone]||CHIP_TONES.neutral;
  return <span style={{display:"inline-block",fontSize:11,fontWeight:700,padding:"2px 8px",background:c.bg(),color:c.fg(),fontFamily:F}}>{children}</span>;
};

// ── SEGMENTIERTE STEUERUNG (Kanten-Segmente) ───────────
// options: [{id,label}], value: aktive id, onChange(id)
export const Segmented = ({options,value,onChange,style={}}) => (
  <div style={{display:"flex",border:`1px solid ${T.sep2}`,...style}}>
    {options.map((o,i)=>(
      <button key={o.id} onClick={()=>onChange(o.id)} style={{flex:1,padding:"9px 4px",border:"none",borderLeft:i===0?"none":`1px solid ${T.sep2}`,cursor:"pointer",fontFamily:F,fontWeight:600,fontSize:13,background:value===o.id?T.accent:"transparent",color:value===o.id?T.bg:T.label}}>{o.label}</button>
    ))}
  </div>
);

// ── UNTERE TAB-LEISTE ───────────────────────────────────
// tabs: [{id,label,icon(svg path d)}], value: aktive id, onChange(id)
export const TabBar = ({tabs,value,onChange}) => (
  <div style={{position:"sticky",bottom:0,zIndex:20,display:"flex",background:"rgba(243,242,242,.94)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",borderTop:`2px solid ${T.sep2}`,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
    {tabs.map((t,i)=>(
      <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"10px 2px 8px",border:"none",borderLeft:i===0?"none":`1px solid ${T.sep}`,cursor:"pointer",fontFamily:F,background:value===t.id?T.accent:"transparent",color:value===t.id?T.bg:T.label2}}>
        {t.icon&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d={t.icon}/></svg>}
        <span style={{fontSize:10,fontWeight:800,letterSpacing:".02em"}}>{t.label}</span>
      </button>
    ))}
  </div>
);

// ── FEHLERANZEIGE ───────────────────────────────────────
export const ErrorBox = ({children}) => (
  <div style={{background:T.warnBg,color:T.warnText,padding:"10px 14px",fontSize:13,fontFamily:F,marginBottom:14}}>{children}</div>
);
