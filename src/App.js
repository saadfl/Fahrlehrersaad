import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ── DESIGN TOKENS ──────────────────────────────────
const T = {
  bg:"linear-gradient(160deg,#0B3FB8 0%,#071E66 40%,#040B26 100%)",
  card:"rgba(255,255,255,0.08)", white:"rgba(255,255,255,0.08)", inset:"rgba(255,255,255,0.06)",
  glass:"rgba(255,255,255,0.08)", glassBorder:"rgba(255,255,255,0.12)",
  tabBg:"rgba(4,11,38,0.8)", tabBorder:"rgba(255,255,255,0.08)",
  navBg:"rgba(4,11,38,0.85)",
  label:"#FFFFFF", label2:"#9DB4F0", label3:"rgba(255,255,255,0.25)",
  sep:"rgba(255,255,255,0.08)", sel:"rgba(76,141,255,0.3)", dangerBg:"rgba(255,107,107,0.1)",
  red:"#FF6B6B", blue:"#4C8DFF", green:"#7FE0A8",
  orange:"#FFB86B", purple:"#AF52DE", gray:"#7E90C2",
  s1:"none", s2:"none",
};
const F = "'Geist',system-ui,-apple-system,sans-serif";

// ── AUSBILDUNG ──────────────────────────────────────
const AUSBILDUNG = [
  { id:"schaltkompetenz", label:"Schaltkompetenz", icon:"⚙️", color:"#FF9500", gruppen:[
    { name:"Schaltübungen", items:["Hoch schalten","Runter schalten","Gänge überspringen"] },
    { name:"Fahrzeugbedienung", items:["Pedal Manuell","Rollen und Schalten","Abbremsen und Schalten","Tastgeschwindigkeit"] },
    { name:"Gefälle/Steigung", items:["Anhalten","Anfahren","Rückwärts","Sichern","Schalten"] },
  ]},
  { id:"grundstufe", label:"Grundstufe", icon:"📗", color:"#34C759", gruppen:[
    { name:"Einstellen", items:["Sitz","Spiegel","Lenkrad","Kopfstütze"] },
    { name:"Fahrzeugbedienung", items:["Lenkradhaltung","Pedale Bedienen","Gurt anlegen/anpassen","Lenkradsperre Entriegeln","Lenkradsperre Verriegeln","Anfahr-/Anhaltübung","Lenkübung"] },
  ]},
  { id:"aufbaustufe", label:"Aufbaustufe", icon:"📘", color:"#007AFF", gruppen:[
    { name:"Bremsübungen", items:["Degressives Bremsen","Zielbremsung"] },
    { name:"Fahrbahnbenutzung", items:["Einordnen","Markierung"] },
  ]},
  { id:"leistungsstufe", label:"Leistungsstufe", icon:"📙", color:"#FF3B30", gruppen:[
    { name:"Spiegel, Blinker, Schulterblick", items:["Fahrstreifenwechsel","Hindernisse/Überholen","Abbiegen","Anfahren"] },
    { name:"Abbiegen", items:["Rechts","Links","Mehrspurig","Sonderstreifen","Einbahnstraßen"] },
    { name:"Geschwindigkeit", items:["Zone","Abbiegen","Inner-/Außerorts","Baustelle + Geschwindigkeit"] },
    { name:"Vorfahrt/Vorrang", items:["Polizeibeamte","Linksabbieger Regel"] },
    { name:"Ampel", items:["Normale Ampel","Pfeilampel","Normale + Pfeilampel","Normale + Räumungspfeil","Grünpfeilschild","2 Phasen Ampel","Linksabbieger Regel"] },
    { name:"Verkehrszeichen Vorfahrt", items:["Vorfahrt gewähren","Stoppschild","Einmalige Vorfahrt","Vorfahrtsstraße","Abknickende Vorfahrt","Linksabbieger Regel"] },
    { name:"Rechts vor Links", items:["Mäßige Geschwindigkeit","Linksabbieger Regel"] },
    { name:"Situationen", items:["Fußgängerüberweg","Ältere/Behinderte","Kinder","Schulbus","Radfahrer","Verkehrsberuhigter Bereich","Einsatzfahrzeuge"] },
    { name:"Fahrradstraße", items:["Geschwindigkeit","Freigabe für Kfz","Beschränkte Freigabe für Kfz"] },
    { name:"Engpässe", items:["Geschwindigkeit","Beobachtung","Abstand"] },
    { name:"Kreisverkehr", items:["Kreisverkehr"] },
    { name:"Bahnübergang", items:["Warten","Überqueren"] },
    { name:"Partnerschaftliches Verhalten", items:["Partnerschaftliches Verhalten"] },
    { name:"Fahrbahnverengung", items:["2 Spuren münden in 1 Spur","1 Spur mündet in mehrere Spuren"] },
    { name:"Weitere Verkehrszeichen", items:["Verbot der Einfahrt/Durchfahrt","Vorgeschriebene Fahrtrichtung","Überholverbot","Vorrang des Gegenverkehrs"] },
  ]},
  { id:"grundfahraufgaben", label:"Grundfahraufgaben", icon:"🎯", color:"#AF52DE", gruppen:[
    { name:"Rückwärtsfahren", items:["Rückwärts um die Ecke"] },
    { name:"Umkehren", items:["Einfahrt","Kreisverkehr","Wendekreis","Wendehammer"] },
    { name:"Einparken Längs", items:["Vorwärts Rechts","Vorwärts Links","Rückwärts Rechts","Rückwärts Links"] },
    { name:"Einparken Quer (Box)", items:["Vorwärts Rechts","Vorwärts Links","Rückwärts Rechts","Rückwärts Links"] },
    { name:"Gefahrenbremsung", items:["Geschwindigkeit (30 km/h)","Spiegel Blinker Schulterblick","Ansage/Abbrechen"] },
  ]},
  { id:"pruefungssimulation", label:"Prüfungssimulation", icon:"📝", color:"#FF2D55", gruppen:[
    { name:"Prüfungsfragen", items:["Beobachtung","Geschwindigkeit","Rechts vor Links","Linksabbieger Regel","Stoppschild","Verbotszeichen"] },
  ]},
  { id:"technik", label:"Technik", icon:"🔧", color:"#636366", gruppen:[
    { name:"Motorraum/Flüssigkeitsstände", items:["Kühlflüssigkeit","Motoröl","Scheibenwischwasser","Bremsflüssigkeit"] },
    { name:"Reifen", items:["Mindestprofiltiefe","Luftdruck","Beschädigung","Winter-/Sommerreifen"] },
    { name:"Bremsprobe", items:["Betriebsbremse","Feststellbremse"] },
    { name:"Beleuchtung", items:["Standlicht","Abblendlicht","Automatisches Abblendlicht","Schlechtwetterscheinwerfer","Nebelschlussleuchte","Fernlicht/Lichthupe","Warnblinkanlage","Bremslicht","Rückfahrscheinwerfer","Reflektoren/Rückstrahler"] },
  ]},
  { id:"sonderfahrten", label:"Sonderfahrten", icon:"🚨", color:"#32ADE6", gruppen:[
    { name:"Überlandfahrten (5)", items:["Abstände vorne/hinten","Beobachtung Spiegel","Verkehrszeichen","Kurven","Steigung","Gefälle","Alleen","Überholen","Geschwindigkeit","Einfahren Ortschaft","Ablenkung","Orientierung"] },
    { name:"Autobahnfahrten (4)", items:["Fahrtplanung","Einfahren BAB","Fahrstreifenwechsel","Geschwindigkeit","Abstände","Überholen","Schilder/Markierung","Rastplätze","Verhalten bei Unfällen","Stau","Leistungsgrenze","Ablenkung","Tempomat","Verlassen BAB"] },
    { name:"Beleuchtungsfahrten (3)", items:["Beleuchtung Einschalten","Beleuchtung Kontrollieren","Beleuchtete Straße","Unbeleuchtete Straßen","Parken","Bahnübergang","Schlechte Witterung","Unbeleuchtete Verkehrsteilnehmer","Tiere/Wild","Orientierung","Blendung","Abschlussgespräch"] },
  ]},
];

const LERN = AUSBILDUNG.flatMap(x=>{
  if(x.id!=="leistungsstufe") return [{...x,key:x.id}];
  const i=x.gruppen.findIndex(g=>g.name==="Situationen");
  return [
    {...x,key:"leistungsstufe-1",label:"Leistungsstufe Teil 1",gruppen:x.gruppen.slice(0,i)},
    {...x,key:"leistungsstufe-2",label:"Leistungsstufe Teil 2",gruppen:x.gruppen.slice(i)},
  ];
});

const ALL = AUSBILDUNG.flatMap(s=>s.gruppen.flatMap(g=>g.items.map(i=>`${s.id}::${g.name}::${i}`)));
const nxt = v => ((v||0)+1)%3;
const KLASSEN = ["B","B197","BE","B96"];
const slug=n=>n.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,".").replace(/^\.+|\.+$/g,"");
const LOGIN_DOMAIN={schueler:"schueler.fahrlehrer-saad.app",lehrer:"lehrer.fahrlehrer-saad.app"};
const kontoFn=async body=>{
  const {data,error}=await supabase.functions.invoke("konto-verwalten",{body});
  if(error){let m=error.message;try{const j=await error.context.json();if(j&&j.fehler)m=j.fehler;}catch(_){}return {error:m};}
  if(data&&data.fehler) return {error:data.fehler};
  return {data};
};
const holeNutzer=async()=>{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return null;
  const uid=session.user.id;
  const {data:p}=await supabase.from("fahrlehrer_profil").select("*").eq("auth_id",uid).maybeSingle();
  if(p) return {role:p.rolle==="admin"?"admin":"lehrer",profil:p};
  const {data:sc}=await supabase.from("schueler").select("*").eq("auth_id",uid).maybeSingle();
  if(sc) return {role:"schueler",schueler:sc};
  return null;
};
const nKeys=n=>Object.keys(n).filter(k=>{const p=k.split("::");return p.length===2||!n[`${p[0]}::${p[1]}`];});
const AbmeldenBtn=({onClick})=><button onClick={onClick} style={{background:T.card,border:`1px solid ${T.sep}`,borderRadius:999,padding:"7px 14px",fontSize:13,fontWeight:500,cursor:"pointer",color:T.red,fontFamily:F,flexShrink:0}}>Abmelden</button>;
const DEFAULT_PROFIL = {name:"Saad",ueber_mich:"Als leidenschaftlicher Fahrlehrer in Münster helfe ich meinen Schülern, sicher und selbstbewusst ans Steuer zu kommen.",tags:["Klasse B","BE","10+ Jahre"]};
const EMPTY_SET = new Set();

// ── UI COMPONENTS ───────────────────────────────────
const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:T.card,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:20,border:`1px solid ${T.glassBorder}`,boxShadow:T.s2,...style,cursor:onClick?"pointer":"default"}}>{children}</div>
);

const Row = ({children,last,onClick,style={}}) => (
  <div onClick={onClick} style={{padding:"13px 16px",display:"flex",alignItems:"center",borderBottom:last?"none":`1px solid ${T.sep}`,background:"transparent",cursor:onClick?"pointer":"default",...style}}>{children}</div>
);

const Ring = ({pct,size=72,stroke=6}) => {
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

const TabBar = ({active,onChange,isLehrer,tabsOverride}) => {
  const tabs = tabsOverride ? tabsOverride : isLehrer
    ? [{id:"home",e:"🏠",l:"Home"},{id:"schueler",e:"👥",l:"Schüler"},{id:"material",e:"📚",l:"Lernen"},{id:"profil",e:"🏫",l:"Fahrschule"}]
    : [{id:"home",e:"🏠",l:"Home"},{id:"diagramm",e:"📊",l:"Diagramm"},{id:"lernen",e:"📚",l:"Lernen"},{id:"profil",e:"🏫",l:"Fahrschule"}];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,height:83,background:T.tabBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${T.tabBorder}`,display:"flex",alignItems:"flex-start",justifyContent:"space-around",padding:"10px 0 0",zIndex:999,fontFamily:F}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:60,padding:"2px 8px"}}>
          <span style={{width:20,height:4,borderRadius:2,background:active===t.id?T.blue:"transparent",marginBottom:2}}/><span style={{fontSize:22,filter:active===t.id?"none":"grayscale(1)",opacity:active===t.id?1:0.35,transition:"all .15s"}}>{t.e}</span>
          <span style={{fontSize:11,fontWeight:active===t.id?600:400,color:active===t.id?T.label:T.label2,transition:"color .15s"}}>{t.l}</span>
        </button>
      ))}
    </div>
  );
};

const NavBar = ({title,onBack}) => (
  <div style={{position:"sticky",top:0,zIndex:100,background:T.navBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${T.sep}`,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",fontFamily:F}}>
    <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:T.blue,fontSize:16,fontWeight:500,fontFamily:F,minWidth:70}}>‹ Zurück</button>
    <span style={{fontSize:16,fontWeight:600,color:T.label}}>{title}</span>
    <div style={{minWidth:70}}/>
  </div>
);

// ── WISCH-ZEILE ─────────────────────────────────────
const SwipeRow = ({children,onSwipeLeft,onSwipeRight,labelLeft,labelRight,colorLeft=T.blue,colorRight=T.gray}) => {
  const [dx,setDx]=useState(0); const [drag,setDrag]=useState(false);
  const st=useRef({id:null,x:0,y:0,dir:null,moved:false});
  const down=e=>{if(e.pointerType==="mouse"&&e.button!==0)return;st.current={id:e.pointerId,x:e.clientX,y:e.clientY,dir:null,moved:false};};
  const move=e=>{
    const m=st.current;if(m.id!==e.pointerId)return;
    const mx=e.clientX-m.x,my=e.clientY-m.y;
    if(m.dir===null&&(Math.abs(mx)>8||Math.abs(my)>8)){
      m.dir=Math.abs(mx)>Math.abs(my)?"h":"v";
      if(m.dir==="h"){setDrag(true);try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}}
    }
    if(m.dir==="h"){
      m.moved=true;let v=mx;
      if(v<0&&!onSwipeLeft)v=0; if(v>0&&!onSwipeRight)v=0;
      setDx(Math.max(-140,Math.min(140,v)));
    }
  };
  const end=e=>{
    const m=st.current;if(m.id!==e.pointerId)return;
    m.id=null;setDrag(false);const v=dx;setDx(0);
    if(m.dir==="h"){if(v<=-80&&onSwipeLeft)onSwipeLeft();else if(v>=80&&onSwipeRight)onSwipeRight();}
  };
  const clickCap=e=>{if(st.current.moved){e.stopPropagation();e.preventDefault();st.current.moved=false;}};
  return (
    <div onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onClickCapture={clickCap}
      style={{position:"relative",borderRadius:20,overflow:"hidden",touchAction:"pan-y",userSelect:drag?"none":"auto"}}>
      {dx!==0&&<div style={{position:"absolute",inset:0,background:`${dx<0?colorLeft:colorRight}33`,display:"flex",alignItems:"center",justifyContent:dx<0?"flex-end":"flex-start",padding:"0 20px",color:dx<0?colorLeft:colorRight,fontSize:14,fontWeight:600,fontFamily:F}}>{dx<0?labelLeft:labelRight}</div>}
      <div style={{transform:`translateX(${dx}px)`,transition:drag?"none":"transform .2s"}}>{children}</div>
    </div>
  );
};

// ── LOGIN ───────────────────────────────────────────
function Login({onLogin}) {
  const [step,setStep]=useState("welcome"); const [rolle,setRolle]=useState("schueler");
  const [name,setName]=useState(""); const [pin,setPin]=useState("");
  const [err,setErr]=useState(""); const [load,setLoad]=useState(false);
  const waehle=r=>{setRolle(r);setErr("");setStep("form");};
  const go=async()=>{
    setErr(""); setLoad(true);
    const login=slug(name.trim());
    if(!login||!pin){setLoad(false);setErr("Bitte Name und PIN eingeben.");return;}
    const {error}=await supabase.auth.signInWithPassword({email:`${login}@${LOGIN_DOMAIN[rolle]}`,password:pin});
    if(error){setLoad(false);setErr("Name oder PIN falsch.");return;}
    const u=await holeNutzer();
    setLoad(false);
    if(!u||(rolle==="schueler"&&u.role!=="schueler")||(rolle==="lehrer"&&u.role==="schueler")){await supabase.auth.signOut();setErr("Name oder PIN falsch.");return;}
    onLogin(u);
  };
  const inp={background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:14,padding:"15px 16px",color:"#fff",fontSize:16,outline:"none",fontFamily:F,width:"100%",boxSizing:"border-box"};
  const huelle=inhalt=><div style={{minHeight:"100dvh",display:"flex",justifyContent:"center",fontFamily:F}}><div style={{width:"100%",maxWidth:440,minHeight:"100dvh",display:"flex",flexDirection:"column"}}>{inhalt}</div></div>;

  if(step==="welcome") return huelle(
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"40px 24px 34px",gap:16}}>
      <div style={{width:64,height:64,borderRadius:18,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:22,color:"#fff"}}>FS</div>
      <div style={{marginTop:"auto",fontSize:15,color:"#9DB4F0"}}>Fahrschule Saad</div>
      <div style={{fontSize:40,lineHeight:1.05,fontWeight:600,letterSpacing:"-.03em",color:"#fff",textWrap:"pretty"}}>Dein Weg zum Führerschein.</div>
      <div style={{fontSize:16,color:"#C4D3FA",lineHeight:1.45,textWrap:"pretty"}}>Ausbildungsstand, Fahrstunden und Theorie – alles an einem Ort.</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:20}}>
        <button onClick={()=>waehle("schueler")} style={{border:"none",background:"#fff",color:"#071E66",borderRadius:16,padding:17,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:F}}>Ich bin Fahrschüler</button>
        <button onClick={()=>waehle("lehrer")} style={{border:"1px solid rgba(255,255,255,.25)",background:"rgba(255,255,255,.08)",color:"#fff",borderRadius:16,padding:17,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:F}}>Ich bin Fahrlehrer</button>
      </div>
    </div>
  );

  return huelle(
    <div style={{flex:1,display:"flex",flexDirection:"column",padding:"20px 24px 34px",gap:14}}>
      <button onClick={()=>{setStep("welcome");setErr("");}} style={{alignSelf:"flex-start",border:"none",background:"none",color:"#6FA0FF",fontSize:16,padding:"8px 0",cursor:"pointer",fontFamily:F}}>‹ Zurück</button>
      <div style={{fontSize:30,fontWeight:600,letterSpacing:"-.02em",marginTop:12,color:"#fff"}}>Anmelden</div>
      <div style={{fontSize:15,color:"#9DB4F0"}}>{rolle==="lehrer"?"Als Fahrlehrer":"Als Fahrschüler"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:16}}>
        <span style={{fontSize:13,color:"#9DB4F0"}}>Name</span>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Vor- und Nachname" autoCapitalize="words" autoCorrect="off" onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <span style={{fontSize:13,color:"#9DB4F0"}}>PIN</span>
        <input value={pin} onChange={e=>setPin(e.target.value)} type="password" inputMode="numeric" maxLength={8} onKeyDown={e=>e.key==="Enter"&&go()} style={inp}/>
      </div>
      {err&&<div style={{fontSize:14,color:"#FFB86B"}}>{err}</div>}
      <button onClick={go} disabled={load} style={{marginTop:"auto",border:"none",background:"#4C8DFF",color:"#fff",borderRadius:16,padding:17,fontSize:16,fontWeight:600,cursor:"pointer",opacity:load?0.7:1,fontFamily:F}}>{load?"Anmelden...":"Anmelden"}</button>
      <div style={{textAlign:"center",fontSize:14,color:"#9DB4F0"}}>PIN vergessen? Frag deinen Fahrlehrer.</div>
    </div>
  );
}

// ── APP ROOT ────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(undefined);
  useEffect(()=>{
    let weg=false;
    holeNutzer().then(u=>{if(!weg)setUser(u);});
    const {data:sub}=supabase.auth.onAuthStateChange(ev=>{if(ev==="SIGNED_OUT")setUser(null);});
    return ()=>{weg=true;sub.subscription.unsubscribe();};
  },[]);
  const abmelden=async()=>{await supabase.auth.signOut();setUser(null);};
  if(window.location.hash==="#einrichtung") return <Einrichtung/>;
  if(user===undefined) return <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,color:"#9DB4F0"}}>Lädt…</div>;
  if(!user) return <Login onLogin={setUser}/>;
  if(user.role==="admin") return <AdminApp onLogout={abmelden}/>;
  if(user.role==="lehrer") return <LehrerApp profil={user.profil} onLogout={abmelden}/>;
  return <SchuelerApp schueler={user.schueler} onLogout={abmelden}/>;
}

// ── EINRICHTUNG (einmalig: bestehende Konten umstellen) ─────
function Einrichtung() {
  const [key,setKey]=useState(""); const [load,setLoad]=useState(false); const [err,setErr]=useState(""); const [res,setRes]=useState(null);
  const go=async()=>{
    setLoad(true);setErr("");
    const {data,error}=await kontoFn({aktion:"migrieren",key:key.trim()});
    setLoad(false);
    if(error){setErr(error);return;}
    setRes(data.ergebnis||[]);
  };
  const inp={background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:14,padding:"15px 16px",color:"#fff",fontSize:16,outline:"none",fontFamily:F,width:"100%",boxSizing:"border-box"};
  return <div style={{maxWidth:440,margin:"0 auto",padding:"40px 20px",fontFamily:F,color:"#fff"}}>
    <div style={{fontSize:26,fontWeight:600,marginBottom:8}}>Einrichtung</div>
    <div style={{fontSize:14,color:"#9DB4F0",marginBottom:20,lineHeight:1.5}}>Legt für alle bestehenden Fahrlehrer und Schüler ein sicheres Konto an. Das Ergebnis wird nur jetzt angezeigt – bitte notieren oder einen Screenshot machen.</div>
    {!res&&<>
      <input value={key} onChange={e=>setKey(e.target.value)} placeholder="Einrichtungsschlüssel" style={inp}/>
      {err&&<div style={{color:"#FFB86B",fontSize:14,marginTop:12}}>{err}</div>}
      <button onClick={go} disabled={load||!key.trim()} style={{marginTop:16,width:"100%",border:"none",background:"#4C8DFF",color:"#fff",borderRadius:16,padding:16,fontSize:16,fontWeight:600,cursor:"pointer",opacity:load?0.7:1,fontFamily:F}}>{load?"Läuft…":"Konten anlegen"}</button>
    </>}
    {res&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {res.length===0&&<div style={{color:"#9DB4F0"}}>Nichts zu tun – alle Konten sind schon umgestellt.</div>}
      {res.map((r,i)=><div key={i} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:16,padding:"12px 14px",fontSize:14,lineHeight:1.5}}>
        <div style={{fontWeight:600}}>{r.name} <span style={{color:"#9DB4F0",fontWeight:400}}>({r.typ==="lehrer"?"Fahrlehrer":"Schüler"})</span></div>
        {r.fehler?<div style={{color:"#FF6B6B"}}>Fehler: {r.fehler}</div>:<>
          <div>Anmeldename: <b>{r.login_name}</b></div>
          <div>PIN: <b style={{letterSpacing:2}}>{r.pin}</b> {r.neue_pin&&<span style={{color:"#FFB86B"}}>(neu vergeben)</span>}</div>
        </>}
      </div>)}
    </div>}
  </div>;
}

// ── LEHRER APP ──────────────────────────────────────
function LehrerApp({onLogout,profil}) {
  const pid=profil?.id;
  const [tab,setTab]=useState("home");
  const [liste,setListe]=useState([]);
  const [mat,setMat]=useState({});
  const [screen,setScreen]=useState(null);
  const [meine,setMeine]=useState(()=>new Set());
  const [filter,setFilter]=useState("aktiv");
  const [meineFehler,setMeineFehler]=useState("");
  const [fahrlehrer,setFahrlehrer]=useState([]); const [standorte,setStandorte]=useState([]);
  useEffect(()=>{
    supabase.from("fahrlehrer_profil").select("id,name,ueber_mich,tags,bild_url,erstellt_am").eq("rolle","lehrer").order("erstellt_am").then(r=>setFahrlehrer(r.data||[]));
    supabase.from("standorte").select("*").order("erstellt_am").then(r=>setStandorte(r.data||[]));
  },[]);

  const ladeListe=useCallback(async()=>{
    const[a,b]=await Promise.all([
      supabase.from("schueler").select("*").order("name"),
      pid?supabase.from("meine_schueler").select("schueler_id").eq("fahrlehrer_id",pid):Promise.resolve({data:[],error:null}),
    ]);
    setListe(a.data||[]);
    if(b.error){setMeineFehler("Meine Schüler konnten nicht geladen werden: "+b.error.message);}
    else{setMeineFehler("");setMeine(new Set((b.data||[]).map(x=>String(x.schueler_id))));}
  },[pid]);
  const ladeMat=useCallback(async()=>{
    const[m,q]=await Promise.all([supabase.from("lernmaterial").select("*"),supabase.from("quiz_fragen").select("*")]);
    const map={};
    (m.data||[]).forEach(x=>{map[x.item_key]={videoUrl:x.video_url||"",fotos:x.fotos||[],quiz:[],pdfUrl:x.pdf_url||"",pdfName:x.pdf_name||""};});
    (q.data||[]).forEach(x=>{if(!map[x.item_key])map[x.item_key]={videoUrl:"",fotos:[],quiz:[],pdfUrl:"",pdfName:""};map[x.item_key].quiz.push({id:x.id,frage:x.frage,typ:x.typ,antworten:x.antworten||[],richtig:x.richtig,erklaerung:x.erklaerung||"",bildUrl:x.bild_url||""});});
    setMat(map);
  },[]);

  useEffect(()=>{ladeListe();ladeMat();},[ladeListe,ladeMat]);

  const setMeineFlag=async(id,on)=>{
    if(!pid) return "Kein Fahrlehrer-Profil angemeldet (SQL-Skript ausführen).";
    const sid=String(id);
    const apply=v=>setMeine(p=>{const n=new Set(p);if(v)n.add(sid);else n.delete(sid);return n;});
    apply(on);
    const {error}=on
      ?await supabase.from("meine_schueler").upsert({fahrlehrer_id:pid,schueler_id:sid},{onConflict:"fahrlehrer_id,schueler_id"})
      :await supabase.from("meine_schueler").delete().eq("fahrlehrer_id",pid).eq("schueler_id",sid);
    if(error){apply(!on);return error.message;}
    return null;
  };

  const openS=s=>setScreen({type:"s",s});

  const aktiv=liste.filter(s=>!["archiviert","abgeschlossen"].includes(s.status||"aktiv"));
  const archiv=liste.filter(s=>["archiviert","abgeschlossen"].includes(s.status||"aktiv"));
  const meineListe=aktiv.filter(s=>meine.has(String(s.id)));

  if(screen?.type==="s") return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><NavBar title={screen.s.name} onBack={()=>{setScreen(null);ladeListe();}}/><div style={{paddingBottom:20}}><DiagrammView s={screen.s} mat={mat} setMat={setMat} onMat={k=>setScreen({type:"m",k,back:screen})} isLehrer/></div></div>;
  if(screen?.type==="m") return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><NavBar title={screen.k.split("::")[1]||"Material"} onBack={()=>setScreen(screen.back||null)}/><div style={{paddingBottom:20}}><MatView ik={screen.k} mat={mat} setMat={setMat} isLehrer={false}/></div></div>;
  if(screen?.type==="neu") return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><NavBar title="Neuer Schüler" onBack={()=>setScreen(null)}/><NeuerS alsMeine={!!screen.meine} profilId={pid} onSaved={()=>{ladeListe();setScreen(null);}}/></div>;

  const tabs={
    home:<LehrerHome liste={liste} aktiv={aktiv} archiv={archiv} meineListe={meineListe} onOpen={openS} onNeu={()=>setScreen({type:"neu",meine:true})} onAlle={f=>{setFilter(f);setTab("schueler");}} onLogout={onLogout}/>,
    schueler:<SListe aktiv={aktiv} archiv={archiv} meine={meine} onMeine={setMeineFlag} fehler={meineFehler} filter={filter} setFilter={setFilter} onOpen={openS} onNeu={()=>setScreen({type:"neu"})} onRefresh={ladeListe}/>,
    material:<MatListe mat={mat} onOpen={k=>setScreen({type:"m",k,back:null})}/>,
    profil:<Profil selbst fahrlehrer={fahrlehrer} meineIds={pid?[pid]:[]} standorte={standorte}/>,
  };

  return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><div style={{paddingBottom:83}}>{tabs[tab]}</div><TabBar active={tab} onChange={setTab} isLehrer/></div>;
}

// ── LEHRER HOME ─────────────────────────────────────
function LehrerHome({liste,aktiv,archiv,meineListe,onOpen,onNeu,onAlle,onLogout}) {
  return (
    <div style={{background:"transparent",minHeight:"100dvh",padding:"20px 16px 0"}}>
      <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
        <div>
          <div style={{fontSize:11,color:T.blue,fontWeight:700,letterSpacing:1,marginBottom:2,fontFamily:F}}>FAHRLEHRER SAAD</div>
          <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56,fontFamily:F}}>Dashboard</div>
        </div>
        <AbmeldenBtn onClick={onLogout}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {[{v:aktiv.length,l:"Aktiv",c:T.green,e:"🎯",f:"aktiv"},{v:meineListe.length,l:"Meine Schüler",c:T.blue,e:"👥",f:"meine"},{v:archiv.length,l:"Archiv",c:T.gray,e:"📦",f:"archiv"}].map((x,i)=>(
          <Card key={i} onClick={()=>onAlle(x.f)} style={{padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{x.e}</div>
            <div style={{fontSize:26,fontWeight:700,color:x.c,fontFamily:F}}>{x.v}</div>
            <div style={{fontSize:11,color:T.label2,marginTop:2,fontFamily:F}}>{x.l}</div>
          </Card>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:11,color:T.label2,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",fontFamily:F}}>Meine Schüler</div>
        <button onClick={onNeu} style={{background:T.blue,color:"#fff",border:"none",borderRadius:999,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>+ Neu</button>
      </div>
      {meineListe.length===0
        ?<Card style={{padding:32,textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:40,marginBottom:12}}>👥</div>
            <div style={{fontSize:15,color:T.label2,marginBottom:liste.length===0?16:0,fontFamily:F}}>Noch keine Schüler bei „Meine Schüler“</div>
            {liste.length===0&&<button onClick={onNeu} style={{background:T.blue,color:"#fff",border:"none",borderRadius:999,padding:"10px 20px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>Ersten Schüler anlegen</button>}
          </Card>
        :<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
            {meineListe.map(s=><SRow key={s.id} s={s} onClick={()=>onOpen(s)}/>)}
            <button onClick={()=>onAlle("meine")} style={{background:"none",border:`1px solid ${T.sep}`,borderRadius:14,padding:"12px",fontSize:14,color:T.blue,cursor:"pointer",fontFamily:F,textAlign:"center"}}>Alle Schüler ({meineListe.length}) →</button>
          </div>
      }
    </div>
  );
}

// ── SCHÜLER ROW ─────────────────────────────────────
function SRow({s,onClick}) {
  const [pct,setPct]=useState(0);
  useEffect(()=>{supabase.from("ausbildungsstand").select("wert").eq("schueler_id",s.id).then(({data})=>setPct(Math.round(((data||[]).filter(x=>x.wert===2).length/ALL.length)*100)));},[s.id]);
  const status=s.status||"aktiv";
  const sc=status==="aktiv"?T.green:status==="abgeschlossen"?T.purple:T.gray;
  return (
    <Card onClick={onClick} style={{padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <Ring pct={pct} size={50} stroke={5}/>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:600,color:T.label,fontFamily:F,marginBottom:3}}>{s.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:sc}}/><span style={{fontSize:12,color:T.label2,fontFamily:F}}>{status==="aktiv"?"Aktiv":status==="abgeschlossen"?"Abgeschlossen":"Archiviert"}</span></div>
        </div>
        <span style={{color:T.label3,fontSize:22}}>›</span>
      </div>
    </Card>
  );
}

// ── SCHÜLER LISTE ───────────────────────────────────
function SListe({aktiv,archiv,meine,onMeine,fehler,filter:filterProp,setFilter,onOpen,onNeu,onRefresh,ohneMeine}) {
  const filter=ohneMeine&&filterProp==="meine"?"aktiv":filterProp;
  const [suche,setSuche]=useState(""); const [toast,setToast]=useState(null);
  const timer=useRef(null);
  const zeigeToast=(t,ms=5000)=>{setToast(t);clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(null),ms);};
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const statusAendern=async(id,st)=>{await supabase.from("schueler").update({status:st}).eq("id",id);onRefresh();};
  const loeschen=async(id)=>{await kontoFn({aktion:"konto_loeschen",typ:"schueler",id});onRefresh();};

  const meineListe=aktiv.filter(s=>meine.has(String(s.id)));
  const quelle=filter==="archiv"?archiv:filter==="meine"?meineListe:aktiv;
  const z=quelle.filter(s=>s.name.toLowerCase().includes(suche.toLowerCase()));

  const archivieren=s=>{const alt=s.status||"aktiv";statusAendern(s.id,"archiviert");zeigeToast({text:`${s.name} archiviert`,undo:()=>statusAendern(s.id,alt)});};
  const reaktivieren=s=>{const alt=s.status||"archiviert";statusAendern(s.id,"aktiv");zeigeToast({text:`${s.name} reaktiviert`,undo:()=>statusAendern(s.id,alt)});};
  const meineSetzen=async(s,on,mitUndo)=>{
    const err=await onMeine(s.id,on);
    if(err){zeigeToast({text:`Speichern fehlgeschlagen: ${err}`},15000);return;}
    zeigeToast({text:on?`${s.name} zu „Meine Schüler“ hinzugefügt`:`${s.name} aus „Meine Schüler“ entfernt`,undo:mitUndo?()=>meineSetzen(s,!on,false):null});
  };
  const meineWechsel=s=>meineSetzen(s,!meine.has(String(s.id)),true);

  const tabs=ohneMeine?[{l:`Aktiv (${aktiv.length})`,v:"aktiv"},{l:`Archiv (${archiv.length})`,v:"archiv"}]:[{l:`Aktiv (${aktiv.length})`,v:"aktiv"},{l:`Meine Schüler (${meineListe.length})`,v:"meine"},{l:`Archiv (${archiv.length})`,v:"archiv"}];
  return (
    <div style={{background:"transparent",minHeight:"100dvh",padding:"20px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
        <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56,fontFamily:F}}>Schüler</div>
        <button onClick={onNeu} style={{background:T.blue,color:"#fff",border:"none",borderRadius:999,padding:"8px 16px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F}}>+ Neu</button>
      </div>
      {fehler&&<div style={{background:T.dangerBg,color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:14,border:`1px solid ${T.red}33`,fontFamily:F}}>{fehler}</div>}
      <div style={{background:T.inset,borderRadius:12,padding:"9px 14px",display:"flex",gap:8,alignItems:"center",marginBottom:14,border:`1px solid ${T.sep}`}}>
        <span style={{color:T.label2}}>🔍</span>
        <input value={suche} onChange={e=>setSuche(e.target.value)} placeholder="Suchen..." style={{background:"none",border:"none",outline:"none",fontSize:15,color:T.label,flex:1,fontFamily:F}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:ohneMeine?"1fr 1fr":"1fr 1fr 1fr",gap:0,background:T.inset,borderRadius:10,padding:2,marginBottom:16,border:`1px solid ${T.sep}`}}>
        {tabs.map(t=>(
          <button key={t.v} onClick={()=>setFilter(t.v)} style={{background:filter===t.v?T.sel:"transparent",border:"none",borderRadius:8,padding:"8px 4px",fontSize:12,fontWeight:600,cursor:"pointer",color:filter===t.v?T.label:T.label2,fontFamily:F,transition:"all .2s"}}>{t.l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {z.length===0&&<Card style={{padding:32,textAlign:"center"}}><div style={{color:T.label2,fontFamily:F}}>Keine Schüler</div></Card>}
        {z.map(s=>{
          const ist=meine.has(String(s.id)); const imArchiv=filter==="archiv";
          return <SRowFull key={s.id} s={s} istMeine={ist} onClick={()=>onOpen(s)} onSA={statusAendern} onDel={loeschen}
            onSwipeLeft={imArchiv?()=>reaktivieren(s):ohneMeine?null:()=>meineWechsel(s)}
            labelLeft={imArchiv?"Reaktivieren":ist?"Aus Meine Schüler":"Meine Schüler"}
            colorLeft={imArchiv?T.green:T.blue}
            onSwipeRight={imArchiv?null:()=>archivieren(s)}
            labelRight="Archivieren"/>;
        })}
      </div>
      {toast&&<div style={{position:"fixed",left:16,right:16,bottom:95,zIndex:1000,background:"rgba(4,11,38,0.95)",border:`1px solid ${T.glassBorder}`,borderRadius:16,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,fontFamily:F}}>
        <span style={{fontSize:14,color:T.label}}>{toast.text}</span>
        {toast.undo&&<button onClick={()=>{toast.undo();setToast(null);}} style={{background:"none",border:"none",color:T.blue,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F,flexShrink:0}}>Rückgängig</button>}
      </div>}
    </div>
  );
}

function SRowFull({s,istMeine,onClick,onSA,onDel,onSwipeLeft,onSwipeRight,labelLeft,labelRight,colorLeft}) {
  const [pct,setPct]=useState(0); const [show,setShow]=useState(false); const [del,setDel]=useState(false);
  useEffect(()=>{supabase.from("ausbildungsstand").select("wert").eq("schueler_id",s.id).then(({data})=>setPct(Math.round(((data||[]).filter(x=>x.wert===2).length/ALL.length)*100)));},[s.id]);
  if(del) return <Card style={{padding:20}}><div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:36,marginBottom:8}}>⚠️</div><div style={{fontSize:16,fontWeight:600,color:T.label,fontFamily:F}}>{s.name} löschen?</div></div><div style={{display:"flex",gap:10}}><button onClick={()=>onDel(s.id)} style={{flex:1,background:T.dangerBg,color:T.red,border:`1px solid ${T.red}66`,borderRadius:12,padding:"12px",fontWeight:600,cursor:"pointer",fontFamily:F}}>Löschen</button><button onClick={()=>setDel(false)} style={{flex:1,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px",cursor:"pointer",fontFamily:F,color:T.label}}>Abbrechen</button></div></Card>;
  return (
    <SwipeRow onSwipeLeft={onSwipeLeft} onSwipeRight={onSwipeRight} labelLeft={labelLeft} labelRight={labelRight} colorLeft={colorLeft}>
    <Card>
      <div onClick={onClick} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
        <Ring pct={pct} size={50} stroke={5}/>
        <div style={{flex:1}}><div style={{fontSize:16,fontWeight:600,color:T.label,fontFamily:F}}>{s.name}</div><div style={{fontSize:12,color:T.label2,fontFamily:F,marginTop:2}}>{s.status==="aktiv"?"🟢 Aktiv":s.status==="abgeschlossen"?"✅ Abgeschlossen":"📦 Archiviert"}{istMeine&&<span style={{color:T.blue,fontWeight:600}}> · Mein Schüler</span>}</div></div>
        <button onClick={e=>{e.stopPropagation();setShow(!show);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:T.label2,padding:4}}>⋯</button>
      </div>
      {show&&<div style={{borderTop:`1px solid ${T.sep}`,display:"flex",flexWrap:"wrap",gap:8,padding:"10px 14px"}}>
        {s.status!=="aktiv"&&<button onClick={()=>onSA(s.id,"aktiv")} style={{fontSize:12,background:`${T.green}18`,color:T.green,border:"none",borderRadius:999,padding:"5px 12px",cursor:"pointer",fontWeight:600,fontFamily:F}}>🟢 Aktiv</button>}
        {s.status!=="abgeschlossen"&&<button onClick={()=>onSA(s.id,"abgeschlossen")} style={{fontSize:12,background:`${T.purple}18`,color:T.purple,border:"none",borderRadius:999,padding:"5px 12px",cursor:"pointer",fontWeight:600,fontFamily:F}}>✅ Abgeschlossen</button>}
        {s.status!=="archiviert"&&<button onClick={()=>onSA(s.id,"archiviert")} style={{fontSize:12,background:`${T.gray}18`,color:T.gray,border:"none",borderRadius:999,padding:"5px 12px",cursor:"pointer",fontWeight:600,fontFamily:F}}>📦 Archivieren</button>}
        <button onClick={()=>setDel(true)} style={{fontSize:12,background:`${T.red}18`,color:T.red,border:"none",borderRadius:999,padding:"5px 12px",cursor:"pointer",fontWeight:600,fontFamily:F}}>🗑 Löschen</button>
      </div>}
    </Card>
    </SwipeRow>
  );
}

// ── NEUER SCHÜLER ───────────────────────────────────
function NeuerS({onSaved,alsMeine,profilId}) {
  const [f,setF]=useState({name:"",pin:"",klassen:[],sehhilfe:"Keine",theorie:false}); const [err,setErr]=useState(""); const [saving,setSaving]=useState(false); const [ok,setOk]=useState(null);
  const go=async()=>{
    if(!f.name.trim()){setErr("Namen eingeben.");return;} if(f.pin.length<6){setErr("PIN mind. 6 Stellen.");return;}
    setSaving(true);
    const {data,error}=await kontoFn({aktion:"schueler_anlegen",name:f.name.trim(),pin:f.pin,klassen:f.klassen,sehhilfe:f.sehhilfe,theorie:f.theorie,alsMeine:!!(alsMeine&&profilId)});
    setSaving(false);
    if(error){setErr("Fehler: "+error);return;}
    setOk({name:f.name.trim(),pin:f.pin,login:data.login_name});
  };
  if(ok) return <div style={{padding:"48px 20px",textAlign:"center",fontFamily:F}}><div style={{fontSize:64,marginBottom:16}}>🎉</div><div style={{fontSize:24,fontWeight:700,color:T.label,marginBottom:16}}>Schüler angelegt!</div><Card style={{padding:20,textAlign:"left"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:T.label2}}>Name</span><span style={{fontWeight:600}}>{ok.name}</span></div><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:T.label2}}>Anmeldename</span><span style={{fontWeight:600}}>{ok.login}</span></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.label2}}>PIN</span><span style={{fontWeight:700,fontSize:22,letterSpacing:4,color:T.blue}}>{ok.pin}</span></div></Card><button onClick={onSaved} style={{width:"100%",marginTop:16,background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:F}}>Fertig</button></div>;
  return (
    <div style={{padding:"20px 16px",fontFamily:F}}>
      <Card style={{padding:24}}>
        <div style={{fontSize:20,fontWeight:700,color:T.label,marginBottom:20}}>Neuer Schüler</div>
        <div style={{marginBottom:14}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:7}}>Vor- und Nachname *</div><input style={{width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px 16px",fontSize:15,color:T.label,outline:"none",fontFamily:F}} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="z.B. Max Mustermann"/></div>
        <div style={{marginBottom:20}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:7}}>PIN (mind. 6 Stellen) *</div><input style={{width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px 16px",fontSize:22,color:T.label,outline:"none",letterSpacing:6,fontFamily:F}} type="password" inputMode="numeric" maxLength={8} value={f.pin} onChange={e=>setF({...f,pin:e.target.value.replace(/\D/g,"")})}/><div style={{fontSize:12,color:T.label2,marginTop:6}}>💡 PIN persönlich mitteilen</div></div>
        <div style={{marginBottom:14}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:8}}>Fahrerlaubnisklassen (optional)</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{KLASSEN.map(k=>{const sel=f.klassen.includes(k);return <button key={k} onClick={()=>setF({...f,klassen:sel?f.klassen.filter(x=>x!==k):[...f.klassen,k]})} style={{padding:"8px 16px",borderRadius:999,border:`1px solid ${sel?T.blue:T.sep}`,background:sel?`${T.blue}18`:"transparent",color:sel?T.blue:T.label2,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:F}}>{k}</button>;})}</div></div>
        <div style={{marginBottom:14}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:8}}>Sehhilfe (optional)</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{["Keine","Brille"].map(o=><button key={o} onClick={()=>setF({...f,sehhilfe:o})} style={{padding:"10px",borderRadius:12,border:`1px solid ${f.sehhilfe===o?T.blue:T.sep}`,background:f.sehhilfe===o?`${T.blue}18`:"transparent",color:f.sehhilfe===o?T.blue:T.label2,cursor:"pointer",fontSize:14,fontFamily:F}}>{o}</button>)}</div></div>
        <div style={{marginBottom:20}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:8}}>Theorie (optional)</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{l:"⏳ Ausstehend",v:false},{l:"✅ Bestanden",v:true}].map(o=><button key={String(o.v)} onClick={()=>setF({...f,theorie:o.v})} style={{padding:"10px",borderRadius:12,border:`1px solid ${f.theorie===o.v?(o.v?T.green:T.red):T.sep}`,background:f.theorie===o.v?(o.v?`${T.green}18`:`${T.red}18`):"transparent",color:f.theorie===o.v?(o.v?T.green:T.red):T.label2,cursor:"pointer",fontSize:13,fontFamily:F}}>{o.l}</button>)}</div></div>
        {err&&<div style={{background:T.dangerBg,color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:14}}>{err}</div>}
        <button onClick={go} disabled={saving} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:16,fontWeight:600,cursor:"pointer",opacity:saving?0.7:1,fontFamily:F}}>{saving?"Speichern...":"✓ Schüler anlegen"}</button>
      </Card>
    </div>
  );
}

// ── DIAGRAMM VIEW ───────────────────────────────────
function DiagrammView({s,mat,setMat,onMat,isLehrer,startStufe,adminEdit}) {
  const [sel,setSel]=useState(startStufe||AUSBILDUNG[0].id);
  const [tab,setTab]=useState("diagramm");
  const [themen,setThemen]=useState({}); const [naechstes,setNaechstes]=useState({});
  const [notizen,setNotizen]=useState([]); const [info,setInfo]=useState(null);
  const [infoF,setInfoF]=useState({klassen:[],sehhilfe:"Keine",theorie:false});
  const [editI,setEditI]=useState(false); const [neuePin,setNeuePin]=useState(""); const [pinFehler,setPinFehler]=useState("");
  const [notizT,setNotizT]=useState(""); const [load,setLoad]=useState(true);

  const laden=useCallback(async()=>{
    setLoad(true);
    const[t,n,i]=await Promise.all([
      supabase.from("ausbildungsstand").select("*").eq("schueler_id",s.id),
      supabase.from("notizen").select("*").eq("schueler_id",s.id).order("erstellt_am",{ascending:false}),
      supabase.from("schueler_info").select("*").eq("schueler_id",s.id).single(),
    ]);
    const tm={},nm={};
    (t.data||[]).forEach(x=>{tm[x.item_key]=Number(x.wert);if(x.naechstes)nm[x.item_key]=true;});
    setThemen(tm);setNaechstes(nm);setNotizen(n.data||[]);
    if(i.data){setInfo(i.data);setInfoF({klassen:i.data.klassen||[],sehhilfe:i.data.sehhilfe||"Keine",theorie:i.data.theorie||false});}
    setLoad(false);
  },[s.id]);
  useEffect(()=>{laden();},[laden]);

  const toggle=async k=>{const v=nxt(themen[k]||0);setThemen(p=>({...p,[k]:v}));await supabase.from("ausbildungsstand").upsert({schueler_id:s.id,item_key:k,wert:v,aktualisiert_am:new Date().toISOString()},{onConflict:"schueler_id,item_key"});};
  const toggleN=async k=>{const ist=!!naechstes[k];const nm={...naechstes};if(ist)delete nm[k];else nm[k]=true;setNaechstes(nm);await supabase.from("ausbildungsstand").upsert({schueler_id:s.id,item_key:k,wert:themen[k]||0,naechstes:!ist,aktualisiert_am:new Date().toISOString()},{onConflict:"schueler_id,item_key"});};
  const pinNeu=async()=>{
    if(!window.confirm("Neue PIN für "+s.name+" vergeben? Die alte PIN wird ungültig.")) return;
    setPinFehler("");
    const {data,error}=await kontoFn({aktion:"pin_setzen",typ:"schueler",id:s.id});
    if(error){setPinFehler(error);return;}
    setNeuePin(data.pin);
  };
  const saveInfo=async()=>{await supabase.from("schueler_info").upsert({schueler_id:s.id,...infoF,aktualisiert_am:new Date().toISOString()},{onConflict:"schueler_id"});setInfo(p=>({...p,...infoF}));setEditI(false);};

  const pct=Math.round((Object.values(themen).filter(v=>v===2).length/ALL.length)*100);
  const stufe=AUSBILDUNG.find(x=>x.id===sel)||AUSBILDUNG[0];

  if(load) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80}}><span style={{fontSize:36}}>⏳</span></div>;

  return (
    <div style={{padding:"16px 16px 0",fontFamily:F}}>
      <Card style={{padding:18,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <Ring pct={pct} size={64}/>
          <div style={{flex:1}}>
            <div style={{fontSize:20,fontWeight:700,color:T.label,marginBottom:5}}>{isLehrer?s.name:"Mein Fortschritt"}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {(info?.klassen||[]).map(k=><span key={k} style={{background:`${T.blue}18`,color:T.blue,borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:600}}>{k}</span>)}
              {isLehrer&&<span style={{background:info?.theorie?`${T.green}18`:`${T.orange}18`,color:info?.theorie?T.green:T.orange,borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:600}}>{info?.theorie?"✅ Theorie":"⏳ Theorie"}</span>}
            </div>
          </div>
        </div>
      </Card>

      {Object.keys(naechstes).length>0&&(
        <div style={{background:`${T.blue}10`,border:`1px solid ${T.blue}30`,borderRadius:16,padding:14,marginBottom:14}}>
          <div style={{fontSize:11,color:T.blue,fontWeight:700,letterSpacing:0.8,marginBottom:10}}>📍 ALS NÄCHSTES GEPLANT</div>
          {nKeys(naechstes).map(k=>{
            const p=k.split("::");const so=AUSBILDUNG.find(x=>x.id===p[0]);const mk=`${p[0]}::${p[1]}`;
            const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0);
            return <div key={k} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.blue}20`}}>
              <span style={{fontSize:18}}>{so?.icon||"📍"}</span>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label}}>{p.length===2?p[1]:p[2]}</div><div style={{fontSize:12,color:T.label2}}>{so?.label}{p.length===2?" · ganze Kategorie":" · "+p[1]}</div></div>
              {hm&&onMat&&<button onClick={()=>onMat(mk)} style={{background:T.blue,color:"#fff",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>📚</button>}
            </div>;
          })}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:isLehrer?"1fr 1fr 1fr":"1fr 1fr",gap:0,background:T.inset,borderRadius:10,padding:2,marginBottom:14,border:`1px solid ${T.sep}`}}>
        {[["diagramm","📊 Diagramm"],["notizen","📝 Notizen"],...(isLehrer?[["akte","👤 Akte"]]:[])].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?T.sel:"transparent",border:"none",borderRadius:8,padding:"8px",fontSize:12,fontWeight:600,cursor:"pointer",color:tab===k?T.label:T.label2,fontFamily:F,boxShadow:tab===k?T.s1:"none",transition:"all .2s"}}>{l}</button>
        ))}
      </div>

      {tab==="diagramm"&&<>
        <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
          {AUSBILDUNG.map(x=>{
            const ks=x.gruppen.flatMap(g=>g.items.map(i=>`${x.id}::${g.name}::${i}`));
            const sp=Math.round((ks.filter(k=>(themen[k]||0)===2).length/ks.length)*100);
            const act=sel===x.id;
            return <button key={x.id} onClick={()=>setSel(x.id)} style={{background:act?x.color:T.card,backdropFilter:"blur(10px)",border:`1px solid ${act?x.color:T.sep}`,borderRadius:14,padding:"10px 14px",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:70,cursor:"pointer",fontFamily:F,boxShadow:"none",transition:"all .2s"}}>
              <span style={{fontSize:20}}>{x.icon}</span>
              <span style={{fontSize:10,color:act?"#fff":T.label2,fontWeight:600}}>{x.label}</span>
              <span style={{fontSize:12,fontWeight:700,color:act?"#fff":x.color}}>{sp}%</span>
            </button>;
          })}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {stufe.gruppen.map(g=>{
            const gk=g.items.map(i=>`${stufe.id}::${g.name}::${i}`);
            const gb=gk.filter(k=>(themen[k]||0)===2).length;
            const mk=`${stufe.id}::${g.name}`;
            const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0);
            return <div key={g.name} style={{background:T.white,borderRadius:16,overflow:"hidden",border:`1px solid ${T.glassBorder}`,boxShadow:T.s1}}>
              <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.sep}`}}>
                <span style={{fontSize:15,fontWeight:600,color:T.label,fontFamily:F}}>{g.name}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {isLehrer&&<button onClick={()=>toggleN(mk)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:naechstes[mk]?1:0.25,padding:0,flexShrink:0}}>📍</button>}
                  {(hm||adminEdit)&&<button onClick={()=>onMat&&onMat(mk)} style={{background:hm?`${T.blue}18`:`${T.gray}10`,color:hm?T.blue:T.gray,border:`1px solid ${hm?T.blue+"30":T.sep}`,borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>{hm?"📚 Material":"+ Material"}</button>}
                  <span style={{fontSize:12,color:T.label2}}>{gb}/{g.items.length}</span>
                </div>
              </div>
              {g.items.map((item,i)=>{
                const k=`${stufe.id}::${g.name}::${item}`;
                const v=themen[k]||0;
                const col=v===2?T.green:v===1?T.orange:T.label3;
                return <div key={item} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:i<g.items.length-1?`1px solid ${T.sep}`:"none",background:naechstes[k]?`${T.blue}06`:"transparent"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:14,color:T.label,fontFamily:F}}>{item}</span>
                  {naechstes[k]&&<span style={{fontSize:10,background:`${T.blue}15`,color:T.blue,borderRadius:999,padding:"2px 8px",fontWeight:600}}>Nächstes</span>}
                  {isLehrer&&<button onClick={()=>toggleN(k)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:naechstes[k]?1:0.2,padding:0,flexShrink:0}}>📍</button>}
                  <button onClick={isLehrer?()=>toggle(k):undefined} style={{background:"none",border:"none",cursor:isLehrer?"pointer":"default",padding:0,flexShrink:0}}>
                    <div style={{width:56,height:5,background:T.sep,borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",borderRadius:99,width:v===2?"100%":v===1?"50%":"0%",background:col,transition:"width .25s"}}/></div>
                  </button>
                </div>;
              })}
            </div>;
          })}
        </div>
      </>}

      {tab==="notizen"&&<div style={{marginBottom:20}}>
        {isLehrer&&<Card style={{padding:16,marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:12}}>Neue Notiz</div>
          <textarea value={notizT} onChange={e=>setNotizT(e.target.value)} placeholder="Notiz für den Schüler..." style={{width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px",fontSize:14,color:T.label,outline:"none",minHeight:80,resize:"vertical",fontFamily:F,marginBottom:10}}/>
          <button onClick={async()=>{if(!notizT.trim())return;const{data}=await supabase.from("notizen").insert({schueler_id:s.id,text:notizT.trim(),datum:new Date().toISOString().split("T")[0]}).select().single();if(data)setNotizen(p=>[data,...p]);setNotizT("");}} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>Speichern</button>
        </Card>}
        {notizen.length===0&&<Card style={{padding:32,textAlign:"center"}}><div style={{color:T.label2}}>Noch keine Notizen</div></Card>}
        {notizen.map(n=><Card key={n.id} style={{padding:16,marginBottom:8,borderLeft:`3px solid ${T.blue}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:12,color:T.label2,fontWeight:500}}>👨‍🏫 {new Date(n.datum).toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"})}</div>
            {isLehrer&&<button onClick={async()=>{await supabase.from("notizen").delete().eq("id",n.id);setNotizen(p=>p.filter(x=>x.id!==n.id));}} style={{background:"none",border:"none",cursor:"pointer",color:T.label2,fontSize:16}}>🗑</button>}
          </div>
          <div style={{fontSize:14,color:T.label,lineHeight:1.6}}>{n.text}</div>
        </Card>)}
      </div>}

      {tab==="akte"&&isLehrer&&<div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
        <div style={{background:T.white,borderRadius:16,overflow:"hidden",border:`1px solid ${T.glassBorder}`,boxShadow:T.s1}}>
          <Row><span style={{flex:1,fontSize:15,color:T.label}}>Name</span><span style={{fontSize:15,fontWeight:500}}>{s.name}</span></Row>
          <Row><span style={{flex:1,fontSize:15,color:T.label}}>Anmeldename</span><span style={{fontSize:15,fontWeight:500}}>{s.login_name||"–"}</span></Row>
          <Row last><span style={{flex:1,fontSize:15,color:T.label}}>PIN</span>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {neuePin&&<span style={{fontSize:18,fontWeight:700,letterSpacing:3,color:T.blue}}>{neuePin}</span>}
              <button onClick={pinNeu} style={{background:`${T.blue}18`,color:T.blue,border:"none",borderRadius:8,padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:F}}>Neue PIN vergeben</button>
            </div>
          </Row>
        </div>
        {pinFehler&&<div style={{background:T.dangerBg,color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13}}>{pinFehler}</div>}
        {neuePin&&<div style={{fontSize:12,color:T.label2}}>Diese PIN wird nur jetzt angezeigt. Bitte dem Schüler weitergeben.</div>}
        <Card style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:600,color:T.label}}>Schüler-Infos</div>
            <button onClick={()=>editI?saveInfo():setEditI(true)} style={{background:editI?T.green:`${T.gray}18`,color:editI?"#fff":T.label2,border:"none",borderRadius:999,padding:"6px 14px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>{editI?"✓ Speichern":"✏️ Bearbeiten"}</button>
          </div>
          {editI?<div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:8}}>Fahrerlaubnisklassen</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{KLASSEN.map(k=>{const sel=(infoF.klassen||[]).includes(k);return <button key={k} onClick={()=>{const c=infoF.klassen||[];setInfoF({...infoF,klassen:sel?c.filter(x=>x!==k):[...c,k]});}} style={{padding:"8px 16px",borderRadius:999,border:`1px solid ${sel?T.blue:T.sep}`,background:sel?`${T.blue}18`:"transparent",color:sel?T.blue:T.label2,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:F}}>{k}</button>;})}</div></div>
            <div><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:8}}>Sehhilfe</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{["Keine","Brille"].map(o=><button key={o} onClick={()=>setInfoF({...infoF,sehhilfe:o})} style={{padding:"10px",borderRadius:12,border:`1px solid ${infoF.sehhilfe===o?T.blue:T.sep}`,background:infoF.sehhilfe===o?`${T.blue}18`:"transparent",color:infoF.sehhilfe===o?T.blue:T.label2,cursor:"pointer",fontSize:14,fontFamily:F}}>{o}</button>)}</div></div>
            <div><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:8}}>Theorie</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[{l:"⏳ Ausstehend",v:false},{l:"✅ Bestanden",v:true}].map(o=><button key={String(o.v)} onClick={()=>setInfoF({...infoF,theorie:o.v})} style={{padding:"10px",borderRadius:12,border:`1px solid ${infoF.theorie===o.v?(o.v?T.green:T.red):T.sep}`,background:infoF.theorie===o.v?(o.v?`${T.green}18`:`${T.red}18`):"transparent",color:infoF.theorie===o.v?(o.v?T.green:T.red):T.label2,cursor:"pointer",fontSize:13,fontFamily:F}}>{o.l}</button>)}</div></div>
          </div>:<div style={{background:T.white,borderRadius:12,overflow:"hidden",border:`1px solid ${T.glassBorder}`}}>
            <Row><span style={{fontSize:14,color:T.label2}}>Klassen</span><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{(info?.klassen||[]).length>0?info.klassen.map(k=><span key={k} style={{background:`${T.blue}18`,color:T.blue,borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:600}}>{k}</span>):<span style={{color:T.label2}}>–</span>}</div></Row>
            <Row><span style={{fontSize:14,color:T.label2}}>Sehhilfe</span><span style={{fontSize:14,color:T.label}}>{info?.sehhilfe||"–"}</span></Row>
            <Row last><span style={{fontSize:14,color:T.label2}}>Theorie</span><span style={{fontSize:14,fontWeight:600,color:info?.theorie?T.green:T.orange}}>{info?.theorie?"✅ Bestanden":"⏳ Ausstehend"}</span></Row>
          </div>}
        </Card>
        <Card style={{padding:18}}>
          <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:12}}>📄 ADK Export</div>
          <button onClick={()=>{
            const text=`Ausbildungsdiagramm - ${s.name}\nDatum: ${new Date().toLocaleDateString("de-DE")}\n\n`+AUSBILDUNG.map(x=>x.label+"\n"+x.gruppen.map(g=>"  "+g.name+"\n"+g.items.map(i=>{const v=themen[`${x.id}::${g.name}::${i}`]||0;return `    ${v===2?"✅":v===1?"⏳":"○"} ${i}`;}).join("\n")).join("\n")).join("\n\n");
            const b=new Blob([text],{type:"text/plain;charset=utf-8"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`ADK_${s.name.replace(/ /g,"_")}.txt`;a.click();URL.revokeObjectURL(u);
          }} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>📄 Herunterladen</button>
        </Card>
      </div>}
    </div>
  );
}

// ── MATERIAL LISTE ──────────────────────────────────
function MatListe({mat,onOpen,themen,nurMitMaterial}) {
  const [sel,setSel]=useState(LERN[0].key);
  const stufe=LERN.find(x=>x.key===sel)||LERN[0];
  const stufeGruppen=nurMitMaterial?stufe.gruppen.filter(g=>{const m2=mat&&mat[`${stufe.id}::${g.name}`];return m2&&(m2.videoUrl||m2.fotos?.length>0||m2.quiz?.length>0||m2.pdfUrl);}):stufe.gruppen;
  return (
    <div style={{background:"transparent",minHeight:"100dvh",padding:"20px 16px 0"}}>
      <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56,marginBottom:4,fontFamily:F}}>Lernen</div>
      <div style={{fontSize:14,color:T.label2,marginBottom:20,fontFamily:F}}>{nurMitMaterial?"Verfügbares Lernmaterial":"Lernmaterial für alle Bereiche"}</div>
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {LERN.map(x=>{
          const act=sel===x.key;
          const ks=x.gruppen.flatMap(g=>g.items.map(i=>`${x.id}::${g.name}::${i}`));
          const sp=themen?Math.round((ks.filter(k=>(themen[k]||0)===2).length/ks.length)*100):null;
          return <button key={x.key} onClick={()=>setSel(x.key)} style={{background:act?x.color:T.card,backdropFilter:"blur(10px)",border:`1px solid ${act?x.color:T.sep}`,borderRadius:14,padding:"10px 14px",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:70,cursor:"pointer",fontFamily:F,transition:"all .2s"}}>
            <span style={{fontSize:20}}>{x.icon}</span>
            <span style={{fontSize:10,color:act?"#fff":T.label2,fontWeight:600,textAlign:"center"}}>{x.label}</span>
            {sp!==null&&<span style={{fontSize:12,fontWeight:700,color:act?"#fff":x.color}}>{sp}%</span>}
          </button>;
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:12}}>
        <div style={{background:T.white,borderRadius:16,overflow:"hidden",border:`1px solid ${T.glassBorder}`,borderLeft:`3px solid ${stufe.color}`}}>
          <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${T.sep}`}}>
            <span style={{fontSize:22}}>{stufe.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:T.label,fontFamily:F}}>{stufe.label}</div><div style={{fontSize:12,color:T.label2,fontFamily:F}}>{stufe.gruppen.flatMap(g=>g.items).length} Punkte</div></div>
          </div>
          {stufeGruppen.length===0&&<Row last><div style={{flex:1,textAlign:"center",fontSize:14,color:T.label2,fontFamily:F}}>Noch kein Lernmaterial</div></Row>}
          {stufeGruppen.map((g,gi)=>{
            const mk=`${stufe.id}::${g.name}`;
            const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0||mat[mk].pdfUrl);
            return <Row key={g.name} last={gi===stufeGruppen.length-1} onClick={()=>onOpen(mk)}>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:500,color:T.label,fontFamily:F}}>{g.name}</div><div style={{fontSize:12,color:T.label2,fontFamily:F}}>{g.items.length} Punkte</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {hm&&<span style={{fontSize:11,background:`${T.blue}18`,color:T.blue,borderRadius:999,padding:"3px 9px",fontWeight:600}}>Material</span>}
                <span style={{color:T.label3,fontSize:20}}>›</span>
              </div>
            </Row>;
          })}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {[{e:"🛣️",t:"Prüfungsstrecken"},{e:"📖",t:"Theorie"}].map((x,i)=>(
          <Card key={i} style={{padding:14,opacity:0.55}}>
            <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:26}}>{x.e}</span><div style={{fontSize:15,fontWeight:600,color:T.label,fontFamily:F}}>{x.t}</div></div>
              <div style={{background:`${T.purple}18`,color:T.purple,borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:700,fontFamily:F}}>Coming Soon</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── MAT VIEW ────────────────────────────────────────
function MatView({ik,mat,setMat,isLehrer}) {
  const name=ik.split("::")[1]||ik;
  const [m,setM]=useState({videoUrl:"",fotos:[],quiz:[],pdfUrl:"",pdfName:""});
  const [vInp,setVInp]=useState(""); const [fInp,setFInp]=useState("");
  const [sav,setSav]=useState(false); const [quizSt,setQuizSt]=useState(null);
  const [editQ,setEditQ]=useState(false); const [editQId,setEditQId]=useState(null);
  const [qF,setQF]=useState({frage:"",typ:"mc",antworten:["","","",""],richtig:0,erklaerung:"",bildUrl:""});
  const [fsIdx,setFsIdx]=useState(null);

  useEffect(()=>{
    const l=async()=>{
      const[mr,qr]=await Promise.all([supabase.from("lernmaterial").select("*").eq("item_key",ik).single(),supabase.from("quiz_fragen").select("*").eq("item_key",ik)]);
      const loaded={videoUrl:mr.data?.video_url||"",fotos:mr.data?.fotos||[],pdfUrl:mr.data?.pdf_url||"",pdfName:mr.data?.pdf_name||"",quiz:(qr.data||[]).map(q=>({id:q.id,frage:q.frage,typ:q.typ,antworten:q.antworten||[],richtig:q.richtig,erklaerung:q.erklaerung||"",bildUrl:q.bild_url||""}))};
      setM(loaded);setVInp(loaded.videoUrl||"");
    };l();
  },[ik]);

  const em=u=>{const x=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);return x?`https://www.youtube.com/embed/${x[1]}`:u;};
  const save=async u=>{
    const mg={...m,...u};setM(mg);if(setMat)setMat(p=>({...p,[ik]:mg}));
    setSav(true);
    await supabase.from("lernmaterial").upsert({item_key:ik,video_url:mg.videoUrl||"",fotos:mg.fotos||[],pdf_url:mg.pdfUrl||"",pdf_name:mg.pdfName||"",aktualisiert_am:new Date().toISOString()},{onConflict:"item_key"});
    if(u.quiz!==undefined){await supabase.from("quiz_fragen").delete().eq("item_key",ik);if(mg.quiz?.length>0)await supabase.from("quiz_fragen").insert(mg.quiz.map(q=>({item_key:ik,frage:q.frage,typ:q.typ,antworten:q.antworten||[],richtig:typeof q.richtig==="boolean"?(q.richtig?1:0):q.richtig,erklaerung:q.erklaerung||"",bild_url:q.bildUrl||""})));}
    setSav(false);
  };
  const upload=async(file,pre)=>{const n=`${pre}_${Date.now()}.${file.name.split(".").pop()||"bin"}`;for(const b of["Lernmaterial","lernmaterial"]){const{error}=await supabase.storage.from(b).upload(n,file,{upsert:true,contentType:file.type});if(!error){const{data:u}=supabase.storage.from(b).getPublicUrl(n);return u.publicUrl;}}return null;};

  if(quizSt) return <QuizView quiz={m.quiz} st={quizSt} setSt={setQuizSt} onBack={()=>setQuizSt(null)}/>;

  return (
    <div style={{padding:"16px 16px 24px",fontFamily:F}}>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14,minHeight:20}}>
        {sav&&<span style={{fontSize:12,color:T.orange,fontWeight:600}}>⏳ Speichern...</span>}
        {!sav&&isLehrer&&<span style={{fontSize:12,color:T.green,fontWeight:600}}>✓ Gespeichert</span>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        {/* PDF */}
        <Card style={{padding:18}}>
          <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:14}}>📄 Dokument</div>
          {isLehrer&&<label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"11px",cursor:"pointer",fontSize:14,color:T.label2,marginBottom:12}}>📄 PDF hochladen<input type="file" accept=".pdf,.doc,.docx" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setSav(true);const u=await upload(f,"doc");if(u)await save({pdfUrl:u,pdfName:f.name});setSav(false);}}/></label>}
          {m.pdfUrl?<a href={m.pdfUrl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:12,padding:"14px",background:T.inset,borderRadius:12,textDecoration:"none",color:T.label,border:`1px solid ${T.sep}`}}><span style={{fontSize:32}}>📄</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{m.pdfName||"Dokument"}</div><div style={{fontSize:12,color:T.label2}}>Tippen zum Öffnen</div></div><span style={{color:T.blue,fontSize:20}}>↗</span></a>:<div style={{textAlign:"center",padding:20,color:T.label2,background:T.inset,borderRadius:12,fontSize:14}}>{isLehrer?"Noch kein Dokument":"Kein Dokument"}</div>}
          {isLehrer&&m.pdfUrl&&<button onClick={()=>save({pdfUrl:"",pdfName:""})} style={{marginTop:10,background:`${T.red}15`,color:T.red,border:"none",borderRadius:10,padding:"8px",width:"100%",cursor:"pointer",fontSize:13,fontFamily:F}}>Entfernen</button>}
        </Card>

        {/* Video */}
        <Card style={{padding:18}}>
          <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:14}}>📹 Video</div>
          {isLehrer&&<div style={{display:"flex",gap:8,marginBottom:12}}><input style={{flex:1,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F}} placeholder="YouTube Link..." value={vInp} onChange={e=>setVInp(e.target.value)}/><button onClick={async()=>await save({videoUrl:em(vInp)})} style={{background:T.blue,color:"#fff",border:"none",borderRadius:12,padding:"10px 16px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F}}>OK</button></div>}
          {m.videoUrl?<div style={{position:"relative",paddingBottom:"56.25%",height:0,borderRadius:12,overflow:"hidden"}}><iframe src={m.videoUrl} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}} allowFullScreen title="Video"/></div>:<div style={{textAlign:"center",padding:32,color:T.label2,background:T.inset,borderRadius:12,fontSize:14}}>{isLehrer?"YouTube Link einfügen":"Noch kein Video"}</div>}
        </Card>

        {/* Fotos */}
        <Card style={{padding:18}}>
          <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:14}}>🖼 Fotos</div>
          {isLehrer&&<div style={{marginBottom:12}}>
            <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:T.green,color:"#fff",borderRadius:12,padding:"11px",cursor:"pointer",fontSize:14,fontWeight:600,marginBottom:8}}>📷 Foto hochladen<input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setSav(true);const u=await upload(f,"foto");if(u)await save({fotos:[...(m.fotos||[]),u]});setSav(false);}}/></label>
            <div style={{display:"flex",gap:8}}><input style={{flex:1,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F}} placeholder="https://...jpg" value={fInp} onChange={e=>setFInp(e.target.value)}/><button onClick={async()=>{if(!fInp.trim())return;await save({fotos:[...(m.fotos||[]),fInp.trim()]});setFInp("");}} style={{background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 16px",fontSize:14,color:T.label2,cursor:"pointer",fontFamily:F}}>+</button></div>
          </div>}
          {(m.fotos||[]).length===0?<div style={{textAlign:"center",padding:24,color:T.label2,background:T.inset,borderRadius:12,fontSize:14}}>{isLehrer?"Noch keine Fotos":"Keine Fotos"}</div>:
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {(m.fotos||[]).map((u,i)=>(
                <div key={i} style={{position:"relative",borderRadius:14,overflow:"hidden",aspectRatio:"1/1",border:`1px solid ${T.sep}`}}>
                  <img src={u} alt="" onClick={()=>setFsIdx(i)} style={{width:"100%",height:"100%",objectFit:"cover",cursor:"pointer"}} onError={e=>{e.target.style.display="none";}}/>
                  {isLehrer&&<button onClick={async()=>save({fotos:(m.fotos||[]).filter((_,j)=>j!==i)})} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",border:"none",borderRadius:8,color:"#fff",padding:"4px 8px",cursor:"pointer",fontSize:13}}>🗑</button>}
                  <button onClick={()=>setFsIdx(i)} style={{position:"absolute",bottom:6,right:6,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",border:"none",borderRadius:8,color:"#fff",padding:"3px 8px",fontSize:11,cursor:"pointer"}}>🔍</button>
                </div>
              ))}
            </div>}
          {fsIdx!==null&&(m.fotos||[]).length>0&&<FullScreen fotos={m.fotos||[]} start={fsIdx} onClose={()=>setFsIdx(null)}/>}
        </Card>

        {/* Quiz */}
        <Card style={{padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:600,color:T.label}}>❓ Quiz ({(m.quiz||[]).length} Fragen)</div>
            <div style={{display:"flex",gap:8}}>
              {(m.quiz||[]).length>0&&<button onClick={()=>setQuizSt({index:0,answers:{},submitted:false,score:0})} style={{background:T.green,color:"#fff",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>▶ Start</button>}
              {isLehrer&&<button onClick={()=>{setEditQ(!editQ);setEditQId(null);setQF({frage:"",typ:"mc",antworten:["","","",""],richtig:0,erklaerung:"",bildUrl:""});}} style={{background:`${T.gray}15`,color:T.label2,border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>{editQ?"Abbrechen":"+ Frage"}</button>}
            </div>
          </div>
          {editQ&&isLehrer&&<div style={{background:T.inset,borderRadius:14,padding:16,marginBottom:14,border:`1px solid ${T.sep}`}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>{[{v:"mc",l:"Multiple Choice"},{v:"wf",l:"Wahr/Falsch"}].map(t=><button key={t.v} onClick={()=>setQF({...qF,typ:t.v})} style={{padding:"9px",borderRadius:12,border:`1px solid ${qF.typ===t.v?T.blue:T.sep}`,background:qF.typ===t.v?`${T.blue}18`:T.inset,color:qF.typ===t.v?T.blue:T.label2,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:F}}>{t.l}</button>)}</div>
            <input style={{width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F,marginBottom:10}} value={qF.frage} onChange={e=>setQF({...qF,frage:e.target.value})} placeholder="Frage *"/>
            <label style={{display:"flex",alignItems:"center",gap:8,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",cursor:"pointer",fontSize:13,color:T.label2,marginBottom:10}}>📷 Bild zur Frage<input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setSav(true);const u=await upload(f,"quiz");if(u)setQF(p=>({...p,bildUrl:u}));setSav(false);}}/></label>
            {qF.bildUrl&&<img src={qF.bildUrl} alt="" style={{height:60,borderRadius:8,objectFit:"cover",marginBottom:10}}/>}
            {qF.typ==="mc"&&<>{qF.antworten.map((a,i)=><input key={i} style={{width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F,marginBottom:6}} placeholder={`Antwort ${i+1}`} value={a} onChange={e=>{const n=[...qF.antworten];n[i]=e.target.value;setQF({...qF,antworten:n});}}/>)}<select style={{width:"100%",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F,marginBottom:10}} value={qF.richtig} onChange={e=>setQF({...qF,richtig:parseInt(e.target.value)})}>{qF.antworten.map((a,i)=><option key={i} value={i}>{i+1}. {a||`Antwort ${i+1}`}</option>)}</select></>}
            {qF.typ==="wf"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>{[{v:true,l:"✓ Wahr"},{v:false,l:"✗ Falsch"}].map(o=><button key={String(o.v)} onClick={()=>setQF({...qF,richtig:o.v})} style={{padding:"10px",borderRadius:12,border:`1px solid ${qF.richtig===o.v?T.green:T.sep}`,background:qF.richtig===o.v?`${T.green}18`:T.inset,color:qF.richtig===o.v?T.green:T.label2,cursor:"pointer",fontSize:14,fontFamily:F}}>{o.l}</button>)}</div>}
            <input style={{width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F,marginBottom:12}} value={qF.erklaerung} onChange={e=>setQF({...qF,erklaerung:e.target.value})} placeholder="Erklärung (optional)"/>
            <button onClick={async()=>{
              if(!qF.frage.trim())return;
              if(editQId){await save({quiz:(m.quiz||[]).map(q=>q.id===editQId?{...q,...qF,antworten:qF.antworten.filter(a=>a.trim())}:q)});}
              else{const q={id:"q"+Date.now(),...qF,antworten:qF.antworten.filter(a=>a.trim())};await save({quiz:[...(m.quiz||[]),q]});}
              setQF({frage:"",typ:"mc",antworten:["","","",""],richtig:0,erklaerung:"",bildUrl:""});setEditQ(false);setEditQId(null);
            }} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>{editQId?"✓ Änderungen speichern":"Frage speichern"}</button>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(m.quiz||[]).length===0&&!editQ&&<div style={{textAlign:"center",padding:24,color:T.label2,background:T.inset,borderRadius:12,fontSize:14}}>{isLehrer?"Klicke + Frage":"Noch keine Fragen"}</div>}
            {(m.quiz||[]).map(q=><div key={q.id} style={{background:T.inset,borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:8,border:`1px solid ${T.sep}`}}>
              <span style={{fontSize:11,background:q.typ==="mc"?`${T.blue}18`:`${T.green}18`,color:q.typ==="mc"?T.blue:T.green,borderRadius:999,padding:"3px 9px",fontWeight:600,flexShrink:0}}>{q.typ==="mc"?"MC":"W/F"}</span>
              <span style={{fontSize:13,flex:1,color:T.label}}>{q.frage}</span>
              {isLehrer&&<><button onClick={()=>{setEditQId(q.id);setQF({frage:q.frage,typ:q.typ,antworten:q.antworten?.length>=4?q.antworten:[...q.antworten||[],...Array(4).fill("")].slice(0,4),richtig:q.richtig,erklaerung:q.erklaerung||"",bildUrl:q.bildUrl||""});setEditQ(true);}} style={{background:"none",border:"none",cursor:"pointer",color:T.blue,fontSize:15}}>✏️</button><button onClick={async()=>save({quiz:(m.quiz||[]).filter(x=>x.id!==q.id)})} style={{background:"none",border:"none",cursor:"pointer",color:T.label2,fontSize:16}}>🗑</button></>}
            </div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── FULLSCREEN ──────────────────────────────────────
function FullScreen({fotos,start,onClose}) {
  const [i,setI]=useState(start); const [tx,setTx]=useState(null);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onTouchStart={e=>setTx(e.touches[0].clientX)} onTouchEnd={e=>{if(tx===null)return;const d=tx-e.changedTouches[0].clientX;if(d>50)setI(x=>(x+1)%fotos.length);else if(d<-50)setI(x=>(x-1+fotos.length)%fotos.length);setTx(null);}}>
    <div style={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <img src={fotos[i]} alt="" style={{maxWidth:"100%",maxHeight:"90vh",objectFit:"contain",borderRadius:12}}/>
      <button onClick={onClose} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",border:"none",borderRadius:"50%",width:44,height:44,color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      {fotos.length>1&&<>
        <div style={{position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",fontSize:13,color:"#fff",fontWeight:600}}>{i+1} / {fotos.length}</div>
        <button onClick={()=>setI(x=>(x-1+fotos.length)%fotos.length)} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",border:"none",borderRadius:"50%",width:48,height:48,color:"#fff",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <button onClick={()=>setI(x=>(x+1)%fotos.length)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",border:"none",borderRadius:"50%",width:48,height:48,color:"#fff",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        <div style={{position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>{fotos.map((_,j)=><div key={j} onClick={()=>setI(j)} style={{width:j===i?20:7,height:7,borderRadius:99,background:j===i?"#fff":"rgba(255,255,255,0.3)",cursor:"pointer",transition:"all .2s"}}/>)}</div>
      </>}
    </div>
  </div>;
}

// ── QUIZ VIEW ───────────────────────────────────────
function QuizView({quiz,st,setSt,onBack}) {
  const{index,answers,submitted,score}=st;
  const submit=()=>{let sc=0;quiz.forEach(q=>{if(answers[q.id]===q.richtig)sc++;});setSt({...st,submitted:true,score:sc});};
  if(submitted){
    const pct=Math.round((score/quiz.length)*100);
    return <div style={{padding:"0 16px 24px",fontFamily:F}}>
      <div style={{textAlign:"center",padding:"36px 0 24px"}}><div style={{fontSize:56,marginBottom:12}}>{pct>=70?"🎉":"📚"}</div><div style={{fontSize:28,fontWeight:700,color:T.label,marginBottom:4}}>{pct>=70?"Super!":"Weiter üben!"}</div><div style={{fontSize:42,fontWeight:700,color:pct>=70?T.green:T.red}}>{pct}%</div><div style={{color:T.label2,marginTop:6}}>{score} von {quiz.length} richtig</div></div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>{quiz.map((q,j)=>{const ok=answers[q.id]===q.richtig;return <Card key={q.id} style={{padding:16,borderLeft:`3px solid ${ok?T.green:T.red}`}}>{q.bildUrl&&<img src={q.bildUrl} alt="" style={{width:"100%",maxHeight:130,objectFit:"contain",borderRadius:10,marginBottom:10,background:T.inset}}/>}<div style={{fontWeight:600,color:T.label,marginBottom:6}}>#{j+1} {q.frage}</div><div style={{fontSize:13,color:T.label}}>{ok?"✅":"❌"} {q.typ==="mc"?(q.antworten[answers[q.id]]||"–"):(answers[q.id]===true?"Wahr":answers[q.id]===false?"Falsch":"–")}{!ok&&<span style={{color:T.green}}> · Richtig: {q.typ==="mc"?q.antworten[q.richtig]:(q.richtig?"Wahr":"Falsch")}</span>}</div>{q.erklaerung&&<div style={{marginTop:6,fontSize:12,color:T.label2,fontStyle:"italic"}}>💡 {q.erklaerung}</div>}</Card>;})}
      </div>
      <button onClick={onBack} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:F}}>← Zurück</button>
    </div>;
  }
  const q=quiz[index];
  return <div style={{padding:"0 16px 24px",fontFamily:F}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><button onClick={onBack} style={{background:T.inset,border:`1px solid ${T.sep}`,borderRadius:999,padding:"8px 16px",fontSize:13,color:T.label2,cursor:"pointer",fontFamily:F}}>← Abbrechen</button><span style={{fontSize:14,color:T.label2}}>Frage {index+1} / {quiz.length}</span></div>
    <div style={{background:T.sep,borderRadius:99,height:5,marginBottom:20}}><div style={{background:T.blue,height:5,borderRadius:99,width:`${((index+1)/quiz.length)*100}%`,transition:"width .3s"}}/></div>
    <Card style={{padding:20,marginBottom:14}}>
      {q.bildUrl&&<img src={q.bildUrl} alt="" style={{width:"100%",maxHeight:200,objectFit:"contain",borderRadius:12,marginBottom:14,background:T.inset}}/>}
      <div style={{fontSize:18,fontWeight:600,color:T.label,marginBottom:20,lineHeight:1.4}}>{q.frage}</div>
      {q.typ==="mc"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.antworten.map((a,j)=><button key={j} onClick={()=>setSt({...st,answers:{...answers,[q.id]:j}})} style={{background:answers[q.id]===j?T.blue:T.inset,color:answers[q.id]===j?"#fff":T.label,border:`1px solid ${answers[q.id]===j?T.blue:T.sep}`,borderRadius:14,padding:"13px 16px",cursor:"pointer",textAlign:"left",fontSize:15,fontWeight:answers[q.id]===j?600:400,fontFamily:F,transition:"all .15s"}}>{a}</button>)}</div>}
      {q.typ==="wf"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[{v:true,l:"✓ Wahr"},{v:false,l:"✗ Falsch"}].map(o=><button key={String(o.v)} onClick={()=>setSt({...st,answers:{...answers,[q.id]:o.v}})} style={{background:answers[q.id]===o.v?T.blue:T.inset,color:answers[q.id]===o.v?"#fff":T.label,border:`1px solid ${answers[q.id]===o.v?T.blue:T.sep}`,borderRadius:14,padding:"14px",cursor:"pointer",fontSize:16,fontWeight:600,fontFamily:F}}>{o.l}</button>)}</div>}
    </Card>
    <div style={{display:"flex",gap:12}}>
      {index>0&&<button onClick={()=>setSt({...st,index:index-1})} style={{flex:1,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:14,padding:"13px",fontSize:15,fontWeight:500,cursor:"pointer",color:T.label,fontFamily:F}}>← Zurück</button>}
      {index<quiz.length-1?<button onClick={()=>setSt({...st,index:index+1})} style={{background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:600,cursor:"pointer",flex:1,fontFamily:F}}>Weiter →</button>:<button onClick={submit} style={{background:T.green,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:600,cursor:"pointer",flex:1,fontFamily:F}}>Abgeben ✓</button>}
    </div>
  </div>;
}

// ── PROFIL ──────────────────────────────────────────
const Avatar = ({url,icon,size=56,round=true}) => url
  ? <img src={url} alt="" style={{width:size,height:size,borderRadius:round?"50%":14,objectFit:"cover",flexShrink:0,display:"block"}}/>
  : <div style={{width:size,height:size,borderRadius:round?"50%":14,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.45),flexShrink:0}}>{icon}</div>;

const ProfilKarte = ({p,label}) => {
  const lab={fontSize:11,fontWeight:700,color:T.label2,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8,paddingLeft:4};
  return (
    <div style={{marginBottom:28}}>
      {label&&<div style={{fontSize:14,fontWeight:700,color:T.blue,marginBottom:10,paddingLeft:4}}>{label}</div>}
      <div style={{background:"rgba(76,141,255,0.22)",border:"1px solid rgba(111,160,255,0.4)",borderRadius:20,padding:"22px 20px",display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
        {p.bild_url
          ?<img src={p.bild_url} alt="" style={{width:76,height:76,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid rgba(255,255,255,0.3)"}}/>
          :<div style={{width:76,height:76,borderRadius:"50%",background:"rgba(255,255,255,0.18)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,flexShrink:0,border:"2px solid rgba(255,255,255,0.3)"}}>👨‍🏫</div>}
        <div>
          <div style={{fontSize:23,fontWeight:700,color:"#fff"}}>Fahrlehrer {p.name}</div>
          {(p.tags||[]).length>0&&<div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
            {p.tags.map((t,i)=><div key={i} style={{background:"rgba(255,255,255,0.18)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 12px",fontSize:12,color:"#fff",fontWeight:500,border:"1px solid rgba(255,255,255,0.3)"}}>{t}</div>)}
          </div>}
        </div>
      </div>
      {p.ueber_mich&&<>
        <div style={lab}>Über mich</div>
        <Card style={{padding:18}}>
          <div style={{fontSize:15,color:T.label,lineHeight:1.65}}>{p.ueber_mich}</div>
        </Card>
      </>}
    </div>
  );
};

const FahrlehrerKachel = ({p,label,onClick}) => (
  <Card onClick={onClick} style={{padding:16}}>
    {label&&<div style={{fontSize:12,fontWeight:700,color:T.blue,marginBottom:10}}>{label}</div>}
    <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
      <Avatar url={p.bild_url} icon="👨‍🏫" size={56}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:17,fontWeight:700,color:T.label}}>Fahrlehrer {p.name}</div>
        {(p.tags||[]).length>0&&<div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>{p.tags.map((t,i)=><span key={i} style={{background:`${T.blue}18`,color:T.blue,borderRadius:999,padding:"2px 10px",fontSize:11,fontWeight:600}}>{t}</span>)}</div>}
        {p.ueber_mich&&<div style={{fontSize:14,color:T.label2,lineHeight:1.5,marginTop:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.ueber_mich}</div>}
        <div style={{fontSize:13,color:T.blue,fontWeight:600,marginTop:8}}>Weiterlesen ›</div>
      </div>
    </div>
  </Card>
);

const StandortKachel = ({o,onClick}) => (
  <Card onClick={onClick} style={{padding:14}}>
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <Avatar url={o.bild_url} icon="📍" size={56} round={false}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:16,fontWeight:600,color:T.label}}>{o.name}</div>
        {o.adresse&&<div style={{fontSize:13,color:T.label2,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{o.adresse}</div>}
      </div>
      <span style={{color:T.label3,fontSize:22}}>›</span>
    </div>
  </Card>
);

const StandortDetail = ({o}) => (
  <div>
    {o.bild_url&&<img src={o.bild_url} alt="" style={{width:"100%",maxHeight:260,objectFit:"cover",borderRadius:20,display:"block",marginBottom:14}}/>}
    <div style={{fontSize:26,fontWeight:700,color:T.label,letterSpacing:-0.3,marginBottom:14}}>{o.name}</div>
    <Card style={{padding:18}}>
      {o.adresse&&<div style={{marginBottom:o.telefon||o.oeffnungszeiten?16:0}}><div style={{fontSize:12,color:T.label2,fontWeight:600,marginBottom:4}}>Adresse</div><div style={{fontSize:15,color:T.label,lineHeight:1.5}}>📍 {o.adresse}</div></div>}
      {o.telefon&&<div style={{marginBottom:o.oeffnungszeiten?16:0}}><div style={{fontSize:12,color:T.label2,fontWeight:600,marginBottom:4}}>Telefon</div><div style={{fontSize:15,color:T.label}}>📞 {o.telefon}</div></div>}
      {o.oeffnungszeiten&&<div><div style={{fontSize:12,color:T.label2,fontWeight:600,marginBottom:4}}>Öffnungszeiten</div><div style={{fontSize:15,color:T.label,lineHeight:1.6,whiteSpace:"pre-wrap"}}>🕒 {o.oeffnungszeiten}</div></div>}
    </Card>
  </div>
);

function Profil({selbst,fahrlehrer=[],meineIds=[],standorte=[]}) {
  const [detail,setDetail]=useState(null);
  if(detail) return (
    <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh",paddingBottom:100}}>
      <NavBar title={detail.typ==="so"?detail.p.name:`Fahrlehrer ${detail.p.name}`} onBack={()=>setDetail(null)}/>
      <div style={{padding:"16px 16px 0"}}>{detail.typ==="so"?<StandortDetail o={detail.p}/>:<ProfilKarte p={detail.p}/>}</div>
    </div>
  );
  const byId=new Map(fahrlehrer.map(f=>[f.id,f]));
  const eigene=meineIds.map(id=>byId.get(id)).filter(Boolean);
  const rest=fahrlehrer.filter(f=>!meineIds.includes(f.id));
  const kacheln=[
    ...eigene.map((p,i)=>({p,label:selbst?"Du":i===0?"Dein Fahrlehrer":i===1?"Dein zweiter Fahrlehrer":"Dein weiterer Fahrlehrer"})),
    ...rest.map((p,i)=>({p,label:i===0&&eigene.length>0?"Weitere Fahrlehrer":null})),
  ];
  if(kacheln.length===0) kacheln.push({p:DEFAULT_PROFIL,label:null});
  const lab={fontSize:11,fontWeight:700,color:T.label2,letterSpacing:0.8,textTransform:"uppercase",marginBottom:10,paddingLeft:4};
  return (
    <div style={{background:"transparent",minHeight:"100dvh",padding:"20px 16px 0",fontFamily:F}}>
      <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56,marginBottom:16}}>Fahrschule</div>
      {standorte.length>0&&<div style={{marginBottom:24}}>
        <div style={lab}>Standorte</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{standorte.map(o=><StandortKachel key={o.id} o={o} onClick={()=>setDetail({typ:"so",p:o})}/>)}</div>
      </div>}
      <div style={{marginBottom:24}}>
        <div style={lab}>Fahrlehrer</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>{kacheln.map((k,i)=><FahrlehrerKachel key={k.p.id||i} p={k.p} label={k.label} onClick={()=>setDetail({typ:"fl",p:k.p})}/>)}</div>
      </div>
    </div>
  );
}

// ── ADMIN ───────────────────────────────────────────
const ADMIN_TABS=[{id:"dashboard",e:"🏠",l:"Dashboard"},{id:"schueler",e:"👥",l:"Schüler"},{id:"lernen",e:"📚",l:"Lernen"},{id:"fahrschule",e:"🏫",l:"Fahrschule"}];

async function uploadBild(file){
  const n=`meldung_${Date.now()}.${file.name.split(".").pop()||"jpg"}`;
  for(const b of["Lernmaterial","lernmaterial"]){
    const{error}=await supabase.storage.from(b).upload(n,file,{upsert:true,contentType:file.type});
    if(!error){const{data:u}=supabase.storage.from(b).getPublicUrl(n);return u.publicUrl;}
  }
  return null;
}

function AdminApp({onLogout}) {
  const [tab,setTab]=useState("dashboard");
  const [liste,setListe]=useState([]); const [mat,setMat]=useState({});
  const [screen,setScreen]=useState(null); const [filter,setFilter]=useState("aktiv");

  const ladeListe=useCallback(async()=>{const{data}=await supabase.from("schueler").select("*").order("name");setListe(data||[]);},[]);
  const ladeMat=useCallback(async()=>{
    const[m,q]=await Promise.all([supabase.from("lernmaterial").select("*"),supabase.from("quiz_fragen").select("*")]);
    const map={};
    (m.data||[]).forEach(x=>{map[x.item_key]={videoUrl:x.video_url||"",fotos:x.fotos||[],quiz:[],pdfUrl:x.pdf_url||"",pdfName:x.pdf_name||""};});
    (q.data||[]).forEach(x=>{if(!map[x.item_key])map[x.item_key]={videoUrl:"",fotos:[],quiz:[],pdfUrl:"",pdfName:""};map[x.item_key].quiz.push({id:x.id,frage:x.frage,typ:x.typ,antworten:x.antworten||[],richtig:x.richtig,erklaerung:x.erklaerung||"",bildUrl:x.bild_url||""});});
    setMat(map);
  },[]);
  useEffect(()=>{ladeListe();ladeMat();},[ladeListe,ladeMat]);

  const aktiv=liste.filter(s=>!["archiviert","abgeschlossen"].includes(s.status||"aktiv"));
  const archiv=liste.filter(s=>["archiviert","abgeschlossen"].includes(s.status||"aktiv"));
  const seite=(titel,onBack,inhalt)=><div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><NavBar title={titel} onBack={onBack}/>{inhalt}</div>;

  if(screen?.type==="s") return seite(screen.s.name,()=>{setScreen(null);ladeListe();},<div style={{paddingBottom:20}}><DiagrammView s={screen.s} mat={mat} setMat={setMat} onMat={k=>setScreen({type:"m",k,back:screen})} isLehrer adminEdit/></div>);
  if(screen?.type==="m") return seite(screen.k.split("::")[1]||"Material",()=>setScreen(screen.back||null),<div style={{paddingBottom:20}}><MatView ik={screen.k} mat={mat} setMat={setMat} isLehrer/></div>);
  if(screen?.type==="neu") return seite("Neuer Schüler",()=>setScreen(null),<NeuerS alsMeine={false} onSaved={()=>{ladeListe();setScreen(null);}}/>);

  const inhalt={
    dashboard:<AdminDashboard onLogout={onLogout}/>,
    schueler:<SListe aktiv={aktiv} archiv={archiv} meine={EMPTY_SET} onMeine={async()=>null} ohneMeine filter={filter} setFilter={setFilter} onOpen={s=>setScreen({type:"s",s})} onNeu={()=>setScreen({type:"neu"})} onRefresh={ladeListe}/>,
    lernen:<MatListe mat={mat} onOpen={k=>setScreen({type:"m",k,back:null})}/>,
    fahrschule:<AdminFahrschule/>,
  };
  return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><div style={{paddingBottom:83}}>{inhalt[tab]}</div><TabBar active={tab} onChange={setTab} tabsOverride={ADMIN_TABS}/></div>;
}

function AdminDashboard({onLogout}) {
  const [text,setText]=useState(""); const [bild,setBild]=useState(""); const [busy,setBusy]=useState(false);
  const [fehler,setFehler]=useState(""); const [liste,setListe]=useState([]);
  const laden=useCallback(async()=>{
    const {data,error}=await supabase.from("meldungen").select("*").order("erstellt_am",{ascending:false});
    if(error)setFehler("Meldungen konnten nicht geladen werden: "+error.message);else setListe(data||[]);
  },[]);
  useEffect(()=>{laden();},[laden]);
  const waehleBild=async f=>{
    if(!f)return; setBusy(true);setFehler("");
    const u=await uploadBild(f);
    if(u)setBild(u);else setFehler("Foto konnte nicht hochgeladen werden.");
    setBusy(false);
  };
  const posten=async()=>{
    if(!text.trim()&&!bild){setFehler("Text oder Foto angeben.");return;}
    setBusy(true);setFehler("");
    const {error}=await supabase.from("meldungen").insert({text:text.trim(),bild_url:bild});
    setBusy(false);
    if(error){setFehler("Fehler: "+error.message);return;}
    setText("");setBild("");laden();
  };
  const loeschen=async id=>{
    if(!window.confirm("Meldung löschen?"))return;
    const {error}=await supabase.from("meldungen").delete().eq("id",id);
    if(error)setFehler("Fehler: "+error.message);else laden();
  };
  return (
    <div style={{background:"transparent",minHeight:"100dvh",padding:"20px 16px 0",fontFamily:F}}>
      <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
        <div>
          <div style={{fontSize:11,color:T.blue,fontWeight:700,letterSpacing:1,marginBottom:2}}>ADMIN</div>
          <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56}}>Dashboard</div>
        </div>
        <AbmeldenBtn onClick={onLogout}/>
      </div>
      <Card style={{padding:18,marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:12}}>Neue Meldung für alle Schüler</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Meldung schreiben..." style={{width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px",fontSize:14,color:T.label,outline:"none",minHeight:90,resize:"vertical",fontFamily:F,marginBottom:10}}/>
        {bild&&<div style={{position:"relative",marginBottom:10}}>
          <img src={bild} alt="" style={{width:"100%",maxHeight:220,objectFit:"cover",borderRadius:12,display:"block"}}/>
          <button onClick={()=>setBild("")} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.55)",border:"none",borderRadius:"50%",width:30,height:30,color:"#fff",fontSize:16,cursor:"pointer"}}>✕</button>
        </div>}
        <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"11px",cursor:"pointer",fontSize:14,color:T.label2,marginBottom:10}}>🖼 {bild?"Anderes Foto wählen":"Foto hochladen"}<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{waehleBild(e.target.files[0]);e.target.value="";}}/></label>
        {fehler&&<div style={{background:T.dangerBg,color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:10}}>{fehler}</div>}
        <button onClick={posten} disabled={busy} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:16,fontWeight:600,cursor:"pointer",opacity:busy?0.7:1,fontFamily:F}}>{busy?"Bitte warten...":"Meldung posten"}</button>
      </Card>
      <div style={{fontSize:11,color:T.label2,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase",marginBottom:12}}>Gepostete Meldungen</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {liste.length===0&&<Card style={{padding:32,textAlign:"center"}}><div style={{color:T.label2}}>Noch keine Meldungen</div></Card>}
        {liste.map(m=><Card key={m.id} style={{overflow:"hidden"}}>
          {m.bild_url&&<img src={m.bild_url} alt="" style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>}
          <div style={{padding:16}}>
            {m.text&&<div style={{fontSize:15,color:T.label,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.text}</div>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:m.text?10:0}}>
              <span style={{fontSize:12,color:T.label2}}>{new Date(m.erstellt_am).toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"})}</span>
              <button onClick={()=>loeschen(m.id)} style={{background:"none",border:"none",cursor:"pointer",color:T.label2,fontSize:16}}>🗑</button>
            </div>
          </div>
        </Card>)}
      </div>
    </div>
  );
}

function AdminFahrschule() {
  const [fl,setFl]=useState([]); const [so,setSo]=useState([]); const [screen,setScreen]=useState(null); const [fehler,setFehler]=useState("");
  const laden=useCallback(async()=>{
    const[a,b]=await Promise.all([
      supabase.from("fahrlehrer_profil").select("*").eq("rolle","lehrer").order("erstellt_am"),
      supabase.from("standorte").select("*").order("erstellt_am"),
    ]);
    const e=a.error?.message||b.error?.message;
    if(e){setFehler("Daten konnten nicht geladen werden: "+e);}
    else{setFehler("");}
    setFl(a.data||[]);setSo(b.data||[]);
  },[]);
  useEffect(()=>{laden();},[laden]);

  if(screen?.kind==="fl") return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><NavBar title={screen.p?`Fahrlehrer ${screen.p.name}`:"Neuer Fahrlehrer"} onBack={()=>setScreen(null)}/><FahrlehrerForm p={screen.p} onDone={()=>{laden();setScreen(null);}}/></div>;
  if(screen?.kind==="so") return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><NavBar title={screen.p?screen.p.name:"Neuer Standort"} onBack={()=>setScreen(null)}/><StandortForm p={screen.p} onDone={()=>{laden();setScreen(null);}}/></div>;

  const kopf=(titel,onNeu)=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
    <div style={{fontSize:11,color:T.label2,fontWeight:700,letterSpacing:0.8,textTransform:"uppercase"}}>{titel}</div>
    <button onClick={onNeu} style={{background:T.blue,color:"#fff",border:"none",borderRadius:999,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>+ Neu</button>
  </div>;
  return (
    <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh",padding:"20px 16px 0"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:T.blue,fontWeight:700,letterSpacing:1,marginBottom:2}}>ADMIN</div>
        <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56}}>Fahrschule</div>
      </div>
      {fehler&&<div style={{background:T.dangerBg,color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:14,border:`1px solid ${T.red}33`}}>{fehler}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {[{v:fl.length,l:"Fahrlehrer",e:"👨‍🏫",c:T.blue},{v:so.length,l:"Standorte",e:"📍",c:T.green}].map((x,i)=>(
          <Card key={i} style={{padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{x.e}</div>
            <div style={{fontSize:26,fontWeight:700,color:x.c}}>{x.v}</div>
            <div style={{fontSize:11,color:T.label2,marginTop:2}}>{x.l}</div>
          </Card>
        ))}
      </div>
      {kopf("Fahrlehrer",()=>setScreen({kind:"fl",p:null}))}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {fl.length===0&&<Card style={{padding:24,textAlign:"center"}}><div style={{color:T.label2}}>Noch keine Fahrlehrer</div></Card>}
        {fl.map(f=>(
          <Card key={f.id} onClick={()=>setScreen({kind:"fl",p:f})} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <Avatar url={f.bild_url} icon="👨‍🏫" size={44}/>
              <div style={{flex:1,fontSize:16,fontWeight:600,color:T.label}}>{f.name}</div>
              <span style={{color:T.label3,fontSize:22}}>›</span>
            </div>
          </Card>
        ))}
      </div>
      {kopf("Standorte",()=>setScreen({kind:"so",p:null}))}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {so.length===0&&<Card style={{padding:24,textAlign:"center"}}><div style={{color:T.label2}}>Noch keine Standorte</div></Card>}
        {so.map(o=>(
          <Card key={o.id} onClick={()=>setScreen({kind:"so",p:o})} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <Avatar url={o.bild_url} icon="📍" size={44}/>
              <div style={{flex:1}}><div style={{fontSize:16,fontWeight:600,color:T.label}}>{o.name}</div>{o.adresse&&<div style={{fontSize:12,color:T.label2,marginTop:2}}>{o.adresse}</div>}</div>
              <span style={{color:T.label3,fontSize:22}}>›</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BildFeld({url,onChange}) {
  const [busy,setBusy]=useState(false); const [err,setErr]=useState("");
  const wahl=async f=>{
    if(!f)return; setBusy(true);setErr("");
    const u=await uploadBild(f);
    if(u)onChange(u);else setErr("Foto konnte nicht hochgeladen werden.");
    setBusy(false);
  };
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:7}}>Foto</div>
      {url&&<div style={{position:"relative",marginBottom:10}}>
        <img src={url} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:12,display:"block"}}/>
        <button onClick={()=>onChange("")} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.55)",border:"none",borderRadius:"50%",width:30,height:30,color:"#fff",fontSize:16,cursor:"pointer"}}>✕</button>
      </div>}
      <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"11px",cursor:"pointer",fontSize:14,color:T.label2}}>🖼 {busy?"Lädt hoch...":url?"Anderes Foto wählen":"Foto hochladen"}<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{wahl(e.target.files[0]);e.target.value="";}}/></label>
      {err&&<div style={{fontSize:13,color:T.red,marginTop:8}}>{err}</div>}
    </div>
  );
}

function FahrlehrerForm({p,onDone}) {
  const [f,setF]=useState({name:p?.name||"",pin:"",ueber_mich:p?.ueber_mich||"",tags:(p?.tags||[]).join(", "),bild_url:p?.bild_url||""});
  const [err,setErr]=useState(""); const [saving,setSaving]=useState(false); const [del,setDel]=useState(false);
  const inp={width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px 16px",fontSize:15,color:T.label,outline:"none",fontFamily:F};
  const feld=(label,key,extra={})=><div style={{marginBottom:14}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:7}}>{label}</div><input style={inp} value={f[key]} onChange={e=>setF({...f,[key]:extra.digits?e.target.value.replace(/\D/g,""):e.target.value})} placeholder={extra.ph||""} maxLength={extra.max}/></div>;
  const save=async()=>{
    if(!f.name.trim()){setErr("Namen eingeben.");return;}
    if(!p&&f.pin.length<6){setErr("PIN mind. 6 Stellen.");return;}
    if(p&&f.pin&&f.pin.length<6){setErr("PIN mind. 6 Stellen (oder leer lassen).");return;}
    setSaving(true);setErr("");
    const tags=f.tags.split(",").map(x=>x.trim()).filter(Boolean);
    if(!p){
      const {error}=await kontoFn({aktion:"lehrer_anlegen",name:f.name.trim(),pin:f.pin,ueber_mich:f.ueber_mich.trim(),tags,bild_url:f.bild_url});
      setSaving(false);
      if(error){setErr("Fehler: "+error);return;}
    }else{
      const {error}=await supabase.from("fahrlehrer_profil").update({name:f.name.trim(),ueber_mich:f.ueber_mich.trim(),tags,bild_url:f.bild_url}).eq("id",p.id);
      if(error){setSaving(false);setErr("Fehler: "+error.message);return;}
      if(f.pin){
        const {error:e2}=await kontoFn({aktion:"pin_setzen",typ:"lehrer",id:p.id,pin:f.pin});
        if(e2){setSaving(false);setErr("Profil gespeichert, aber PIN nicht geändert: "+e2);return;}
      }
      setSaving(false);
    }
    onDone();
  };
  const loeschen=async()=>{
    const {error}=await kontoFn({aktion:"konto_loeschen",typ:"lehrer",id:p.id});
    if(error){setErr("Fehler: "+error);setDel(false);return;}
    onDone();
  };
  return (
    <div style={{padding:"20px 16px",fontFamily:F}}>
      <Card style={{padding:24,marginBottom:14}}>
        <div style={{fontSize:20,fontWeight:700,color:T.label,marginBottom:20}}>{p?"Profil bearbeiten":"Neuer Fahrlehrer"}</div>
        <BildFeld url={f.bild_url} onChange={u=>setF({...f,bild_url:u})}/>
        {feld("Name *","name",{ph:"z.B. Max"})}
        {feld(p?"Neue PIN (leer = unverändert)":"PIN (mind. 6 Stellen) *","pin",{digits:true,max:8})}
        <div style={{marginBottom:14}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:7}}>Über mich</div><textarea style={{...inp,minHeight:100,resize:"vertical"}} value={f.ueber_mich} onChange={e=>setF({...f,ueber_mich:e.target.value})}/></div>
        {feld("Etiketten (mit Komma trennen)","tags",{ph:"Klasse B, BE, 10+ Jahre"})}
        {err&&<div style={{background:T.dangerBg,color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:14}}>{err}</div>}
        <button onClick={save} disabled={saving} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:16,fontWeight:600,cursor:"pointer",opacity:saving?0.7:1,fontFamily:F}}>{saving?"Speichern...":"✓ Speichern"}</button>
      </Card>
      {p&&(del
        ?<Card style={{padding:20}}><div style={{textAlign:"center",marginBottom:14,fontSize:16,fontWeight:600,color:T.label}}>{p.name} löschen?</div><div style={{display:"flex",gap:10}}><button onClick={loeschen} style={{flex:1,background:T.dangerBg,color:T.red,border:`1px solid ${T.red}66`,borderRadius:12,padding:"12px",fontWeight:600,cursor:"pointer",fontFamily:F}}>Löschen</button><button onClick={()=>setDel(false)} style={{flex:1,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px",cursor:"pointer",fontFamily:F,color:T.label}}>Abbrechen</button></div></Card>
        :<button onClick={()=>setDel(true)} style={{width:"100%",background:T.dangerBg,color:T.red,border:`1px solid ${T.red}66`,borderRadius:14,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>🗑 Fahrlehrer löschen</button>)}
    </div>
  );
}

function StandortForm({p,onDone}) {
  const [f,setF]=useState({name:p?.name||"",adresse:p?.adresse||"",telefon:p?.telefon||"",oeffnungszeiten:p?.oeffnungszeiten||"",bild_url:p?.bild_url||""});
  const [err,setErr]=useState(""); const [saving,setSaving]=useState(false); const [del,setDel]=useState(false);
  const inp={width:"100%",boxSizing:"border-box",background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px 16px",fontSize:15,color:T.label,outline:"none",fontFamily:F};
  const feld=(label,key,ph)=><div style={{marginBottom:14}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:7}}>{label}</div><input style={inp} value={f[key]} onChange={e=>setF({...f,[key]:e.target.value})} placeholder={ph||""}/></div>;
  const save=async()=>{
    if(!f.name.trim()){setErr("Namen eingeben.");return;}
    setSaving(true);setErr("");
    const row={name:f.name.trim(),adresse:f.adresse.trim(),telefon:f.telefon.trim(),oeffnungszeiten:f.oeffnungszeiten.trim(),bild_url:f.bild_url};
    const {error}=p?await supabase.from("standorte").update(row).eq("id",p.id):await supabase.from("standorte").insert(row);
    setSaving(false);
    if(error){setErr("Fehler: "+error.message);return;}
    onDone();
  };
  const loeschen=async()=>{
    const {error}=await supabase.from("standorte").delete().eq("id",p.id);
    if(error){setErr("Fehler: "+error.message);setDel(false);return;}
    onDone();
  };
  return (
    <div style={{padding:"20px 16px",fontFamily:F}}>
      <Card style={{padding:24,marginBottom:14}}>
        <div style={{fontSize:20,fontWeight:700,color:T.label,marginBottom:20}}>{p?"Standort bearbeiten":"Neuer Standort"}</div>
        <BildFeld url={f.bild_url} onChange={u=>setF({...f,bild_url:u})}/>
        {feld("Name *","name","z.B. Filiale Metzer Straße")}
        {feld("Adresse","adresse","Straße, PLZ Ort")}
        {feld("Telefon","telefon")}
        <div style={{marginBottom:14}}><div style={{fontSize:13,color:T.label2,fontWeight:500,marginBottom:7}}>Öffnungszeiten</div><textarea style={{...inp,minHeight:90,resize:"vertical"}} value={f.oeffnungszeiten} onChange={e=>setF({...f,oeffnungszeiten:e.target.value})} placeholder={"Mo–Fr 9–18 Uhr"}/></div>
        {err&&<div style={{background:T.dangerBg,color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:14}}>{err}</div>}
        <button onClick={save} disabled={saving} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:16,fontWeight:600,cursor:"pointer",opacity:saving?0.7:1,fontFamily:F}}>{saving?"Speichern...":"✓ Speichern"}</button>
      </Card>
      {p&&(del
        ?<Card style={{padding:20}}><div style={{textAlign:"center",marginBottom:14,fontSize:16,fontWeight:600,color:T.label}}>{p.name} löschen?</div><div style={{display:"flex",gap:10}}><button onClick={loeschen} style={{flex:1,background:T.dangerBg,color:T.red,border:`1px solid ${T.red}66`,borderRadius:12,padding:"12px",fontWeight:600,cursor:"pointer",fontFamily:F}}>Löschen</button><button onClick={()=>setDel(false)} style={{flex:1,background:T.inset,border:`1px solid ${T.sep}`,borderRadius:12,padding:"12px",cursor:"pointer",fontFamily:F,color:T.label}}>Abbrechen</button></div></Card>
        :<button onClick={()=>setDel(true)} style={{width:"100%",background:T.dangerBg,color:T.red,border:`1px solid ${T.red}66`,borderRadius:14,padding:"14px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>🗑 Standort löschen</button>)}
    </div>
  );
}

// ── SCHÜLER APP ─────────────────────────────────────
function SchuelerApp({schueler,onLogout}) {
  const [tab,setTab]=useState("home");
  const [themen,setThemen]=useState({}); const [naechstes,setNaechstes]=useState({});
  const [notizen,setNotizen]=useState([]); const [info,setInfo]=useState(null);
  const [mat,setMat]=useState({}); const [screen,setScreen]=useState(null);
  const [selStufe,setSelStufe]=useState(null); const [load,setLoad]=useState(true);
  const [fahrlehrer,setFahrlehrer]=useState([]); const [meineIds,setMeineIds]=useState([]);
  const [meldungen,setMeldungen]=useState([]); const [standorte,setStandorte]=useState([]); const [fsBild,setFsBild]=useState(null);

  useEffect(()=>{
    const l=async()=>{
      setLoad(true);
      const[t,n,i,m,q,f,ms,md,so]=await Promise.all([
        supabase.from("ausbildungsstand").select("*").eq("schueler_id",schueler.id),
        supabase.from("notizen").select("*").eq("schueler_id",schueler.id).order("erstellt_am",{ascending:false}),
        supabase.from("schueler_info").select("*").eq("schueler_id",schueler.id).single(),
        supabase.from("lernmaterial").select("*"),
        supabase.from("quiz_fragen").select("*"),
        supabase.from("fahrlehrer_profil").select("id,name,ueber_mich,tags,bild_url,erstellt_am").eq("rolle","lehrer").order("erstellt_am"),
        supabase.from("meine_schueler").select("fahrlehrer_id,erstellt_am").eq("schueler_id",String(schueler.id)).order("erstellt_am"),
        supabase.from("meldungen").select("*").order("erstellt_am",{ascending:false}),
        supabase.from("standorte").select("*").order("erstellt_am"),
      ]);
      setMeldungen(md.data||[]);setStandorte(so.data||[]);
      setFahrlehrer(f.data||[]);setMeineIds((ms.data||[]).map(x=>x.fahrlehrer_id));
      const tm={},nm={};
      (t.data||[]).forEach(x=>{tm[x.item_key]=Number(x.wert);if(x.naechstes)nm[x.item_key]=true;});
      setThemen(tm);setNaechstes(nm);setNotizen(n.data||[]);setInfo(i.data);
      const mm={};
      (m.data||[]).forEach(x=>{mm[x.item_key]={videoUrl:x.video_url||"",fotos:x.fotos||[],quiz:[],pdfUrl:x.pdf_url||"",pdfName:x.pdf_name||""};});
      (q.data||[]).forEach(x=>{if(!mm[x.item_key])mm[x.item_key]={videoUrl:"",fotos:[],quiz:[],pdfUrl:"",pdfName:""};mm[x.item_key].quiz.push({id:x.id,frage:x.frage,typ:x.typ,antworten:x.antworten||[],richtig:x.richtig,erklaerung:x.erklaerung||"",bildUrl:x.bild_url||""});});
      setMat(mm);setLoad(false);
    };l();
  },[schueler.id]);

  const pct=Math.round((Object.values(themen).filter(v=>v===2).length/ALL.length)*100);

  if(screen?.type==="mat") return <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}><NavBar title={screen.k.split("::")[1]||"Material"} onBack={()=>setScreen(null)}/><div style={{paddingBottom:20}}><MatView ik={screen.k} mat={mat} setMat={setMat} isLehrer={false}/></div></div>;

  const renderTab=()=>{
    if(load) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:100}}><span style={{fontSize:40}}>⏳</span></div>;

    if(tab==="home") return (
      <div style={{background:"transparent",minHeight:"100dvh",padding:"20px 16px 0",fontFamily:F}}>
        <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div>
            <div style={{fontSize:11,color:T.blue,fontWeight:700,letterSpacing:1}}>FAHRLEHRER SAAD</div>
            <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56,fontFamily:F}}>Hallo, {schueler.name.split(" ")[0]}! 👋</div>
          </div>
          <AbmeldenBtn onClick={onLogout}/>
        </div>
        {Object.keys(naechstes).length>0&&<div style={{background:`${T.blue}10`,border:`1px solid ${T.blue}30`,borderRadius:20,padding:16,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span style={{fontSize:18}}>📍</span><div style={{fontSize:15,fontWeight:700,color:T.blue,fontFamily:F}}>Als nächstes geplant</div><span style={{background:`${T.blue}18`,color:T.blue,borderRadius:999,padding:"2px 8px",fontSize:11,fontWeight:700,marginLeft:"auto"}}>{nKeys(naechstes).length}</span></div>
          {nKeys(naechstes).map(k=>{const p=k.split("::");const so=AUSBILDUNG.find(x=>x.id===p[0]);const mk=`${p[0]}::${p[1]}`;const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0);return <Card key={k} style={{padding:"12px 14px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:hm?10:0}}><span style={{fontSize:20}}>{so?.icon||"📍"}</span><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label,fontFamily:F}}>{p.length===2?p[1]:p[2]}</div><div style={{fontSize:12,color:T.label2,fontFamily:F}}>{so?.label}{p.length===2?" · ganze Kategorie":" · "+p[1]}</div></div></div>{hm&&<button onClick={()=>setScreen({type:"mat",k:mk})} style={{width:"100%",background:`${T.blue}15`,color:T.blue,border:`1px solid ${T.blue}30`,borderRadius:12,padding:"9px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>📚 Lernmaterial ansehen</button>}</Card>;})}
        </div>}
        <Card style={{padding:20,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:T.label2,letterSpacing:0.8,textTransform:"uppercase",marginBottom:12}}>Mein Fortschritt</div>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
            <Ring pct={pct} size={84}/>
            <div style={{flex:1}}><div style={{fontSize:24,fontWeight:700,color:T.label,fontFamily:F}}>{pct}% erreicht</div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>{(info?.klassen||[]).map(k=><span key={k} style={{background:`${T.blue}18`,color:T.blue,borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:600}}>{k}</span>)}</div></div>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:14}}>
            {AUSBILDUNG.map(s=>{const ks=s.gruppen.flatMap(g=>g.items.map(i=>`${s.id}::${g.name}::${i}`));const sp=Math.round((ks.filter(k=>(themen[k]||0)===2).length/ks.length)*100);return <div key={s.id} onClick={()=>{setSelStufe(s.id);setTab("diagramm");}} style={{background:sp>0?`${s.color}15`:T.card,border:`1px solid ${sp>0?s.color+"40":T.glassBorder}`,borderRadius:12,padding:"8px 12px",flexShrink:0,textAlign:"center",minWidth:66,cursor:"pointer"}}><div style={{fontSize:18}}>{s.icon}</div><div style={{fontSize:10,color:sp>0?s.color:T.label2,fontWeight:600,marginTop:2,fontFamily:F}}>{s.label}</div><div style={{fontSize:12,fontWeight:700,color:sp>0?s.color:T.label3,fontFamily:F}}>{sp}%</div></div>;})}
          </div>
          <button onClick={()=>setTab("diagramm")} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>Alle Stufen & Lernmaterial →</button>
        </Card>

        {meldungen.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          {meldungen.map(m=><Card key={m.id} style={{overflow:"hidden"}}>
            {m.bild_url&&<img src={m.bild_url} alt="" onClick={()=>setFsBild(m.bild_url)} style={{width:"100%",maxHeight:260,objectFit:"cover",display:"block",cursor:"pointer"}}/>}
            <div style={{padding:16}}>
              {m.text&&<div style={{fontSize:15,color:T.label,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.text}</div>}
              <div style={{fontSize:11,color:T.label2,marginTop:m.text?8:0}}>{new Date(m.erstellt_am).toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"})}</div>
            </div>
          </Card>)}
        </div>}

        {notizen.length>0&&<div style={{background:"rgba(255,184,107,0.14)",border:"1px solid rgba(255,184,107,0.3)",borderRadius:20,padding:"14px 16px",marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:T.orange,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>Letzte Notiz</div><div style={{fontSize:14,color:"#FFD9AE",lineHeight:1.6}}>{notizen[0].text}</div></div>}
      </div>
    );

    if(tab==="diagramm") return (
      <div style={{background:"transparent",minHeight:"100dvh",padding:"20px 0 0",fontFamily:F}}>
        <div style={{fontSize:28,fontWeight:600,color:T.label,letterSpacing:-0.56,marginBottom:16,padding:"0 16px"}}>Diagramm</div>
        <DiagrammView s={schueler} mat={mat} setMat={setMat} onMat={k=>setScreen({type:"mat",k})} isLehrer={false} startStufe={selStufe}/>
      </div>
    );

    if(tab==="lernen") return <MatListe mat={mat} themen={themen} nurMitMaterial onOpen={k=>setScreen({type:"mat",k})}/>;

    if(tab==="profil") return <Profil fahrlehrer={fahrlehrer} meineIds={meineIds} standorte={standorte}/>;
    return null;
  };

  return (
    <div style={{fontFamily:F,background:"transparent",minHeight:"100dvh"}}>
      {screen?renderTab():<><div style={{paddingBottom:83}}>{renderTab()}</div><TabBar active={tab} onChange={setTab} isLehrer={false}/></>}
      {fsBild&&<FullScreen fotos={[fsBild]} start={0} onClose={()=>setFsBild(null)}/>}
    </div>
  );
}
