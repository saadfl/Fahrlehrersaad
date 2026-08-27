import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { T, F } from "./theme";
import { Card, Row } from "./ui";
import { tenantState, fahrschuleId } from "./tenant";

// ── ADMIN HOME ──────────────────────────────────────
// Einstiegspunkt in den Admin-Bereich, erreichbar von LehrerHome aus
// (nur sichtbar wenn isAdmin). Vier Kacheln fuehren zu den Unterbereichen.
export function AdminHome({onNav}) {
  const items = [
    {k:"admin-fahrschule",e:"🏫",t:"Fahrschul-Infos",d:"Texte, Öffnungszeiten, Kontakt, Social Media"},
    {k:"admin-fahrlehrer",e:"👨‍🏫",t:"Fahrlehrer",d:"Zugänge anlegen und verwalten"},
    {k:"admin-ankuendigungen",e:"📢",t:"Ankündigungen",d:"News für die Schüler-Startseite"},
    {k:"admin-abrechnung",e:"💶",t:"Abrechnung",d:"Kosten diesen Monat & Historie"},
  ];
  return (
    <div>
      <div style={{fontSize:24,fontWeight:700,color:T.label,letterSpacing:-0.5,marginBottom:20,fontFamily:F}}>Admin-Bereich</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {items.map(x=>(
          <Card key={x.k} onClick={()=>onNav(x.k)} style={{padding:16}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:26}}>{x.e}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:T.label,fontFamily:F}}>{x.t}</div>
                <div style={{fontSize:12,color:T.label2,fontFamily:F}}>{x.d}</div>
              </div>
              <span style={{color:T.label3,fontSize:22}}>›</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ADMIN: FAHRSCHUL-INHALTE ────────────────────────
// Bewusst NUR Inhalts-Felder (Text, Kontakt, Zeiten, Social Media).
// Icon/Logo/Farbe/Slug bleiben Betreiber-exklusiv, wie besprochen.
export function AdminFahrschule() {
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

  const inp={width:"100%",boxSizing:"border-box",background:T.bg,border:`0.5px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F};
  const lbl={fontSize:13,color:T.label2,fontWeight:500,marginBottom:6};

  return (
    <div>
      <div style={{fontSize:24,fontWeight:700,color:T.label,letterSpacing:-0.5,marginBottom:20,fontFamily:F}}>Fahrschul-Infos</div>
      <Card style={{padding:20,marginBottom:14}}>
        <div style={{marginBottom:14}}><div style={lbl}>Über uns</div><textarea style={{...inp,minHeight:90,resize:"vertical"}} value={form.ueber_uns_text} onChange={e=>setForm({...form,ueber_uns_text:e.target.value})} placeholder="Wir sind Fahrschule ..."/></div>
        <div style={{marginBottom:14}}><div style={lbl}>Adresse</div><input style={inp} value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} placeholder="Musterstraße 1, 12345 Musterstadt"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div><div style={lbl}>Telefon</div><input style={inp} value={form.telefon} onChange={e=>setForm({...form,telefon:e.target.value})}/></div>
          <div><div style={lbl}>E-Mail</div><input style={inp} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        </div>
        <div style={{marginBottom:0}}><div style={lbl}>Öffnungszeiten</div><textarea style={{...inp,minHeight:70,resize:"vertical"}} value={form.oeffnungszeiten} onChange={e=>setForm({...form,oeffnungszeiten:e.target.value})} placeholder={"Mo–Fr 9–18 Uhr\nSa nach Vereinbarung"}/></div>
      </Card>

      <Card style={{padding:20,marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:14}}>Social Media & Bewertungen</div>
        <div style={{marginBottom:12}}><div style={lbl}>Instagram</div><input style={inp} value={form.social_instagram} onChange={e=>setForm({...form,social_instagram:e.target.value})} placeholder="@dein_account"/></div>
        <div style={{marginBottom:12}}><div style={lbl}>TikTok</div><input style={inp} value={form.social_tiktok} onChange={e=>setForm({...form,social_tiktok:e.target.value})} placeholder="@dein_account"/></div>
        <div style={{marginBottom:12}}><div style={lbl}>YouTube</div><input style={inp} value={form.social_youtube} onChange={e=>setForm({...form,social_youtube:e.target.value})} placeholder="Kanalname"/></div>
        <div><div style={lbl}>Google-Bewertungslink</div><input style={inp} value={form.google_bewertung_url} onChange={e=>setForm({...form,google_bewertung_url:e.target.value})} placeholder="https://g.page/..."/></div>
      </Card>

      <Card style={{padding:20,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:T.label}}>"Meine Schüler"-Feature</div>
            <div style={{fontSize:12,color:T.label2,marginTop:2}}>Fahrlehrer können sich Schüler markieren</div>
          </div>
          <button onClick={()=>setForm({...form,meine_schueler_aktiv:!form.meine_schueler_aktiv})} style={{width:48,height:28,borderRadius:999,border:"none",cursor:"pointer",background:form.meine_schueler_aktiv?T.green:T.sep,position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",top:3,left:form.meine_schueler_aktiv?23:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
          </button>
        </div>
      </Card>

      <button onClick={save} disabled={saving} style={{width:"100%",background:saved?T.green:T.red,color:"#fff",border:"none",borderRadius:14,padding:14,fontSize:15,fontWeight:600,cursor:"pointer",opacity:saving?0.7:1,fontFamily:F}}>
        {saving?"Speichern…":saved?"✓ Gespeichert":"Speichern"}
      </button>
    </div>
  );
}

// ── ADMIN: FAHRLEHRER-VERWALTUNG ────────────────────
export function AdminFahrlehrer() {
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

  const inp={width:"100%",boxSizing:"border-box",background:T.bg,border:`0.5px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F};

  return (
    <div>
      <div style={{fontSize:24,fontWeight:700,color:T.label,letterSpacing:-0.5,marginBottom:20,fontFamily:F}}>Fahrlehrer</div>

      <Card style={{padding:18,marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:12}}>Neuer Zugang</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8,marginBottom:8}}>
          <input style={inp} placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <input style={inp} placeholder="PIN" maxLength={8} value={form.pin} onChange={e=>setForm({...form,pin:e.target.value.replace(/\D/g,"")})}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {[{v:"lehrer",l:"Fahrlehrer"},{v:"admin",l:"Admin"}].map(o=>(
            <button key={o.v} onClick={()=>setForm({...form,rolle:o.v})} style={{padding:"9px",borderRadius:12,border:`0.5px solid ${form.rolle===o.v?T.blue:T.sep}`,background:form.rolle===o.v?`${T.blue}18`:"#fff",color:form.rolle===o.v?T.blue:T.label2,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:F}}>{o.l}</button>
          ))}
        </div>
        {err&&<div style={{background:"#FFF2F2",color:T.red,borderRadius:10,padding:"8px 12px",fontSize:13,marginBottom:10}}>{err}</div>}
        <button onClick={anlegen} disabled={saving} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F}}>{saving?"Anlegen…":"+ Zugang anlegen"}</button>
      </Card>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {liste.length===0&&<Card style={{padding:24,textAlign:"center"}}><span style={{color:T.label2}}>Noch keine Fahrlehrer-Zugänge</span></Card>}
        {liste.map(l=>(
          <Card key={l.id} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:T.label,fontFamily:F}}>{l.name} {l.rolle==="admin"&&<span style={{fontSize:11,background:`${T.red}18`,color:T.red,borderRadius:999,padding:"2px 8px",marginLeft:6}}>Admin</span>}</div>
                <div style={{fontSize:12,color:T.label2,fontFamily:F}}>PIN: {l.pin} · {l.aktiv?"🟢 Aktiv":"⚪ Deaktiviert"}</div>
              </div>
              <button onClick={()=>toggleAktiv(l.id,l.aktiv)} style={{fontSize:12,background:l.aktiv?`${T.gray}18`:`${T.green}18`,color:l.aktiv?T.gray:T.green,border:"none",borderRadius:999,padding:"6px 12px",cursor:"pointer",fontWeight:600,fontFamily:F}}>{l.aktiv?"Deaktivieren":"Aktivieren"}</button>
              <button onClick={()=>loeschen(l.id)} style={{fontSize:12,background:`${T.red}18`,color:T.red,border:"none",borderRadius:999,padding:"6px 12px",cursor:"pointer",fontWeight:600,fontFamily:F}}>🗑</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ADMIN: ANKÜNDIGUNGEN ────────────────────────────
export function AdminAnkuendigungen() {
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

  const typInfo = {info:{l:"Info",c:T.blue},aktion:{l:"Aktion",c:T.green},dringend:{l:"Dringend",c:T.red}};
  const inp={width:"100%",boxSizing:"border-box",background:T.bg,border:`0.5px solid ${T.sep}`,borderRadius:12,padding:"10px 14px",fontSize:14,color:T.label,outline:"none",fontFamily:F};

  return (
    <div>
      <div style={{fontSize:24,fontWeight:700,color:T.label,letterSpacing:-0.5,marginBottom:20,fontFamily:F}}>Ankündigungen</div>

      <Card style={{padding:18,marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:12}}>Neue Ankündigung</div>
        <input style={{...inp,marginBottom:8}} placeholder="Titel, z.B. Heute geschlossen" value={form.titel} onChange={e=>setForm({...form,titel:e.target.value})}/>
        <textarea style={{...inp,minHeight:70,resize:"vertical",marginBottom:8}} placeholder="Text..." value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {Object.entries(typInfo).map(([k,v])=>(
            <button key={k} onClick={()=>setForm({...form,typ:k})} style={{padding:"8px",borderRadius:12,border:`0.5px solid ${form.typ===k?v.c:T.sep}`,background:form.typ===k?`${v.c}18`:"#fff",color:form.typ===k?v.c:T.label2,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:F}}>{v.l}</button>
          ))}
        </div>
        <button onClick={anlegen} disabled={saving} style={{width:"100%",background:T.blue,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F}}>{saving?"Speichern…":"+ Veröffentlichen"}</button>
      </Card>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {liste.length===0&&<Card style={{padding:24,textAlign:"center"}}><span style={{color:T.label2}}>Noch keine Ankündigungen</span></Card>}
        {liste.map(a=>(
          <Card key={a.id} style={{padding:16,opacity:a.aktiv?1:0.5}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <span style={{fontSize:11,background:`${typInfo[a.typ]?.c||T.blue}18`,color:typInfo[a.typ]?.c||T.blue,borderRadius:999,padding:"2px 9px",fontWeight:700}}>{typInfo[a.typ]?.l||a.typ}</span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>toggleAktiv(a.id,a.aktiv)} style={{fontSize:11,background:"none",border:"none",color:T.blue,cursor:"pointer",fontFamily:F}}>{a.aktiv?"Ausblenden":"Einblenden"}</button>
                <button onClick={()=>loeschen(a.id)} style={{fontSize:14,background:"none",border:"none",color:T.label2,cursor:"pointer"}}>🗑</button>
              </div>
            </div>
            <div style={{fontSize:15,fontWeight:600,color:T.label,marginBottom:4}}>{a.titel}</div>
            <div style={{fontSize:13,color:T.label2,lineHeight:1.5}}>{a.text}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── ADMIN: ABRECHNUNG ───────────────────────────────
// Zeigt der Fahrschule ihre EIGENE Kostenuebersicht (aktueller Monat +
// Historie), berechnet aus der Anzahl angelegter Schueler * Preis pro
// Schueler. Kein Einblick in andere Fahrschulen oder Gesamtumsatz.
export function AdminAbrechnung() {
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

  if(load) return <div style={{display:"flex",justifyContent:"center",padding:60}}><span style={{fontSize:32}}>⏳</span></div>;

  const aktuellerMonat = monate[0];

  return (
    <div>
      <div style={{fontSize:24,fontWeight:700,color:T.label,letterSpacing:-0.5,marginBottom:20,fontFamily:F}}>Abrechnung</div>

      <Card style={{padding:20,marginBottom:16,background:`linear-gradient(135deg,${T.red},#c1121f)`,border:"none"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",fontWeight:600,letterSpacing:0.5,marginBottom:6}}>DIESER MONAT</div>
        <div style={{fontSize:34,fontWeight:700,color:"#fff"}}>{(aktuellerMonat?.[1]||0) * preis}€</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",marginTop:4}}>{aktuellerMonat?.[1]||0} neue Schüler × {preis}€</div>
      </Card>

      <div style={{fontSize:11,fontWeight:700,color:T.label2,letterSpacing:0.8,textTransform:"uppercase",marginBottom:10,paddingLeft:4}}>Historie</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {monate.length<=1&&<Card style={{padding:24,textAlign:"center"}}><span style={{color:T.label2}}>Noch keine vergangenen Monate</span></Card>}
        {monate.slice(1).map(([key,anzahl])=>(
          <Row key={key} style={{background:"#fff",borderRadius:14,boxShadow:T.s1}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:T.label,textTransform:"capitalize"}}>{monatsName(key)}</div>
              <div style={{fontSize:12,color:T.label2}}>{anzahl} neue Schüler</div>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:T.label}}>{anzahl*preis}€</div>
          </Row>
        ))}
      </div>
    </div>
  );
}
