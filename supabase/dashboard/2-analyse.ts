// @ts-nocheck
// AUTOMATISCH ERZEUGT aus supabase/functions/analyse (npm run dashboard) – nicht von Hand bearbeiten.
// Im Supabase-Dashboard: Edge Functions → Deploy a new function → Via Editor,
// Name „analyse“, diesen Inhalt komplett einfügen → Deploy.
// analyse/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

// _shared/bewertung.ts
function massnahmenPunkte(m, rolle) {
  const mod = rolle ? m.rollen_modifikator?.[rolle] : void 0;
  const rollenBonus = mod?.wert ?? 0;
  return {
    punkte: Math.max(0, m.wirksamkeit + m.umsetzbarkeit + rollenBonus),
    rollenBonus,
    rollenBegruendung: mod?.begruendung
  };
}
function bewertePartei(partei, themaId, ursachenIds, rolle, massnahmen) {
  const eigene = massnahmen.filter((m) => m.partei_id === partei.id && m.thema_id === themaId);
  const trefferJeMassnahme = /* @__PURE__ */ new Map();
  let punkte = 0;
  for (const ursacheId of ursachenIds) {
    let beste = null;
    for (const m of eigene) {
      if (!m.ursachen_ids.includes(ursacheId)) continue;
      const p = massnahmenPunkte(m, rolle);
      if (!beste || p.punkte > beste.p.punkte) beste = {
        m,
        p
      };
    }
    if (!beste) continue;
    punkte += beste.p.punkte;
    const vorhanden = trefferJeMassnahme.get(beste.m.id);
    if (vorhanden) {
      vorhanden.ursachen_ids.push(ursacheId);
    } else {
      trefferJeMassnahme.set(beste.m.id, {
        massnahme: beste.m,
        ursachen_ids: [
          ursacheId
        ],
        punkteJeUrsache: beste.p.punkte,
        rollenBonus: beste.p.rollenBonus,
        rollenBegruendung: beste.p.rollenBegruendung
      });
    }
  }
  return {
    partei,
    punkte,
    treffer: [
      ...trefferJeMassnahme.values()
    ]
  };
}

// _shared/typen.ts
var ROLLEN_IDS = [
  "mieter",
  "eigentuemer",
  "angestellt",
  "selbststaendig",
  "rentner",
  "arbeitslos",
  "studierend",
  "vermoegend"
];

// _shared/ki.ts
var MAX_NACHFRAGEN = 2;
var MAX_NACHRICHTEN = 2 * MAX_NACHFRAGEN + 1;
var MAX_TEXTLAENGE = 500;
var ROLLEN_TEXT = {
  mieter: "Mieter:in",
  eigentuemer: "Eigent\xFCmer:in",
  angestellt: "Angestellt",
  selbststaendig: "Selbstst\xE4ndig",
  rentner: "Rentner:in",
  arbeitslos: "Arbeitslos",
  studierend: "Studierend",
  vermoegend: "Verm\xF6gend"
};
function systemPrompt(themen, ursachen) {
  const katalog = themen.map((t) => {
    const u = ursachen.filter((x) => x.thema_id === t.id).map((x) => `    - Ursache ${x.id}: ${x.beschreibung}`).join("\n");
    return `- Thema ${t.id}: ${t.name} \u2013 ${t.beschreibung}
${u}`;
  }).join("\n");
  return `Du moderierst das Spiel \u201EWer liefert?\u201C. Spieler:innen nennen Alltagsprobleme.
Deine einzige Aufgabe: die \xC4u\xDFerung einordnen und einem Thema und Ursachen aus dem Katalog zuordnen.

Regeln:
- Neutral, respektvoll, freundlich. Keine Belehrung. Deutsch, kurze S\xE4tze.
- Bewerte NIEMALS Parteien, Politiker:innen oder Ma\xDFnahmen. Nenne keine Parteien.
- Nenne NIEMALS Links, Quellen oder Zahlen aus Studien.
- Vergib keine Punkte.

Einordnung ("typ"):
- "problem": ein konkretes Alltagsproblem (z. B. \u201EIch finde keine bezahlbare Wohnung\u201C).
- "forderung": eine politische Forderung ohne konkretes Alltagsproblem (z. B. \u201EWeniger Steuern!\u201C).
  Dann stelle in "nachfrage" genau eine kurze, freundliche Frage nach dem konkreten Alltagsproblem dahinter,
  z. B. \u201EWas l\xE4uft in deinem Alltag konkret schief?\u201C.
- "wert": eine pers\xF6nliche Haltung oder ein Wert (z. B. \u201EMir ist Gerechtigkeit wichtig\u201C), kein Problem.

Zuordnung (nur bei "problem"):
- "thema_id": die ID aus dem Katalog, die am besten passt, sonst null.
- "ursachen_ids": IDs der Ursachen dieses Themas, die zum geschilderten Problem passen. Wenn unklar: alle Ursachen des Themas.
- Passt kein Thema: "thema_id": null, "ursachen_ids": [] und in "einschaetzung" 1\u20132 neutrale S\xE4tze zu m\xF6glichen
  Ursachen des Problems \u2013 ohne Parteien, ohne L\xF6sungsbewertung, ohne Links.

"zusammenfassung": ein kurzer, neutraler Satz zum Problem, ohne Namen oder pers\xF6nliche Details.

Katalog:
${katalog}

Antworte ausschlie\xDFlich mit einem JSON-Objekt:
{"typ": "problem" | "forderung" | "wert", "nachfrage": string | null, "thema_id": number | null,
 "ursachen_ids": number[], "zusammenfassung": string, "einschaetzung": string | null}`;
}
function nutzerNachrichten(verlauf, rolle) {
  const nachfragen = verlauf.filter((n) => n.von === "ki").length;
  const hinweis = `Rolle der Person: ${rolle ? ROLLEN_TEXT[rolle] : "keine Angabe"}.` + (nachfragen >= MAX_NACHFRAGEN ? ' Es wurde bereits zweimal nachgefragt: Ordne jetzt als "problem" oder "wert" ein, nicht als "forderung".' : "");
  return [
    {
      role: "system",
      content: hinweis
    },
    ...verlauf.map((n) => ({
      role: n.von === "spieler" ? "user" : "assistant",
      content: n.text
    }))
  ];
}
var EingabeFehler = class extends Error {
};
function pruefeAnfrage(roh) {
  const a = roh;
  if (!a || typeof a !== "object") throw new EingabeFehler("Anfrage fehlt.");
  if (typeof a.sitzung !== "string" || !/^[0-9a-f-]{36}$/i.test(a.sitzung)) throw new EingabeFehler("Ung\xFCltige Sitzung.");
  if (!Array.isArray(a.verlauf) || a.verlauf.length === 0 || a.verlauf.length > MAX_NACHRICHTEN) throw new EingabeFehler("Ung\xFCltiger Verlauf.");
  for (const n of a.verlauf) {
    if (!n || n.von !== "spieler" && n.von !== "ki" || typeof n.text !== "string") throw new EingabeFehler("Ung\xFCltige Nachricht.");
    if (n.text.trim().length === 0 || n.text.length > MAX_TEXTLAENGE) throw new EingabeFehler("Text zu lang oder leer.");
  }
  if (a.verlauf[a.verlauf.length - 1].von !== "spieler") throw new EingabeFehler("Letzte Nachricht muss vom Spieler sein.");
  if (a.rolle !== null && a.rolle !== void 0 && !ROLLEN_IDS.includes(a.rolle)) throw new EingabeFehler("Ung\xFCltige Rolle.");
  if (!Array.isArray(a.parteien) || a.parteien.length !== 2 || !a.parteien.every((p) => Number.isInteger(p)) || a.parteien[0] === a.parteien[1]) throw new EingabeFehler("Ung\xFCltige Parteien.");
  return {
    sitzung: a.sitzung,
    verlauf: a.verlauf,
    rolle: a.rolle ?? null,
    parteien: a.parteien
  };
}
var kurz = (s, max) => typeof s === "string" ? s.trim().replace(/\s+/g, " ").slice(0, max) : "";
function bereinigeAntwort(roh, verlauf, themen, ursachen) {
  const r = roh && typeof roh === "object" ? roh : {};
  const nachfragen = verlauf.filter((n) => n.von === "ki").length;
  const letzterText = verlauf.filter((n) => n.von === "spieler").at(-1)?.text ?? "";
  const ohneLinks = (s) => s.replace(/(https?:\/\/|www\.)\S+/gi, "").trim();
  let typ = r.typ === "forderung" || r.typ === "wert" ? r.typ : "problem";
  let nachfrage = ohneLinks(kurz(r.nachfrage, 200));
  if (typ === "forderung" && (nachfragen >= MAX_NACHFRAGEN || !nachfrage)) {
    if (nachfragen >= MAX_NACHFRAGEN) typ = "problem";
    else nachfrage = "Was l\xE4uft in deinem Alltag konkret schief?";
  }
  const zusammenfassung = ohneLinks(kurz(r.zusammenfassung, 200)) || kurz(letzterText, 120);
  if (typ !== "problem") {
    return {
      typ,
      nachfrage: typ === "forderung" ? nachfrage : null,
      thema_id: null,
      ursachen_ids: [],
      zusammenfassung,
      einschaetzung: null
    };
  }
  const thema = themen.find((t) => t.id === Number(r.thema_id)) ?? null;
  if (!thema) {
    return {
      typ,
      nachfrage: null,
      thema_id: null,
      ursachen_ids: [],
      zusammenfassung,
      einschaetzung: ohneLinks(kurz(r.einschaetzung, 400)) || null
    };
  }
  const erlaubt = ursachen.filter((u) => u.thema_id === thema.id).map((u) => u.id);
  const genannt = Array.isArray(r.ursachen_ids) ? r.ursachen_ids.map(Number).filter((id) => erlaubt.includes(id)) : [];
  return {
    typ,
    nachfrage: null,
    thema_id: thema.id,
    ursachen_ids: genannt.length > 0 ? [
      ...new Set(genannt)
    ] : erlaubt,
    zusammenfassung,
    einschaetzung: null
  };
}

// analyse/index.ts
var RATE_LIMIT_MAX = 40;
var RATE_LIMIT_FENSTER = "30 minutes";
var MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
var json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...CORS,
    "Content-Type": "application/json"
  }
});
var db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: {
    persistSession: false
  }
});
async function frageMistral(system, nachrichten) {
  const key = Deno.env.get("MISTRAL_API_KEY");
  if (!key) throw new Error("MISTRAL_API_KEY fehlt");
  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: Deno.env.get("MISTRAL_MODEL") ?? "mistral-small-latest",
      temperature: 0.1,
      max_tokens: 400,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: system
        },
        ...nachrichten
      ]
    }),
    signal: AbortSignal.timeout(2e4)
  });
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const daten = await res.json();
  return JSON.parse(daten.choices?.[0]?.message?.content ?? "{}");
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: CORS
  });
  if (req.method !== "POST") return json({
    fehler: "Nur POST erlaubt."
  }, 405);
  try {
    const anfrage = pruefeAnfrage(await req.json().catch(() => null));
    const { data: erlaubt, error: rlFehler } = await db.rpc("rate_limit_pruefen", {
      p_sitzung: anfrage.sitzung,
      p_max: RATE_LIMIT_MAX,
      p_fenster: RATE_LIMIT_FENSTER
    });
    if (rlFehler) throw rlFehler;
    if (!erlaubt) return json({
      fehler: "Zu viele Anfragen. Bitte warte ein paar Minuten."
    }, 429);
    const [themenRes, ursachenRes] = await Promise.all([
      db.from("themen").select("id, name, beschreibung"),
      db.from("ursachen").select("id, thema_id, beschreibung, quelle_url")
    ]);
    if (themenRes.error) throw themenRes.error;
    if (ursachenRes.error) throw ursachenRes.error;
    const themen = themenRes.data;
    const ursachen = ursachenRes.data;
    const roh = await frageMistral(systemPrompt(themen, ursachen), nutzerNachrichten(anfrage.verlauf, anfrage.rolle));
    const antwort = bereinigeAntwort(roh, anfrage.verlauf, themen, ursachen);
    if (antwort.typ !== "forderung") {
      await speichereRunde(antwort, anfrage.parteien, anfrage.rolle);
    }
    return json(antwort);
  } catch (e) {
    if (e instanceof EingabeFehler) return json({
      fehler: e.message
    }, 400);
    console.error("analyse:", e instanceof Error ? e.message : e);
    return json({
      fehler: "Die Einordnung hat gerade nicht geklappt. Bitte versuch es noch einmal."
    }, 502);
  }
});
async function speichereRunde(antwort, [parteiA, parteiB], rolle) {
  const basis = {
    problem_text: antwort.zusammenfassung,
    partei_a: parteiA,
    partei_b: parteiB
  };
  if (antwort.typ === "wert") {
    await db.from("runden").insert({
      ...basis,
      status: "wert"
    });
    return;
  }
  if (antwort.thema_id === null) {
    await Promise.all([
      db.from("runden").insert({
        ...basis,
        status: "ungeprueft"
      }),
      db.from("review_warteschlange").insert({
        problem_text: antwort.zusammenfassung,
        einschaetzung: antwort.einschaetzung ?? null
      })
    ]);
    return;
  }
  const [pRes, mRes] = await Promise.all([
    db.from("parteien").select("*").in("id", [
      parteiA,
      parteiB
    ]),
    db.from("massnahmen").select("*").eq("thema_id", antwort.thema_id).in("partei_id", [
      parteiA,
      parteiB
    ])
  ]);
  const parteien = pRes.data ?? [];
  const massnahmen = mRes.data ?? [];
  const a = parteien.find((p) => p.id === parteiA);
  const b = parteien.find((p) => p.id === parteiB);
  if (!a || !b) return;
  const pa = bewertePartei(a, antwort.thema_id, antwort.ursachen_ids, rolle, massnahmen).punkte;
  const pb = bewertePartei(b, antwort.thema_id, antwort.ursachen_ids, rolle, massnahmen).punkte;
  await db.from("runden").insert({
    ...basis,
    thema_id: antwort.thema_id,
    status: "gewertet",
    punkte_a: pa,
    punkte_b: pb
  });
}
