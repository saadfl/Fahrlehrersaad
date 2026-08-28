import { tenantState } from "./tenant";

// ── DESIGN TOKENS ──────────────────────────────────
// "Modernist"-Designsprache: flach, 0px Ecken, klare Regeln statt Schatten.
// T.accent ist die aktuell aktive Akzentfarbe. Sie wird pro Rolle gesetzt
// (setRoleAccent) statt fest die Markenfarbe zu sein: Schüler sehen die
// Markenfarbe der Fahrschule, Fahrlehrer/Admin/Betreiber je eine eigene
// Tonlage zur Orientierung beim Rollenwechsel. T.brand hält die reine
// Markenfarbe der Fahrschule (für Stellen, die IMMER die Marke zeigen
// sollen, z.B. Betreiber-Übersicht der Fahrschulen).
export const T = {
  bg:"#F3F2F2", card:"#EAE9E9", white:"#FFFFFF",
  ink:"#201E1D", label:"#201E1D",
  label2:"rgba(32,30,29,.62)", label3:"rgba(32,30,29,.4)",
  sep:"rgba(32,30,29,.16)", sep2:"rgba(32,30,29,.4)",
  red:"#EC3013", redDark:"#AE1800",
  green:"#0E6B5E", blue:"#3B4A8F", gray:"rgba(32,30,29,.5)",
  warnBg:"#FFE0D9", warnText:"#7C1405",
  neutralBg:"rgba(32,30,29,.08)", neutralText:"rgba(32,30,29,.6)",
  brand:"#EC3013", accent:"#EC3013",
};
export const F = "'Archivo',system-ui,sans-serif";

// Feste Akzenttöne pro Rolle (Orientierungshilfe beim Rollenwechsel).
// Schüler hat keinen eigenen Eintrag: dort gilt immer die Markenfarbe.
const ROLE_ACCENTS = { lehrer:"#0E6B5E", admin:"#3B4A8F", owner:"#201E1D" };

// Setzt Markenfarbe + Standard-Akzent der aktuell geladenen Fahrschule.
// Wird einmal beim Laden der Fahrschule in TenantApp.js aufgerufen,
// bevor die eigentliche App (Login/LehrerApp/SchuelerApp) gerendert wird.
export function applyBranding(fahrschule) {
  T.brand = fahrschule?.farbe_primary || "#EC3013";
  T.accent = T.brand;
}

// Setzt die Akzentfarbe für die aktuell aktive Rolle/Ansicht. Da T ein
// normales Objekt ist (kein React State), reicht ein Aufruf am Anfang
// der jeweiligen App-Hülle (LehrerApp, SchuelerApp, Betreiber) - die
// Änderung wirkt sofort auf alle Stellen im Code, die T.accent verwenden.
export function setRoleAccent(role) {
  T.accent = ROLE_ACCENTS[role] || tenantState.current?.farbe_primary || T.brand;
}

// Setzt die Akzentfarbe zurück auf die reine Markenfarbe der Fahrschule.
// Wird auf dem Login-Screen aufgerufen, damit nach dem Abmelden aus einer
// Rolle mit eigenem Akzent (Lehrer/Admin) wieder die Markenfarbe gilt.
export function resetAccent() {
  T.accent = T.brand;
}

// ── AUSBILDUNG ──────────────────────────────────────
// Diese Struktur ist aktuell für ALLE Fahrschulen identisch (geteilter
// Ausbildungsrahmen). Die daraus abgeleiteten item_key-Strings
// (z.B. "schaltkompetenz::Schaltübungen::Hoch schalten") sind deshalb
// über alle Fahrschulen hinweg gleich — wichtig zu wissen, wenn Material
// oder Quiz-Fragen dazu gespeichert werden: dort MUSS zusätzlich nach
// fahrschule_id gefiltert werden, siehe TenantScreens.js.
export const AUSBILDUNG = [
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

export const ALL = AUSBILDUNG.flatMap(s=>s.gruppen.flatMap(g=>g.items.map(i=>`${s.id}::${g.name}::${i}`)));
export const nxt = v => ((v||0)+1)%3;
export const KLASSEN = ["B","B197","BE","B96"];
