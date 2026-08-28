import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { T, F, setRoleAccent } from "../theme";
import { Row, TopBar, Page, H1, SectionLabel, RuleList, inputStyle, Field, PrimaryButton, GhostButton, TextButton, Chip, TabBar, ErrorBox } from "../ui";

// ────────────────────────────────────────────────────────────────
// WICHTIGER SICHERHEITSHINWEIS:
// Dieser PIN-Schutz ist NUR ein einfacher Platzhalter (PIN liegt
// sichtbar im Frontend-Code) und bietet keine echte Sicherheit.
// Für den produktiven Einsatz muss das durch einen serverseitig
// geprüften Zugang ersetzt werden (z.B. Supabase Auth), bevor hier
// echte Kundendaten/Umsatzzahlen mehrerer Fahrschulen sichtbar sind.
// ────────────────────────────────────────────────────────────────
const PLATZHALTER_PIN = "0000";

const ICONS = { uebersicht:"M4 19h16M6 19V10m5 9V5m5 14v-6", anlegen:"M12 5v14M5 12h14" };

export default function Betreiber() {
  const [pin,setPin]=useState(""); const [entered,setEntered]=useState(false);
  setRoleAccent("owner");

  if(!entered){
    return (
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:F}}>
        <H1 style={{fontSize:24,marginBottom:18}}>Betreiber-Zugang</H1>
        <input value={pin} onChange={e=>setPin(e.target.value)} type="password" placeholder="PIN"
          style={{...inputStyle,width:200,textAlign:"center",letterSpacing:6,marginBottom:12}}
          onKeyDown={e=>{if(e.key==="Enter"&&pin===PLATZHALTER_PIN)setEntered(true);}}/>
        <PrimaryButton style={{width:200}} onClick={()=>{if(pin===PLATZHALTER_PIN)setEntered(true);}}>Weiter</PrimaryButton>
      </div>
    );
  }
  return <BetreiberApp onLogout={()=>{setEntered(false);setPin("");}}/>;
}

function BetreiberApp({onLogout}) {
  const [tab,setTab]=useState("uebersicht");
  const [detail,setDetail]=useState(null); // Fahrschule-Objekt fuer Detailansicht, oder null
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
  else if(detail) body = <FahrschuleDetail f={detail} onBack={()=>setDetail(null)} onChanged={laden}/>;
  else if(tab==="anlegen") body = <NeueFahrschule onSaved={()=>{laden();setTab("uebersicht");}}/>;
  else body = <Dashboard fahrschulen={fahrschulen} onOpen={setDetail}/>;

  return (
    <div style={{fontFamily:F,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <TopBar onBack={detail?()=>setDetail(null):null} onLogout={onLogout} fahrschuleName="Betreiber"/>
      <div style={{flex:1}}><Page style={{paddingBottom:100}}>{body}</Page></div>
      {!detail&&<TabBar value={tab} onChange={setTab} tabs={[
        {id:"uebersicht",label:"Übersicht",icon:ICONS.uebersicht},{id:"anlegen",label:"Anlegen",icon:ICONS.anlegen},
      ]}/>}
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────
function Dashboard({fahrschulen,onOpen}) {
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
      <H1 style={{marginBottom:16}}>Alle Fahrschulen</H1>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:`2px solid ${T.sep2}`,borderBottom:`2px solid ${T.sep2}`,marginBottom:22}}>
        <div style={{padding:"14px 12px"}}>
          <div style={{fontWeight:800,fontSize:28,letterSpacing:"-.04em",color:T.label}}>{aktive.length}</div>
          <div style={{fontSize:11,color:T.label2,marginTop:6}}>Aktive Fahrschulen</div>
        </div>
        <div style={{padding:"14px 12px",borderLeft:`1px solid ${T.sep}`}}>
          <div style={{fontWeight:800,fontSize:28,letterSpacing:"-.04em",color:T.label}}>{gesamtSchueler}</div>
          <div style={{fontSize:11,color:T.label2,marginTop:6}}>Schüler gesamt</div>
        </div>
      </div>

      <SectionLabel>Mandanten</SectionLabel>
      <RuleList>
        {fahrschulen.length===0&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch keine Fahrschulen angelegt.</div>}
        {fahrschulen.map((f,i)=>(
          <Row key={f.id} last={i===fahrschulen.length-1} onClick={()=>onOpen(f)}>
            <span style={{width:9,height:9,flexShrink:0,background:f.farbe_primary||T.accent}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:T.label}}>{f.name}</div>
              <div style={{fontSize:11,color:T.label2,marginTop:1}}>/{f.slug}</div>
            </div>
            <span style={{fontSize:13,color:T.label,fontVariantNumeric:"tabular-nums"}}>{counts[f.id]||0} Schüler</span>
            {!f.aktiv&&<Chip tone="neutral">inaktiv</Chip>}
            <span style={{color:T.label3,fontSize:18}}>›</span>
          </Row>
        ))}
      </RuleList>
    </div>
  );
}

// ── NEUE FAHRSCHULE ANLEGEN ─────────────────────────
const BRAND_CHOICES = ["#e8620a","#ec3013","#0e6b5e","#3b4a8f","#201e1d"];

function NeueFahrschule({onSaved}) {
  const [f,setF]=useState({name:"",slug:"",farbe_primary:BRAND_CHOICES[0],preis_pro_schueler:20});
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
    <div>
      <H1 style={{marginBottom:16}}>{ok.name} angelegt</H1>
      <RuleList style={{marginBottom:20}}>
        <Row><span style={{flex:1,color:T.label2}}>URL</span><span style={{fontWeight:600}}>/{ok.slug}</span></Row>
        <Row><span style={{flex:1,color:T.label2}}>Admin-Name</span><span style={{fontWeight:600}}>{ok.adminName}</span></Row>
        <Row last><span style={{flex:1,color:T.label2}}>Admin-PIN</span><span style={{fontWeight:800,fontSize:18,letterSpacing:3,color:T.accent}}>{ok.adminPin}</span></Row>
      </RuleList>
      <PrimaryButton onClick={onSaved}>Zur Übersicht</PrimaryButton>
    </div>
  );

  return (
    <div>
      <Eyebrow>Schritt 1 von 1</Eyebrow>
      <H1 style={{margin:"6px 0 20px"}}>Fahrschule anlegen</H1>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:22}}>
        <Field label="Name *"><input style={inputStyle} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Fahrschule Fahrwerk"/></Field>
        <Field label="URL-Pfad (Slug)"><input style={inputStyle} value={f.slug} onChange={e=>setF({...f,slug:slugify(e.target.value)})} placeholder={f.name?slugify(f.name):"fahrwerk"}/></Field>
        <Field label="Markenfarbe">
          <div style={{display:"flex",gap:8}}>
            {BRAND_CHOICES.map(c=>(
              <button key={c} onClick={()=>setF({...f,farbe_primary:c})} style={{flex:1,height:44,cursor:"pointer",background:c,border:f.farbe_primary===c?`3px solid ${T.ink}`:`1px solid ${T.sep}`,display:"flex",alignItems:"flex-end",padding:4,fontFamily:F,fontSize:12,fontWeight:800,color:"#fff"}}>{f.farbe_primary===c?"✓":""}</button>
            ))}
            <input type="color" value={f.farbe_primary} onChange={e=>setF({...f,farbe_primary:e.target.value})} style={{width:44,height:44,border:`1px solid ${T.sep2}`,cursor:"pointer",padding:0}}/>
          </div>
        </Field>
        <Field label="Preis pro Schüler (€)"><input style={inputStyle} type="number" value={f.preis_pro_schueler} onChange={e=>setF({...f,preis_pro_schueler:e.target.value})}/></Field>
        <Field label="App-Icon (optional)">
          <label style={{display:"flex",alignItems:"center",gap:14,padding:12,border:`1px dashed ${T.sep2}`,cursor:"pointer"}}>
            <div style={{width:44,height:44,flexShrink:0,background:f.farbe_primary,display:"flex",alignItems:"flex-end",padding:5,boxSizing:"border-box",fontWeight:800,fontSize:18,color:"#fff",overflow:"hidden"}}>
              {iconFile?<span style={{fontSize:11}}>✓</span>:(f.name||"F").slice(0,1).toUpperCase()}
            </div>
            <div style={{fontSize:12,lineHeight:1.4,color:T.label2}}>PNG, mind. 512×512.<br/><span style={{fontWeight:800,color:T.accent}}>{iconFile?iconFile.name:"Datei wählen"}</span></div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>setIconFile(e.target.files[0]||null)}/>
          </label>
        </Field>
      </div>

      <SectionLabel>Erster Admin-Zugang</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8,marginBottom:22}}>
        <Field label="Name"><input style={inputStyle} value={adminName} onChange={e=>setAdminName(e.target.value)}/></Field>
        <Field label="PIN *"><input style={inputStyle} maxLength={8} value={adminPin} onChange={e=>setAdminPin(e.target.value.replace(/\D/g,""))}/></Field>
      </div>

      {err&&<ErrorBox>{err}</ErrorBox>}
      <PrimaryButton onClick={go} disabled={saving} style={{justifyContent:"space-between"}}><span>{saving?"Anlegen…":"Fahrschule anlegen"}</span><span style={{fontSize:18}}>→</span></PrimaryButton>
    </div>
  );
}

function Eyebrow({children}) {
  return <div style={{fontSize:11,letterSpacing:".1em",textTransform:"uppercase",color:T.label2,fontFamily:F}}>{children}</div>;
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
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        <div style={{width:52,height:52,flexShrink:0,background:f.farbe_primary||T.accent,overflow:"hidden"}}>
          {f.icon_url&&<img src={f.icon_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
        </div>
        <div>
          <H1 style={{fontSize:22}}>{f.name}</H1>
          <div style={{fontSize:13,color:T.label2,marginTop:2}}>/{f.slug} · {preis} € pro Schüler</div>
        </div>
      </div>

      {load?<div style={{display:"flex",justifyContent:"center",padding:40}}><span style={{fontSize:28}}>⏳</span></div>:<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:`2px solid ${T.sep2}`,borderBottom:`2px solid ${T.sep2}`,marginBottom:20}}>
          <div style={{padding:"14px 12px"}}><div style={{fontWeight:800,fontSize:26,letterSpacing:"-.03em"}}>{count}</div><div style={{fontSize:11,color:T.label2,marginTop:6}}>Schüler gesamt</div></div>
          <div style={{padding:"14px 12px",borderLeft:`1px solid ${T.sep}`}}><div style={{fontWeight:800,fontSize:26,letterSpacing:"-.03em"}}>{((monate[0]?.[1]||0)*preis).toFixed(2)} €</div><div style={{fontSize:11,color:T.label2,marginTop:6}}>Dieser Monat</div></div>
        </div>

        <SectionLabel>Monatliche Historie</SectionLabel>
        <RuleList style={{marginBottom:22}}>
          {monate.length===0&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch keine Schüler angelegt.</div>}
          {monate.map(([key,anzahl],i,arr)=>(
            <Row key={key} last={i===arr.length-1}>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label,textTransform:"capitalize"}}>{monatsName(key)}</div><div style={{fontSize:12,color:T.label2}}>{anzahl} neue Schüler</div></div>
              <div style={{fontSize:15,fontWeight:800,color:T.label}}>{(anzahl*preis).toFixed(2)} €</div>
            </Row>
          ))}
        </RuleList>
      </>}

      <GhostButton style={{width:"100%",boxSizing:"border-box",color:f.aktiv?T.red:T.green,borderColor:f.aktiv?T.red:T.green}} onClick={toggleAktiv}>
        {f.aktiv?"Fahrschule deaktivieren":"Fahrschule aktivieren"}
      </GhostButton>
    </div>
  );
}
