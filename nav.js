// La cabecera de todas las páginas: se monta aquí (una sola vez para las tres páginas).
// Ordenador: secciones numeradas, panel «Catálogo» (zonas con su número de vinos, buscador y una bodega destacada),
// se esconde al bajar y vuelve al subir. Móvil: botón que abre un menú a pantalla completa con el mandala de fondo.
// Va antes de mandala.js (que dibuja el mandala en los [data-mandala] que crea este archivo).
(() => {
  const header = document.querySelector("header.top");
  if (!header) return;
  const page = location.pathname.split("/").pop() || "index.html";
  const C = window.CATALOG || [];
  const ZONES = ["Barcelona", "Girona", "Tarragona", "Madrid"];
  const count = (z) => C.reduce((n, w) => n + w.wines.filter((x) => (x.zones || w.zones || []).includes(z)).length, 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const pick = C[0];
  const LINKS = [
    ["I", "Destacados", "index.html#destacados", page === "vino.html"],
    ["II", "Catálogo", "catalogo.html", page === "catalogo.html", true],
    ["III", "Buscador", "buscador.html", page === "buscador.html"],
    ["IV", "Profesionales", "index.html#profesionales"],
    ["V", "Contacto", "#contacto"],
  ];

  header.innerHTML = `
    <div class="wrap nav-row">
      <a class="brand" href="index.html" aria-label="Celobert Vins, inicio"><span class="brand-mark" data-mandala></span><span class="brand-word">celobert<small>vins</small></span></a>
      <nav class="nav" aria-label="Principal">
        ${LINKS.map(([n, t, h, on, mega]) => `
          <div class="nav-item${mega ? " has-mega" : ""}">
            <a href="${h}" class="${on ? "on" : ""}"${mega ? ' aria-haspopup="true"' : ""}><sup>${n}</sup>${t}${mega ? '<span class="caret" aria-hidden="true"></span>' : ""}</a>
            ${mega ? `
            <div class="mega" role="group" aria-label="Catálogo">
              <div class="mega-zones">
                <p class="mega-k">Catálogo por zona</p>
                ${ZONES.map((z) => `<a href="catalogo.html?zona=${z.toLowerCase()}"><span>${z}</span><em>${count(z) || ""} vinos</em></a>`).join("")}
              </div>
              <form class="mega-search" action="buscador.html">
                <p class="mega-k">Buscar</p>
                <label><span class="sr">Buscar un vino o una bodega</span><input name="q" placeholder="Un vino, una bodega, una zona…" /></label>
                <button class="btn solid" type="submit">Buscar en el catálogo</button>
                <p class="mega-note">${C.length} bodegas · ${C.reduce((n, w) => n + w.wines.length, 0)} vinos</p>
              </form>
              ${pick ? `<a class="mega-pick" href="catalogo.html?bodega=${encodeURIComponent(pick.id)}">
                ${pick.photo ? `<img src="${pick.photo}" alt="" loading="lazy" />` : ""}
                <span class="mega-k">Bodega destacada</span><b>${esc(pick.name)}</b><small>${esc(pick.do)}</small></a>` : ""}
            </div>` : ""}
          </div>`).join("")}
      </nav>
      <div class="nav-end">
        <a class="team-btn" href="comerciales.html">Área comercial</a><a class="pro-btn" href="#" data-platform>Acceso clientes</a>
        <button class="burger" type="button" aria-label="Abrir el menú" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
      </div>
    </div>`;

  // menú del móvil (a pantalla completa)
  const menu = document.createElement("div");
  menu.id = "menu";
  menu.className = "menu";
  menu.hidden = true;
  menu.innerHTML = `
    <div class="menu-mandala" data-mandala aria-hidden="true"></div>
    <nav class="menu-links" aria-label="Menú">
      ${LINKS.map(([n, t, h]) => `<a href="${h}"><sup>${n}</sup>${t}</a>`).join("")}
    </nav>
    <form class="menu-search" action="buscador.html"><label><span class="sr">Buscar</span><input name="q" placeholder="Buscar un vino o una bodega" /></label></form>
    <div class="menu-zones">${ZONES.map((z) => `<a href="catalogo.html?zona=${z.toLowerCase()}">${z}<em>${count(z) || ""}</em></a>`).join("")}</div>
    <div class="menu-end"><a class="btn solid light" href="#" data-platform>Acceso clientes</a><a class="menu-mail" href="comerciales.html">Área comercial</a></div>`;
  document.body.append(menu);

  const burger = header.querySelector(".burger");
  const G = window.gsap;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function openMenu() {
    menu.hidden = false;
    document.body.classList.add("menu-open", "locked");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Cerrar el menú");
    if (G && !calm) {
      G.fromTo(menu, { clipPath: "circle(0% at 92% 4%)" }, { clipPath: "circle(150% at 92% 4%)", duration: 0.7, ease: "power3.inOut" });
      G.fromTo(".menu-links a", { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, delay: 0.25, ease: "power3.out" });
      G.fromTo([".menu-search", ".menu-zones a", ".menu-end"], { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.04, delay: 0.5 });
      G.fromTo(".menu-mandala", { scale: 0.6, rotation: -60, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 0.18, duration: 1.2, ease: "power3.out" });
    }
  }
  function closeMenu() {
    const end = () => {
      menu.hidden = true;
      document.body.classList.remove("menu-open", "locked");
    };
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir el menú");
    G && !calm ? G.to(menu, { clipPath: "circle(0% at 92% 4%)", duration: 0.5, ease: "power3.in", onComplete: end }) : end();
  }
  burger.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
  menu.addEventListener("click", (e) => e.target.closest("a") && closeMenu());
  addEventListener("keydown", (e) => e.key === "Escape" && !menu.hidden && closeMenu());

  // la cabecera: transparente sobre la portada oscura; se esconde al bajar y vuelve al subir
  const darkHero = document.querySelector(".ed-hero");
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("over-dark", !!darkHero && y < darkHero.offsetHeight - 80);
    header.classList.toggle("scrolled", y > 10);
    if (!document.body.classList.contains("menu-open")) header.classList.toggle("hide", y > 240 && y > lastY + 4);
    if (y < lastY - 4 || y < 240) header.classList.remove("hide");
    document.body.classList.toggle("nav-hidden", header.classList.contains("hide"));
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // el panel del catálogo: se abre con intención (ratón quieto 120 ms o teclado) y se cierra SIEMPRE
  // al salir, al hacer scroll, al hacer clic fuera, con Escape o al volver a la página (Atrás)
  header.querySelectorAll(".has-mega").forEach((item) => {
    let t;
    const open = () => { clearTimeout(t); item.classList.add("open"); };
    const close = () => { clearTimeout(t); item.classList.remove("open"); };
    item.addEventListener("mouseenter", () => { clearTimeout(t); t = setTimeout(open, 120); });
    item.addEventListener("mouseleave", () => { clearTimeout(t); t = setTimeout(close, 180); });
    item.addEventListener("focusin", (e) => e.target.matches(":focus-visible") && open());
    item.addEventListener("focusout", (e) => !item.contains(e.relatedTarget) && close());
    addEventListener("scroll", () => item.classList.contains("open") && !item.contains(document.activeElement) && close(), { passive: true });
    document.addEventListener("pointerdown", (e) => !item.contains(e.target) && close());
    addEventListener("keydown", (e) => e.key === "Escape" && close());
    addEventListener("pageshow", close);
    item.querySelector(".mega").addEventListener("click", (e) => e.target.closest("a") && close());
  });
})();
