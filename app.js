// Pinta la portada (index.html) y la ficha de cada vino (vino.html?id=…) a partir de data.js.
(() => {
  const W = window.WINES;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const $ = (id) => document.getElementById(id);

  const card = (w) => `
    <a class="card" href="vino.html?id=${w.id}">
      <div class="media">
        <video src="assets/vinos/${w.id}.mp4" poster="assets/vinos/${w.id}-poster.jpg" muted loop playsinline preload="none"></video>
        <span class="play">▶ Vídeo</span>
      </div>
      <div class="body">
        <div class="winery">${esc(w.winery)} · ${esc(w.type)}</div>
        <h3>${esc(w.name)}</h3>
        <p>${esc(w.hook)}</p>
      </div>
    </a>`;

  // en las tarjetas, el vídeo se mueve al pasar el ratón (y en el móvil, cuando se ve en pantalla)
  const liveCards = (root) => {
    root.querySelectorAll(".card").forEach((c) => {
      const v = c.querySelector("video");
      c.addEventListener("mouseenter", () => v.play().catch(() => {}));
      c.addEventListener("mouseleave", () => v.pause());
    });
    if (matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.6 });
      root.querySelectorAll(".card video").forEach((v) => io.observe(v));
    }
  };

  // ---------- la plataforma de pedidos de la distribuidora (window.PLATFORM, en data.js) ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-platform]");
    if (!b) return;
    e.preventDefault();
    const P = window.PLATFORM || { name: "plataforma de clientes", url: "" };
    if (P.url) return window.open(P.url, "_blank", "noopener");
    let tip = document.getElementById("platform-tip");
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "platform-tip";
      tip.className = "platform-tip";
      document.body.append(tip);
    }
    tip.textContent = `Prototipo: aquí se abriría vuestra ${P.name}${document.getElementById("order-list") ? ", con esta selección ya cargada si la plataforma lo permite" : ""}.`;
    tip.classList.add("show");
    clearTimeout(tip.t);
    tip.t = setTimeout(() => tip.classList.remove("show"), 3800);
  });

  // ---------- portada ----------
  if ($("featured")) {
    $("featured").innerHTML = W.map(card).join("");
    liveCards($("featured"));
  }
  const C = window.CATALOG || [];
  const SMALL = matchMedia("(max-width: 700px)").matches;
  // la cinta con los nombres de las bodegas (dos veces seguidas: así el bucle no se nota)
  if ($("ribbon") && C.length) {
    // cada nombre lleva a su bodega en el catálogo; la segunda copia (solo para el bucle) no se anuncia ni se tabula
    // carta tipográfica: cada bodega con uno de seis estilos, siempre el mismo para el mismo nombre (y nunca dos iguales seguidos)
    // una bodega con fichas en dos denominaciones sale una sola vez (el catálogo filtra por nombre y enseña las dos)
    // en el móvil, menos nombres: una cinta de ~18.000 px es demasiada capa animada para Safari en iPhone
    const R = C.filter((w, i) => C.findIndex((x) => x.name === w.name) === i).slice(0, SMALL ? 16 : undefined);
    const styleOf = [];
    R.forEach((w, i) => {
      let k = [...w.name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 6;
      if (i && k === styleOf[i - 1]) k = (k + 1) % 6;
      styleOf.push(k);
    });
    const names = (copy) => R.map((w, i) => `<a class="r${styleOf[i]}" href="catalogo.html?bodega=${encodeURIComponent(w.id)}"${copy ? ' tabindex="-1"' : ""}>${esc(w.name)}</a><i>${i % 3 === 2 ? "◆" : "✦"}</i>`).join("");
    $("ribbon").innerHTML = `<span class="rg">${names(false)}</span><span class="rg" aria-hidden="true">${names(true)}</span>`;
    $("ribbon").style.animationDuration = `${R.length * 2.2}s`;
  }
  // la pared de botellas: dos estanterías que se mueven en sentidos contrarios
  if ($("shelf-a") && C.length) {
    const all = C.flatMap((w) => w.wines.map((x) => ({ ...x, winery: w.name })));
    const pick = (start, n) => Array.from({ length: n }, (_, i) => all[(start + i * 7) % all.length]);
    const shelf = (items) => {
      const row = items.map((x) => `<a class="ed-bottle" href="catalogo.html" title="${esc(x.name)} · ${esc(x.winery)}"><img src="${x.img}" alt="${esc(x.name)}" decoding="async" /><span>${esc(x.name)}</span></a>`).join("");
      return row + row;
    };
    const n = SMALL ? 9 : 18; // en el móvil, menos botellas por estantería (Safari en iPhone dejaba una sin dibujar)
    $("shelf-a").innerHTML = shelf(pick(0, n));
    $("shelf-b").innerHTML = shelf(pick(3, n));
    $("shelf-a").style.animationDuration = `${n * 3}s`;
    $("shelf-b").style.animationDuration = `${n * 3.4}s`;
  }
  // destacados: sala de proyección con todos los vinos que tienen vídeo (la lista sale de destacados.js)
  const stage = $("destacados");
  const FEAT = window.featuredList ? window.featuredList() : [];
  if (stage && FEAT.length) {
    const v = stage.querySelector("video");
    const text = stage.querySelector(".ed-star-text");
    const rail = stage.querySelector(".ed-star-rail");
    const snd = stage.querySelector(".ed-star-sound");
    rail.innerHTML = FEAT.map((w, i) => `
      <button type="button" role="tab" class="ed-star-tab" data-i="${i}" aria-selected="false">
        <span class="ed-star-thumb"><img src="${w.poster}" alt="" loading="lazy" /></span>
        <span class="ed-star-tabtext"><small>${esc(w.winery)}</small><b>${esc(w.name)}</b></span>
      </button>`).join("");
    let cur = -1, seen = false;
    const show = (i, play = true) => {
      if (i === cur) return;
      cur = i;
      const w = FEAT[i];
      v.src = w.video;
      v.poster = w.poster;
      text.innerHTML = `
        <p class="ed-star-kicker">${i === 0 ? "Vino destacado" : `Destacado ${i + 1} de ${FEAT.length}`}</p>
        <p class="kicker">${esc(w.winery)} · ${esc(w.region)}</p>
        <h3>${esc(w.name)}</h3>
        ${w.hook ? `<p class="ed-star-hook">${esc(w.hook)}</p>` : ""}
        <dl class="ed-star-facts">${w.facts.map(([k, val]) => `<div>${k ? `<dt>${esc(k)}</dt>` : ""}<dd>${esc(val)}</dd></div>`).join("")}</dl>
        <div class="btns">
          <a class="btn" href="${w.href}">Ficha completa</a>
          ${w.download ? `<a class="btn ghost" href="${w.download}" download>Descargar el vídeo (9:16)</a>` : ""}
        </div>`;
      rail.querySelectorAll(".ed-star-tab").forEach((b, j) => {
        b.classList.toggle("on", j === i);
        b.setAttribute("aria-selected", j === i ? "true" : "false");
      });
      const tab = rail.children[i];
      if (tab && rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: tab.offsetLeft - rail.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
      if (window.gsap) gsap.fromTo(text.children, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" });
      if (play && seen) v.play().catch(() => {});
    };
    rail.addEventListener("click", (e) => {
      const b = e.target.closest(".ed-star-tab");
      if (b) show(+b.dataset.i);
    });
    // al acabar un vídeo, pasa solo al siguiente
    v.addEventListener("ended", () => show((cur + 1) % FEAT.length));
    snd.addEventListener("click", () => {
      v.muted = !v.muted;
      snd.textContent = v.muted ? "Sonido" : "Silenciar";
      snd.setAttribute("aria-label", v.muted ? "Activar el sonido" : "Silenciar");
      if (!v.muted) v.play().catch(() => {});
    });
    show(0, false);
    stage.hidden = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => {
        seen = e.isIntersecting;
        e.isIntersecting ? v.play().catch(() => {}) : v.pause();
      }), { threshold: 0.35 }).observe(v);
    }
  }

  // ---------- ficha de un vino ----------
  // ficha de un vino del catálogo (sin vídeo propio): botella, bodega y su historia, zonas y vinos hermanos
  const CAT = window.CATALOG || [];
  const catWine = (id) => {
    for (const b of CAT) for (const x of b.wines) if (x.id === id) return { x, b };
    return null;
  };
  // ficha técnica oficial de la bodega (solo para los vinos que la tienen, con su fuente y su añada)
  const techBox = (t) => `
    <div class="tech">
      <p class="tech-badge">${t.source.url ? "Ficha técnica oficial" : "Ficha ficticia · portfolio"}${t.vintage ? ` · ${/^\d/.test(t.vintage) ? "añada " : ""}${esc(t.vintage)}` : ""}</p>
      ${t.intro ? `<p class="tech-intro">${esc(t.intro)}</p>` : ""}
      <dl class="sheet">${t.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      ${t.vintageNote ? `<p class="kicker" style="margin-top:22px">La añada</p><p>${esc(t.vintageNote)}</p>` : ""}
      ${t.tasting ? `<p class="kicker" style="margin-top:22px">Nota de cata</p><p>${esc(t.tasting)}</p>` : ""}
      ${t.pairing ? `<p class="kicker" style="margin-top:22px">Maridaje</p><p>${esc(t.pairing)}</p>` : ""}
      <div class="btns">${t.source.pdf ? `<a class="btn" href="${t.source.pdf}" download>Descargar ficha (PDF)</a>` : ""}${t.source.url ? `<a class="btn ghost" href="${esc(t.source.url)}" target="_blank" rel="noopener">Ver en la web de la bodega</a>` : ""}</div>
      <p class="cat-source">Fuente: ${esc(t.source.label)}. Los datos técnicos cambian con cada añada: confirmar con el comercial la añada en distribución.</p>
    </div>`;

  function catalogSheet(x, b) {
    document.title = `${x.name} · ${b.name} · Celobert Vins (portfolio)`;
    $("crumb").textContent = `${b.name} · ${x.name}`;
    const fmt = /magnum/i.test(x.name) ? "Magnum 1,5 l" : /(50|37,5|0,5)\s?(cl|l)/i.test(x.name) ? x.name.match(/(50|37,5|0,5)\s?(cl|l)/i)[0] : "75 cl";
    const zones = x.zones || b.zones || [];
    const siblings = b.wines.filter((y) => y.id !== x.id);
    $("wine").innerHTML = `
      <section class="wine-hero">
        <div class="bottle-stage">
          <div class="glow" style="background:var(--olive)"></div>
          <img src="${x.img_hd || x.img}" alt="Botella de ${esc(x.name)}" />
        </div>
        <div>
          <p class="kicker">${esc(b.do)} · ${esc(b.country)}</p>
          <h1>${esc(x.name)}</h1>
          <p class="winery">${esc(b.name)}</p>
          ${b.summary ? `<p class="lead">${esc(b.summary)}</p>` : ""}
          <div class="chips">${[...(x.tech && x.tech.vintage ? [/^\d/.test(x.tech.vintage) ? `Añada ${x.tech.vintage}` : x.tech.vintage.replace(/^./, (c) => c.toUpperCase())] : []), b.country, fmt, ...zones].map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
          <div class="btns">
            <a class="btn solid" href="#" data-platform>Pedir en la plataforma</a>
            <a class="btn" href="catalogo.html?bodega=${encodeURIComponent(b.id)}">Toda la bodega en el catálogo</a>
            ${x.video ? `<a class="btn" href="#material">▶ Ver su vídeo</a>` : ""}
            ${b.reel ? `<a class="btn" href="catalogo.html?reel=${encodeURIComponent(b.id)}">▶ Reel de la bodega</a>` : ""}
          </div>
        </div>
      </section>

      <section class="section grid-2">
        <div>
          <p class="kicker">La bodega</p>
          ${b.photo ? `<img class="cat-wphoto" src="${b.photo}" alt="${esc(b.name)}" loading="lazy" />` : ""}
          <div class="story">${(b.story || []).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
          <p class="cat-source">Texto: ${esc(b.story_src || "catálogo de Celobert")}.</p>
        </div>
        <div>
          <p class="kicker">La ficha</p>
          <dl class="sheet">
            <dt>Vino</dt><dd>${esc(x.name)}</dd>
            <dt>Bodega</dt><dd>${esc(b.name)}</dd>
            <dt>Denominación</dt><dd>${esc(b.do)}</dd>
            <dt>País</dt><dd>${esc(b.country)}</dd>
            <dt>Formato</dt><dd>${esc(fmt)}</dd>
            <dt>Disponible en</dt><dd>${esc(zones.join(" · "))}</dd>
          </dl>
          ${x.tech ? techBox(x.tech) : `<div class="pending">
            <b>Datos técnicos y nota de cata</b>
            <p>Variedades, crianza y nota de cata vienen en la ficha técnica de la bodega: te la facilita tu comercial. Cada vino tiene aquí su ficha completa.</p>
            <a class="btn" href="#" data-platform>Pedir la ficha técnica</a>
          </div>`}
        </div>
      </section>

      ${x.video ? `<section class="section kit" id="material">
        <div class="phone"><video src="${x.video.src}" poster="${x.video.poster}" controls playsinline preload="metadata"></video></div>
        <div>
          <p class="kicker">Su vídeo · material para tu restaurante o tu tienda</p>
          <h2 style="font-size:clamp(30px,3.6vw,44px)">${esc(x.name)}, listo para tus redes</h2>
          <p class="lead" style="margin-top:16px">Con su propio estilo y los datos de la ficha oficial de la bodega. Sin coste para clientes de Celobert.</p>
          <div class="downloads">
            <a class="dl" href="${x.video.downloads["9x16"]}" download><div><b>Vídeo vertical 9:16</b><small>Reels, Stories, TikTok, WhatsApp</small></div><span class="go">Descargar ↓</span></a>
            <a class="dl" href="${x.video.downloads["4x5"]}" download><div><b>Vídeo 4:5</b><small>Feed de Instagram y LinkedIn</small></div><span class="go">Descargar ↓</span></a>
          </div>
        </div>
      </section>` : ""}
      ${siblings.length ? `<section class="section">
        <div class="section-head"><h2>Más vinos de ${esc(b.name)}</h2><a class="btn" href="catalogo.html?bodega=${encodeURIComponent(b.id)}">Ver en el catálogo</a></div>
        <div class="bottles sib">${siblings.map((y) => `<a class="bottle-card" href="vino.html?id=${encodeURIComponent(y.id)}"><span class="bimg"><img src="${y.img}" alt="" loading="lazy" /></span><span class="bname">${esc(y.name)}</span></a>`).join("")}</div>
      </section>` : ""}`;
  }

  if ($("wine")) {
    const id = new URLSearchParams(location.search).get("id") || (W[0] || C[0]?.wines[0] || {}).id;
    const found = !W.some((x) => x.id === id) && catWine(id);
    if (found) catalogSheet(found.x, found.b);
  }
  if ($("wine") && !$("wine").innerHTML.trim() && W.length) {
    const id = new URLSearchParams(location.search).get("id") || W[0].id;
    const w = W.find((x) => x.id === id) || W[0];
    document.title = `${w.name} · ${w.winery} · Celobert Vins (portfolio)`;
    $("crumb").textContent = `${w.winery} · ${w.name}`;
    $("wine").innerHTML = `
      <section class="wine-hero">
        <div class="bottle-stage ${w.dark ? "dark" : ""}">
          <div class="glow" style="background:${w.accent}"></div>
          <img class="${w.multiply ? "multiply" : ""}" src="assets/vinos/${w.id}.png" alt="Botella de ${esc(w.name)}" />
        </div>
        <div>
          <p class="kicker">${esc(w.region)}</p>
          <h1>${esc(w.name)}</h1>
          <p class="winery">${esc(w.winery)}</p>
          <p class="lead">${esc(w.hook)}</p>
          <div class="chips">${[w.type, ...w.chips].map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>
          <div class="btns">
            <a class="btn solid" href="#contacto">Pedir precio y disponibilidad</a>
            <a class="btn" href="#material">Ver el vídeo</a>
            ${w.pdf ? `<a class="btn" href="${esc(w.pdf)}" target="_blank" rel="noopener">Ficha técnica (PDF)</a>` : ""}
          </div>
        </div>
      </section>

      <section class="section grid-2">
        <div>
          <p class="kicker">La ficha</p>
          <dl class="sheet">${w.sheet.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        </div>
        <div>
          ${w.nose.length || w.palate ? `<p class="kicker">Nota de cata</p>` : ""}
          ${w.nose.length ? `<ul class="notes">${w.nose.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
          ${w.palate ? `<p>${esc(w.palate)}</p>` : ""}
          ${w.pairing.length ? `<p class="kicker" style="margin-top:28px">Maridaje</p><div class="tags">${w.pairing.map((p) => `<span class="chip">${esc(p)}</span>`).join("")}</div>` : ""}
          ${w.quote ? `<blockquote class="quote"><p>«${esc(w.quote.text)}»</p><p style="font-size:18px">${esc(w.quote.es)}</p><small>${esc(w.quote.who)}</small></blockquote>` : ""}
          ${!w.nose.length && !w.palate && !w.quote ? `<p class="kicker">Nota de cata</p><p class="lead">La ficha de la bodega no trae nota de cata. Aquí iría la del equipo de la distribuidora.</p>` : ""}
        </div>
      </section>

      <section class="section kit" id="material">
        <div class="phone"><video src="assets/vinos/${w.id}.mp4" poster="assets/vinos/${w.id}-poster.jpg" controls playsinline preload="metadata"></video></div>
        <div>
          <p class="kicker">Material para tu restaurante o tu tienda</p>
          <h2 style="font-size:clamp(30px,3.6vw,44px)">Este vino, listo para tus redes</h2>
          <p class="lead" style="margin-top:16px">Vídeo de la promo para publicar en Instagram, LinkedIn o WhatsApp. Sin coste para clientes de Celobert.</p>
          <div class="downloads">
            <a class="dl" href="assets/descargas/${w.id}-9x16.mp4" download><div><b>Vídeo vertical 9:16</b><small>Reels, Stories, TikTok, WhatsApp</small></div><span class="go">Descargar ↓</span></a>
            <a class="dl" href="assets/descargas/${w.id}-4x5.mp4" download><div><b>Vídeo 4:5</b><small>Feed de Instagram y LinkedIn</small></div><span class="go">Descargar ↓</span></a>
            <a class="dl" href="assets/vinos/${w.id}.png" download><div><b>Foto de la botella</b><small>PNG para cartas y fichas</small></div><span class="go">Descargar ↓</span></a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Más vinos</h2><a class="btn" href="index.html#destacados">Ver los destacados</a></div>
        <div class="more cards" id="more">${W.filter((x) => x.id !== w.id).map(card).join("")}</div>
      </section>`;
    liveCards($("more"));
  }
})();
