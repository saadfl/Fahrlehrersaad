// Supabase Edge Function: konto-verwalten
// Legt Konten an, setzt PINs, löscht Konten und migriert die bestehenden Nutzer.
// Der geheime Service-Schlüssel bleibt hier auf dem Server und kommt nie in die App.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const DOMAIN = { schueler: "schueler.fahrlehrer-saad.app", lehrer: "lehrer.fahrlehrer-saad.app" } as const;

const antwort = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const fehler = (msg: string, status = 400) => antwort({ fehler: msg }, status);

// muss exakt der Funktion slug() in der App entsprechen
function slug(n: string) {
  return n.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}
const zufallsPin = () => String(Math.floor(100000 + Math.random() * 900000));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Wer ruft auf?
    let caller: { id: string; rolle: string } | null = null;
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (jwt) {
      const { data } = await admin.auth.getUser(jwt);
      if (data?.user) {
        const { data: p } = await admin.from("fahrlehrer_profil").select("id,rolle").eq("auth_id", data.user.id).maybeSingle();
        caller = p;
      }
    }
    const istStaff = !!caller;
    const istAdmin = caller?.rolle === "admin";

    const freierLoginName = async (tabelle: "schueler" | "fahrlehrer_profil", name: string) => {
      const basis = slug(name);
      if (!basis) throw new Error("Name enthält keine gültigen Zeichen.");
      for (let i = 1; i < 500; i++) {
        const kandidat = i === 1 ? basis : `${basis}${i}`;
        const { data } = await admin.from(tabelle).select("id").eq("login_name", kandidat).maybeSingle();
        if (!data) return kandidat;
      }
      throw new Error("Kein freier Anmeldename gefunden.");
    };
    const authAnlegen = async (typ: "schueler" | "lehrer", login: string, pin: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email: `${login}@${DOMAIN[typ]}`, password: pin, email_confirm: true,
      });
      if (error) throw new Error("Konto konnte nicht angelegt werden: " + error.message);
      return data.user.id;
    };
    const pinOk = (p: unknown) => typeof p === "string" && /^\d{6,8}$/.test(p);

    switch (body.aktion) {
      case "schueler_anlegen": {
        if (!istStaff) return fehler("Keine Berechtigung.", 403);
        if (!body.name?.trim()) return fehler("Namen eingeben.");
        if (!pinOk(body.pin)) return fehler("PIN muss 6 bis 8 Ziffern haben.");
        const login = await freierLoginName("schueler", body.name);
        const authId = await authAnlegen("schueler", login, body.pin);
        const { data: s, error } = await admin.from("schueler")
          .insert({ name: body.name.trim(), status: "aktiv", auth_id: authId, login_name: login }).select().single();
        if (error) { await admin.auth.admin.deleteUser(authId); return fehler("Fehler: " + error.message, 500); }
        await admin.from("schueler_info").insert({
          schueler_id: s.id, klassen: body.klassen || [], sehhilfe: body.sehhilfe || "Keine",
          theorie: !!body.theorie, fahrlehrer: "",
        });
        if (body.alsMeine && caller) {
          await admin.from("meine_schueler").insert({ fahrlehrer_id: caller.id, schueler_id: String(s.id) });
        }
        return antwort({ ok: true, id: s.id, login_name: login });
      }

      case "lehrer_anlegen": {
        if (!istAdmin) return fehler("Nur der Admin darf Fahrlehrer anlegen.", 403);
        if (!body.name?.trim()) return fehler("Namen eingeben.");
        if (!pinOk(body.pin)) return fehler("PIN muss 6 bis 8 Ziffern haben.");
        const login = await freierLoginName("fahrlehrer_profil", body.name);
        const authId = await authAnlegen("lehrer", login, body.pin);
        const { data: p, error } = await admin.from("fahrlehrer_profil").insert({
          rolle: "lehrer", name: body.name.trim(), ueber_mich: body.ueber_mich || "", tags: body.tags || [],
          bild_url: body.bild_url || "", auth_id: authId, login_name: login,
        }).select().single();
        if (error) { await admin.auth.admin.deleteUser(authId); return fehler("Fehler: " + error.message, 500); }
        return antwort({ ok: true, id: p.id, login_name: login });
      }

      case "pin_setzen": {
        const tabelle = body.typ === "lehrer" ? "fahrlehrer_profil" : "schueler";
        if (body.typ === "lehrer" ? !istAdmin : !istStaff) return fehler("Keine Berechtigung.", 403);
        const pin = body.pin ? String(body.pin) : zufallsPin();
        if (!pinOk(pin)) return fehler("PIN muss 6 bis 8 Ziffern haben.");
        const { data: z } = await admin.from(tabelle).select("auth_id").eq("id", body.id).maybeSingle();
        if (!z?.auth_id) return fehler("Konto nicht gefunden.", 404);
        const { error } = await admin.auth.admin.updateUserById(z.auth_id, { password: pin });
        if (error) return fehler("Fehler: " + error.message, 500);
        return antwort({ ok: true, pin });
      }

      case "konto_loeschen": {
        const lehrer = body.typ === "lehrer";
        if (lehrer ? !istAdmin : !istStaff) return fehler("Keine Berechtigung.", 403);
        const tabelle = lehrer ? "fahrlehrer_profil" : "schueler";
        const { data: z } = await admin.from(tabelle).select("auth_id").eq("id", body.id).maybeSingle();
        if (lehrer && caller && String(caller.id) === String(body.id)) return fehler("Das eigene Konto kann nicht gelöscht werden.");
        if (lehrer) {
          await admin.from("meine_schueler").delete().eq("fahrlehrer_id", body.id);
        } else {
          const sid = body.id;
          await admin.from("schueler_info").delete().eq("schueler_id", sid);
          await admin.from("ausbildungsstand").delete().eq("schueler_id", sid);
          await admin.from("notizen").delete().eq("schueler_id", sid);
          await admin.from("meine_schueler").delete().eq("schueler_id", String(sid));
        }
        const { error } = await admin.from(tabelle).delete().eq("id", body.id);
        if (error) return fehler("Fehler: " + error.message, 500);
        if (z?.auth_id) await admin.auth.admin.deleteUser(z.auth_id);
        return antwort({ ok: true });
      }

      case "migrieren": {
        // Einmalig: bestehende Schüler/Lehrer bekommen ein Konto. Geschützt durch den Einrichtungsschlüssel.
        const key = Deno.env.get("MIGRATION_KEY");
        if (!key || body.key !== key) return fehler("Einrichtungsschlüssel falsch.", 403);
        const ergebnis: unknown[] = [];
        for (const [typ, tabelle] of [["lehrer", "fahrlehrer_profil"], ["schueler", "schueler"]] as const) {
          const { data: zeilen } = await admin.from(tabelle).select("*").is("auth_id", null);
          for (const z of zeilen || []) {
            const alt = String(z.pin || "");
            const neu = !/^\d{6,8}$/.test(alt);
            const pin = neu ? zufallsPin() : alt;
            try {
              const login = await freierLoginName(tabelle, z.name);
              const authId = await authAnlegen(typ, login, pin);
              await admin.from(tabelle).update({ auth_id: authId, login_name: login }).eq("id", z.id);
              ergebnis.push({ typ, name: z.name, login_name: login, pin, neue_pin: neu });
            } catch (e) {
              ergebnis.push({ typ, name: z.name, fehler: String((e as Error).message) });
            }
          }
        }
        return antwort({ ok: true, ergebnis });
      }

      default:
        return fehler("Unbekannte Aktion.");
    }
  } catch (e) {
    return fehler(String((e as Error).message || e), 500);
  }
});
