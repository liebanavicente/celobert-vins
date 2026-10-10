// Animaciones de la propuesta (GSAP 3.13, en assets/vendor/ para que funcione sin internet).
// 1. Portada: el mandala se despliega capa a capa como un caleidoscopio, sale el nombre y todo vuela a la cabecera.
// 2. Cada sección entra al hacer scroll. 3. En la ficha de un vino: botella, ficha, móvil y descargas.
(() => {
  const root = document.documentElement;
  const done = () => root.classList.remove("js-intro", "js-anim");
  if (!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.getElementById("intro")?.remove();
    return done();
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- entrada al caer: lo que esté por debajo, al llegar ----------
  const reveal = (sel, from = { y: 50 }, stagger = 0.1) => {
    const els = $$(sel);
    if (!els.length) return;
    gsap.set(els, { autoAlpha: 0, ...from });
    ScrollTrigger.batch(els, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 0.8, ease: "power3.out", stagger, overwrite: true }),
    });
  };

  // el mandala de la cabecera gira despacio mientras bajas por la página
  gsap.to(".brand-mark svg", { rotation: 360, ease: "none", transformOrigin: "50% 50%", scrollTrigger: { start: 0, end: "max", scrub: 1 } });

  // ---------- portada ----------
  const heroIn = () => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    gsap.set([".hero .kicker", ".hero h1", ".hero .lead", ".hero .btns"], { autoAlpha: 1 }); // los contenedores, visibles; lo de dentro entra animado
    const words = new SplitText(".hero h1", { type: "words" }).words;
    tl.fromTo(".hero .kicker", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6 })
      .fromTo(words, { autoAlpha: 0, yPercent: 80, rotation: 4 }, { autoAlpha: 1, yPercent: 0, rotation: 0, duration: 0.8, stagger: 0.06, ease: "back.out(1.6)" }, "-=0.3")
      .fromTo(".hero .lead", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.4")
      .fromTo(".hero .btns a", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, "-=0.4");
    // el mandala de la portada: sus capas giran por turnos, 45° cada vez (tiene 8 lóbulos, así que al parar
    // cada capa vuelve exactamente a su sitio: en reposo siempre es el logo oficial)
    const heroMark = $(".ed-mandala svg");
    if (heroMark) {
      const layers = $$(".m-layer", heroMark);
      const turns = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 2.4 });
      turns.to(layers, { rotation: (i) => (i % 2 ? -90 : 90), svgOrigin: "0 0", duration: 2.2, ease: "power2.inOut", stagger: { each: 0.12, from: "end" } })
        .to(layers, { rotation: 0, svgOrigin: "0 0", duration: 0.001 }) // 90° = misma baldosa: se vuelve a 0 sin que se note
        .to(layers, { rotation: (i) => (i % 2 ? 90 : -90), svgOrigin: "0 0", duration: 2.4, ease: "power2.inOut", stagger: { each: 0.12, from: "start" } }, "+=1.4")
        .to(layers, { rotation: 0, svgOrigin: "0 0", duration: 0.001 });
      gsap.to(heroMark, { scale: 1.025, transformOrigin: "50% 50%", duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      // al entrar: las capas se despliegan desde el centro, como en la entrada del logo
      tl.from(layers.slice().reverse(), { scale: 0, autoAlpha: 0, rotation: (i) => (i % 2 ? -90 : 90), svgOrigin: "0 0", duration: 1, stagger: 0.08, ease: "back.out(1.5)" }, 0.15);
    }
    // el caleidoscopio entra girando desde pequeño
    if (document.querySelector(".ed-kaleido")) tl.fromTo(".ed-kaleido", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.1);
    // la marca de agua: sus capas se abren y luego gira sin parar (y un poco más al bajar)
    const mark = $(".hero .mandala svg");
    if (mark) {
      gsap.set(".hero .mandala", { visibility: "visible" });
      tl.from($$(".m-layer", mark).reverse(), { scale: 0.4, autoAlpha: 0, svgOrigin: "0 0", duration: 1.2, stagger: 0.06, ease: "power2.out" }, 0.2);
      gsap.to(mark, { rotation: 360, duration: 140, repeat: -1, ease: "none", transformOrigin: "50% 50%" });
      gsap.to(".hero .mandala", { yPercent: 25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
    return tl;
  };

  const intro = $("#intro");
  if (intro) {
    const markBox = $(".intro-mark", intro);
    markBox.innerHTML = window.mandalaSvg();
    const svg = $("svg", markBox);
    const layers = $$(".m-layer", svg).reverse(); // del centro hacia fuera
    const brand = $(".top .brand");
    const chars = new SplitText($(".intro-word", intro), { type: "chars" }).chars;
    gsap.set(brand, { autoAlpha: 0 });
    gsap.set([".hero .kicker", ".hero h1", ".hero .lead", ".hero .btns"], { autoAlpha: 0 }); // entran después, con heroIn
    if ($(".hero .mandala")) gsap.set(".hero .mandala", { visibility: "hidden" }); // solo visibilidad: su opacidad tenue es la del CSS
    if ($(".ed-kaleido")) gsap.set(".ed-kaleido", { autoAlpha: 0 });
    // cada capa empieza girada en sentido contrario a la anterior: al abrirse, el dibujo «gira» como un caleidoscopio
    gsap.set(layers, { scale: 0, autoAlpha: 0, rotation: (i) => (i % 2 ? -90 : 90), svgOrigin: "0 0" });
    gsap.set(chars, { yPercent: 120, autoAlpha: 0 });

    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(layers, { scale: 1, autoAlpha: 1, rotation: 0, duration: 1.0, ease: "back.out(1.5)", stagger: 0.1 })
      .from(svg, { rotation: -45, duration: 1.9, ease: "power2.out", transformOrigin: "50% 50%" }, 0)
      .to(chars, { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: 0.035, ease: "back.out(2.2)" }, "-=0.55")
      .add(() => {}, "+=0.35")
      // vuelo a la cabecera: el mandala y el nombre van justo adonde está el logo
      .add(() => {
        const fly = (el, target) => {
          const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
          const k = b.width / a.width;
          return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2), scale: k };
        };
        const m = fly(markBox, $(".brand-mark", brand));
        const w = fly($(".intro-word", intro), $(".brand-word", brand));
        gsap.timeline()
          .to(markBox, { ...m, duration: 0.9, ease: "power3.inOut" })
          .to($(".intro-word", intro), { ...w, duration: 0.9, ease: "power3.inOut" }, 0)
          .to(intro, { backgroundColor: "rgba(250,248,244,0)", duration: 0.5 }, 0.45)
          .to(".intro-skip", { autoAlpha: 0, duration: 0.2 }, 0)
          .set(brand, { autoAlpha: 1 })
          .add(finish);
      });
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      gsap.set(brand, { autoAlpha: 1 });
      intro.remove();
      root.classList.remove("js-intro");
      heroIn();
      ScrollTrigger.refresh();
    }
    // saltar: un clic, una tecla o el botón
    const skip = () => { tl.kill(); finish(); };
    intro.addEventListener("click", skip);
    addEventListener("keydown", skip, { once: true });
  } else if ($(".hero")) {
    heroIn();
  }

  // ---------- secciones de la portada (dirección revista) ----------
  reveal(".ed-wall-head > *", { y: 40 }, 0.1);
  reveal(".ed-chapter > *", { y: 40 }, 0.1);
  reveal(".ed-star-head > *", { y: 40 }, 0.1);
  reveal(".ed-star-media", { y: 80, scale: 0.94 }, 0);
  reveal(".ed-star-tab", { y: 30 }, 0.05);
  reveal(".ed-spread .ed-spread-media", { y: 80, scale: 0.96 }, 0);
  reveal(".ed-spread .ed-spread-text > *", { y: 30 }, 0.08);
  reveal(".ed-zones li", { x: -60 }, 0.1);
  reveal(".ed-pro h2, .ed-pro .btns, .ed-pro .ed-num", { y: 30 }, 0.1);
  reveal(".ed-pro-list li", { x: 40 }, 0.1);
  // la botella de cada página de revista sube un poco al bajar
  $$(".ed-spread").forEach((sp) => gsap.fromTo($(".ed-spread-bottle", sp), { yPercent: 12 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: sp, start: "top bottom", end: "bottom top", scrub: true } }));
  // los números romanos se deslizan en paralaje
  $$(".ed-spread-n").forEach((n) => gsap.fromTo(n, { y: 40 }, { y: -40, ease: "none", scrollTrigger: { trigger: n, start: "top bottom", end: "bottom top", scrub: true } }));

  // ---------- secciones de la portada ----------
  reveal(".section-head", { y: 40 }, 0.1);
  reveal("#featured .card", { y: 70 }, 0.14);
  reveal(".zone", { y: 40 }, 0.08);
  const pro = $(".pro");
  if (pro) {
    gsap.fromTo(pro, { clipPath: "inset(10% 8% round 28px)" }, { clipPath: "inset(0% 0% round 28px)", ease: "none", scrollTrigger: { trigger: pro, start: "top 90%", end: "top 45%", scrub: true } });
    reveal(".pro li", { x: 30 }, 0.1);
  }
  reveal("#contacto .grid-2 > *", { y: 40 }, 0.15);
  reveal(".foot .cols > div", { y: 24 }, 0.08);

  // ---------- ficha de un vino ----------
  const stage = $(".bottle-stage");
  if (stage) {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(stage, { autoAlpha: 0, scale: 0.96, duration: 0.8 })
      .from($("img", stage), { yPercent: 25, autoAlpha: 0, duration: 1.1, ease: "power4.out" }, 0.15)
      .from(".wine-hero .kicker", { autoAlpha: 0, y: 14, duration: 0.5 }, 0.2)
      .from(new SplitText(".wine-hero h1", { type: "words" }).words, { autoAlpha: 0, yPercent: 70, duration: 0.7, stagger: 0.07, ease: "back.out(1.6)" }, 0.3)
      .from([".wine-hero .winery", ".wine-hero .lead"], { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.1 }, "-=0.4")
      .from(".wine-hero .chip", { autoAlpha: 0, scale: 0.7, duration: 0.4, stagger: 0.06, ease: "back.out(2)" }, "-=0.3")
      .from(".wine-hero .btns .btn", { autoAlpha: 0, y: 14, duration: 0.4, stagger: 0.07 }, "-=0.2");
    // el halo de color respira detrás de la botella
    gsap.to(".bottle-stage .glow", { scale: 1.15, opacity: 0.5, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
    // la botella sube un poco al bajar por la página
    // (en píxeles, «y»: la entrada usa «yPercent» y así no se pisan; antes la botella se quedaba a medias hasta hacer scroll)
    gsap.to(".bottle-stage img", { y: -40, ease: "none", scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: 0.8 } }); // scrub con retardo: sigue al dedo sin temblar
    reveal(".sheet dt, .sheet dd", { y: 16 }, 0.04);
    reveal(".notes li", { x: -24 }, 0.1);
    reveal(".grid-2 > div:last-child > p, .tags .chip, .quote", { y: 20 }, 0.06);
    reveal(".kit .phone", { x: -80, rotation: -6 }, 0);
    reveal(".kit > div:last-child > *:not(.downloads)", { y: 24 }, 0.08);
    reveal(".dl", { x: 40 }, 0.1);
    reveal("#more .card", { y: 60 }, 0.12);
  }

  root.classList.remove("js-anim"); // la entrada (js-intro) se quita sola al terminar
})();
