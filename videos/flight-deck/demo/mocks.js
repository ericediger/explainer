/* Demo-stage mocks for Flight Deck (public build): stub chrome.*, the microphone, and the Anthropic,
   SerpApi and OpenAI endpoints the side panel calls. All trips, fares and replies are fictional. Loaded
   before app/sidepanel.js, so the app's own fetch calls land here. */
"use strict";
(() => {
  const realFetch = window.fetch.bind(window);
  const sceneId = location.hash.slice(1) || "ask";

  const Q = {
    austin: "Philly to Austin Friday the 23rd, back Sunday evening",
    chicago: "Philly to Chicago Monday morning on United, one way",
  };
  const SCENES = {
    ask: { mail: "austin", panelOpen: false },
    take: { mail: "austin", query: Q.austin },
    voice: { mail: "chicago", transcript: Q.chicago },
    clarify: { mail: "orlando" },
    explore: { mail: "london" },
    book: { mail: "austin", query: Q.austin, autoRun: true, fast: true },
  };
  const S = SCENES[sceneId] || SCENES.ask;
  // Latency per call (ms) and per streamed word, so the footage paces like the real thing.
  const LAT = S.fast ? { parse: 0, serp: 0, word: 0, stt: 0 } : { parse: 650, serp: 850, word: 52, stt: 550 };
  window.DEMO = { realFetch, sceneId, scene: S, Q };

  // ---- chrome.* and microphone stubs ----
  window.chrome = {
    storage: {
      local: {
        _data: {
          anthropicKey: "sk-ant-DEMO", serpapiKey: "serpapi-DEMO", model: "claude-opus-5",
          openaiKey: "sk-DEMO", ttsVoice: "alloy", speakResults: true,
        },
        async get(defaults) { return { ...defaults, ...this._data }; },
        async set(obj) { Object.assign(this._data, obj); },
      },
    },
    tabs: { create: (o) => window.DEMO.openTab?.(o.url) },
    runtime: { getURL: (p) => "app/" + p },
  };
  navigator.permissions.query = async () => ({ state: "granted" });
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => ({ getTracks: () => [{ stop() {} }] });
  window.MediaRecorder = class {
    constructor() { this.mimeType = "audio/webm"; }
    start() {}
    stop() {
      this.ondataavailable?.({ data: new Blob(["demo"], { type: "audio/webm" }) });
      this.onstop?.();
    }
  };

  // ---- Fictional flights ----
  // Airline marks are plain code badges, not the carriers' logos.
  const badge = (code, bg) =>
    "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><rect width="52" height="52" rx="12" fill="${bg}"/>` +
      `<text x="26" y="33" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" fill="#fff">${code}</text></svg>`);
  const AIR = {
    AA: { name: "American", logo: badge("AA", "#36495A") },
    DL: { name: "Delta", logo: badge("DL", "#7A2533") },
    UA: { name: "United", logo: badge("UA", "#1B3F8F") },
  };
  const leg = (code, num, from, dep, to, arr, dur) => ({
    departure_airport: { name: from, id: from, time: dep },
    arrival_airport: { name: to, id: to, time: arr },
    duration: dur, airline: AIR[code].name, airline_logo: AIR[code].logo,
    flight_number: `${code} ${num}`, travel_class: "Economy", airplane: "Airbus A321",
  });
  const trip = (legs, layovers, total, price, token) => ({
    flights: legs, layovers, total_duration: total, price, type: "Round trip",
    airline_logo: legs[0].airline_logo, departure_token: token, booking_token: token,
  });
  const nextDay = (d) => {
    const [y, m, dd] = d.split("-").map(Number);
    return new Date(y, m - 1, dd + 1).toLocaleDateString("en-CA");
  };

  const AUSTIN_OUT = {
    price_insights: { lowest_price: 287, price_level: "low", typical_price_range: [320, 480] },
    best_flights: [
      trip([leg("AA", "2154", "PHL", "2026-10-23 08:05", "AUS", "2026-10-23 11:01", 236)], [], 236, 312, "tok-aa2154"),
      trip([leg("UA", "1187", "PHL", "2026-10-23 06:30", "ORD", "2026-10-23 07:58", 148),
            leg("UA", "2290", "ORD", "2026-10-23 09:05", "AUS", "2026-10-23 11:52", 167)],
           [{ id: "ORD", duration: 67, name: "Chicago O'Hare" }], 382, 298, "tok-ua1187"),
    ],
    other_flights: [
      trip([leg("DL", "1630", "PHL", "2026-10-23 07:15", "ATL", "2026-10-23 09:22", 127),
            leg("DL", "2718", "ATL", "2026-10-23 10:30", "AUS", "2026-10-23 11:58", 148)],
           [{ id: "ATL", duration: 68, name: "Atlanta" }], 343, 287, "tok-dl1630"),
      trip([leg("AA", "1876", "PHL", "2026-10-23 12:40", "AUS", "2026-10-23 15:38", 238)], [], 238, 349, "tok-aa1876"),
    ],
  };
  const AUSTIN_BACK = {
    best_flights: [
      trip([leg("AA", "1903", "AUS", "2026-10-25 17:10", "PHL", "2026-10-25 21:35", 205)], [], 205, 312, "b-aa1903"),
    ],
    other_flights: [
      trip([leg("AA", "2440", "AUS", "2026-10-25 19:45", "PHL", "2026-10-26 00:12", 207)], [], 207, 318, "b-aa2440"),
      trip([leg("DL", "1871", "AUS", "2026-10-25 15:20", "ATL", "2026-10-25 18:41", 141),
            leg("DL", "2402", "ATL", "2026-10-25 19:55", "PHL", "2026-10-25 22:03", 128)],
           [{ id: "ATL", duration: 74, name: "Atlanta" }], 343, 344, "b-dl1871"),
    ],
  };
  const CHICAGO = {
    price_insights: { lowest_price: 139, price_level: "typical", typical_price_range: [130, 240] },
    best_flights: [
      trip([leg("UA", "2061", "PHL", "2026-10-19 08:15", "ORD", "2026-10-19 09:39", 144)], [], 144, 189, "c-ua2061"),
      trip([leg("UA", "637", "PHL", "2026-10-19 10:30", "ORD", "2026-10-19 11:52", 142)], [], 142, 139, "c-ua637"),
    ],
    other_flights: [
      trip([leg("UA", "1424", "PHL", "2026-10-19 06:00", "ORD", "2026-10-19 07:20", 140)], [], 140, 164, "c-ua1424"),
    ],
  };
  const ORLANDO = {
    price_insights: { lowest_price: 218, price_level: "typical", typical_price_range: [200, 320] },
    best_flights: [
      trip([leg("AA", "1452", "PHL", "2026-11-05 07:15", "MCO", "2026-11-05 09:51", 156)], [], 156, 218, "o-aa1452"),
      trip([leg("AA", "2210", "PHL", "2026-11-05 12:40", "MCO", "2026-11-05 15:19", 159)], [], 159, 232, "o-aa2210"),
    ],
    other_flights: [
      trip([leg("DL", "2385", "PHL", "2026-11-05 06:00", "ATL", "2026-11-05 08:12", 132),
            leg("DL", "1960", "ATL", "2026-11-05 09:20", "MCO", "2026-11-05 10:48", 88)],
           [{ id: "ATL", duration: 68, name: "Atlanta" }], 288, 226, "o-dl2385"),
      trip([leg("UA", "3410", "PHL", "2026-11-05 08:30", "IAD", "2026-11-05 09:42", 72),
            leg("UA", "1218", "IAD", "2026-11-05 11:05", "MCO", "2026-11-05 13:10", 125)],
           [{ id: "IAD", duration: 83, name: "Washington Dulles" }], 280, 241, "o-ua3410"),
    ],
  };
  const LONDON_OUT = (d, bump) => ({
    best_flights: [
      trip([leg("AA", "714", "PHL", `${d} 18:30`, "LHR", `${nextDay(d)} 06:40`, 430)], [], 430, 548 + bump, null),
      trip([leg("AA", "732", "PHL", `${d} 21:45`, "LHR", `${nextDay(d)} 09:50`, 425)], [], 425, 576 + bump, null),
    ],
    other_flights: [],
  });
  const LONDON_BACK = (d) => ({
    best_flights: [
      trip([leg("AA", "715", "LHR", `${d} 11:05`, "PHL", `${d} 14:15`, 490)], [], 490, 571, null),
      trip([leg("AA", "733", "LHR", `${d} 16:20`, "PHL", `${d} 19:35`, 495)], [], 495, 598, null),
    ],
    other_flights: [],
  });

  // ---- Claude: parses and the streamed takes ----
  const base = {
    intent: "book", outbound_date: null, return_date: null, trip_type: "round_trip", nonstop_only: false,
    travel_class: 1, adults: 1, airlines: null, explore_window_start: null, explore_window_end: null,
    explore_question: null, check_both_directions: false, clarification_needed: null,
  };
  const PARSE = {
    austin: { ...base, origin: "PHL", destination: "AUS", outbound_date: "2026-10-23", return_date: "2026-10-25" },
    chicago: { ...base, origin: "PHL", destination: "ORD,MDW", outbound_date: "2026-10-19", trip_type: "one_way", airlines: ["UA"] },
    orlandoAsk: { ...base, origin: "PHL", destination: "MCO", outbound_date: "2026-11-05", clarification_needed: "When are you returning?" },
    orlando: { ...base, origin: "PHL", destination: "MCO", outbound_date: "2026-11-05", return_date: "2026-11-12" },
    london: {
      ...base, intent: "explore", origin: "PHL", destination: "LHR,LGW", nonstop_only: true, check_both_directions: true,
      explore_window_start: "2026-11-01", explore_window_end: "2026-11-30",
      explore_question: "Are there daily nonstop flights between Philadelphia and London in both directions?",
    },
  };
  const TAKE = {
    austin: "American's 8:05 AM nonstop is the pick: under four hours gate to gate and just $25 more than the cheapest fare. Delta's connection through Atlanta saves that $25 but adds nearly two hours. Prices are running low for this route, so booking soon makes sense.",
    chicago: "United's 8:15 AM nonstop is the sweet spot, into O'Hare by 9:39 for $189. If you can leave later, the 10:30 nonstop is $50 less; the 6:00 AM saves $25 if you don't mind the early start.",
    orlando: "American's 7:15 AM nonstop is the pick at $218 round trip, and you're in Orlando before ten. The 12:40 PM nonstop is only $14 more if you'd rather not start that early.",
    london: "Yes. American flies nonstop between Philadelphia and Heathrow on every day checked, with evening departures that land the next morning. Flights home leave London late morning or mid-afternoon. Expect around $1,100 to $1,200 round trip, though fares vary with your exact dates.",
  };

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  // 0.1 s of silence as a WAV: this build plays the spoken take through an <audio> element.
  function silentWav() {
    const sr = 8000, n = 800, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, n * 2, true);
    return new Blob([buf], { type: "audio/wav" });
  }
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  // Server-sent events in the Messages API shape, one word per delta.
  function sse(text) {
    const words = text.match(/\S+\s*/g) || [];
    const enc = new TextEncoder();
    const ev = (type, data) => enc.encode(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
    let i = -1;
    const body = new ReadableStream({
      async pull(ctrl) {
        if (i === -1) { ctrl.enqueue(ev("message_start", {})); i = 0; return; }
        if (i < words.length) {
          await delay(LAT.word * (0.7 + 0.6 * (((i * 37) % 10) / 10)));
          ctrl.enqueue(ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: words[i] } }));
          i++;
          return;
        }
        ctrl.enqueue(ev("message_delta", { delta: { stop_reason: "end_turn" } }));
        ctrl.enqueue(ev("message_stop", {}));
        ctrl.close();
      },
    });
    return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
  }

  function pickParse(text, msgs) {
    if (/thursday/i.test(text) && msgs.length >= 3) return PARSE.orlando;
    if (/orlando/i.test(text)) return PARSE.orlandoAsk;
    if (/london/i.test(text)) return PARSE.london;
    if (/chicago/i.test(text)) return PARSE.chicago;
    return PARSE.austin;
  }
  function pickTake(text) {
    if (/"question"/.test(text)) return TAKE.london;
    if (/AUS/.test(text)) return TAKE.austin;
    if (/ORD/.test(text)) return TAKE.chicago;
    return TAKE.orlando;
  }

  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u.includes("api.anthropic.com")) {
      const body = JSON.parse(opts.body);
      const msgs = body.messages || [];
      const last = String([...msgs].reverse().find((m) => m.role === "user")?.content || "");
      if (body.output_config?.format) {
        await delay(LAT.parse);
        return json({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(pickParse(last, msgs)) }] });
      }
      const take = pickTake(last);
      if (body.stream) { await delay(LAT.parse * 0.6); return sse(take); }
      // This build asks for the whole take at once, so it lands after a Claude-sized pause.
      await delay(S.fast ? 0 : 1300);
      return json({ stop_reason: "end_turn", content: [{ type: "text", text: take }] });
    }
    if (u.includes("serpapi.com")) {
      const p = new URL(u).searchParams;
      await delay(LAT.serp);
      const dep = p.get("departure_id") || "";
      const arr = p.get("arrival_id") || "";
      const date = p.get("outbound_date") || "";
      let data = null;
      if (p.get("departure_token")) data = AUSTIN_BACK;
      else if (arr === "AUS") data = AUSTIN_OUT;
      else if (arr.startsWith("ORD")) data = CHICAGO;
      else if (arr === "MCO") data = ORLANDO;
      else if (arr.startsWith("LHR")) data = LONDON_OUT(date, Number(date.slice(-2)) > 15 ? 14 : 0);
      else if (dep.startsWith("LHR")) data = LONDON_BACK(date);
      // Book This Trip opens search_metadata.google_flights_url, as SerpApi returns it for the real search.
      const q = `Flights from ${dep} to ${arr} on ${date}${p.get("return_date") ? ` through ${p.get("return_date")}` : ""}`;
      const meta = { google_flights_url: `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&curr=USD` };
      return data ? json({ search_metadata: meta, ...data }) : json({ error: "Google Flights hasn't returned any results for this query." }, 400);
    }
    if (u.includes("api.openai.com/v1/audio/transcriptions")) {
      await delay(LAT.stt);
      return json({ text: S.transcript || "" });
    }
    if (u.includes("api.openai.com/v1/audio/speech")) {
      return new Response(silentWav(), { status: 200, headers: { "content-type": "audio/wav" } });
    }
    return realFetch(url, opts);
  };
})();
