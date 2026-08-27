import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { T, F } from "../theme";
import { Card, Row } from "../ui";

// ────────────────────────────────────────────────────────────────
// WICHTIGER SICHERHEITSHINWEIS:
// Dieser PIN-Schutz ist NUR ein einfacher Platzhalter (PIN liegt
// sichtbar im Frontend-Code) und bietet keine echte Sicherheit.
// Für den produktiven Einsatz muss das durch einen serverseitig
// geprüften Zugang ersetzt werden (z.B. Supabase Auth), bevor hier
// echte Kundendaten/Umsatzzahlen mehrerer Fahrschulen sichtbar sind.
// ────────────────────────────────────────────────────────────────
const PLATZHALTER_PIN = "0000";

export default function Betreiber() {
  const [pin,setPin]=useState(""); const [entered,setEntered]=useState(false);

  if(!entered){
    return (
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:F}}>
        <div style={{fontSize:22,fontWeight:700,color:T.label,marginBottom:16}}>Betreiber-Zugang</div>
        <input value={pin} onChange={e=>setPin(e.target.value)} type="password" placeholder="PIN"
          style={{border:`0.5px solid ${T.sep}`,borderRadius:12,padding:"12px 16px",fontSize:18,textAlign:"center",letterSpacing:6,marginBottom:12,outline:"none"}}
          onKeyDown={e=>{if(e.key==="Enter"&&pin===PLATZHALTER_PIN)setEntered(true);}}/>
        <button onClick={()=>{if(pin===PLATZHALTER_PIN)setEntered(true);}} style={{background:T.red,color:"#fff",border:"none",borderRadius:12,padding:"12px 24px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>Weiter</button>
      </div>
    );
  }
  return <BetreiberApp/>;
}

function BetreiberApp() {
  const [screen,setScreen]=useState(null); // null=Dashboard, "neu", {type:"detail",f}
  const [fahrschulen,setFahrschulen]=useState([]);
  const [load,setLoad]=useState(true);

  const laden=useCallback(async()=>{
    setLoad(true);
    const {data} = await supabase.from("fahrschulen").select("*").order("erstellt_am",{ascending:false});
    setFahrschulen(data||[]);
    setLoad(false);
  },[]);
  useEffect(()=>{laden();},[laden]);

  let body;
  if(load) body = <div style={{display:"flex",justifyContent:"center",padding:80}}><span style={{fontSize:36}}>⏳</span></div>;
  else if(screen==="neu") body = <NeueFahrschule onSaved={()=>{laden();setScreen(null);}} onCancel={()=>setScreen(null)}/>;
  else if(screen?.type==="detail") body = <FahrschuleDetail f={screen.f} onBack={()=>setScreen(null)} onChanged={laden}/>;
  else body = <Dashboard fahrschulen={fahrschulen} onNeu={()=>setScreen("neu")} onOpen={f=>setScreen({type:"detail",f})}/>;

  return (
    <div style={{fontFamily:F,background:T.bg,minHeight:"100vh"}}>
      <div style={{position:"sticky",top:0,zIndex:100,background:T.navBg,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`0.5px solid ${T.sep}`,padding:"14px 20px",fontFamily:F}}>
        <span style={{fontSize:20,fontWeight:700,color:T.label}}>🛠️ Betreiber</span>
      </div>
      <div style={{maxWidth:880,margin:"0 auto",padding:"20px 20px 40px"}}>{body}</div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────
function Dashboard({fahrschulen,onNeu,onOpen}) {
  const [counts,setCounts]=useState({}); // fahrschule_id -> schueler count
  useEffect(()=>{
    (async()=>{
      const {data} = await supabase.from("schueler").select("fahrschule_id");
      const c = {};
      (data||[]).forEach(s=>{c[s.fahrschule_id]=(c[s.fahrschule_id]||0)+1;});
      setCounts(c);
    })();
  },[fahrschulen]);

  const gesamtSchueler = Object.values(counts).reduce((a,b)=>a+b,0);
  const aktive = fahrschulen.filter(f=>f.aktiv);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
        <Card style={{padding:"18px 12px",textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:6}}>🏫</div>
          <div style={{fontSize:28,fontWeight:700,color:T.blue,fontFamily:F}}>{aktive.length}</div>
          <div style={{fontSize:12,color:T.label2,marginTop:2,fontFamily:F}}>Aktive Fahrschulen</div>
        </Card>
        <Card style={{padding:"18px 12px",textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:6}}>👥</div>
          <div style={{fontSize:28,fontWeight:700,color:T.green,fontFamily:F}}>{gesamtSchueler}</div>
          <div style={{fontSize:12,color:T.label2,marginTop:2,fontFamily:F}}>Schüler gesamt</div>
        </Card>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:16,fontWeight:700,color:T.label,fontFamily:F}}>Fahrschulen</div>
        <button onClick={onNeu} style={{background:T.green,color:"#fff",border:"none",borderRadius:999,padding:"9px 18px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F,boxShadow:`0 3px 12px ${T.green}44`}}>+ Neue Fahrschule</button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {fahrschulen.length===0&&<Card style={{padding:32,textAlign:"center"}}><span style={{color:T.label2}}>Noch keine Fahrschulen angelegt</span></Card>}
        {fahrschulen.map(f=>(
          <Card key={f.id} onClick={()=>onOpen(f)} style={{padding:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:f.farbe_primary||T.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,overflow:"hidden"}}>
                {f.icon_url?<img src={f.icon_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🚗"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:T.label,fontFamily:F}}>{f.name}</div>
                <div style={{fontSize:12,color:T.label2,fontFamily:F}}>/{f.slug} · {counts[f.id]||0} Schüler {!f.aktiv&&"· ⚪ Deaktiviert"}</div>
              </div>
              <span style={{color:T.label3,fontSize:22}}>›</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── NEUE FAHRSCHULE ANLEGEN ─────────────────────────
function NeueFahrschule({onSaved,onCancel}) {
  const [f,setF]=useState({name:"",slug:"",farbe_primary:"#E63946",preis_pro_schueler:20});
  const [adminName,setAdminName]=useState("Admin");
  const [adminPin,setAdminPin]=useState("");
  const [iconFile,setIconFile]=useState(null);
  const [err,setErr]=useState(""); const [saving,setSaving]=useState(false); const [ok,setOk]=useState(null);

  const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

  const go=async()=>{
    setErr("");
    if(!f.name.trim()){setErr("Namen eingeben.");return;}
    const slug = f.slug.trim() || slugify(f.name);
    if(!slug){setErr("Ungültiger Slug.");return;}
    if(adminPin.length<4){setErr("Admin-PIN mind. 4 Stellen.");return;}
    setSaving(true);

    let icon_url = null;
    if(iconFile){
      const n = `icon_${slug}_${Date.now()}.${iconFile.name.split(".").pop()||"png"}`;
      for(const b of ["Lernmaterial","lernmaterial"]){
        const {error} = await supabase.storage.from(b).upload(n,iconFile,{upsert:true,contentType:iconFile.type});
        if(!error){ icon_url = supabase.storage.from(b).getPublicUrl(n).data.publicUrl; break; }
      }
    }

    const {data,error} = await supabase.from("fahrschulen").insert({
      name:f.name.trim(), slug, farbe_primary:f.farbe_primary,
      preis_pro_schueler:Number(f.preis_pro_schueler)||20, icon_url,
    }).select().single();

    if(error){setSaving(false);setErr(error.message.includes("duplicate")?"Dieser Slug ist schon vergeben.":"Fehler: "+error.message);return;}

    await supabase.from("fahrlehrer").insert({fahrschule_id:data.id,name:adminName.trim()||"Admin",pin:adminPin,rolle:"admin"});

    setSaving(false);
    setOk({name:f.name.trim(),slug,adminName:adminName.trim()||"Admin",adminPin});
  };

  if(ok) return (
    <div style={{textAlign:"center",padding:"24px 0"}}>
      <div style={{fontSize:64,marginBottom:16}}>🎉</div>
      <div style={{fontSize:24,fontWeight:700,color:T.label,marginBottom:16}}>{ok.name} angelegt!</div>
      <Card style={{padding:20,textAlign:"left",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:T.label2}}>URL</span><span style={{fontWeight:600}}>/{ok.slug}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:T.label2}}>Admin-Name</span><span style={{fontWeight:600}}>{ok.adminName}</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:T.label2}}>Admin-PIN</span><span style={{fontWeight:700,fontSize:20,letterSpacing:3,color:T.blue}}>{ok.adminPin}</span></div>
      </Card>
      <button onClick={onSaved} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>Zur Übersicht</button>
    </div>
  );

  const inp={width:"100%",boxSizing:"border-box",background:T.bg,border:`0.5px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F};
  const lbl={fontSize:13,color:T.label2,fontWeight:500,marginBottom:6};

  return (
    <div>
      <div style={{fontSize:24,fontWeight:700,color:T.label,letterSpacing:-0.5,marginBottom:20,fontFamily:F}}>Neue Fahrschule</div>
      <Card style={{padding:20,marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:14}}>Branding & Zugang</div>
        <div style={{marginBottom:12}}><div style={lbl}>Name *</div><input style={inp} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Fahrschule Fahrwerk"/></div>
        <div style={{marginBottom:12}}><div style={lbl}>URL-Pfad (Slug)</div><input style={inp} value={f.slug} onChange={e=>setF({...f,slug:slugify(e.target.value)})} placeholder={f.name?slugify(f.name):"fahrwerk"}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={lbl}>Markenfarbe</div><input type="color" value={f.farbe_primary} onChange={e=>setF({...f,farbe_primary:e.target.value})} style={{width:"100%",height:40,border:`0.5px solid ${T.sep}`,borderRadius:12,cursor:"pointer"}}/></div>
          <div><div style={lbl}>Preis pro Schüler (€)</div><input style={inp} type="number" value={f.preis_pro_schueler} onChange={e=>setF({...f,preis_pro_schueler:e.target.value})}/></div>
        </div>
        <div><div style={lbl}>App-Icon (optional)</div>
          <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:T.bg,border:`0.5px solid ${T.sep}`,borderRadius:12,padding:"11px",cursor:"pointer",fontSize:14,color:T.label2}}>
            {iconFile?`✓ ${iconFile.name}`:"📷 Icon hochladen"}
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>setIconFile(e.target.files[0]||null)}/>
          </label>
        </div>
      </Card>

      <Card style={{padding:20,marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:14}}>Erster Admin-Zugang</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
          <div><div style={lbl}>Name</div><input style={inp} value={adminName} onChange={e=>setAdminName(e.target.value)}/></div>
          <div><div style={lbl}>PIN *</div><input style={inp} maxLength={8} value={adminPin} onChange={e=>setAdminPin(e.target.value.replace(/\D/g,""))}/></div>
        </div>
      </Card>

      {err&&<div style={{background:"#FFF2F2",color:T.red,borderRadius:10,padding:"10px 14px",fontSize:13,marginBottom:14}}>{err}</div>}
      <div style={{display:"flex",gap:10}}>
        <button onClick={onCancel} style={{flex:1,background:T.bg,border:`0.5px solid ${T.sep}`,borderRadius:14,padding:14,fontSize:15,cursor:"pointer",fontFamily:F}}>Abbrechen</button>
        <button onClick={go} disabled={saving} style={{flex:2,background:T.red,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:15,fontWeight:600,cursor:"pointer",opacity:saving?0.7:1,fontFamily:F}}>{saving?"Anlegen…":"✓ Fahrschule anlegen"}</button>
      </div>
    </div>
  );
}

// ── FAHRSCHULE DETAIL ────────────────────────────────
function FahrschuleDetail({f,onBack,onChanged}) {
  const [count,setCount]=useState(0);
  const [monate,setMonate]=useState([]);
  const [load,setLoad]=useState(true);

  useEffect(()=>{
    (async()=>{
      setLoad(true);
      const {data} = await supabase.from("schueler").select("erstellt_am").eq("fahrschule_id",f.id);
      setCount((data||[]).length);
      const gruppen = {};
      (data||[]).forEach(s=>{
        const d = new Date(s.erstellt_am);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        gruppen[key] = (gruppen[key]||0)+1;
      });
      setMonate(Object.entries(gruppen).sort((a,b)=>b[0].localeCompare(a[0])));
      setLoad(false);
    })();
  },[f.id]);

  const toggleAktiv=async()=>{await supabase.from("fahrschulen").update({aktiv:!f.aktiv}).eq("id",f.id);onChanged();onBack();};

  const monatsName = key => {const [j,m]=key.split("-");return new Date(Number(j),Number(m)-1,1).toLocaleDateString("de-DE",{month:"long",year:"numeric"});};
  const preis = f.preis_pro_schueler||20;

  return (
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",color:T.blue,cursor:"pointer",fontSize:15,fontFamily:F,marginBottom:16,padding:0}}>← Zurück zur Übersicht</button>

      <Card style={{padding:20,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:56,height:56,borderRadius:14,background:f.farbe_primary||T.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,overflow:"hidden"}}>
            {f.icon_url?<img src={f.icon_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🚗"}
          </div>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:T.label}}>{f.name}</div>
            <div style={{fontSize:13,color:T.label2}}>/{f.slug} · {preis}€ pro Schüler</div>
          </div>
        </div>
      </Card>

      {load?<div style={{display:"flex",justifyContent:"center",padding:40}}><span style={{fontSize:28}}>⏳</span></div>:<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <Card style={{padding:"16px 12px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:T.blue,fontFamily:F}}>{count}</div>
            <div style={{fontSize:12,color:T.label2,marginTop:2}}>Schüler gesamt</div>
          </Card>
          <Card style={{padding:"16px 12px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:T.green,fontFamily:F}}>{(monate[0]?.[1]||0)*preis}€</div>
            <div style={{fontSize:12,color:T.label2,marginTop:2}}>Dieser Monat</div>
          </Card>
        </div>

        <div style={{fontSize:11,fontWeight:700,color:T.label2,letterSpacing:0.8,textTransform:"uppercase",marginBottom:10,paddingLeft:4}}>Monatliche Historie</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {monate.length===0&&<Card style={{padding:24,textAlign:"center"}}><span style={{color:T.label2}}>Noch keine Schüler angelegt</span></Card>}
          {monate.map(([key,anzahl])=>(
            <Row key={key} style={{background:"#fff",borderRadius:14,boxShadow:T.s1}}>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label,textTransform:"capitalize"}}>{monatsName(key)}</div><div style={{fontSize:12,color:T.label2}}>{anzahl} neue Schüler</div></div>
              <div style={{fontSize:16,fontWeight:700,color:T.label}}>{anzahl*preis}€</div>
            </Row>
          ))}
        </div>
      </>}

      <button onClick={toggleAktiv} style={{width:"100%",background:f.aktiv?`${T.red}18`:`${T.green}18`,color:f.aktiv?T.red:T.green,border:"none",borderRadius:14,padding:14,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:F}}>
        {f.aktiv?"Fahrschule deaktivieren":"Fahrschule aktivieren"}
      </button>
    </div>
  );
}
