// Buscador avanzado: filtros combinables con contadores en vivo (cada filtro cuenta con los demás aplicados),
// el estado en la URL (se puede compartir una búsqueda) y «Añadir a la propuesta» (la misma selección que el catálogo,
// que luego monta la propuesta visual en propuesta.html). Los datos y su procedencia salen de fichas.js.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ALL, norm } = window.FICHAS;
  const KEY = "celobert-seleccion";
  const PEND = "Pendiente de ficha";

  // cada grupo: clave en la URL, título, cómo saca los valores de un vino, orden y nota
  const GROUPS = [
    { k: "tipo", t: "Tipo", get: (w) => [w.tipoLabel || PEND], order: ["Espumoso", "Blanco", "Rosado", "Tinto", "Generoso", "Dulce", "Destilado o vermut", PEND] },
    { k: "zona", t: "Zona de reparto", get: (w) => w.zones, order: ["Barcelona", "Girona", "Tarragona", "Madrid"] },
    { k: "pais", t: "País", get: (w) => [w.country] },
    { k: "do", t: "Denominación", get: (w) => [w.do], scroll: true },
    { k: "bodega", t: "Elaborador", get: (w) => [w.winery], scroll: true, find: true },
    { k: "uva", t: "Uva", get: (w) => (w.uvas.length ? w.uvas : []), scroll: true, note: "Solo los vinos con la uva en la ficha oficial o en el nombre." },
    { k: "gama", t: "Gama de precio", get: (w) => (w.gama ? [w.gama[0].toUpperCase() + w.gama.slice(1)] : []), order: ["Entrada", "Media", "Alta"] },
    { k: "formato", t: "Formato", get: (w) => [w.formato], order: ["75 cl", "Magnum 1,5 l", "50 cl", "37,5 cl"] },
    { k: "extra", t: "Material", get: (w) => [...(w.tech ? ["Con ficha técnica oficial"] : []), ...(w.video ? ["Con vídeo"] : [])] },
  ];
  const state = Object.fromEntries(GROUPS.map((g) => [g.k, new Set()]));
  let q = "";
  const finds = {};

  // estado ↔ URL
  const params = new URLSearchParams(location.search);
  GROUPS.forEach((g) => params.getAll(g.k).forEach((v) => state[g.k].add(v)));
  q = params.get("q") || "";
  $("bs-q").value = q;
  const pushURL = () => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    GROUPS.forEach((g) => state[g.k].forEach((v) => p.append(g.k, v)));
    history.replaceState(null, "", `${location.pathname}${p.toString() ? `?${p}` : ""}`);
  };

  const matches = (w, skip) => (!q || norm(q).split(/\s+/).every((t) => w.search.includes(t))) &&
    GROUPS.every((g) => g.k === skip || !state[g.k].size || g.get(w).some((v) => state[g.k].has(v)));

  // selección compartida (la propuesta)
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} };
  const inSel = (id) => load().some((o) => o.id === id);
  const paintFab = () => {
    const n = load().length;
    $("pp-n").textContent = n;
    $("pp-fab").hidden = !n;
    $("pp-fab").classList.toggle("has", n > 0);
  };
  $("pp-fab").addEventListener("click", () => (location.href = "propuesta.html"));

  function facets() {
    $("bs-groups").innerHTML = GROUPS.map((g) => {
      const counts = {};
      ALL.filter((w) => matches(w, g.k)).forEach((w) => g.get(w).forEach((v) => (counts[v] = (counts[v] || 0) + 1)));
      const all = new Set([...Object.keys(counts), ...state[g.k]]);
      let vals = [...all];
      vals.sort((a, b) => (g.order ? (g.order.indexOf(a) + 1 || 99) - (g.order.indexOf(b) + 1 || 99) : 0) || (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b));
      if (g.find && finds[g.k]) vals = vals.filter((v) => norm(v).includes(norm(finds[g.k])) || state[g.k].has(v));
      if (!vals.length && !g.find) return "";
      return `
        <fieldset class="bs-group" data-g="${g.k}">
          <legend class="bs-gtitle">${g.t}${state[g.k].size ? ` <em>${state[g.k].size}</em>` : ""}</legend>
          ${g.find ? `<input class="bs-find" data-find="${g.k}" placeholder="Buscar ${g.t.toLowerCase()}…" value="${esc(finds[g.k] || "")}" />` : ""}
          <div class="bs-opts${g.scroll ? " scroll" : ""}">
            ${vals.map((v) => `<label class="bs-opt${counts[v] ? "" : " zero"}${v === PEND ? " pend" : ""}"><input type="checkbox" data-k="${g.k}" value="${esc(v)}" ${state[g.k].has(v) ? "checked" : ""} /><span>${esc(v)}</span><small>${counts[v] || 0}</small></label>`).join("")}
          </div>
          ${g.note ? `<p class="bs-note">${g.note}</p>` : ""}
        </fieldset>`;
    }).join("");
  }

  function results() {
    const sort = $("bs-sort").value;
    const list = ALL.filter((w) => matches(w));
    list.sort((a, b) => sort === "nombre" ? a.name.localeCompare(b.name)
      : sort === "ficha" ? (b.video - a.video) || (b.tech - a.tech) || a.winery.localeCompare(b.winery)
      : a.winery.localeCompare(b.winery) || a.name.localeCompare(b.name));
    const active = GROUPS.reduce((n, g) => n + state[g.k].size, 0) + (q ? 1 : 0);
    $("bs-count").innerHTML = `<b>${list.length}</b> ${list.length === 1 ? "vino" : "vinos"} de ${ALL.length}`;
    $("bs-nf").textContent = active || "";
    $("bs-apply").textContent = `Ver ${list.length} ${list.length === 1 ? "vino" : "vinos"}`;
    $("bs-chips").innerHTML = [...(q ? [["q", q]] : []), ...GROUPS.flatMap((g) => [...state[g.k]].map((v) => [g.k, v]))]
      .map(([k, v]) => `<button type="button" class="bs-chip" data-k="${k}" data-v="${esc(v)}">${esc(v)} <span aria-hidden="true">×</span></button>`).join("");
    $("bs-empty").hidden = list.length > 0;
    $("bs-grid").innerHTML = list.slice(0, 120).map((w) => `
      <article class="bs-card">
        <a class="bs-img" href="vino.html?id=${encodeURIComponent(w.id)}"><img src="${w.img}" alt="" loading="lazy" decoding="async" /></a>
        <div class="bs-body">
          <small>${esc(w.winery)}</small>
          <a class="bs-name" href="vino.html?id=${encodeURIComponent(w.id)}">${esc(w.name)}</a>
          <p class="bs-meta">${esc(w.do)} · ${esc(w.country)}</p>
          <p class="bs-tags">${w.tipoLabel ? `<span class="t-${w.tipo}">${w.tipoLabel}${w.crianza ? ` · ${esc(w.crianza)}` : ""}</span>` : `<span class="pend">Tipo pendiente</span>`}<span>${esc(w.formato)}</span>${w.gama ? `<span>Gama ${esc(w.gama)}</span>` : ""}${w.video ? `<span class="v">▶ Vídeo</span>` : ""}</p>
          ${w.uvas.length ? `<p class="bs-uvas">${esc(w.uvas.join(", "))}</p>` : ""}
        </div>
        <button type="button" class="bs-add" data-id="${w.id}" ${inSel(w.id) ? "aria-pressed=\"true\"" : ""}>${inSel(w.id) ? "✓ En la propuesta" : "+ Propuesta"}</button>
      </article>`).join("") + (list.length > 120 ? `<p class="bs-more">Y ${list.length - 120} más: afina con los filtros.</p>` : "");
  }

  const render = () => { facets(); results(); pushURL(); };
  $("bs-groups").addEventListener("change", (e) => {
    const c = e.target.closest("input[type=checkbox]");
    if (!c) return;
    c.checked ? state[c.dataset.k].add(c.value) : state[c.dataset.k].delete(c.value);
    render();
  });
  $("bs-groups").addEventListener("input", (e) => {
    const f = e.target.closest("[data-find]");
    if (!f) return;
    finds[f.dataset.find] = f.value;
    const pos = f.selectionStart;
    facets();
    const again = document.querySelector(`[data-find="${f.dataset.find}"]`);
    again.focus();
    again.setSelectionRange(pos, pos);
  });
  $("bs-q").addEventListener("input", () => { q = $("bs-q").value.trim(); render(); });
  $("bs-sort").addEventListener("change", results);
  $("bs-chips").addEventListener("click", (e) => {
    const b = e.target.closest(".bs-chip");
    if (!b) return;
    if (b.dataset.k === "q") { q = ""; $("bs-q").value = ""; } else state[b.dataset.k].delete(b.dataset.v);
    render();
  });
  const clear = () => { GROUPS.forEach((g) => state[g.k].clear()); q = ""; $("bs-q").value = ""; render(); };
  $("bs-clear").addEventListener("click", clear);
  $("bs-clear2").addEventListener("click", clear);
  $("bs-grid").addEventListener("click", (e) => {
    const b = e.target.closest(".bs-add");
    if (!b) return;
    const o = load();
    const i = o.findIndex((y) => y.id === b.dataset.id);
    i >= 0 ? o.splice(i, 1) : o.push({ id: b.dataset.id, n: 1 });
    save(o);
    b.setAttribute("aria-pressed", i < 0);
    b.textContent = i < 0 ? "✓ En la propuesta" : "+ Propuesta";
    paintFab();
  });
  // móvil: los filtros en un panel que sube
  $("bs-open").addEventListener("click", () => document.body.classList.add("bs-filters-open"));
  $("bs-close").addEventListener("click", () => document.body.classList.remove("bs-filters-open"));
  $("bs-apply").addEventListener("click", () => { document.body.classList.remove("bs-filters-open"); $("bs-count").scrollIntoView({ block: "start" }); });

  paintFab();
  render();
})();
