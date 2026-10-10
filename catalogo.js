// Catálogo vivo: buscador, filtros (las botellas se recolocan con GSAP Flip), ficha rápida de cada vino
// y «Mi pedido» (se guarda en este navegador y se envía al comercial o se descarga en PDF).
(() => {
  const C = window.CATALOG;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const G = window.gsap;
  const motion = G && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (G && window.Flip) G.registerPlugin(Flip);

  // índice de vinos
  const WINES = C.flatMap((w) => w.wines.map((x) => ({ ...x, winery: w, search: norm(`${x.name} ${w.name} ${w.do} ${w.country}`) })));
  const byId = Object.fromEntries(WINES.map((x) => [x.id, x]));

  // ---------- zonas ----------
  const ZONES = ["Barcelona", "Girona", "Tarragona", "Madrid"];
  const zone = ZONES.find((z) => norm(z) === norm(new URLSearchParams(location.search).get("zona") || "")) || "Barcelona";
  $("zone-name").textContent = zone;
  $("zone-tabs").innerHTML = ZONES.map((z) => `<a href="?zona=${norm(z)}" class="${z === zone ? "on" : ""}">${z}</a>`).join("");
  // cada zona tiene su catálogo (los cuatro PDF de 2022): se ven solo sus vinos
  $("o-zone").value = zone;
  $("cat-count").textContent = WINES.filter((x) => (x.zones || x.winery.zones || []).includes(zone)).length;
  $("cat-wineries").textContent = C.filter((w) => (w.zones || []).includes(zone)).length;


  // ---------- fichas completas (los vinos de la propuesta, con vídeo) ----------
  const FULL = window.WINES || [];
  const FEAT = window.featuredList ? window.featuredList() : [];
  $("cat-featured").innerHTML = FEAT.length
    ? `<div class="feat-head"><p class="kicker">Destacados · con vídeo</p><p class="hint">Así sería la ficha de cada vino del catálogo.</p></div>
       <div class="feat-row">${FEAT.map((w) => `<a class="feat" href="${w.href}"><img src="${w.thumb}" alt="" class="${w.multiply ? "multiply" : ""}" loading="lazy" /><span><small>${esc(w.winery)}</small><b>${esc(w.name)}</b><em>Ficha y vídeo →</em></span></a>`).join("")}</div>`
    : "";

  // ---------- filtros ----------
  const params = new URLSearchParams(location.search);
  const startWinery = C.find((w) => w.id === params.get("bodega"));
  const state = { q: norm((params.get("q") || "").trim()), country: "", do: "", winery: startWinery ? startWinery.name : "", view: "bodegas", zone };
  if (params.get("q")) $("q").value = params.get("q");
  const countries = [...new Set(C.map((w) => w.country))];
  $("f-country").innerHTML = [`<button type="button" data-c="" class="on">Todos</button>`, ...countries.map((c) => `<button type="button" data-c="${esc(c)}">${esc(c)}</button>`)].join("");
  const opts = (sel, label, values) => ($(sel).innerHTML = `<option value="">${label}</option>` + values.map((v) => `<option>${esc(v)}</option>`).join(""));
  opts("f-do", "Todas las denominaciones", [...new Set(C.map((w) => w.do))].sort((a, b) => a.localeCompare(b, "es")));
  opts("f-winery", "Todas las bodegas", [...new Set(C.map((w) => w.name))].sort((a, b) => a.localeCompare(b, "es")));

  const inZone = (x) => (x.zones || x.winery.zones || []).includes(state.zone);
  const visible = (x) =>
    inZone(x) &&
    (!state.q || state.q.split(/\s+/).every((t) => x.search.includes(t))) &&
    (!state.country || x.winery.country === state.country) &&
    (!state.do || x.winery.do === state.do) &&
    (!state.winery || x.winery.name === state.winery);

  // ---------- pintar ----------
  const card = (x, showWinery) => `
    <button type="button" class="bottle-card" data-wine="${x.id}" data-flip-id="${x.id}">
      <span class="bimg"><img src="${x.img}" alt="" loading="lazy" decoding="async" /></span>
      <span class="bname">${esc(x.name)}</span>${showWinery ? `<small>${esc(x.winery.name)}</small>` : ""}
    </button>`;

  function render() {
    const res = $("results");
    if (state.view === "bodegas") {
      res.className = "wrap by-winery";
      res.innerHTML = C.map((w) => `
        <article class="winery" data-winery="${esc(w.id)}" data-flip-id="w-${esc(w.id)}">
          <header class="winery-head">
            ${w.photo ? `<span class="wphoto" style="background-image:url('${w.photo}')"></span>` : `<span class="wphoto empty"></span>`}
            <span class="wtext"><b>${esc(w.name)}</b><small>${esc(w.do)} · ${esc(w.country)}</small>${w.summary ? `<em class="wsum">${esc(w.summary)}</em>` : ""}</span>
            ${w.reel ? `<button type="button" class="reel-btn" data-reel="${esc(w.id)}"><span>▶</span> Reel de la bodega</button>` : ""}
            <span class="wcount"><span class="n">${w.wines.length}</span> vinos</span>
          </header>
          <div class="bottles">${w.wines.map((x) => card(WINES.find((y) => y.id === x.id), false)).join("")}</div>
        </article>`).join("");
    } else {
      res.className = "wrap all-bottles";
      res.innerHTML = `<div class="bottles grid">${WINES.map((x) => card(x, true)).join("")}</div>`;
    }
    applyFilter(false);
    if (motion) G.from("#results .bottle-card:not(.hide)", { autoAlpha: 0, y: 30, duration: 0.5, stagger: { each: 0.008, from: "start" }, ease: "power2.out", clearProps: "transform" });
  }

  function applyFilter(animate = true) {
    const flipState = animate && motion && window.Flip ? Flip.getState("#results .bottle-card, #results .winery") : null;
    let n = 0;
    document.querySelectorAll("#results .bottle-card").forEach((el) => {
      const on = visible(byId[el.dataset.wine]);
      el.classList.toggle("hide", !on);
      if (on) n++;
    });
    document.querySelectorAll("#results .winery").forEach((sec) => {
      const shown = sec.querySelectorAll(".bottle-card:not(.hide)").length;
      sec.classList.toggle("hide", !shown);
      sec.querySelector(".wcount .n").textContent = shown;
    });
    $("cat-count").textContent = n;
    $("cat-wineries").textContent = document.querySelectorAll("#results .winery:not(.hide)").length || new Set(WINES.filter(visible).map((x) => x.winery.name)).size;
    $("cat-empty").hidden = n > 0;
    if (flipState) {
      Flip.from(flipState, {
        duration: 0.55,
        ease: "power2.inOut",
        absolute: false,
        nested: true,
        onEnter: (els) => G.fromTo(els, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.45 }),
        onLeave: (els) => G.to(els, { autoAlpha: 0, scale: 0.85, duration: 0.3 }),
      });
    }
  }

  let t;
  $("q").addEventListener("input", (e) => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = norm(e.target.value.trim());
      applyFilter();
    }, 160);
  });
  $("f-country").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.country = b.dataset.c;
    $("f-country").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    applyFilter();
  });
  $("f-do").addEventListener("change", (e) => ((state.do = e.target.value), applyFilter()));
  $("f-winery").addEventListener("change", (e) => ((state.winery = e.target.value), applyFilter()));
  document.querySelectorAll(".toggle button").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.view === b.dataset.view) return;
      state.view = b.dataset.view;
      document.querySelectorAll(".toggle button").forEach((x) => x.classList.toggle("on", x === b));
      render();
    }),
  );
  $("clear").addEventListener("click", () => {
    Object.assign(state, { q: "", country: "", do: "", winery: "" });
    $("q").value = "";
    $("f-do").value = $("f-winery").value = "";
    $("f-country").querySelectorAll("button").forEach((x, i) => x.classList.toggle("on", i === 0));
    applyFilter();
  });

  // ---------- ficha rápida ----------
  let current = null, qty = 6;
  const fullFor = (x) => FULL.find((w) => norm(w.name).includes(norm(x.name)) && norm(w.winery) === norm(x.winery.name));
  function openWine(id) {
    const x = byId[id];
    if (!x) return;
    current = x;
    qty = 6;
    $("m-img").src = x.img;
    $("m-img").alt = `Botella de ${x.name}`;
    $("m-do").textContent = `${x.winery.do} · ${x.winery.country}`;
    $("m-name").textContent = x.name;
    $("m-winery").textContent = x.winery.name;
    const fmt = /magnum/i.test(x.name) ? "Magnum 1,5 l" : /50 cl/i.test(x.name) ? "50 cl" : "75 cl";
    $("m-chips").innerHTML = [x.winery.country, fmt].map((c) => `<span class="chip">${esc(c)}</span>`).join("");
    $("m-qty").textContent = qty;
    $("m-ok").hidden = true;
    const full = fullFor(x);
    $("m-ficha").hidden = false;
    $("m-ficha").textContent = full ? "Ver ficha completa y vídeo" : x.tech ? "Ver ficha técnica" : "Ver ficha del vino";
    $("m-ficha").href = `vino.html?id=${encodeURIComponent(full ? full.id : x.id)}`;
    const m = $("modal");
    m.hidden = false;
    $("scrim").hidden = false;
    document.body.classList.add("locked");
    if (motion) {
      G.fromTo(".modal-card", { autoAlpha: 0, y: 40, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" });
      G.fromTo("#m-img", { yPercent: 20, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, delay: 0.1, ease: "power3.out" });
      G.fromTo("#scrim", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
    }
  }
  function closeModal() {
    const end = () => {
      $("modal").hidden = true;
      if ($("order").hidden) {
        $("scrim").hidden = true;
        document.body.classList.remove("locked");
      }
    };
    motion ? G.to(".modal-card", { autoAlpha: 0, y: 30, duration: 0.25, onComplete: end }) : end();
  }
  document.addEventListener("click", (e) => {
    const r = e.target.closest("[data-reel]");
    if (r) openReel(r.dataset.reel);
  });
  $("results").addEventListener("click", (e) => {
    if (e.target.closest("[data-reel]")) return;
    const b = e.target.closest(".bottle-card");
    if (b) openWine(b.dataset.wine);
  });
  $("modal-close").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => e.target.id === "modal" && closeModal());
  $("m-minus").addEventListener("click", () => ($("m-qty").textContent = qty = Math.max(1, qty - 1)));
  $("m-plus").addEventListener("click", () => ($("m-qty").textContent = qty = qty + 1));
  $("m-sheet").addEventListener("click", () => {
    $("m-ok").hidden = false;
    $("m-ok").textContent = "Prototipo: te enviaríamos la ficha técnica de la bodega a tu correo.";
  });

  // ---------- reel de una bodega ----------
  function openReel(id) {
    const w = C.find((x) => x.id === id);
    if (!w || !w.reel) return;
    $("reel-name").textContent = w.name;
    $("reel-do").textContent = `${w.do} · ${w.country}`;
    const v = $("reel-video");
    v.src = w.reel.src;
    v.poster = w.reel.poster;
    $("reel-dl").innerHTML = [["9x16", "Vídeo vertical 9:16", "Reels, Stories, TikTok, WhatsApp"], ["4x5", "Vídeo 4:5", "Feed de Instagram y LinkedIn"]]
      .filter(([k]) => w.reel.downloads[k])
      .map(([k, t, d]) => `<a class="dl" href="${w.reel.downloads[k]}" download><div><b>${t}</b><small>${d}</small></div><span class="go">Descargar ↓</span></a>`)
      .join("");
    $("reel").hidden = false;
    $("scrim").hidden = false;
    document.body.classList.add("locked");
    v.play().catch(() => {});
    if (motion) {
      G.fromTo(".reel-card", { autoAlpha: 0, y: 40, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" });
      G.fromTo(".reel-phone .phone", { x: -60, rotation: -5, autoAlpha: 0 }, { x: 0, rotation: 0, autoAlpha: 1, duration: 0.7, delay: 0.1, ease: "power3.out" });
      G.from("#reel-dl .dl", { x: 30, autoAlpha: 0, stagger: 0.08, duration: 0.4, delay: 0.3 });
    }
  }
  function closeReel() {
    const v = $("reel-video");
    v.pause();
    const end = () => {
      $("reel").hidden = true;
      v.removeAttribute("src");
      v.load();
      if ($("order").hidden && $("modal").hidden) {
        $("scrim").hidden = true;
        document.body.classList.remove("locked");
      }
    };
    motion ? G.to(".reel-card", { autoAlpha: 0, y: 30, duration: 0.25, onComplete: end }) : end();
  }
  $("reel-close").addEventListener("click", closeReel);
  $("reel").addEventListener("click", (e) => e.target.id === "reel" && closeReel());

  // ---------- mi pedido ----------
  const KEY = "celobert-seleccion";
  let order = [];
  try {
    order = JSON.parse(localStorage.getItem(KEY) || "[]").filter((o) => byId[o.id]);
  } catch {}
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(order));
    } catch {}
  };
  function paintOrder(bump = false) {
    const total = order.reduce((a, o) => a + o.n, 0);
    $("order-n").textContent = total;
    $("order-fab").classList.toggle("has", total > 0);
    if (bump && motion) G.fromTo("#order-n", { scale: 1.8 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    $("order-list").innerHTML = order.length
      ? order
          .map((o) => {
            const x = byId[o.id];
            return `<div class="o-row" data-id="${o.id}"><img src="${x.img}" alt="" /><span><b>${esc(x.name)}</b><small>${esc(x.winery.name)}</small></span>
              <span class="qty"><button type="button" data-d="-1" aria-label="Menos">−</button><span>${o.n}</span><button type="button" data-d="1" aria-label="Más">+</button></span>
              <button type="button" class="x" data-del aria-label="Quitar">×</button></div>`;
          })
          .join("")
      : `<p class="hint empty">Todavía no has añadido vinos. Pulsa una botella y «Añadir a mi selección».</p>`;
    $("order-foot").hidden = !order.length;
  }
  $("m-add").addEventListener("click", () => {
    const o = order.find((y) => y.id === current.id);
    o ? (o.n += qty) : order.push({ id: current.id, n: qty });
    save();
    paintOrder(true);
    $("m-ok").hidden = false;
    $("m-ok").textContent = `Añadido: ${qty} botellas. Lo tienes en «Mi selección».`;
    if (motion) {
      // la botella «vuela» hacia el botón del pedido
      const a = $("m-img").getBoundingClientRect(), b = $("order-fab").getBoundingClientRect();
      const ghost = $("m-img").cloneNode();
      Object.assign(ghost.style, { position: "fixed", left: a.left + "px", top: a.top + "px", height: a.height + "px", zIndex: 200, pointerEvents: "none" });
      document.body.append(ghost);
      G.to(ghost, { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top - a.top - a.height / 2, scale: 0.12, rotation: 25, autoAlpha: 0.2, duration: 0.8, ease: "power2.in", onComplete: () => ghost.remove() });
    }
  });
  $("order-list").addEventListener("click", (e) => {
    const row = e.target.closest(".o-row");
    if (!row) return;
    const o = order.find((y) => y.id === row.dataset.id);
    if (e.target.dataset.d) o.n = Math.max(1, o.n + Number(e.target.dataset.d));
    if (e.target.hasAttribute("data-del")) order = order.filter((y) => y !== o);
    save();
    paintOrder();
  });
  function openOrder() {
    $("order").hidden = false;
    $("scrim").hidden = false;
    document.body.classList.add("locked");
    if (motion) {
      G.fromTo("#order", { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: "power3.out" });
      G.from("#order .o-row", { x: 40, autoAlpha: 0, stagger: 0.05, duration: 0.35, delay: 0.15 });
    }
  }
  function closeOrder() {
    const end = () => {
      $("order").hidden = true;
      if ($("modal").hidden) {
        $("scrim").hidden = true;
        document.body.classList.remove("locked");
      }
    };
    motion ? G.to("#order", { xPercent: 100, duration: 0.3, ease: "power2.in", onComplete: end }) : end();
  }
  $("order-fab").addEventListener("click", () => (closeModalIfOpen(), openOrder()));
  const closeModalIfOpen = () => !$("modal").hidden && ($("modal").hidden = true);
  $("order-close").addEventListener("click", closeOrder);
  $("scrim").addEventListener("click", () => (!$("reel").hidden ? closeReel() : !$("order").hidden ? closeOrder() : closeModal()));
  addEventListener("keydown", (e) => e.key === "Escape" && (!$("reel").hidden ? closeReel() : !$("modal").hidden ? closeModal() : !$("order").hidden && closeOrder()));
  $("o-send").addEventListener("click", () => {
    $("o-ok").hidden = false;
    $("o-ok").textContent = "Prototipo: tu selección llegaría al comercial de tu zona, con copia a tu correo.";
  });

  // ---------- PDF (imprimir): el catálogo filtrado o solo el pedido ----------
  $("print-cat").addEventListener("click", () => {
    document.body.classList.remove("print-order");
    document.querySelectorAll("#results img").forEach((i) => (i.loading = "eager")); // que salgan todas las fotos
    setTimeout(() => print(), 400);
  });
  $("o-print").addEventListener("click", () => {
    document.body.classList.add("print-order");
    print();
    setTimeout(() => document.body.classList.remove("print-order"), 500);
  });

  $("print-date").textContent = `Catálogo generado el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} · Celobert Vins (ficticia)`;
  render();
  paintOrder();
  if (startWinery) {
    $("f-winery").value = startWinery.name;
    setTimeout(() => $("results").scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  }
  if (params.get("reel")) setTimeout(() => openReel(params.get("reel")), 400);
  if (params.get("seleccion")) setTimeout(openOrder, 400); // llegando desde «Completa tu carta»
})();
