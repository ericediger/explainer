/* Builds the stage for one scene: the fictional inbox, then the extension's real side panel
   (markup from app/sidepanel.html, logic from app/sidepanel.js). Signals readiness by filling
   #stageReady, which is the recorder's readySelector. */
"use strict";
(() => {
  const D = window.DEMO;
  const el = (id) => document.getElementById(id);

  const MAIL = [
    {
      id: "austin", from: "Maya Chen", addr: "maya.chen@example.com", av: "#d9822b", time: "9:12 AM", unread: true,
      subj: "Austin workshop: Friday the 23rd?",
      event: { day: "FRI", date: "23", title: "Planning workshop", where: "Austin · Fri 2:00 PM – Sun" },
      body: [
        "Hi Jordan,",
        "Can you join us in Austin for the planning workshop? We kick off Friday the 23rd at 2:00 PM at the downtown office and run working sessions on Saturday.",
        "Most of the team flies home Sunday evening. Send me your flights when you have them and I'll sort out the hotel.",
        "Thanks,<br>Maya",
      ],
    },
    {
      id: "chicago", from: "Sam Ortiz", addr: "sam.ortiz@example.com", av: "#3f8f6b", time: "8:47 AM", unread: true,
      subj: "Chicago review moved to Monday",
      event: { day: "MON", date: "19", title: "Quarterly review", where: "Chicago · Mon 1:00 PM" },
      body: [
        "Hi Jordan,",
        "Quick heads-up: the quarterly review with the Chicago team is now Monday the 19th at 1:00 PM, at the West Loop office.",
        "A morning flight should get you there in plenty of time. We'll sort out the trip home once the agenda is final.",
        "Sam",
      ],
    },
    {
      id: "orlando", from: "Elena Park", addr: "elena.park@example.com", av: "#7b5cc4", time: "Yesterday",
      subj: "Orlando conference kicks off Nov 5",
      event: { day: "THU", date: "5", title: "Conference kickoff", where: "Orlando · Nov 5 – 11" },
      body: [
        "Hi Jordan,",
        "The conference kicks off Thursday, November 5 in Orlando, and sessions run through the following Wednesday.",
        "Pick whatever return works for you; the closing dinner is Wednesday night.",
        "Elena",
      ],
    },
    {
      id: "london", from: "Chris Adeyemi", addr: "chris.adeyemi@example.com", av: "#2f7fb5", time: "Yesterday",
      subj: "London client visits in November",
      body: [
        "Hi Jordan,",
        "We're lining up client visits in London next month, and the dates are still open.",
        "Before we commit, could you check what nonstop service looks like from Philadelphia?",
        "Chris",
      ],
    },
    { id: "expense", from: "Finance", time: "Mon", subj: "Expense report approved", snip: "Your September report has been approved and paid." },
    { id: "lunch", from: "Priya Shah", time: "Mon", subj: "Team lunch Thursday", snip: "We booked a table for 12:30. Shout if you can't make it." },
  ];

  function renderMail(selId) {
    const strip = (h) => h.replace(/<[^>]+>/g, " ");
    el("mailList").innerHTML = MAIL.map((m) => `
      <li class="ml-item${m.id === selId ? " sel" : ""}${m.unread && m.id !== selId ? " unread" : ""}">
        <div class="ml-row"><span class="ml-from">${m.from}</span><span class="ml-time">${m.time}</span></div>
        <div class="ml-subj">${m.subj}</div>
        <div class="ml-snip">${m.snip || strip(m.body[1])}</div>
      </li>`).join("");
    const m = MAIL.find((x) => x.id === selId) || MAIL[0];
    const initials = m.from.split(" ").map((w) => w[0]).join("");
    el("mailRead").innerHTML = `
      <h2>${m.subj}</h2>
      <div class="ml-meta">
        <div class="ml-av" style="background:${m.av}">${initials}</div>
        <div><div class="ml-name">${m.from}</div><div class="ml-addr">${m.addr} &middot; to me</div></div>
        <div class="ml-date">${m.time}</div>
      </div>
      ${m.event ? `<div class="ml-event"><div class="ml-cal"><b>${m.event.day}</b><span>${m.event.date}</span></div>
        <div><div class="ml-ev-title">${m.event.title}</div><div class="ml-ev-where">${m.event.where}</div></div></div>` : ""}
      <div class="ml-body">${m.body.map((p) => `<p>${p}</p>`).join("")}</div>`;
  }

  function setSide(open) {
    el("side").classList.toggle("open", open);
    el("extBtn").classList.toggle("on", open);
    document.querySelector(".cx-body").classList.toggle("side-open", open);
  }

  // Book This Trip opens a new tab: show it in the tab strip with a plain loading page.
  D.openTab = (url) => {
    el("tabMail").classList.remove("active");
    el("tabBook").classList.remove("cx-hidden");
    el("tabBook").classList.add("active");
    const shown = decodeURIComponent(url.replace(/^https?:\/\//, ""));
    el("omniText").textContent = shown;
    el("ldUrl").textContent = shown;
    el("mailPage").classList.add("cx-hidden");
    el("bookPage").classList.remove("cx-hidden");
  };

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.body.appendChild(s);
  });
  const until = async (fn, ms = 8000) => {
    const end = Date.now() + ms;
    while (!fn() && Date.now() < end) await new Promise((r) => setTimeout(r, 30));
  };

  // The recorder's spotlight is a fixed rectangle; while window.__follow names an element, keep it on that element.
  (function follow() {
    const f = window.__follow;
    const spot = document.getElementById("__spot");
    if (f && spot && spot.classList.contains("on")) {
      const e = document.querySelector(f.sel);
      const b = e?.getBoundingClientRect();
      if (b && (b.width || b.height)) {
        const set = (k, v) => { if (spot.style[k] !== v) spot.style[k] = v; };
        set("left", `${b.left - f.pad}px`);
        set("top", `${b.top - f.pad}px`);
        set("width", `${b.width + 2 * f.pad}px`);
        set("height", `${b.height + 2 * f.pad}px`);
      }
    }
    requestAnimationFrame(follow);
  })();

  (async () => {
    const S = D.scene;
    renderMail(S.mail);
    setSide(S.panelOpen !== false);
    el("extBtn").addEventListener("click", () => setSide(!el("side").classList.contains("open")));

    const html = await (await D.realFetch("app/sidepanel.html", { cache: "no-store" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script").forEach((s) => s.remove());
    doc.querySelectorAll("img[src^='icons/']").forEach((img) => img.setAttribute("src", "app/" + img.getAttribute("src")));
    el("panel").append(...doc.body.childNodes);
    await loadScript("app/sidepanel.js");

    if (S.query) el("queryInput").value = S.query;
    if (S.autoRun) {
      el("searchBtn").click();
      await until(() => document.querySelector(".flight-card") && el("statusBar").classList.contains("hidden"));
    }
    const ready = document.createElement("div");
    ready.id = "stageReady";
    ready.hidden = true;
    ready.textContent = "ready";
    document.body.appendChild(ready);
  })();
})();
