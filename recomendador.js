// Recomendador: unas pocas preguntas (para qué es, qué se come, qué estilo, de dónde) llevan a una decisión: el estilo
// que mejor encaja y los vinos del catálogo que lo cumplen, con el porqué. Criterio general de maridaje, orientativo.
// Solo usa datos reales de cada vino (tipo, crianza, zona, ficha y vídeo; fichas.js). Lo elegido va a la propuesta.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ALL } = window.FICHAS;
  const BRAND = document.body.dataset.brand || "calidoscopi";
  const SEL = `${BRAND}-seleccion`;
  const TIPOS = ["espumoso", "blanco", "rosado", "tinto", "generoso", "dulce"];
  const LABEL = { espumoso: "un espumoso", blanco: "un blanco", rosado: "un rosado", tinto: "un tinto", generoso: "un generoso", dulce: "un dulce" };
  const PLURAL = { espumoso: "Espumosos", blanco: "Blancos", rosado: "Rosados", tinto: "Tintos", generoso: "Generosos", dulce: "Dulces" };
  const CAT_DOS = /conca del riu anoia|penedes|parcel|priorat|montsant|tarragona|costers del segre|emporda|terra alta|gandesa|pla de bages|valles/;
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const origin = (w) => (CAT_DOS.test(norm(w.do)) ? "cerca" : w.country === "España" ? "espana" : "mundo");

  // cada respuesta suma puntos a los estilos (criterio general de maridaje) y deja una frase para el porqué
  const Q = [
    { k: "uso", q: "¿Para qué es el vino?", opts: [
      ["comida", "Para acompañar un plato", {}, ""],
      ["copas", "Para servir por copas", { blanco: 1, tinto: 1, espumoso: 1 }, "por copas funcionan los estilos versátiles"],
      ["carta", "Para la carta del restaurante", {}, ""],
      ["brindis", "Para un aperitivo o un brindis", { espumoso: 3, generoso: 2 }, "para brindar, la burbuja manda"],
    ] },
    { k: "plato", q: "¿Qué se va a comer?", skip: (a) => a.uso === "brindis", opts: [
      ["pescado", "Pescado y marisco", { blanco: 3, espumoso: 2, generoso: 2, rosado: 1 }, "el pescado pide blancos, burbuja o un fino"],
      ["arroz", "Arroz o paella", { blanco: 3, rosado: 2, espumoso: 1, tinto: 1 }, "los arroces van bien con blancos y rosados"],
      ["carne", "Carne roja o a la brasa", { tinto: 4 }, "la carne roja pide un tinto"],
      ["ave", "Ave o carne blanca", { tinto: 2, blanco: 2, rosado: 1 }, "el ave admite blancos con cuerpo o tintos ligeros"],
      ["verdura", "Verduras y ensaladas", { blanco: 2, rosado: 2, espumoso: 1 }, "la verdura va bien con blancos y rosados frescos"],
      ["queso", "Quesos", { dulce: 2, generoso: 2, tinto: 1, blanco: 1 }, "los quesos curados agradecen un dulce o un generoso"],
      ["postre", "Postre", { dulce: 4, espumoso: 1 }, "el postre pide un vino dulce"],
      ["tapas", "Tapas y aperitivo", { espumoso: 2, generoso: 3, blanco: 1 }, "para picar, generosos y burbuja"],
      ["especias", "Cocina asiática o especiada", { blanco: 3, espumoso: 2, rosado: 1 }, "las especias van mejor con blancos y burbuja"],
      ["nose", "Todavía no lo sé", { espumoso: 1, blanco: 1, rosado: 1, tinto: 1 }, ""],
    ] },
    { k: "estilo", q: "¿Qué estilo le apetece?", opts: [
      ["burbuja", "Con burbuja", { espumoso: 4 }, "quiere burbuja"],
      ["fresco", "Fresco y ligero", { blanco: 3, rosado: 2, espumoso: 1 }, "busca algo fresco"],
      ["cuerpo", "Con cuerpo y crianza", { tinto: 3, generoso: 1 }, "busca cuerpo y crianza"],
      ["distinto", "Algo diferente", { generoso: 3, dulce: 2 }, "quiere algo diferente"],
      ["igual", "Sin preferencia", {}, ""],
    ] },
    { k: "origen", q: "¿De dónde?", opts: [
      ["cerca", "De cercanía (Catalunya)", {}, "de cercanía"], ["espana", "De España", {}, "de España"],
      ["mundo", "Internacional", {}, "de fuera"], ["igual", "Me da igual", {}, ""],
    ] },
  ];

  let ans = {}, step = 0;
  const steps = () => Q.filter((q) => !q.skip || !q.skip(ans));

  function paintQuestion() {
    const list = steps();
    const q = list[step];
    $("rc-progress").style.width = `${(step / list.length) * 100}%`;
    $("rc-count").textContent = `Pregunta ${step + 1} de ${list.length}`;
    $("rc-stage").innerHTML = `
      <div class="rc-q" key="${q.k}">
        <h2>${q.q}</h2>
        <div class="rc-opts">${q.opts.map(([v, label]) => `<button type="button" class="rc-opt${ans[q.k] === v ? " on" : ""}" data-v="${v}">${esc(label)}</button>`).join("")}</div>
        <div class="rc-nav">${step ? `<button type="button" class="linkish" id="rc-back">← Atrás</button>` : "<span></span>"}<span class="rc-hint">Toca una respuesta</span></div>
      </div>`;
    $("rc-result").hidden = true;
    $("rc-stage").hidden = false;
  }

  function decide() {
    const pts = Object.fromEntries(TIPOS.map((t) => [t, 0]));
    const why = [];
    for (const q of steps()) {
      const o = q.opts.find(([v]) => v === ans[q.k]);
      if (!o) continue;
      Object.entries(o[2]).forEach(([t, n]) => (pts[t] += n));
      if (o[3] && q.k !== "origen") why.push(o[3]);
    }
    const ranked = TIPOS.filter((t) => pts[t] > 0).sort((a, b) => pts[b] - pts[a]);
    const top = ranked.length ? ranked : ["blanco", "tinto", "espumoso"];
    // carta del restaurante: variedad (los tres estilos mejor puntuados); si no, el estilo ganador y el segundo
    const tipos = ans.uso === "carta" ? top.slice(0, 3) : top.slice(0, 2);
    const pref = ans.origen || "igual";
    const score = (w) => (pts[w.tipo] || 0) * 10 + (pref === "igual" || origin(w) === pref ? 6 : 0) + (w.tech ? 2 : 0) + (w.video ? 2 : 0) +
      (ans.estilo === "cuerpo" && w.crianza ? 3 : 0);
    const pool = ALL.filter((w) => tipos.includes(w.tipo)).sort((a, b) => score(b) - score(a) || a.winery.localeCompare(b.winery));
    const pick = [], used = new Set();
    // para la carta, el mismo número de cada estilo (2 + 2 + 2); si no, los mejores (una bodega distinta cada vez)
    const cupo = ans.uso === "carta" ? Object.fromEntries(tipos.map((t) => [t, Math.ceil(6 / tipos.length)])) : null;
    const cabe = (w) => !cupo || pick.filter((x) => x.tipo === w.tipo).length < cupo[w.tipo];
    for (const w of pool) { if (pick.length >= 6) break; if (used.has(w.winery) || !cabe(w)) continue; pick.push(w); used.add(w.winery); }
    for (const w of pool) { if (pick.length >= 6) break; if (!pick.includes(w) && cabe(w)) pick.push(w); }
    if (cupo) pick.sort((a, b) => tipos.indexOf(a.tipo) - tipos.indexOf(b.tipo));
    const otro = pref !== "igual" && pick.some((w) => origin(w) !== pref);
    return { tipos, why, pick, pref, otro };
  }

  function paintResult() {
    const { tipos, why, pick, pref, otro } = decide();
    const sel = (() => { try { return JSON.parse(localStorage.getItem(SEL) || "[]"); } catch { return []; } })();
    const inSel = (id) => sel.some((o) => o.id === id);
    const zona = { cerca: "de cercanía", espana: "de España", mundo: "internacional", igual: "" }[pref];
    const headline = ans.uso === "carta"
      ? `Para la carta: <em>${tipos.map((t) => PLURAL[t].toLowerCase()).join(", ")}</em>${zona ? ` ${zona}` : ""}`
      : `La recomendación: <em>${LABEL[tipos[0]]}${zona ? ` ${zona}` : ""}</em>${tipos[1] ? `, o ${LABEL[tipos[1]]}` : ""}`;
    $("rc-progress").style.width = "100%";
    $("rc-count").textContent = "Recomendación";
    $("rc-stage").hidden = true;
    $("rc-result").hidden = false;
    $("rc-result").innerHTML = `
      <p class="kicker">Tu decisión</p>
      <h2>${headline}</h2>
      ${why.length ? `<p class="rc-why"><b>Por qué:</b> ${esc(why.join("; "))}.</p>` : ""}
      <div class="rc-cards">${pick.map((w, i) => `
        <article class="rc-card${i === 0 ? " first" : ""}">
          ${i === 0 ? `<span class="rc-badge">La primera opción</span>` : ""}
          <a class="rc-img" href="vino.html?id=${encodeURIComponent(w.id)}"><img src="${w.img}" alt="" loading="lazy" /></a>
          <div class="rc-body">
            <small>${esc(w.winery)} · ${esc(w.do)}</small>
            <b>${esc(w.name)}</b>
            <span class="rc-tags"><span>${esc(w.tipoLabel)}${w.crianza ? ` · ${esc(w.crianza)}` : ""}</span>${w.uvas.length ? `<span>${esc(w.uvas.join(", "))}</span>` : ""}${w.video ? `<span class="v">▶ Vídeo</span>` : ""}${pref !== "igual" && origin(w) !== pref ? `<span class="o">Otro origen</span>` : ""}</span>
            <button type="button" class="rc-add" data-id="${w.id}" ${inSel(w.id) ? "disabled" : ""}>${inSel(w.id) ? "✓ En la propuesta" : "+ Añadir a la propuesta"}</button>
          </div>
        </article>`).join("")}</div>
      ${otro ? `<p class="rc-note">Del origen elegido no hay bastantes vinos de ese estilo con ficha: se completa con otros.</p>` : ""}
      <div class="rc-actions"><button type="button" class="btn" id="rc-edit">← Cambiar respuestas</button><button type="button" class="btn ghost" id="rc-restart">Empezar de nuevo</button><a class="btn solid" href="propuesta.html">Ir a la propuesta</a></div>
      <p class="rc-fine">Orientativo: criterio general de maridaje aplicado al catálogo. Solo se proponen vinos con su estilo confirmado. La última palabra es del comercial y del cliente.</p>`;
  }

  $("rc-stage").addEventListener("click", (e) => {
    if (e.target.id === "rc-back") { step = Math.max(0, step - 1); return paintQuestion(); }
    const b = e.target.closest(".rc-opt");
    if (!b) return;
    const q = steps()[step];
    ans[q.k] = b.dataset.v;
    if (step + 1 < steps().length) { step++; paintQuestion(); } else paintResult();
    $("rc-top").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("rc-result").addEventListener("click", (e) => {
    if (e.target.id === "rc-edit") { step = steps().length - 1; return paintQuestion(); }
    if (e.target.id === "rc-restart") { ans = {}; step = 0; return paintQuestion(); }
    const b = e.target.closest(".rc-add");
    if (!b) return;
    let sel = [];
    try { sel = JSON.parse(localStorage.getItem(SEL) || "[]"); } catch {}
    if (!sel.some((o) => o.id === b.dataset.id)) sel.push({ id: b.dataset.id, n: 1 });
    try { localStorage.setItem(SEL, JSON.stringify(sel)); } catch {}
    b.disabled = true;
    b.textContent = "✓ En la propuesta";
  });
  paintQuestion();
})();
