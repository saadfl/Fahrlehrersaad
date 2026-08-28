import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { T, F, AUSBILDUNG, ALL, nxt, KLASSEN, setRoleAccent, resetAccent } from "./theme";
import { Card, Row, Ring, TopBar, Page, Eyebrow, H1, SectionLabel, RuleList, inputStyle, Field, PrimaryButton, GhostButton, TextButton, Chip, Segmented, TabBar, ErrorBox } from "./ui";
import { tenantState, fahrschuleId } from "./tenant";
import { AdminHome } from "./AdminScreens";

const ICONS = {
  home:"M4 11l8-6 8 6v8H4z", diagramm:"M4 20V9m5 11V4m5 16v-7m5 7V7",
  lernen:"M4 5h7v15H4zm9 0h7v15h-7", schule:"M3 20h18M6 20V8l6-4 6 4v12M10 20v-5h4v5",
};

// Themen-Status wie im Design-System: 0=offen, 1=in Arbeit, 2=fertig
const STATUS = [
  { label:"offen", tone:"neutral" },
  { label:"in Arbeit", tone:"warn" },
  { label:"fertig", tone:"ink" },
];

// ── LOGIN ───────────────────────────────────────────
// Prueft zuerst gegen die fahrlehrer-Tabelle (admin oder lehrer),
// dann gegen die schueler-Tabelle - beide gefiltert auf die
// aktuell geladene Fahrschule (fahrschuleId()).
function Login({onLogin}) {
  const [name,setName]=useState(""); const [pin,setPin]=useState("");
  const [err,setErr]=useState(""); const [load,setLoad]=useState(false);
  const fahrschule = tenantState.current;
  resetAccent();

  const go=async()=>{
    setErr(""); setLoad(true);
    const fid = fahrschuleId();

    const { data: fl } = await supabase
      .from("fahrlehrer")
      .select("*")
      .eq("fahrschule_id", fid)
      .ilike("name", name.trim())
      .eq("pin", pin)
      .eq("aktiv", true)
      .maybeSingle();

    if (fl) {
      setLoad(false);
      onLogin({ role:"lehrer", fahrlehrer: fl, isAdmin: fl.rolle === "admin" });
      return;
    }

    const { data: sch, error } = await supabase
      .from("schueler")
      .select("*")
      .eq("fahrschule_id", fid)
      .ilike("name", name.trim())
      .eq("pin", pin)
      .maybeSingle();

    setLoad(false);
    if (error || !sch) { setErr("Name oder PIN falsch."); return; }
    onLogin({ role:"schueler", schueler: sch });
  };

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:F}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{width:56,height:56,background:T.accent,display:"flex",alignItems:"flex-end",padding:6,boxSizing:"border-box",overflow:"hidden",marginBottom:24}}>
          {fahrschule?.icon_url
            ? <img src={fahrschule.icon_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{fontWeight:800,fontSize:22,color:T.bg,lineHeight:1}}>{(fahrschule?.name||"F").slice(0,1).toUpperCase()}</span>}
        </div>
        <H1 style={{marginBottom:6}}>{fahrschule?.name || "Fahrschule"}</H1>
        <p style={{fontSize:14,lineHeight:1.45,color:T.label2,margin:"0 0 28px",fontFamily:F}}>Deine Ausbildung, dein Fortschritt, dein Lernmaterial – an einem Ort.</p>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:22}}>
          <Field label="Name">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Vor- und Nachname" onKeyDown={e=>e.key==="Enter"&&go()} style={inputStyle}/>
          </Field>
          <Field label="PIN">
            <input value={pin} onChange={e=>setPin(e.target.value)} type="password" maxLength={8} onKeyDown={e=>e.key==="Enter"&&go()} style={{...inputStyle,fontSize:22,letterSpacing:6}}/>
          </Field>
        </div>
        {err&&<ErrorBox>{err}</ErrorBox>}
        <PrimaryButton onClick={go} disabled={load} style={{justifyContent:"space-between"}}>
          <span>{load?"Anmelden…":"Anmelden"}</span><span style={{fontSize:18}}>→</span>
        </PrimaryButton>
      </div>
    </div>
  );
}

// ── TENANT ROOT ─────────────────────────────────────
// Ersetzt den frueheren Default-Export "App". Wird von TenantApp.js
// gerendert, NACHDEM die Fahrschule geladen und tenantState.current
// gesetzt wurde.
export function TenantRoot() {
  const [user,setUser]=useState(null);
  if(!user) return <Login onLogin={setUser}/>;
  if(user.role==="lehrer") return <LehrerApp onLogout={()=>setUser(null)} fahrlehrer={user.fahrlehrer} isAdmin={user.isAdmin}/>;
  return <SchuelerApp schueler={user.schueler} onLogout={()=>setUser(null)}/>;
}

// ── LEHRER APP ──────────────────────────────────────
function LehrerApp({onLogout,fahrlehrer,isAdmin}) {
  const [liste,setListe]=useState([]);
  const [mat,setMat]=useState({});
  const [screen,setScreen]=useState(null); // null = Dashboard
  const [zuletzt,setZuletzt]=useState([]);
  const fid = fahrschuleId();
  setRoleAccent(screen?.type==="admin" ? "admin" : "lehrer");

  const ladeListe=useCallback(async()=>{
    const{data}=await supabase.from("schueler").select("*").eq("fahrschule_id", fid).order("name");
    setListe(data||[]);
  },[fid]);

  const ladeMat=useCallback(async()=>{
    const[m,q]=await Promise.all([
      supabase.from("lernmaterial").select("*").eq("fahrschule_id", fid),
      supabase.from("quiz_fragen").select("*").eq("fahrschule_id", fid),
    ]);
    const map={};
    (m.data||[]).forEach(x=>{map[x.item_key]={videoUrl:x.video_url||"",fotos:x.fotos||[],quiz:[],pdfUrl:x.pdf_url||"",pdfName:x.pdf_name||""};});
    (q.data||[]).forEach(x=>{if(!map[x.item_key])map[x.item_key]={videoUrl:"",fotos:[],quiz:[],pdfUrl:"",pdfName:""};map[x.item_key].quiz.push({id:x.id,frage:x.frage,typ:x.typ,antworten:x.antworten||[],richtig:x.richtig,erklaerung:x.erklaerung||"",bildUrl:x.bild_url||""});});
    setMat(map);
  },[fid]);

  useEffect(()=>{ladeListe();ladeMat();},[ladeListe,ladeMat]);

  const openS=s=>{setZuletzt(p=>[s,...p.filter(x=>x.id!==s.id)].slice(0,5));setScreen({type:"s",s});};
  const backToDashboard=()=>{setScreen(null);ladeListe();};

  const aktiv=liste.filter(s=>!["archiviert","abgeschlossen"].includes(s.status||"aktiv"));
  const archiv=liste.filter(s=>["archiviert","abgeschlossen"].includes(s.status||"aktiv"));

  let body, onBack=null;
  if(screen?.type==="s"){ body=<DiagrammView s={screen.s} mat={mat} setMat={setMat} onMat={k=>setScreen({type:"m",k,back:screen})} isLehrer/>; onBack=backToDashboard; }
  else if(screen?.type==="m"){ body=<MatView ik={screen.k} mat={mat} setMat={setMat} isLehrer/>; onBack=()=>setScreen(screen.back||null); }
  else if(screen?.type==="neu"){ body=<NeuerS onSaved={()=>{ladeListe();setScreen(null);}}/>; onBack=()=>setScreen(null); }
  else if(screen?.type==="alle"){ body=<SListe liste={liste} aktiv={aktiv} archiv={archiv} onOpen={openS} onNeu={()=>setScreen({type:"neu"})} onRefresh={ladeListe}/>; onBack=()=>setScreen(null); }
  else if(screen?.type==="material"){ body=<MatListe mat={mat} onOpen={k=>setScreen({type:"m",k,back:screen})}/>; onBack=()=>setScreen(null); }
  else if(screen?.type==="profil"){ body=<Profil/>; onBack=()=>setScreen(null); }
  else if(screen?.type==="admin"){ body=<AdminHome/>; onBack=()=>setScreen(null); }
  else { body=<LehrerHome liste={liste} zuletzt={zuletzt} aktiv={aktiv} archiv={archiv} onOpen={openS} onNeu={()=>setScreen({type:"neu"})} onAlle={()=>setScreen({type:"alle"})} onMaterial={()=>setScreen({type:"material"})} onProfil={()=>setScreen({type:"profil"})} onAdmin={()=>setScreen({type:"admin"})} onStatusChanged={ladeListe} fahrlehrer={fahrlehrer} isAdmin={isAdmin}/>; }

  return (
    <div style={{fontFamily:F,background:T.bg,minHeight:"100vh"}}>
      <TopBar onBack={onBack} onLogout={onLogout} fahrschuleName={tenantState.current?.name}/>
      <Page>{body}</Page>
    </div>
  );
}

// ── LEHRER HOME ─────────────────────────────────────
function LehrerHome({liste,zuletzt,aktiv,archiv,onOpen,onNeu,onAlle,onMaterial,onProfil,onAdmin,onStatusChanged,fahrlehrer,isAdmin}) {
  const fid = fahrschuleId();
  const statusAendern=async(id,st)=>{await supabase.from("schueler").update({status:st}).eq("id",id).eq("fahrschule_id",fid);onStatusChanged();};
  const loeschen=async(id)=>{await supabase.from("schueler").delete().eq("id",id).eq("fahrschule_id",fid);onStatusChanged();};
  return (
    <div>
      {fahrlehrer&&<Eyebrow>Fahrlehrer · {fahrlehrer.name}{isAdmin?" (Admin)":""}</Eyebrow>}
      <H1 style={{margin:"6px 0 20px"}}>Dashboard</H1>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderTop:`2px solid ${T.sep2}`,borderBottom:`2px solid ${T.sep2}`,marginBottom:24}}>
        <div onClick={onAlle} style={{padding:"14px 12px",cursor:"pointer"}}>
          <div style={{fontWeight:800,fontSize:30,letterSpacing:"-.04em",lineHeight:1,color:T.label}}>{liste.length}</div>
          <div style={{fontSize:11,color:T.label2,marginTop:6}}>Schüler gesamt</div>
        </div>
        <div onClick={onAlle} style={{padding:"14px 12px",borderLeft:`1px solid ${T.sep}`,cursor:"pointer"}}>
          <div style={{fontWeight:800,fontSize:30,letterSpacing:"-.04em",lineHeight:1,color:T.accent}}>{aktiv.length}</div>
          <div style={{fontSize:11,color:T.label2,marginTop:6}}>aktiv in Ausbildung</div>
        </div>
        <div onClick={onMaterial} style={{padding:"14px 12px",borderLeft:`1px solid ${T.sep}`,cursor:"pointer"}}>
          <div style={{fontWeight:800,fontSize:30,letterSpacing:"-.04em",lineHeight:1,color:T.label}}>{AUSBILDUNG.length}</div>
          <div style={{fontSize:11,color:T.label2,marginTop:6}}>Lernbereiche</div>
        </div>
      </div>

      <SectionLabel right={<TextButton onClick={onNeu}>+ Neuer Schüler</TextButton>}>Zuletzt geöffnet</SectionLabel>
      {zuletzt.length===0
        ?<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch kein Schüler geöffnet.</div>
        :<RuleList style={{marginBottom:8}}>
          {zuletzt.filter(s=>liste.find(x=>x.id===s.id)).map(s=>{const a=liste.find(x=>x.id===s.id)||s;return <SRow key={s.id} s={a} onClick={()=>onOpen(a)} onSA={statusAendern} onDel={loeschen}/>;} )}
        </RuleList>
      }
      <div style={{padding:"6px 0 10px"}}><TextButton onClick={onAlle}>Alle Schüler anzeigen ({liste.length}) →</TextButton></div>

      <SectionLabel>Bald verfügbar</SectionLabel>
      <RuleList style={{marginBottom:10}}>
        {[{t:"Prüfungsreife",d:"Automatische Auswertung der Ausbildungsreife"},{t:"Theorie Lektionen",d:"14 Lektionen für die Theorieprüfung"}].map((x,i)=>(
          <Row key={i} last={i===1}>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label}}>{x.t}</div><div style={{fontSize:12,color:T.label2,marginTop:1}}>{x.d}</div></div>
            <Chip tone="neutral">Bald</Chip>
          </Row>
        ))}
      </RuleList>

      <SectionLabel>Mehr</SectionLabel>
      <RuleList>
        <Row onClick={onProfil}><span style={{flex:1,fontSize:14,fontWeight:600,color:T.label}}>Fahrschule & Team</span><span style={{color:T.label3,fontSize:18}}>›</span></Row>
        {isAdmin&&<Row last onClick={onAdmin}><span style={{flex:1,fontSize:14,fontWeight:600,color:T.label}}>Admin-Bereich</span><span style={{color:T.label3,fontSize:18}}>›</span></Row>}
      </RuleList>
    </div>
  );
}

// ── SCHÜLER ROW ─────────────────────────────────────
function SRow({s,onClick,onSA,onDel}) {
  const [pct,setPct]=useState(0);
  useEffect(()=>{supabase.from("ausbildungsstand").select("wert").eq("schueler_id",s.id).then(({data})=>setPct(Math.round(((data||[]).filter(x=>x.wert===2).length/ALL.length)*100)));},[s.id]);
  const status=s.status||"aktiv";
  return (
    <Row style={{flexDirection:"column",alignItems:"stretch",gap:0,padding:"13px 0"}}>
      <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:onSA?10:0}}>
        <span style={{fontWeight:800,fontSize:13,minWidth:34,color:T.label}}>{pct}%</span>
        <span style={{flex:1,fontSize:15,fontWeight:600,color:T.label}}>{s.name}</span>
        <Chip tone={status==="aktiv"?"accent":status==="abgeschlossen"?"ink":"neutral"}>{status==="aktiv"?"aktiv":status==="abgeschlossen"?"abgeschlossen":"archiviert"}</Chip>
        <span style={{color:T.label3,fontSize:18}}>›</span>
      </div>
      {onSA&&<div style={{display:"flex",flexWrap:"wrap",gap:16}}>
        {status!=="abgeschlossen"&&<TextButton onClick={()=>onSA(s.id,"abgeschlossen")} style={{color:T.label2}}>Abgeschlossen</TextButton>}
        {status!=="archiviert"&&<TextButton onClick={()=>onSA(s.id,"archiviert")} style={{color:T.label2}}>Archivieren</TextButton>}
        <TextButton onClick={()=>onDel(s.id)} style={{color:T.red,marginLeft:"auto"}}>Löschen</TextButton>
      </div>}
    </Row>
  );
}

// ── SCHÜLER LISTE ───────────────────────────────────
function SListe({liste,aktiv,archiv,onOpen,onNeu,onRefresh}) {
  const [suche,setSuche]=useState(""); const [filter,setFilter]=useState("alle");
  const fid = fahrschuleId();
  const statusAendern=async(id,st)=>{await supabase.from("schueler").update({status:st}).eq("id",id).eq("fahrschule_id",fid);onRefresh();};
  const loeschen=async(id)=>{await supabase.from("schueler").delete().eq("id",id).eq("fahrschule_id",fid);onRefresh();};
  const z=liste
    .filter(s=>filter==="alle"||(s.status||"aktiv")===filter)
    .filter(s=>s.name.toLowerCase().includes(suche.toLowerCase()));
  return (
    <div>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:16}}>
        <H1>Schüler</H1>
        <TextButton onClick={onNeu}>+ Neu</TextButton>
      </div>
      <input value={suche} onChange={e=>setSuche(e.target.value)} placeholder="Name suchen …" style={{...inputStyle,marginBottom:12}}/>
      <Segmented style={{marginBottom:18}} value={filter} onChange={setFilter} options={[
        {id:"alle",label:`Alle (${liste.length})`},{id:"aktiv",label:`Aktiv (${aktiv.length})`},
        {id:"abgeschlossen",label:"Fertig"},{id:"archiviert",label:`Archiv (${archiv.length})`},
      ]}/>
      <RuleList>
        {z.length===0&&<div style={{padding:"24px 0",color:T.label2,fontSize:14}}>Kein Schüler passt zur Auswahl.</div>}
        {z.map((s,i)=><SRowFull key={s.id} s={s} last={i===z.length-1} onClick={()=>onOpen(s)} onSA={statusAendern} onDel={loeschen}/>)}
      </RuleList>
    </div>
  );
}

function SRowFull({s,last,onClick,onSA,onDel}) {
  const [pct,setPct]=useState(0); const [show,setShow]=useState(false); const [del,setDel]=useState(false);
  useEffect(()=>{supabase.from("ausbildungsstand").select("wert").eq("schueler_id",s.id).then(({data})=>setPct(Math.round(((data||[]).filter(x=>x.wert===2).length/ALL.length)*100)));},[s.id]);
  const status=s.status||"aktiv";
  if(del) return <Row last={last} style={{flexDirection:"column",alignItems:"stretch"}}>
    <div style={{fontSize:14,fontWeight:600,color:T.label,marginBottom:10}}>{s.name} wirklich löschen?</div>
    <div style={{display:"flex",gap:10}}><GhostButton onClick={()=>onDel(s.id)} style={{flex:1,color:T.red,borderColor:T.red}}>Löschen</GhostButton><GhostButton onClick={()=>setDel(false)} style={{flex:1}}>Abbrechen</GhostButton></div>
  </Row>;
  return (
    <Row last={last} style={{flexDirection:"column",alignItems:"stretch",gap:0}}>
      <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
        <Ring pct={pct} size={44} stroke={5}/>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:T.label}}>{s.name}</div></div>
        <Chip tone={status==="aktiv"?"accent":status==="abgeschlossen"?"ink":"neutral"}>{status}</Chip>
        <button onClick={e=>{e.stopPropagation();setShow(!show);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.label2,padding:"0 0 0 4px"}}>⋯</button>
      </div>
      {show&&<div style={{display:"flex",flexWrap:"wrap",gap:16,marginTop:10}}>
        {status!=="aktiv"&&<TextButton onClick={()=>onSA(s.id,"aktiv")} style={{color:T.label2}}>Aktiv</TextButton>}
        {status!=="abgeschlossen"&&<TextButton onClick={()=>onSA(s.id,"abgeschlossen")} style={{color:T.label2}}>Abgeschlossen</TextButton>}
        {status!=="archiviert"&&<TextButton onClick={()=>onSA(s.id,"archiviert")} style={{color:T.label2}}>Archivieren</TextButton>}
        <TextButton onClick={()=>setDel(true)} style={{color:T.red}}>Löschen</TextButton>
      </div>}
    </Row>
  );
}

// ── NEUER SCHÜLER ───────────────────────────────────
function NeuerS({onSaved}) {
  const [f,setF]=useState({name:"",pin:""}); const [err,setErr]=useState(""); const [saving,setSaving]=useState(false); const [ok,setOk]=useState(null);
  const go=async()=>{
    if(!f.name.trim()){setErr("Namen eingeben.");return;} if(f.pin.length<4){setErr("PIN mind. 4 Stellen.");return;}
    setSaving(true);
    const fid = fahrschuleId();
    const{data,error}=await supabase.from("schueler").insert({name:f.name.trim(),pin:f.pin,status:"aktiv",fahrschule_id:fid}).select().single();
    setSaving(false);
    if(error){setErr("Fehler: "+error.message);return;}
    await supabase.from("schueler_info").insert({schueler_id:data.id,fahrschule_id:fid,klassen:[],sehhilfe:"Keine",theorie:false,fahrlehrer:""});
    setOk({name:f.name.trim(),pin:f.pin}); onSaved();
  };
  if(ok) return <div>
    <H1 style={{marginBottom:16}}>Schüler angelegt</H1>
    <RuleList style={{marginBottom:20}}>
      <Row><span style={{flex:1,color:T.label2}}>Name</span><span style={{fontWeight:600}}>{ok.name}</span></Row>
      <Row last><span style={{flex:1,color:T.label2}}>PIN</span><span style={{fontWeight:800,fontSize:20,letterSpacing:3,color:T.accent}}>{ok.pin}</span></Row>
    </RuleList>
  </div>;
  return (
    <div>
      <H1 style={{marginBottom:20}}>Neuer Schüler</H1>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:22}}>
        <Field label="Vor- und Nachname *"><input style={inputStyle} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="z.B. Max Mustermann"/></Field>
        <Field label="PIN (mind. 4 Stellen) *"><input style={{...inputStyle,fontSize:22,letterSpacing:6}} type="password" maxLength={8} value={f.pin} onChange={e=>setF({...f,pin:e.target.value.replace(/\D/g,"")})}/></Field>
      </div>
      {err&&<ErrorBox>{err}</ErrorBox>}
      <PrimaryButton onClick={go} disabled={saving}>{saving?"Speichern…":"Schüler anlegen"}</PrimaryButton>
    </div>
  );
}

// ── DIAGRAMM VIEW ───────────────────────────────────
function DiagrammView({s,mat,setMat,onMat,isLehrer,startStufe}) {
  const [sel,setSel]=useState(startStufe||AUSBILDUNG[0].id);
  const [tab,setTab]=useState("diagramm");
  const [themen,setThemen]=useState({}); const [naechstes,setNaechstes]=useState({});
  const [notizen,setNotizen]=useState([]); const [info,setInfo]=useState(null);
  const [infoF,setInfoF]=useState({klassen:[],sehhilfe:"Keine",theorie:false});
  const [editI,setEditI]=useState(false); const [pinVis,setPinVis]=useState(false);
  const [notizT,setNotizT]=useState(""); const [load,setLoad]=useState(true);
  const fid = fahrschuleId();

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

  const toggle=async k=>{const v=nxt(themen[k]||0);setThemen(p=>({...p,[k]:v}));await supabase.from("ausbildungsstand").upsert({schueler_id:s.id,fahrschule_id:fid,item_key:k,wert:v,aktualisiert_am:new Date().toISOString()},{onConflict:"schueler_id,item_key"});};
  const toggleN=async k=>{const ist=!!naechstes[k];const nm={...naechstes};if(ist)delete nm[k];else nm[k]=true;setNaechstes(nm);await supabase.from("ausbildungsstand").upsert({schueler_id:s.id,fahrschule_id:fid,item_key:k,wert:themen[k]||0,naechstes:!ist,aktualisiert_am:new Date().toISOString()},{onConflict:"schueler_id,item_key"});};
  const saveInfo=async()=>{await supabase.from("schueler_info").upsert({schueler_id:s.id,fahrschule_id:fid,...infoF,aktualisiert_am:new Date().toISOString()},{onConflict:"schueler_id"});setInfo(p=>({...p,...infoF}));setEditI(false);};

  const pct=Math.round((Object.values(themen).filter(v=>v===2).length/ALL.length)*100);
  const stufe=AUSBILDUNG.find(x=>x.id===sel)||AUSBILDUNG[0];

  if(load) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80}}><span style={{fontSize:36}}>⏳</span></div>;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
        <Ring pct={pct} size={64}/>
        <div style={{flex:1}}>
          <H1 style={{fontSize:26}}>{isLehrer?s.name:"Mein Fortschritt"}</H1>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
            {(info?.klassen||[]).map(k=><Chip key={k} tone="neutral">{k}</Chip>)}
            {isLehrer&&<Chip tone={info?.theorie?"ink":"warn"}>{info?.theorie?"Theorie ✓":"Theorie offen"}</Chip>}
          </div>
        </div>
      </div>

      {Object.keys(naechstes).length>0&&(
        <RuleList style={{marginBottom:18}}>
          <div style={{padding:"10px 0",fontSize:11,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:T.accent}}>Als nächstes geplant</div>
          {Object.keys(naechstes).map(k=>{
            const p=k.split("::");const so=AUSBILDUNG.find(x=>x.id===p[0]);const mk=`${p[0]}::${p[1]}`;
            const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0);
            return <Row key={k}>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label}}>{p[2]}</div><div style={{fontSize:12,color:T.label2}}>{so?.label} · {p[1]}</div></div>
              {hm&&onMat&&<TextButton onClick={()=>onMat(mk)}>Material →</TextButton>}
            </Row>;
          })}
        </RuleList>
      )}

      <Segmented style={{marginBottom:18}} value={tab} onChange={setTab} options={[
        {id:"diagramm",label:"Diagramm"},{id:"notizen",label:"Notizen"},...(isLehrer?[{id:"akte",label:"Akte"}]:[]),
      ]}/>

      {tab==="diagramm"&&<>
        <div style={{display:"flex",gap:8,marginBottom:18,overflowX:"auto",paddingBottom:4}}>
          {AUSBILDUNG.map(x=>{
            const ks=x.gruppen.flatMap(g=>g.items.map(i=>`${x.id}::${g.name}::${i}`));
            const sp=Math.round((ks.filter(k=>(themen[k]||0)===2).length/ks.length)*100);
            const act=sel===x.id;
            return <button key={x.id} onClick={()=>setSel(x.id)} style={{background:act?T.accent:"transparent",border:`1px solid ${act?T.accent:T.sep2}`,padding:"9px 13px",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:66,cursor:"pointer",fontFamily:F}}>
              <span style={{fontSize:10,color:act?T.bg:T.label2,fontWeight:700}}>{x.label}</span>
              <span style={{fontSize:13,fontWeight:800,color:act?T.bg:T.label}}>{sp}%</span>
            </button>;
          })}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:20,marginBottom:10}}>
          {stufe.gruppen.map(g=>{
            const gk=g.items.map(i=>`${stufe.id}::${g.name}::${i}`);
            const gb=gk.filter(k=>(themen[k]||0)===2).length;
            const mk=`${stufe.id}::${g.name}`;
            const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0);
            return <div key={g.name}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",paddingBottom:8,borderBottom:`2px solid ${T.sep2}`,marginBottom:2}}>
                <span style={{fontSize:15,fontWeight:800,color:T.label}}>{g.name}</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {onMat&&<TextButton onClick={()=>onMat(mk)} style={{color:hm?T.accent:T.label2}}>{hm?"Material":"+ Material"}</TextButton>}
                  <span style={{fontSize:12,color:T.label2}}>{gb}/{g.items.length}</span>
                </div>
              </div>
              {g.items.map((item,i)=>{
                const k=`${stufe.id}::${g.name}::${item}`;
                const v=themen[k]||0; const st=STATUS[v];
                return <div key={item} onClick={isLehrer?()=>toggle(k):undefined} style={{padding:"12px 0",borderBottom:i<g.items.length-1?`1px solid ${T.sep}`:"none",cursor:isLehrer?"pointer":"default"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                    <span style={{flex:1,fontSize:14,fontWeight:600,color:T.label}}>{item}{naechstes[k]&&<span style={{color:T.accent}}> · als nächstes</span>}</span>
                    {isLehrer&&<button onClick={e=>{e.stopPropagation();toggleN(k);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:naechstes[k]?1:0.25,padding:0}}>📍</button>}
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                  <div style={{height:6,background:"rgba(32,30,29,.12)",marginTop:9}}><div style={{height:6,width:v===2?"100%":v===1?"50%":"0%",background:v===2?T.ink:T.accent}}/></div>
                </div>;
              })}
            </div>;
          })}
        </div>
      </>}

      {tab==="notizen"&&<div>
        {isLehrer&&<div style={{marginBottom:20}}>
          <textarea value={notizT} onChange={e=>setNotizT(e.target.value)} placeholder="Notiz nach der Fahrstunde …" style={{...inputStyle,minHeight:84,resize:"vertical",marginBottom:10}}/>
          <PrimaryButton onClick={async()=>{if(!notizT.trim())return;const{data}=await supabase.from("notizen").insert({schueler_id:s.id,fahrschule_id:fid,text:notizT.trim(),datum:new Date().toISOString().split("T")[0]}).select().single();if(data)setNotizen(p=>[data,...p]);setNotizT("");}}>Notiz speichern</PrimaryButton>
        </div>}
        <RuleList>
          {notizen.length===0&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch keine Notizen.</div>}
          {notizen.map((n,i)=><Row key={n.id} last={i===notizen.length-1} style={{flexDirection:"column",alignItems:"stretch",gap:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <Eyebrow>{new Date(n.datum).toLocaleDateString("de-DE",{day:"2-digit",month:"long",year:"numeric"})}</Eyebrow>
              {isLehrer&&<TextButton onClick={async()=>{await supabase.from("notizen").delete().eq("id",n.id);setNotizen(p=>p.filter(x=>x.id!==n.id));}} style={{color:T.label2}}>Löschen</TextButton>}
            </div>
            <div style={{fontSize:14,color:T.label,lineHeight:1.5}}>{n.text}</div>
          </Row>)}
        </RuleList>
      </div>}

      {tab==="akte"&&isLehrer&&<div>
        <RuleList style={{marginBottom:18}}>
          <Row><span style={{flex:1,fontSize:14,color:T.label2}}>Name</span><span style={{fontWeight:600}}>{s.name}</span></Row>
          <Row><span style={{flex:1,fontSize:14,color:T.label2}}>PIN</span>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16,fontWeight:800,letterSpacing:pinVis?3:2}}>{pinVis?s.pin:"••••"}</span>
              <TextButton onClick={()=>setPinVis(!pinVis)}>{pinVis?"Verbergen":"Anzeigen"}</TextButton>
            </div>
          </Row>
          <Row last>
            <span style={{flex:1,fontSize:14,color:T.label2}}>Schüler-Infos</span>
            <TextButton onClick={()=>editI?saveInfo():setEditI(true)}>{editI?"Speichern":"Bearbeiten"}</TextButton>
          </Row>
        </RuleList>
        {editI?<div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:18}}>
          <Field label="Fahrerlaubnisklassen"><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{KLASSEN.map(k=>{const sel=(infoF.klassen||[]).includes(k);return <button key={k} onClick={()=>{const c=infoF.klassen||[];setInfoF({...infoF,klassen:sel?c.filter(x=>x!==k):[...c,k]});}} style={{padding:"8px 14px",border:`1px solid ${sel?T.accent:T.sep2}`,background:sel?T.accent:"transparent",color:sel?T.bg:T.label2,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:F}}>{k}</button>;})}</div></Field>
          <Field label="Sehhilfe"><Segmented value={infoF.sehhilfe} onChange={v=>setInfoF({...infoF,sehhilfe:v})} options={[{id:"Keine",label:"Keine"},{id:"Brille",label:"Brille"}]}/></Field>
          <Field label="Theorie"><Segmented value={String(infoF.theorie)} onChange={v=>setInfoF({...infoF,theorie:v==="true"})} options={[{id:"false",label:"Ausstehend"},{id:"true",label:"Bestanden"}]}/></Field>
        </div>:<RuleList style={{marginBottom:18}}>
          <Row><span style={{fontSize:14,color:T.label2}}>Klassen</span><div style={{display:"flex",gap:5,flexWrap:"wrap",marginLeft:"auto"}}>{(info?.klassen||[]).length>0?info.klassen.map(k=><Chip key={k} tone="neutral">{k}</Chip>):<span style={{color:T.label2}}>–</span>}</div></Row>
          <Row><span style={{fontSize:14,color:T.label2}}>Sehhilfe</span><span style={{marginLeft:"auto",fontSize:14}}>{info?.sehhilfe||"–"}</span></Row>
          <Row last><span style={{fontSize:14,color:T.label2}}>Theorie</span><span style={{marginLeft:"auto"}}><Chip tone={info?.theorie?"ink":"warn"}>{info?.theorie?"Bestanden":"Ausstehend"}</Chip></span></Row>
        </RuleList>}
        <GhostButton style={{width:"100%",boxSizing:"border-box"}} onClick={()=>{
          const text=`Ausbildungsdiagramm - ${s.name}\nDatum: ${new Date().toLocaleDateString("de-DE")}\n\n`+AUSBILDUNG.map(x=>x.label+"\n"+x.gruppen.map(g=>"  "+g.name+"\n"+g.items.map(i=>{const v=themen[`${x.id}::${g.name}::${i}`]||0;return `    ${STATUS[v].label} ${i}`;}).join("\n")).join("\n")).join("\n\n");
          const b=new Blob([text],{type:"text/plain;charset=utf-8"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`ADK_${s.name.replace(/ /g,"_")}.txt`;a.click();URL.revokeObjectURL(u);
        }}>ADK Export herunterladen</GhostButton>
      </div>}
    </div>
  );
}

// ── MATERIAL LISTE ──────────────────────────────────
function MatListe({mat,onOpen}) {
  return (
    <div>
      <H1 style={{marginBottom:4}}>Material</H1>
      <div style={{fontSize:14,color:T.label2,marginBottom:20}}>Lernmaterial für alle Bereiche</div>
      {AUSBILDUNG.map((s,si)=>(
        <div key={s.id} style={{marginBottom:si===AUSBILDUNG.length-1?0:22}}>
          <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:8,borderBottom:`2px solid ${T.sep2}`}}>
            <span style={{fontSize:20}}>{s.icon}</span>
            <span style={{fontSize:15,fontWeight:800,color:T.label}}>{s.label}</span>
          </div>
          {s.gruppen.map((g,gi)=>{
            const mk=`${s.id}::${g.name}`;
            const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0||mat[mk].pdfUrl);
            return <Row key={g.name} last={gi===s.gruppen.length-1} onClick={()=>onOpen(mk)}>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label}}>{g.name}</div><div style={{fontSize:12,color:T.label2}}>{g.items.length} Punkte</div></div>
              {hm&&<Chip tone="accent">Material</Chip>}
              <span style={{color:T.label3,fontSize:18}}>›</span>
            </Row>;
          })}
        </div>
      ))}
    </div>
  );
}

// ── MAT VIEW ────────────────────────────────────────
// WICHTIG: item_key allein ist NICHT eindeutig ueber Fahrschulen hinweg
// (kommt aus der gemeinsamen AUSBILDUNG-Struktur). Jede Abfrage hier
// filtert deshalb zusaetzlich nach fahrschule_id - sonst wuerde eine
// Fahrschule das Material/die Quiz-Fragen einer anderen sehen oder
// ueberschreiben.
function MatView({ik,mat,setMat,isLehrer}) {
  const [m,setM]=useState({videoUrl:"",fotos:[],quiz:[],pdfUrl:"",pdfName:""});
  const [seg,setSeg]=useState("medien");
  const [vInp,setVInp]=useState(""); const [fInp,setFInp]=useState("");
  const [sav,setSav]=useState(false); const [quizSt,setQuizSt]=useState(null);
  const [editQ,setEditQ]=useState(false); const [editQId,setEditQId]=useState(null);
  const [qF,setQF]=useState({frage:"",typ:"mc",antworten:["","","",""],richtig:0,erklaerung:"",bildUrl:""});
  const [fsIdx,setFsIdx]=useState(null);
  const fid = fahrschuleId();

  useEffect(()=>{
    const l=async()=>{
      const[mr,qr]=await Promise.all([
        supabase.from("lernmaterial").select("*").eq("item_key",ik).eq("fahrschule_id",fid).maybeSingle(),
        supabase.from("quiz_fragen").select("*").eq("item_key",ik).eq("fahrschule_id",fid),
      ]);
      const loaded={videoUrl:mr.data?.video_url||"",fotos:mr.data?.fotos||[],pdfUrl:mr.data?.pdf_url||"",pdfName:mr.data?.pdf_name||"",quiz:(qr.data||[]).map(q=>({id:q.id,frage:q.frage,typ:q.typ,antworten:q.antworten||[],richtig:q.richtig,erklaerung:q.erklaerung||"",bildUrl:q.bild_url||""}))};
      setM(loaded);setVInp(loaded.videoUrl||"");
    };l();
  },[ik,fid]);

  const em=u=>{const x=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);return x?`https://www.youtube.com/embed/${x[1]}`:u;};
  const save=async u=>{
    const mg={...m,...u};setM(mg);if(setMat)setMat(p=>({...p,[ik]:mg}));
    setSav(true);
    await supabase.from("lernmaterial").upsert(
      {item_key:ik,fahrschule_id:fid,video_url:mg.videoUrl||"",fotos:mg.fotos||[],pdf_url:mg.pdfUrl||"",pdf_name:mg.pdfName||"",aktualisiert_am:new Date().toISOString()},
      {onConflict:"fahrschule_id,item_key"}
    );
    if(u.quiz!==undefined){
      await supabase.from("quiz_fragen").delete().eq("item_key",ik).eq("fahrschule_id",fid);
      if(mg.quiz?.length>0)await supabase.from("quiz_fragen").insert(mg.quiz.map(q=>({item_key:ik,fahrschule_id:fid,frage:q.frage,typ:q.typ,antworten:q.antworten||[],richtig:typeof q.richtig==="boolean"?(q.richtig?1:0):q.richtig,erklaerung:q.erklaerung||"",bild_url:q.bildUrl||""})));
    }
    setSav(false);
  };
  const upload=async(file,pre)=>{
    const slug = tenantState.current?.slug || "x";
    const n=`${slug}_${pre}_${Date.now()}.${file.name.split(".").pop()||"bin"}`;
    for(const b of["Lernmaterial","lernmaterial"]){const{error}=await supabase.storage.from(b).upload(n,file,{upsert:true,contentType:file.type});if(!error){const{data:u}=supabase.storage.from(b).getPublicUrl(n);return u.publicUrl;}}
    return null;
  };

  if(quizSt) return <QuizView quiz={m.quiz} st={quizSt} setSt={setQuizSt} onBack={()=>setQuizSt(null)}/>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10,minHeight:18}}>
        {sav&&<Eyebrow>Speichern…</Eyebrow>}
        {!sav&&isLehrer&&<Eyebrow color={T.accent}>Gespeichert</Eyebrow>}
      </div>
      <Segmented style={{marginBottom:20}} value={seg} onChange={setSeg} options={[{id:"medien",label:"Medien"},{id:"quiz",label:`Quiz (${(m.quiz||[]).length})`}]}/>

      {seg==="medien"&&<div style={{display:"flex",flexDirection:"column",gap:24}}>
        <div>
          <SectionLabel>Video</SectionLabel>
          {isLehrer&&<div style={{display:"flex",gap:8,marginBottom:12}}><input style={{...inputStyle,flex:1}} placeholder="YouTube Link..." value={vInp} onChange={e=>setVInp(e.target.value)}/><GhostButton onClick={async()=>await save({videoUrl:em(vInp)})}>OK</GhostButton></div>}
          {m.videoUrl?<div style={{position:"relative",paddingBottom:"56.25%",height:0}}><iframe src={m.videoUrl} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}} allowFullScreen title="Video"/></div>:<div style={{padding:24,color:T.label2,background:T.card,fontSize:14,textAlign:"center"}}>{isLehrer?"Noch kein Video hinterlegt.":"Noch kein Video."}</div>}
        </div>

        <div>
          <SectionLabel>Fotos</SectionLabel>
          {isLehrer&&<div style={{marginBottom:12}}>
            <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:T.accent,color:T.bg,padding:"11px",cursor:"pointer",fontSize:14,fontWeight:700,marginBottom:8}}>Foto hochladen<input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setSav(true);const u=await upload(f,"foto");if(u)await save({fotos:[...(m.fotos||[]),u]});setSav(false);}}/></label>
            <div style={{display:"flex",gap:8}}><input style={{...inputStyle,flex:1}} placeholder="https://...jpg" value={fInp} onChange={e=>setFInp(e.target.value)}/><GhostButton onClick={async()=>{if(!fInp.trim())return;await save({fotos:[...(m.fotos||[]),fInp.trim()]});setFInp("");}}>+</GhostButton></div>
          </div>}
          {(m.fotos||[]).length===0?<div style={{padding:20,color:T.label2,background:T.card,fontSize:14,textAlign:"center"}}>{isLehrer?"Noch keine Fotos.":"Keine Fotos."}</div>:
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {(m.fotos||[]).map((u,i)=>(
                <div key={i} style={{position:"relative",aspectRatio:"1/1",border:`1px solid ${T.sep}`}}>
                  <img src={u} alt="" onClick={()=>setFsIdx(i)} style={{width:"100%",height:"100%",objectFit:"cover",cursor:"pointer"}} onError={e=>{e.target.style.display="none";}}/>
                  {isLehrer&&<button onClick={async()=>save({fotos:(m.fotos||[]).filter((_,j)=>j!==i)})} style={{position:"absolute",top:4,right:4,background:"rgba(32,30,29,.7)",border:"none",color:"#fff",padding:"3px 7px",cursor:"pointer",fontSize:12}}>🗑</button>}
                </div>
              ))}
            </div>}
          {fsIdx!==null&&(m.fotos||[]).length>0&&<FullScreen fotos={m.fotos||[]} start={fsIdx} onClose={()=>setFsIdx(null)}/>}
        </div>

        <div>
          <SectionLabel>Dokument</SectionLabel>
          {isLehrer&&<label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"transparent",border:`1px solid ${T.sep2}`,padding:"11px",cursor:"pointer",fontSize:14,color:T.label2,marginBottom:12}}>PDF hochladen<input type="file" accept=".pdf,.doc,.docx" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setSav(true);const u=await upload(f,"doc");if(u)await save({pdfUrl:u,pdfName:f.name});setSav(false);}}/></label>}
          {m.pdfUrl?<a href={m.pdfUrl} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"transparent",border:`1px solid ${T.sep2}`,textDecoration:"none",color:T.label,fontSize:14,fontWeight:600}}><span>{m.pdfName||"Dokument"}</span><span style={{fontWeight:800}}>↓</span></a>:<div style={{padding:20,color:T.label2,background:T.card,fontSize:14,textAlign:"center"}}>{isLehrer?"Noch kein Dokument.":"Kein Dokument."}</div>}
          {isLehrer&&m.pdfUrl&&<div style={{marginTop:8}}><TextButton onClick={()=>save({pdfUrl:"",pdfName:""})} style={{color:T.red}}>Entfernen</TextButton></div>}
        </div>
      </div>}

      {seg==="quiz"&&<div>
        {isLehrer&&<div style={{display:"flex",gap:8,marginBottom:16}}>
          {(m.quiz||[]).length>0&&<GhostButton onClick={()=>setQuizSt({index:0,answers:{},submitted:false,score:0})}>Quiz starten</GhostButton>}
          <GhostButton onClick={()=>{setEditQ(!editQ);setEditQId(null);setQF({frage:"",typ:"mc",antworten:["","","",""],richtig:0,erklaerung:"",bildUrl:""});}}>{editQ?"Abbrechen":"+ Frage"}</GhostButton>
        </div>}
        {!isLehrer&&(m.quiz||[]).length>0&&<div style={{marginBottom:16}}><PrimaryButton onClick={()=>setQuizSt({index:0,answers:{},submitted:false,score:0})}>Quiz starten</PrimaryButton></div>}

        {editQ&&isLehrer&&<div style={{border:`1px solid ${T.sep2}`,padding:16,marginBottom:18}}>
          <Segmented style={{marginBottom:10}} value={qF.typ} onChange={v=>setQF({...qF,typ:v})} options={[{id:"mc",label:"Multiple Choice"},{id:"wf",label:"Wahr/Falsch"}]}/>
          <input style={{...inputStyle,marginBottom:8}} value={qF.frage} onChange={e=>setQF({...qF,frage:e.target.value})} placeholder="Frage *"/>
          <label style={{display:"flex",alignItems:"center",gap:8,border:`1px solid ${T.sep2}`,padding:"10px 14px",cursor:"pointer",fontSize:13,color:T.label2,marginBottom:8}}>Bild zur Frage<input type="file" accept="image/*" style={{display:"none"}} onChange={async e=>{const f=e.target.files[0];if(!f)return;setSav(true);const u=await upload(f,"quiz");if(u)setQF(p=>({...p,bildUrl:u}));setSav(false);}}/></label>
          {qF.bildUrl&&<img src={qF.bildUrl} alt="" style={{height:60,objectFit:"cover",marginBottom:8}}/>}
          {qF.typ==="mc"&&<>{qF.antworten.map((a,i)=><input key={i} style={{...inputStyle,marginBottom:6}} placeholder={`Antwort ${i+1}`} value={a} onChange={e=>{const n=[...qF.antworten];n[i]=e.target.value;setQF({...qF,antworten:n});}}/>)}<select style={{...inputStyle,marginBottom:8}} value={qF.richtig} onChange={e=>setQF({...qF,richtig:parseInt(e.target.value)})}>{qF.antworten.map((a,i)=><option key={i} value={i}>{i+1}. {a||`Antwort ${i+1}`}</option>)}</select></>}
          {qF.typ==="wf"&&<Segmented style={{marginBottom:8}} value={String(qF.richtig)} onChange={v=>setQF({...qF,richtig:v==="true"})} options={[{id:"true",label:"Wahr"},{id:"false",label:"Falsch"}]}/>}
          <input style={{...inputStyle,marginBottom:10}} value={qF.erklaerung} onChange={e=>setQF({...qF,erklaerung:e.target.value})} placeholder="Erklärung (optional)"/>
          <PrimaryButton onClick={async()=>{
            if(!qF.frage.trim())return;
            if(editQId){await save({quiz:(m.quiz||[]).map(q=>q.id===editQId?{...q,...qF,antworten:qF.antworten.filter(a=>a.trim())}:q)});}
            else{const q={id:"q"+Date.now(),...qF,antworten:qF.antworten.filter(a=>a.trim())};await save({quiz:[...(m.quiz||[]),q]});}
            setQF({frage:"",typ:"mc",antworten:["","","",""],richtig:0,erklaerung:"",bildUrl:""});setEditQ(false);setEditQId(null);
          }}>{editQId?"Änderungen speichern":"Frage speichern"}</PrimaryButton>
        </div>}

        <RuleList>
          {(m.quiz||[]).length===0&&!editQ&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>{isLehrer?'Noch keine Fragen – "+ Frage" antippen.':"Noch keine Fragen."}</div>}
          {(m.quiz||[]).map((q,i)=><Row key={q.id} last={i===(m.quiz||[]).length-1}>
            <Chip tone={q.typ==="mc"?"neutral":"warn"}>{q.typ==="mc"?"MC":"W/F"}</Chip>
            <span style={{fontSize:13,flex:1,color:T.label}}>{q.frage}</span>
            {isLehrer&&<>
              <TextButton onClick={()=>{setEditQId(q.id);setQF({frage:q.frage,typ:q.typ,antworten:q.antworten?.length>=4?q.antworten:[...q.antworten||[],...Array(4).fill("")].slice(0,4),richtig:q.richtig,erklaerung:q.erklaerung||"",bildUrl:q.bildUrl||""});setEditQ(true);}}>Bearbeiten</TextButton>
              <TextButton onClick={async()=>save({quiz:(m.quiz||[]).filter(x=>x.id!==q.id)})} style={{color:T.red}}>Löschen</TextButton>
            </>}
          </Row>)}
        </RuleList>
      </div>}
    </div>
  );
}

// ── FULLSCREEN ──────────────────────────────────────
function FullScreen({fotos,start,onClose}) {
  const [i,setI]=useState(start); const [tx,setTx]=useState(null);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.97)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onTouchStart={e=>setTx(e.touches[0].clientX)} onTouchEnd={e=>{if(tx===null)return;const d=tx-e.changedTouches[0].clientX;if(d>50)setI(x=>(x+1)%fotos.length);else if(d<-50)setI(x=>(x-1+fotos.length)%fotos.length);setTx(null);}}>
    <div style={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <img src={fotos[i]} alt="" style={{maxWidth:"100%",maxHeight:"90vh",objectFit:"contain"}}/>
      <button onClick={onClose} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,0.14)",border:"none",width:44,height:44,color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      {fotos.length>1&&<>
        <div style={{position:"absolute",top:20,left:"50%",transform:"translateX(-50%)",background:"rgba(255,255,255,0.14)",padding:"4px 14px",fontSize:13,color:"#fff",fontWeight:700}}>{i+1} / {fotos.length}</div>
        <button onClick={()=>setI(x=>(x-1+fotos.length)%fotos.length)} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.14)",border:"none",width:48,height:48,color:"#fff",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <button onClick={()=>setI(x=>(x+1)%fotos.length)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.14)",border:"none",width:48,height:48,color:"#fff",fontSize:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        <div style={{position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>{fotos.map((_,j)=><div key={j} onClick={()=>setI(j)} style={{width:j===i?20:7,height:7,background:j===i?"#fff":"rgba(255,255,255,0.3)",cursor:"pointer"}}/>)}</div>
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
    return <div>
      <div style={{marginBottom:24}}><H1 style={{fontSize:28}}>{pct>=70?"Super!":"Weiter üben!"}</H1><div style={{fontWeight:800,fontSize:42,color:T.accent,marginTop:4}}>{pct}%</div><div style={{color:T.label2,marginTop:4}}>{score} von {quiz.length} richtig</div></div>
      <RuleList style={{marginBottom:18}}>{quiz.map((q,j)=>{const ok=answers[q.id]===q.richtig;return <Row key={q.id} last={j===quiz.length-1} style={{flexDirection:"column",alignItems:"stretch",gap:0}}>
        {q.bildUrl&&<img src={q.bildUrl} alt="" style={{width:"100%",maxHeight:130,objectFit:"contain",marginBottom:8,background:T.card}}/>}
        <div style={{fontWeight:700,color:T.label,marginBottom:4}}>#{j+1} {q.frage}</div>
        <div style={{fontSize:13,color:T.label}}>
          <Chip tone={ok?"ink":"warn"}>{ok?"richtig":"falsch"}</Chip> {q.typ==="mc"?(q.antworten[answers[q.id]]||"–"):(answers[q.id]===true?"Wahr":answers[q.id]===false?"Falsch":"–")}
          {!ok&&<span style={{color:T.label2}}> · Richtig: {q.typ==="mc"?q.antworten[q.richtig]:(q.richtig?"Wahr":"Falsch")}</span>}
        </div>
        {q.erklaerung&&<div style={{marginTop:6,fontSize:12,color:T.label2,fontStyle:"italic"}}>{q.erklaerung}</div>}
      </Row>;})}</RuleList>
      <PrimaryButton onClick={onBack}>← Zurück</PrimaryButton>
    </div>;
  }
  const q=quiz[index];
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}><Eyebrow>Frage {index+1} von {quiz.length}</Eyebrow><TextButton onClick={onBack} style={{color:T.label2}}>Abbrechen</TextButton></div>
    <div style={{height:4,background:"rgba(32,30,29,.14)",marginBottom:20}}><div style={{background:T.accent,height:4,width:`${((index+1)/quiz.length)*100}%`}}/></div>
    {q.bildUrl&&<img src={q.bildUrl} alt="" style={{width:"100%",maxHeight:200,objectFit:"contain",marginBottom:14,background:T.card}}/>}
    <div style={{fontSize:20,fontWeight:800,letterSpacing:"-.015em",color:T.label,marginBottom:20,lineHeight:1.3}}>{q.frage}</div>
    {q.typ==="mc"&&<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>{q.antworten.map((a,j)=><button key={j} onClick={()=>setSt({...st,answers:{...answers,[q.id]:j}})} style={{background:answers[q.id]===j?T.accent:"transparent",color:answers[q.id]===j?T.bg:T.label,border:`1px solid ${answers[q.id]===j?T.accent:T.sep2}`,padding:"13px",cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:600,fontFamily:F}}>{a}</button>)}</div>}
    {q.typ==="wf"&&<div style={{marginBottom:20}}><Segmented value={answers[q.id]===undefined?"":String(answers[q.id])} onChange={v=>setSt({...st,answers:{...answers,[q.id]:v==="true"}})} options={[{id:"true",label:"Wahr"},{id:"false",label:"Falsch"}]}/></div>}
    <div style={{display:"flex",gap:12}}>
      {index>0&&<GhostButton style={{flex:1}} onClick={()=>setSt({...st,index:index-1})}>← Zurück</GhostButton>}
      {index<quiz.length-1?<PrimaryButton style={{flex:1}} onClick={()=>setSt({...st,index:index+1})}>Weiter →</PrimaryButton>:<PrimaryButton style={{flex:1}} onClick={submit}>Abgeben</PrimaryButton>}
    </div>
  </div>;
}

// ── PROFIL / FAHRSCHULE & TEAM ──────────────────────
// Zeigt Infos der aktuell geladenen Fahrschule statt fest einprogrammierter
// Werte. Fehlende Felder (noch nicht von der Fahrschule gepflegt) werden
// dezent ausgeblendet statt Platzhalter-Muell anzuzeigen. Wird sowohl von
// Fahrlehrern ("Fahrschule & Team" im Dashboard) als auch von Schülern
// (eigener Tab) genutzt.
function Profil() {
  const f = tenantState.current || {};
  const [team,setTeam]=useState([]);
  useEffect(()=>{
    supabase.from("fahrlehrer").select("*").eq("fahrschule_id",fahrschuleId()).eq("im_team_sichtbar",true).eq("aktiv",true).order("erstellt_am")
      .then(({data})=>setTeam(data||[]));
  },[]);
  const socials = [
    f.social_instagram && {l:"Instagram",h:f.social_instagram},
    f.social_tiktok && {l:"TikTok",h:f.social_tiktok},
    f.social_youtube && {l:"YouTube",h:f.social_youtube},
  ].filter(Boolean);

  return (
    <div>
      <H1 style={{marginBottom:10}}>{f.name || "Fahrschule"}</H1>
      {f.ueber_uns_text&&<p style={{fontSize:14,lineHeight:1.55,color:T.label2,margin:"0 0 18px"}}>{f.ueber_uns_text}</p>}

      {(f.telefon||f.adresse)&&<div style={{display:"flex",gap:10,marginBottom:6}}>
        {f.telefon&&<a href={`tel:${f.telefon}`} style={{flex:1,textDecoration:"none"}}><PrimaryButton style={{justifyContent:"flex-start"}}>Anrufen</PrimaryButton></a>}
        {f.adresse&&<a href={`https://maps.google.com/?q=${encodeURIComponent(f.adresse)}`} target="_blank" rel="noopener noreferrer" style={{flex:1,textDecoration:"none"}}><GhostButton style={{width:"100%",boxSizing:"border-box",justifyContent:"flex-start"}}>Route</GhostButton></a>}
      </div>}

      {f.adresse&&<div style={{fontSize:13,color:T.label2,margin:"10px 0"}}>{f.adresse}</div>}

      {f.oeffnungszeiten&&<>
        <SectionLabel>Öffnungszeiten</SectionLabel>
        <RuleList style={{marginBottom:8}}><Row last><div style={{fontSize:14,color:T.label,lineHeight:1.65,whiteSpace:"pre-line"}}>{f.oeffnungszeiten}</div></Row></RuleList>
      </>}

      {team.length>0&&<>
        <SectionLabel>Team</SectionLabel>
        <RuleList style={{marginBottom:8}}>
          {team.map((p,i)=>(
            <Row key={p.id} last={i===team.length-1}>
              <div style={{width:44,height:44,flexShrink:0,background:T.card,border:`1px solid ${T.sep}`,overflow:"hidden"}}>
                {p.foto_url&&<img src={p.foto_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15,color:T.label}}>{p.name}</div>
                <div style={{fontSize:12,color:T.label2,marginTop:2}}>{p.bio_text||(p.rolle==="admin"?"Inhaber":"Fahrlehrer")}</div>
              </div>
            </Row>
          ))}
        </RuleList>
      </>}

      {(socials.length>0||f.google_bewertung_url)&&<>
        <SectionLabel>Kontakt & Social Media</SectionLabel>
        <RuleList>
          {socials.map((s,i)=>(<Row key={i}><span style={{flex:1,fontSize:14,fontWeight:600,color:T.label}}>{s.l}</span><span style={{fontSize:13,color:T.label2}}>{s.h}</span></Row>))}
          {f.google_bewertung_url&&<Row last><a href={f.google_bewertung_url} target="_blank" rel="noopener noreferrer" style={{color:T.accent,fontSize:14,fontWeight:700,textDecoration:"none"}}>Google-Bewertungen ansehen →</a></Row>}
        </RuleList>
      </>}
    </div>
  );
}

// ── SCHÜLER APP ─────────────────────────────────────
function SchuelerApp({schueler,onLogout}) {
  const [themen,setThemen]=useState({}); const [naechstes,setNaechstes]=useState({});
  const [notizen,setNotizen]=useState([]); const [info,setInfo]=useState(null);
  const [mat,setMat]=useState({}); const [tab,setTab]=useState("home");
  const [matScreen,setMatScreen]=useState(null); // {k,back} wenn Lernmaterial einer Gruppe offen ist
  const [selStufe,setSelStufe]=useState(null); const [load,setLoad]=useState(true);
  const [ankuendigung,setAnkuendigung]=useState(null);
  const fid = fahrschuleId();
  setRoleAccent("schueler");

  useEffect(()=>{
    const l=async()=>{
      setLoad(true);
      const[t,n,i,m,q,a]=await Promise.all([
        supabase.from("ausbildungsstand").select("*").eq("schueler_id",schueler.id),
        supabase.from("notizen").select("*").eq("schueler_id",schueler.id).order("erstellt_am",{ascending:false}),
        supabase.from("schueler_info").select("*").eq("schueler_id",schueler.id).single(),
        supabase.from("lernmaterial").select("*").eq("fahrschule_id",fid),
        supabase.from("quiz_fragen").select("*").eq("fahrschule_id",fid),
        supabase.from("ankuendigungen").select("*").eq("fahrschule_id",fid).eq("aktiv",true).order("erstellt_am",{ascending:false}),
      ]);
      const tm={},nm={};
      (t.data||[]).forEach(x=>{tm[x.item_key]=Number(x.wert);if(x.naechstes)nm[x.item_key]=true;});
      setThemen(tm);setNaechstes(nm);setNotizen(n.data||[]);setInfo(i.data);
      const mm={};
      (m.data||[]).forEach(x=>{mm[x.item_key]={videoUrl:x.video_url||"",fotos:x.fotos||[],quiz:[],pdfUrl:x.pdf_url||"",pdfName:x.pdf_name||""};});
      (q.data||[]).forEach(x=>{if(!mm[x.item_key])mm[x.item_key]={videoUrl:"",fotos:[],quiz:[],pdfUrl:"",pdfName:""};mm[x.item_key].quiz.push({id:x.id,frage:x.frage,typ:x.typ,antworten:x.antworten||[],richtig:x.richtig,erklaerung:x.erklaerung||"",bildUrl:x.bild_url||""});});
      setMat(mm);
      const now=new Date();
      const aktuelle=(a.data||[]).find(x=>new Date(x.gueltig_von)<=now && (!x.gueltig_bis || new Date(x.gueltig_bis)>=now));
      setAnkuendigung(aktuelle||null);
      setLoad(false);
    };l();
  },[schueler.id,fid]);

  const pct=Math.round((Object.values(themen).filter(v=>v===2).length/ALL.length)*100);

  let body;
  if(load){ body=<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:100}}><span style={{fontSize:40}}>⏳</span></div>; }
  else if(matScreen){ body=<MatView ik={matScreen.k} mat={mat} setMat={setMat} isLehrer={false}/>; }
  else if(tab==="diagramm"){ body=<DiagrammView s={schueler} mat={mat} setMat={setMat} onMat={k=>setMatScreen({k})} isLehrer={false} startStufe={selStufe}/>; }
  else if(tab==="lernen"){
    const items=AUSBILDUNG.flatMap(s=>s.gruppen.map(g=>{const mk=`${s.id}::${g.name}`;const m2=mat[mk];if(!m2||(!(m2.videoUrl)&&!(m2.fotos?.length)&&!(m2.quiz?.length)&&!(m2.pdfUrl)))return null;return{icon:s.icon,name:g.name,mk,m2};})).filter(Boolean);
    body=<div>
      <H1 style={{marginBottom:4}}>Lernen</H1>
      <div style={{fontSize:14,color:T.label2,marginBottom:20}}>Verfügbares Lernmaterial</div>
      <RuleList>
        {items.length===0&&<div style={{padding:"20px 0",color:T.label2,fontSize:14}}>Noch kein Lernmaterial verfügbar.</div>}
        {items.map((it,i)=>(
          <Row key={it.mk} last={i===items.length-1} onClick={()=>setMatScreen({k:it.mk})}>
            <span style={{fontSize:20}}>{it.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:T.label}}>{it.name}</div><div style={{fontSize:12,color:T.label2,marginTop:2}}>{[it.m2.videoUrl&&"Video",it.m2.fotos?.length&&`${it.m2.fotos.length} Fotos`,it.m2.quiz?.length&&`${it.m2.quiz.length} Fragen`,it.m2.pdfUrl&&"PDF"].filter(Boolean).join(" · ")}</div></div>
            <span style={{color:T.label3,fontSize:18}}>›</span>
          </Row>
        ))}
      </RuleList>
    </div>;
  }
  else if(tab==="schule"){ body=<Profil/>; }
  else {
    body=(
      <div>
        <Eyebrow>{new Date().toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long"})}</Eyebrow>
        <H1 style={{margin:"6px 0 16px"}}>Moin, {schueler.name.split(" ")[0]}.</H1>

        {ankuendigung&&<div style={{margin:"0 0 18px",padding:"12px 14px",background:ankuendigung.typ==="dringend"?T.warnBg:T.accent,color:ankuendigung.typ==="dringend"?T.warnText:T.bg,display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:10,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",opacity:.8,paddingTop:2}}>{ankuendigung.typ==="aktion"?"Aktion":ankuendigung.typ==="dringend"?"Wichtig":"Info"}</span>
          <span style={{fontSize:13,fontWeight:600,lineHeight:1.35}}>{ankuendigung.titel}{ankuendigung.text?` – ${ankuendigung.text}`:""}</span>
        </div>}

        <div style={{padding:18,background:T.card,border:`1px solid ${T.sep}`,display:"flex",alignItems:"center",gap:18,marginBottom:20}}>
          <Ring pct={pct} size={100}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:17,color:T.label}}>Ausbildung läuft</div>
            <div style={{fontSize:13,color:T.label2,marginTop:4,lineHeight:1.4}}>{Object.values(themen).filter(v=>v===2).length} von {ALL.length} Themen fertig.</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>{(info?.klassen||[]).map(k=><Chip key={k} tone="neutral">{k}</Chip>)}</div>
          </div>
        </div>

        <SectionLabel right="wischen →">Lernbereiche</SectionLabel>
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:6,marginBottom:8}}>
          {AUSBILDUNG.map(s=>{const ks=s.gruppen.flatMap(g=>g.items.map(i=>`${s.id}::${g.name}::${i}`));const sp=Math.round((ks.filter(k=>(themen[k]||0)===2).length/ks.length)*100);return <button key={s.id} onClick={()=>{setSelStufe(s.id);setTab("diagramm");}} style={{flex:"none",width:130,textAlign:"left",padding:14,background:T.card,border:`1px solid ${T.sep}`,cursor:"pointer",fontFamily:F,color:T.label}}>
            <div style={{fontWeight:800,fontSize:22,letterSpacing:"-.03em"}}>{sp}%</div>
            <div style={{height:4,background:"rgba(32,30,29,.14)",margin:"8px 0 9px"}}><div style={{height:4,background:T.accent,width:`${sp}%`}}/></div>
            <div style={{fontWeight:600,fontSize:12,lineHeight:1.2}}>{s.label}</div>
          </button>;})}
        </div>

        {Object.keys(naechstes).length>0&&<>
          <SectionLabel>Als nächstes geplant</SectionLabel>
          <RuleList style={{marginBottom:8}}>
            {Object.keys(naechstes).map((k,i,arr)=>{const p=k.split("::");const so=AUSBILDUNG.find(x=>x.id===p[0]);const mk=`${p[0]}::${p[1]}`;const hm=mat&&mat[mk]&&(mat[mk].videoUrl||mat[mk].fotos?.length>0||mat[mk].quiz?.length>0);return <Row key={k} last={i===arr.length-1} onClick={hm?()=>{setMatScreen({k:mk});}:undefined}>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.label}}>{p[2]}</div><div style={{fontSize:11,color:T.label2,marginTop:1}}>{so?.label} · {p[1]}</div></div>
              {hm&&<span style={{color:T.label3,fontSize:18}}>›</span>}
            </Row>;})}
          </RuleList>
        </>}

        {notizen.length>0&&<>
          <SectionLabel>Letzte Notiz</SectionLabel>
          <div style={{padding:"14px 0",borderTop:`2px solid ${T.sep2}`,marginBottom:8}}>
            <div style={{fontSize:14,lineHeight:1.5,color:T.label}}>{notizen[0].text}</div>
            <div style={{fontSize:11,color:T.label2,marginTop:8}}>{new Date(notizen[0].datum).toLocaleDateString("de-DE",{day:"2-digit",month:"long"})}</div>
          </div>
        </>}
      </div>
    );
  }

  return (
    <div style={{fontFamily:F,background:T.bg,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <TopBar onBack={matScreen?()=>setMatScreen(null):null} onLogout={onLogout} fahrschuleName={tenantState.current?.name}/>
      <div style={{flex:1}}><Page style={{paddingBottom:100}}>{body}</Page></div>
      {!matScreen&&<TabBar value={tab} onChange={setTab} tabs={[
        {id:"home",label:"Home",icon:ICONS.home},{id:"diagramm",label:"Diagramm",icon:ICONS.diagramm},
        {id:"lernen",label:"Lernen",icon:ICONS.lernen},{id:"schule",label:"Fahrschule",icon:ICONS.schule},
      ]}/>}
    </div>
  );
}
