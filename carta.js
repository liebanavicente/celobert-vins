// «Asistente de carta» para comerciales: en la visita, el comercial marca la cocina del cliente, el tamaño de carta y lo que ya tiene; la herramienta
// compara con un reparto orientativo y propone vinos del catálogo para cubrir los huecos. Lo elegido va a «Mi selección»
// (la misma que el catálogo, en localStorage) y de ahí a la plataforma de pedidos.
// Datos: tipo de cada vino en carta-data.js (ficha oficial o nombre/denominación sin dudas). Sin datos de ventas ni
// Celobert es ficticia: cada vino trae su gama de precio inventada (entrada/media/alta), que filtra las propuestas.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const C = window.CATALOG || [];
  const T = Object.fromEntries((window.CARTA || []).map((c) => [c.id, c]));
  const KEY = "celobert-seleccion";

  const STYLES = [
    ["espumoso", "Espumosos", "Champagne, cava, ancestrales…"],
    ["blanco", "Blancos", ""],
    ["rosado", "Rosados", ""],
    ["tinto", "Tintos", ""],
    ["generoso", "Generosos", "Jerez: manzanilla, fino, amontillado, oloroso"],
    ["dulce", "Dulces", "Para el postre o el queso"],
  ];
  // reparto orientativo (%) por tipo de cocina: criterio general de sumillería
  const COCINAS = {
    mediterranea: ["Mediterránea / de mercado", { espumoso: 12, blanco: 34, rosado: 10, tinto: 34, generoso: 5, dulce: 5 }],
    pescado: ["Pescado y marisco", { espumoso: 15, blanco: 45, rosado: 10, tinto: 18, generoso: 8, dulce: 4 }],
    carnes: ["Carnes y brasa", { espumoso: 8, blanco: 20, rosado: 6, tinto: 56, generoso: 5, dulce: 5 }],
    arroces: ["Arrocería", { espumoso: 12, blanco: 38, rosado: 15, tinto: 25, generoso: 7, dulce: 3 }],
    tapas: ["Tapas e informal", { espumoso: 12, blanco: 30, rosado: 12, tinto: 30, generoso: 13, dulce: 3 }],
    asiatica: ["Asiática / fusión", { espumoso: 16, blanco: 44, rosado: 12, tinto: 18, generoso: 5, dulce: 5 }],
    alta: ["Alta cocina / degustación", { espumoso: 14, blanco: 34, rosado: 6, tinto: 34, generoso: 6, dulce: 6 }],
  };
  const CAT_DOS = /conca del riu anoia|penedes|parcel|priorat|montsant|tarragona|costers del segre|emporda|terra alta|gandesa|pla de bages|valles/;
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // todos los vinos con tipo conocido, con su bodega y su origen
  const WINES = C.flatMap((b) => b.wines.map((x) => ({ ...x, winery: b, t: T[x.id] }))).filter((x) => x.t && x.t.tipo && x.t.tipo !== "otros");
  const origin = (x) => (CAT_DOS.test(norm(x.winery.do)) ? "cerca" : x.winery.country === "España" ? "espana" : "mundo");
  const pending = (window.CARTA || []).filter((c) => !c.tipo).length;
  $("cc-pend").textContent = `Hoy: ${WINES.length} vinos con estilo conocido; ${pending} esperan su ficha oficial y no se proponen todavía.`;

  // ---------- formulario ----------
  let cocina = "mediterranea";
  const have = Object.fromEntries(STYLES.map(([k]) => [k, 0]));
  $("cc-cocina").innerHTML = Object.entries(COCINAS).map(([k, [label]]) => `<button type="button" role="radio" class="cc-chip${k === cocina ? " on" : ""}" aria-checked="${k === cocina}" data-k="${k}">${esc(label)}</button>`).join("");
  $("cc-have").innerHTML = STYLES.map(([k, label, sub]) => `
    <div class="cc-stepper" data-k="${k}">
      <span class="cc-st-label"><b>${label}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>
      <span class="cc-st-ctrl"><button type="button" data-d="-1" aria-label="Uno menos de ${label}">−</button><output>0</output><button type="button" data-d="1" aria-label="Uno más de ${label}">+</button></span>
    </div>`).join("");
  $("cc-cocina").addEventListener("click", (e) => {
    const b = e.target.closest(".cc-chip");
    if (!b) return;
    cocina = b.dataset.k;
    document.querySelectorAll(".cc-chip").forEach((c) => { c.classList.toggle("on", c === b); c.setAttribute("aria-checked", c === b); });
    render();
  });
  $("cc-have").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (!b) return;
    const row = b.closest(".cc-stepper");
    have[row.dataset.k] = Math.max(0, Math.min(40, have[row.dataset.k] + Number(b.dataset.d)));
    row.querySelector("output").textContent = have[row.dataset.k];
    render();
  });
  $("cc-size").addEventListener("change", render);
  $("cc-cliente").addEventListener("input", render);
  $("cc-origen").addEventListener("change", render);
  $("cc-gama").addEventListener("change", render);

  // ---------- selección compartida con el catálogo ----------
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };
  const inSel = (id) => load().some((o) => o.id === id);
  function add(ids) {
    const o = load();
    ids.forEach((id) => { if (!o.some((y) => y.id === id)) o.push({ id, n: 1 }); });
    save(o);
    paintFab();
    render();
  }
  function paintFab() {
    const n = load().reduce((a, o) => a + o.n, 0);
    $("cc-n").textContent = n;
    $("cc-fab").hidden = n === 0;
    $("cc-fab").classList.toggle("has", n > 0);
  }
  $("cc-fab").addEventListener("click", () => (location.href = "catalogo.html?seleccion=1"));

  // ---------- propuesta ----------
  function suggest(tipo, n, pref, excl = new Set()) {
    // orden: el origen que pide el restaurante manda (+10); dentro, los que tienen ficha oficial o vídeo; dentro, los que tienen ficha oficial o vídeo; y una bodega distinta cada vez
    const gamas = $("cc-gama").value;
    const pool = WINES.filter((x) => x.t.tipo === tipo && !excl.has(x.id) && (gamas === "todas" || gamas.split(",").includes(x.t.gama)))
      .map((x) => ({ x, s: (pref === "todo" || origin(x) === pref ? 10 : 0) + (x.tech ? 1 : 0) + (x.video ? 1 : 0) }))
      .sort((a, b) => b.s - a.s || a.x.winery.name.localeCompare(b.x.winery.name) || a.x.name.localeCompare(b.x.name));
    const out = [], used = new Set();
    for (const pass of [0, 1, 2]) {
      for (const { x } of pool) {
        if (out.length >= n) break;
        if (out.includes(x) || (pass === 0 && used.has(x.winery.id))) continue;
        out.push(x);
        used.add(x.winery.id);
      }
    }
    return out;
  }

  // el plan: lo que tiene el cliente + lo que ya va en la propuesta (la selección) frente al reparto orientativo
  function plan() {
    const size = Number($("cc-size").value), pref = $("cc-origen").value, mix = COCINAS[cocina][1];
    const target = Object.fromEntries(STYLES.map(([k]) => [k, Math.max(k === "dulce" || k === "generoso" ? 1 : 0, Math.round((size * mix[k]) / 100))]));
    const sel = new Set(load().map((o) => o.id));
    const inProp = WINES.filter((x) => sel.has(x.id));
    const added = Object.fromEntries(STYLES.map(([k]) => [k, inProp.filter((x) => x.t.tipo === k).length]));
    const rows = STYLES.map(([k, label]) => {
      const gap = Math.max(0, target[k] - have[k] - added[k]);
      return { k, label, gap, list: gap ? suggest(k, gap, pref, sel) : [] };
    });
    return { size, pref, target, added, inProp, rows, gaps: rows.filter((r) => r.gap > 0) };
  }

  function render() {
    const { size, pref, target, added, inProp, gaps } = plan();
    const totalHave = Object.values(have).reduce((a, b) => a + b, 0);
    const max = Math.max(...STYLES.map(([k]) => Math.max(target[k], have[k] + added[k])), 1);
    const bars = STYLES.map(([k, label]) => `
      <div class="cc-bar">
        <span class="cc-bar-label">${label}</span>
        <span class="cc-bar-track">
          <i class="cc-bar-target" style="width:${(target[k] / max) * 100}%"></i>
          <i class="cc-bar-have" style="width:${(have[k] / max) * 100}%"></i>
          <i class="cc-bar-add" style="left:${(have[k] / max) * 100}%;width:${(added[k] / max) * 100}%"></i>
        </span>
        <span class="cc-bar-n"><b>${have[k] + added[k]}</b> / ${target[k]}</span>
      </div>`).join("");
    const missing = gaps.reduce((a, g) => a + g.gap, 0);
    const blocks = gaps.map((g) => `
        <div class="cc-gap">
          <h3>${g.label} <small>le ${g.gap === 1 ? "falta 1" : `faltan ${g.gap}`}</small></h3>
          ${g.list.length ? `<div class="cc-cards">${g.list.map((x) => `
            <article class="cc-card">
              <img src="${x.img_hd || x.img}" alt="" loading="lazy" />
              <div>
                <small>${esc(x.winery.name)} · ${esc(x.winery.do)}</small>
                <b>${esc(x.name)}</b>
                <span class="cc-src" title="${esc(x.t.motivo)}">${x.t.fuente && x.t.fuente.startsWith("http") ? "Ficha oficial" : x.t.fuente === "ficticio" ? "Ficha ficticia" : "Estilo por su denominación"}${x.t.crianza ? ` · ${esc(x.t.crianza)}` : ""}</span>
                <span class="cc-tags">${pref !== "todo" && origin(x) !== pref ? `<em class="cc-other">Otro origen: no hay más en esa gama</em>` : ""}${x.video ? `<a href="vino.html?id=${encodeURIComponent(x.id)}">Ficha y vídeo →</a>` : ""}<em class="cc-slot">Gama ${esc(x.t.gama)}</em></span>
              </div>
              <button type="button" class="cc-add" data-id="${x.id}" ${inSel(x.id) ? "disabled" : ""}>${inSel(x.id) ? "En tu selección" : "Añadir"}</button>
            </article>`).join("")}</div>` : `<p class="cc-empty">No quedan más vinos de este estilo con esos filtros.</p>`}
        </div>`).join("");
    const allIds = gaps.flatMap((g) => g.list.map((x) => x.id));
    $("cc-result").innerHTML = `
      <div class="cc-panel">
        <p class="kicker">${esc($("cc-cliente").value.trim() || "La carta del cliente")} · ${esc(COCINAS[cocina][0])} · ${size} referencias</p>
        <h2>${missing ? `Le faltan <em>${missing}</em> referencias` : "Su carta está <em>equilibrada</em>"}</h2>
        <p class="cc-legend"><i class="lg-have"></i> lo que tiene (${totalHave}) <i class="lg-add"></i> en la propuesta (${inProp.length}) <i class="lg-target"></i> reparto orientativo</p>
        ${bars}
      </div>
      ${blocks}
      <div class="cc-all">${allIds.length ? `<button type="button" class="btn solid" id="cc-add-all">Añadir las ${allIds.length} a la propuesta</button>` : ""}${inProp.length || allIds.length ? `<button type="button" class="btn" id="cc-share">Compartir la propuesta</button>` : ""}${inProp.length ? `<a class="btn" href="catalogo.html?seleccion=1">Ver la propuesta (${inProp.length})</a>` : ""}</div>`;
  }

  $("cc-result").addEventListener("click", (e) => {
    const b = e.target.closest(".cc-add");
    if (b) return add([b.dataset.id]);
    if (e.target.id === "cc-share") {
      const { size, inProp, gaps } = plan();
      const cli = $("cc-cliente").value.trim();
      // lo que ya va en la propuesta; si aún no hay nada, las sugerencias
      const wines = inProp.length ? inProp : gaps.flatMap((g) => g.list);
      const lines = STYLES.map(([k, label]) => {
        const list = wines.filter((x) => x.t.tipo === k);
        return list.length ? `${label}:\n${list.map((x) => `· ${x.name} (${x.winery.name}, ${x.winery.do})`).join("\n")}` : "";
      }).filter(Boolean);
      const text = `Propuesta de vinos${cli ? ` para ${cli}` : ""} · Celobert Vins\nCocina: ${COCINAS[cocina][0]} · carta de ${size} referencias\n\n${lines.join("\n\n")}\n\nDisfruta de un consumo responsable.`;
      if (navigator.share) navigator.share({ title: "Propuesta de vinos", text }).catch(() => {});
      else navigator.clipboard?.writeText(text).then(() => { e.target.textContent = "Copiada ✓"; setTimeout(() => (e.target.textContent = "Compartir la propuesta"), 2000); });
      return;
    }
    if (e.target.id === "cc-add-all") add(plan().gaps.flatMap((g) => g.list.map((x) => x.id)));
  });

  paintFab();
  render();
})();
