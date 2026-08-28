import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { T, F } from "./theme";
import { Row, H1, SectionLabel, RuleList, inputStyle, Field, PrimaryButton, GhostButton, TextButton, Chip, Segmented, ErrorBox } from "./ui";
import { tenantState, fahrschuleId } from "./tenant";

// ── ADMIN HOME ──────────────────────────────────────
// Einstiegspunkt in den Admin-Bereich, erreichbar von LehrerHome aus
// (nur sichtbar wenn isAdmin). Drei Segmente statt getrennter Screens,
// analog zum Design-System: Fahrschule / Ankündigungen / Team.
export function AdminHome() {
  const [seg,setSeg]=useState("fahrschule");
  return (
    <div>
      <H1 style={{marginBottom:20}}>Inhalte</H1>
      <Segmented style={{marginBottom:22}} value={seg} onChange={setSeg} options={[
        {id:"fahrschule",label:"Fahrschule"},{id:"anns",label:"Ankündigungen"},{id:"team",label:"Team"},
      ]}/>
      {seg==="fahrschule"&&<AdminFahrschule/>}
      {seg==="anns"&&<AdminAnkuendigungen/>}
      {seg==="team"&&<div><AdminFahrlehrer/><AdminAbrechnung/></div>}
    </div>
  );
}

// ── ADMIN: FAHRSCHUL-INHALTE ────────────────────────
// Bewusst NUR Inhalts-Felder (Text, Kontakt, Zeiten, Social Media).
// Icon/Logo/Farbe/Slug bleiben Betreiber-exklusiv, wie besprochen.
function AdminFahrschule() {
  const fid = fahrschuleId();
  const f = tenantState.current || {};
  const [form,setForm]=useState({
    ueber_uns_text:f.ueber_uns_text||"", adresse:f.adresse||"", telefon:f.telefon||"",
    email:f.email||"", oeffnungszeiten:f.oeffnungszeiten||"",
    social_instagram:f.social_instagram||"", social_tiktok:f.social_tiktok||"", social_youtube:f.social_youtube||"",
    google_bewertung_url:f.google_bewertung_url||"", meine_schueler_aktiv:f.meine_schueler_aktiv!==false,
  });
  const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);

  const save=async()=>{
    setSaving(true);
    const {error} = await supabase.from("fahrschulen").update(form).eq("id",fid);
    setSaving(false);
    if(!error){
      Object.assign(tenantState.current, form); // andere Screens (z.B. Profil) sofort aktualisieren
      setSaved(true); setTimeout(()=>setSaved(false),2000);
    }
  };

  return (
    <div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
        <Field label="Über uns"><textarea style={{...inputStyle,minHeight:90,resize:"vertical"}} value={form.ueber_uns_text} onChange={e=>setForm({...form,ueber_uns_text:e.target.value})} placeholder="Wir sind Fahrschule ..."/></Field>
        <Field label="Adresse"><input style={inputStyle} value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} placeholder="Musterstraße 1, 12345 Musterstadt"/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Field label="Telefon"><input style={inputStyle} value={form.telefon} onChange={e=>setForm({...form,telefon:e.target.value})}/></Field>
          <Field label="E-Mail"><input style={inputStyle} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
        </div>
        <Field label="Öffnungszeiten"><textarea style={{...inputStyle,minHeight:70,resize:"vertical"}} value={form.oeffnungszeiten} onChange={e=>setForm({...form,oeffnungszeiten:e.target.value})} placeholder={"Mo–Fr 9–18 Uhr\nSa nach Vereinbarung"}/></Field>
      </div>

      <SectionLabel>Social Media & Bewertungen</SectionLabel>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
        <Field label="Instagram"><input style={inputStyle} value={form.social_instagram} onChange={e=>setForm({...form,social_instagram:e.target.value})} placeholder="@dein_account"/></Field>
        <Field label="TikTok"><input style={inputStyle} value={form.social_tiktok} onChange={e=>setForm({...form,social_tiktok:e.target.value})} placeholder="@dein_account"/></Field>
        <Field label="YouTube"><input style={inputStyle} value={form.social_youtube} onChange={e=>setForm({...form,social_youtube:e.target.value})} placeholder="Kanalname"/></Field>
        <Field label="Google-Bewertungslink"><input style={inputStyle} value={form.google_bewertung_url} onChange={e=>setForm({...form,google_bewertung_url:e.target.value})} placeholder="https://g.page/..."/></Field>
      </div>

      <RuleList style={{marginBottom:24}}>
        <Row last>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:T.label}}>"Meine Schüler"-Feature</div>
            <div style={{fontSize:12,color:T.label2,marginTop:2}}>Fahrlehrer können sich Schüler markieren</div>
          </div>
          <button onClick={()=>setForm({...form,meine_schueler_aktiv:!form.meine_schueler_aktiv})} style={{width:48,height:26,border:`1px solid ${T.sep2}`,cursor:"pointer",padding:2,background:form.meine_schueler_aktiv?T.accent:"transparent",display:"flex",justifyContent:form.meine_schueler_aktiv?"flex-end":"flex-start"}}>
            <span style={{width:20,height:20,background:form.meine_schueler_aktiv?T.bg:T.label3,display:"block"}}/>
          </button>
        </Row>
      </RuleList>

      <PrimaryButton onClick={save} disabled={saving}>{saving?"Speichern…":saved?"Gespeichert ✓":"Änderungen speichern"}</PrimaryButton>
    </div>
  );
}

// ── ADMIN: FAHRLEHRER-VERWALTUNG ────────────────────
function AdminFahrlehrer() {
  const fid = fahrschuleId();
  const [liste,setListe]=useState([]);
  const [form,setForm]=useState({name:"",pin:"",rolle:"lehrer"});
  const [err,setErr]=useState(""); const [saving,setSaving]=useState(false);

  const laden=useCallback(async()=>{
    const{data}=await supabase.from("fahrlehrer").select("*").eq("fahrschule_id",fid).order("erstellt_am");
    setListe(data||[]);
  },[fid]);
  useEffect(()=>{laden();},[laden]);

  const anlegen=async()=>{
    setErr("");
    if(!form.name.trim()){setErr("Namen eingeben.");return;}
    if(form.pin.length<4){setErr("PIN mind. 4 Stellen.");return;}
    setSaving(true);
    const{error}=await supabase.from("fahrlehrer").insert({fahrschule_id:fid,name:form.name.trim(),pin:form.pin,rolle:form.rolle});
    setSaving(false);
    if(error){setErr(error.message.includes("duplicate")?"Diese PIN ist schon vergeben.":"Fehler: "+error.message);return;}
    setForm({name:"",pin:"",rolle:"lehrer"});
    laden();
  };

  const toggleAktiv=async(id,aktiv)=>{await supabase.from("fahrlehrer").update({aktiv:!aktiv}).eq("id",id).eq("fahrschule_id",fid);laden();};
  const loeschen=async(id)=>{await supabase.from("fahrlehrer").delete().eq("id",id).eq("fahrschule_id",fid);laden();};

  return (
    <div>
      <SectionLabel>Neuer Zugang</SectionLabel>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8,marginBottom:8}}>
        <input style={inputStyle} placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input style={inputStyle} placeholder="PIN" maxLength={8} value={form.pin} onChange={e=>setForm({...form,pin:e.target.value.replace(/\D/g,"")})}/>
      </div>
      <Segmented style={{marginBottom:12}} value={form.rolle} onChange={v=>setForm({...form,rolle:v})} options={[{id:"lehrer",label:"Fahrlehrer"},{id:"admin",label:"Admin"}]}/>
      {err&&<ErrorBox>{err}</ErrorBox>}
      <GhostButton style={{width:"100%",boxSizing:"border-box",marginBottom:26}} onClick={anlegen} disabled={saving}>{saving?"Anlegen…":"+ Zugang anlegen"}</GhostButton>

      <SectionLabel>Team</SectionLabel>
      <RuleList>
        {liste.length===0&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch keine Fahrlehrer-Zugänge.</div>}
        {liste.map((l,i)=>(
          <Row key={l.id} last={i===liste.length-1}>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:600,color:T.label}}>{l.name} {l.rolle==="admin"&&<Chip tone="neutral">Admin</Chip>}</div>
              <div style={{fontSize:12,color:T.label2,marginTop:2}}>PIN {l.pin}</div>
            </div>
            <Chip tone={l.aktiv?"accent":"neutral"}>{l.aktiv?"aktiv":"deaktiviert"}</Chip>
            <TextButton onClick={()=>toggleAktiv(l.id,l.aktiv)}>{l.aktiv?"Deaktivieren":"Aktivieren"}</TextButton>
            <TextButton onClick={()=>loeschen(l.id)} style={{color:T.red}}>Löschen</TextButton>
          </Row>
        ))}
      </RuleList>
    </div>
  );
}

// ── ADMIN: ANKÜNDIGUNGEN ────────────────────────────
function AdminAnkuendigungen() {
  const fid = fahrschuleId();
  const [liste,setListe]=useState([]);
  const [form,setForm]=useState({titel:"",text:"",typ:"info"});
  const [saving,setSaving]=useState(false);

  const laden=useCallback(async()=>{
    const{data}=await supabase.from("ankuendigungen").select("*").eq("fahrschule_id",fid).order("erstellt_am",{ascending:false});
    setListe(data||[]);
  },[fid]);
  useEffect(()=>{laden();},[laden]);

  const anlegen=async()=>{
    if(!form.titel.trim()||!form.text.trim())return;
    setSaving(true);
    await supabase.from("ankuendigungen").insert({fahrschule_id:fid,titel:form.titel.trim(),text:form.text.trim(),typ:form.typ});
    setSaving(false);
    setForm({titel:"",text:"",typ:"info"});
    laden();
  };
  const toggleAktiv=async(id,aktiv)=>{await supabase.from("ankuendigungen").update({aktiv:!aktiv}).eq("id",id).eq("fahrschule_id",fid);laden();};
  const loeschen=async(id)=>{await supabase.from("ankuendigungen").delete().eq("id",id).eq("fahrschule_id",fid);laden();};

  const typLabel = {info:"Info",aktion:"Aktion",dringend:"Dringend"};

  return (
    <div>
      <SectionLabel>Neue Ankündigung</SectionLabel>
      <input style={{...inputStyle,marginBottom:8}} placeholder="Titel, z.B. Heute geschlossen" value={form.titel} onChange={e=>setForm({...form,titel:e.target.value})}/>
      <textarea style={{...inputStyle,minHeight:70,resize:"vertical",marginBottom:8}} placeholder="Text..." value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/>
      <Segmented style={{marginBottom:12}} value={form.typ} onChange={v=>setForm({...form,typ:v})} options={[{id:"info",label:"Info"},{id:"aktion",label:"Aktion"},{id:"dringend",label:"Dringend"}]}/>
      <GhostButton style={{width:"100%",boxSizing:"border-box",marginBottom:26}} onClick={anlegen} disabled={saving}>{saving?"Speichern…":"+ Veröffentlichen"}</GhostButton>

      <SectionLabel>Alle Ankündigungen</SectionLabel>
      <RuleList>
        {liste.length===0&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch keine Ankündigungen.</div>}
        {liste.map((a,i)=>(
          <Row key={a.id} last={i===liste.length-1} style={{flexDirection:"column",alignItems:"stretch",gap:0,opacity:a.aktiv?1:.5}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <Chip tone={a.typ==="dringend"?"warn":a.typ==="aktion"?"accent":"neutral"}>{typLabel[a.typ]||a.typ}</Chip>
              <div style={{display:"flex",gap:14}}>
                <TextButton onClick={()=>toggleAktiv(a.id,a.aktiv)}>{a.aktiv?"Ausblenden":"Einblenden"}</TextButton>
                <TextButton onClick={()=>loeschen(a.id)} style={{color:T.red}}>Löschen</TextButton>
              </div>
            </div>
            <div style={{fontSize:15,fontWeight:600,color:T.label}}>{a.titel}</div>
            <div style={{fontSize:13,color:T.label2,lineHeight:1.5,marginTop:2}}>{a.text}</div>
          </Row>
        ))}
      </RuleList>
    </div>
  );
}

// ── ADMIN: ABRECHNUNG ───────────────────────────────
// Zeigt der Fahrschule ihre EIGENE Kostenuebersicht (aktueller Monat +
// Historie), berechnet aus der Anzahl angelegter Schueler * Preis pro
// Schueler. Kein Einblick in andere Fahrschulen oder Gesamtumsatz.
function AdminAbrechnung() {
  const fid = fahrschuleId();
  const preis = tenantState.current?.preis_pro_schueler || 20;
  const [monate,setMonate]=useState([]); const [load,setLoad]=useState(true);

  useEffect(()=>{
    (async()=>{
      setLoad(true);
      const {data} = await supabase.from("schueler").select("erstellt_am").eq("fahrschule_id",fid);
      const gruppen = {};
      (data||[]).forEach(s=>{
        const d = new Date(s.erstellt_am);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
        gruppen[key] = (gruppen[key]||0)+1;
      });
      const liste = Object.entries(gruppen).sort((a,b)=>b[0].localeCompare(a[0]));
      setMonate(liste);
      setLoad(false);
    })();
  },[fid]);

  const monatsName = key => {
    const [j,m] = key.split("-");
    return new Date(Number(j),Number(m)-1,1).toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  };

  if(load) return <div style={{display:"flex",justifyContent:"center",padding:40}}><span style={{fontSize:28}}>⏳</span></div>;

  const aktuellerMonat = monate[0];

  return (
    <div>
      <SectionLabel>Abrechnung</SectionLabel>
      <div style={{padding:14,background:T.card,border:`1px solid ${T.sep}`,marginBottom:20}}>
        <Chip tone="neutral">Abrechnung {aktuellerMonat?monatsName(aktuellerMonat[0]):"diesen Monat"}</Chip>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:8}}>
          <span style={{fontWeight:800,fontSize:28,letterSpacing:"-.04em",color:T.label}}>{((aktuellerMonat?.[1]||0) * preis).toFixed(2)} €</span>
          <span style={{fontSize:12,color:T.label2}}>{aktuellerMonat?.[1]||0} neue Schüler × {preis} €</span>
        </div>
      </div>

      <SectionLabel>Historie</SectionLabel>
      <RuleList>
        {monate.length<=1&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch keine vergangenen Monate.</div>}
        {monate.slice(1).map(([key,anzahl],i,arr)=>(
          <Row key={key} last={i===arr.length-1}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:T.label,textTransform:"capitalize"}}>{monatsName(key)}</div>
              <div style={{fontSize:12,color:T.label2}}>{anzahl} neue Schüler</div>
            </div>
            <div style={{fontSize:15,fontWeight:800,color:T.label}}>{(anzahl*preis).toFixed(2)} €</div>
          </Row>
        ))}
      </RuleList>
    </div>
  );
}
