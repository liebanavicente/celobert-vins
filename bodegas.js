// Sección «Bodegas»: el índice (bodegas.html) y la ficha de cada una (bodega.html?id=…). Solo información y fotos:
// textos de cada bodega (en Celobert, ficticios), foto de la bodega si la hay y sus vinos con su tipo
// (fichas.js). Si una bodega no tiene foto, la cabecera enseña sus botellas.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const C = window.CATALOG || [];
  const F = window.FICHAS || { byId: {}, norm: (s) => s.toLowerCase(), TIPOS: {} };
  const { byId, norm } = F;
  const ORDER = ["espumoso", "blanco", "rosado", "tinto", "generoso", "dulce", "otros"];
  const PLURAL = { espumoso: "espumosos", blanco: "blancos", rosado: "rosados", tinto: "tintos", generoso: "generosos", dulce: "dulces", otros: "destilados y vermuts" };
  const shortDO = (s) => s.replace(/^(DOQ|DOCa|DO|AOC|DOC)\s+/, "");
  const wines = (b) => b.wines.map((x) => ({ ...x, f: byId[x.id] || {} }));
  const tipoCount = (b) => {
    const n = {};
    wines(b).forEach((w) => { const t = w.f.tipo; if (t) n[t] = (n[t] || 0) + 1; });
    return ORDER.filter((t) => n[t]).map((t) => `${n[t]} ${n[t] === 1 ? PLURAL[t].replace(/s$/, "").replace(/destilados y vermut$/, "destilado o vermut") : PLURAL[t]}`);
  };
  const bottles = (b, n = 5) => wines(b).slice(0, n).map((w) => `<img src="${w.img_hd || w.img}" alt="" loading="lazy" decoding="async" />`).join("");

  // ---------- índice ----------
  if ($("bd-grid")) {
    const countries = [...new Set(C.map((b) => b.country))].sort((a, b) => (a === "España" ? -1 : b === "España" ? 1 : a.localeCompare(b)));
    const zones = ["Barcelona", "Girona", "Tarragona", "Madrid"];
    const st = { q: "", pais: "", zona: "" };
    $("bd-total").textContent = C.length;
    $("bd-paises").innerHTML = [["", "Todas"], ...countries.map((c) => [c, c])].map(([v, l]) => `<button type="button" class="bd-chip${v === st.pais ? " on" : ""}" data-pais="${esc(v)}">${esc(l)}</button>`).join("");
    $("bd-zona").innerHTML = `<option value="">Todas las zonas de reparto</option>` + zones.map((z) => `<option>${z}</option>`).join("");
    const card = (b) => `
      <a class="bd-card" href="bodega.html?id=${encodeURIComponent(b.id)}">
        <span class="bd-photo">${b.photo ? `<img src="${b.photo}" alt="" loading="lazy" decoding="async" />` : `<span class="bd-bottles">${bottles(b, 4)}</span>`}</span>
        <span class="bd-text">
          <small>${esc(shortDO(b.do))} · ${esc(b.country)}</small>
          <b>${esc(b.name)}</b>
          ${b.summary ? `<span class="bd-sum">${esc(b.summary)}</span>` : ""}
          <em>${b.wines.length} ${b.wines.length === 1 ? "vino" : "vinos"} →</em>
        </span>
      </a>`;
    const render = () => {
      const q = norm(st.q.trim());
      const list = C.filter((b) => (!st.pais || b.country === st.pais) && (!st.zona || (b.zones || []).includes(st.zona)) &&
        (!q || q.split(/\s+/).every((t) => norm(`${b.name} ${b.do} ${b.country} ${b.summary || ""}`).includes(t))));
      const groups = countries.map((c) => [c, list.filter((b) => b.country === c).sort((a, b) => a.name.localeCompare(b.name))]).filter(([, l]) => l.length);
      $("bd-count").textContent = `${list.length} ${list.length === 1 ? "bodega" : "bodegas"}`;
      $("bd-grid").innerHTML = groups.length ? groups.map(([c, l]) => `
        <section class="bd-group"><h2>${esc(c)} <small>${l.length}</small></h2><div class="bd-cards">${l.map(card).join("")}</div></section>`).join("")
        : `<p class="bd-empty">Ninguna bodega con esos filtros.</p>`;
    };
    $("bd-paises").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pais]");
      if (!b) return;
      st.pais = b.dataset.pais;
      document.querySelectorAll("[data-pais]").forEach((x) => x.classList.toggle("on", x === b));
      render();
    });
    $("bd-zona").addEventListener("change", () => { st.zona = $("bd-zona").value; render(); });
    $("bd-q").addEventListener("input", () => { st.q = $("bd-q").value; render(); });
    render();
  }

  // ---------- ficha de una bodega ----------
  if ($("bd-ficha")) {
    const id = new URLSearchParams(location.search).get("id");
    const b = C.find((x) => x.id === id) || C[0];
    document.title = `${b.name} · Bodegas · Celobert Vins (portfolio)`;
    const ws = wines(b);
    const byTipo = ORDER.map((t) => [t, ws.filter((w) => w.f.tipo === t)]).filter(([, l]) => l.length);
    const sinTipo = ws.filter((w) => !w.f.tipo);
    const story = Array.isArray(b.story) ? b.story : b.story ? [b.story] : [];
    const others = C.filter((x) => x.id !== b.id && (x.do === b.do || x.country === b.country)).sort((x, y) => (y.do === b.do) - (x.do === b.do)).slice(0, 4);
    const wineCard = (w) => `
      <a class="bd-wine" href="vino.html?id=${encodeURIComponent(w.id)}">
        <span class="bd-wine-img"><img src="${w.img_hd || w.img}" alt="" loading="lazy" decoding="async" /></span>
        <b>${esc(w.name)}</b>
        <small>${[w.f.crianza, w.f.formato && w.f.formato !== "75 cl" ? w.f.formato : "", w.f.uvas && w.f.uvas.length ? w.f.uvas.join(", ") : ""].filter(Boolean).map(esc).join(" · ")}</small>
      </a>`;
    $("bd-ficha").innerHTML = `
      <section class="bd-hero wrap">
        <div class="bd-hero-text">
          <p class="crumbs"><a href="bodegas.html">Bodegas</a> › ${esc(b.name)}</p>
          <p class="kicker">${esc(b.do)} · ${esc(b.country)}</p>
          <h1>${esc(b.name)}</h1>
          ${b.summary ? `<p class="lead">${esc(b.summary)}</p>` : ""}
          <dl class="bd-facts">
            <div><dt>Vinos en el catálogo</dt><dd>${ws.length}</dd></div>
            ${tipoCount(b).length ? `<div><dt>Estilos</dt><dd>${esc(tipoCount(b).join(" · "))}</dd></div>` : ""}
            <div><dt>Disponible en</dt><dd>${esc((b.zones || []).join(" · "))}</dd></div>
          </dl>
          <div class="btns"><a class="btn solid" href="#vinos">Ver sus vinos</a><a class="btn" href="catalogo.html?bodega=${encodeURIComponent(b.id)}">En el catálogo</a></div>
        </div>
        <figure class="bd-hero-photo${b.photo ? "" : " no-photo"}">
          ${b.photo ? `<img src="${b.photo}" alt="${esc(b.name)}" />` : `<span class="bd-bottles big">${bottles(b, 6)}</span>`}
          <figcaption>${b.photo ? "Foto de la bodega" : "Sus vinos (botellas dibujadas)"}</figcaption>
        </figure>
      </section>

      ${story.length ? `
      <section class="bd-story wrap">
        <p class="bd-label">La bodega</p>
        <div class="bd-story-text">${story.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
        <p class="cat-source">Texto: ${esc(b.story_src || "texto ficticio")}.</p>
      </section>` : ""}

      <section class="bd-wines wrap" id="vinos">
        <div class="bd-wines-head"><p class="bd-label">Sus vinos</p><h2>${ws.length} ${ws.length === 1 ? "vino" : "vinos"} de ${esc(b.name)}</h2></div>
        ${byTipo.map(([t, l]) => `<h3 class="bd-tipo">${PLURAL[t][0].toUpperCase() + PLURAL[t].slice(1)} <small>${l.length}</small></h3><div class="bd-wine-grid">${l.map(wineCard).join("")}</div>`).join("")}
        ${sinTipo.length ? `<h3 class="bd-tipo">${byTipo.length ? "Más vinos" : "Vinos"} <small>${sinTipo.length}</small></h3><div class="bd-wine-grid">${sinTipo.map(wineCard).join("")}</div>` : ""}
      </section>

      ${others.length ? `
      <section class="bd-others wrap">
        <p class="bd-label">${others.some((x) => x.do === b.do) ? `Más bodegas de ${esc(shortDO(b.do))} y de ${esc(b.country)}` : `Más bodegas de ${esc(b.country)}`}</p>
        <div class="bd-cards small">${others.map((x) => `
          <a class="bd-card" href="bodega.html?id=${encodeURIComponent(x.id)}">
            <span class="bd-photo">${x.photo ? `<img src="${x.photo}" alt="" loading="lazy" />` : `<span class="bd-bottles">${bottles(x, 4)}</span>`}</span>
            <span class="bd-text"><small>${esc(shortDO(x.do))}</small><b>${esc(x.name)}</b></span>
          </a>`).join("")}</div>
        <a class="btn" href="bodegas.html">Todas las bodegas</a>
      </section>` : ""}`;
  }
})();
