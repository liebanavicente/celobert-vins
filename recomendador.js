// Recomendador con criterio de sumiller (principios de maridaje del WSET): el vino tiene que casar con lo DOMINANTE del
// plato —intensidad, acidez, grasa, sal, picante, dulzor, umami— y la salsa manda sobre la proteína.
// Cada vino recibe un PERFIL típico de su tipo y su denominación (tinto ligero/medio/con cuerpo, blanco fresco/aromático/
// con madera, espumoso joven o de larga crianza, generoso salino u oxidativo, dulce), deducido solo de datos reales
// (tipo, crianza, denominación, uva, nombre). Es orientativo y se dice así. Las preguntas se saltan las que no tocan.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ALL } = window.FICHAS;
  const BRAND = document.body.dataset.brand || "calidoscopi";
  const SEL = `${BRAND}-seleccion`;
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const CAT_DOS = /conca del riu anoia|penedes|parcel|priorat|montsant|tarragona|costers del segre|emporda|terra alta|gandesa|pla de bages|valles/;
  const origin = (w) => (CAT_DOS.test(norm(w.do)) ? "cerca" : w.country === "España" ? "espana" : "mundo");

  // ---------- la uva: estructura típica de cada variedad (conocimiento general de viticultura; tabla propia) ----------
  // c = cuerpo, a = acidez, t = tanino (1 bajo · 2 medio · 3 alto); aro = variedad aromática. Las más concretas, primero.
  const UVAS = [
    [/garnatxa blanca|garnacha blanca/, "Garnatxa blanca", { c: 2.5, a: 1.5 }], [/garnatxa gris|garnacha gris/, "Garnatxa gris", { c: 2.5, a: 2 }],
    [/lledoner roig/, "Lledoner roig", { c: 2, a: 2, t: 1 }], [/pinot gris|pinot grigio/, "Pinot gris", { c: 2, a: 2, aro: 1 }], [/pinot blanc/, "Pinot blanc", { c: 1.5, a: 2 }],
    [/pinot noir/, "Pinot noir", { c: 1.5, a: 3, t: 1.5 }], [/meunier/, "Meunier", { c: 1.5, a: 2.5, t: 1 }],
    [/garnatxa|garnacha|lledoner|grenache/, "Garnacha", { c: 2.5, a: 1.5, t: 1.5 }], [/carinyena|carinena|mazuelo|samso/, "Cariñena", { c: 2.5, a: 2.5, t: 2.5 }],
    [/tinta de toro/, "Tinta de Toro", { c: 3, a: 2, t: 3 }], [/tempranillo|tinto fino|tinta del pais|ull de llebre/, "Tempranillo", { c: 2, a: 2, t: 2 }],
    [/cabernet sauvignon/, "Cabernet sauvignon", { c: 3, a: 2.5, t: 3 }], [/cabernet franc/, "Cabernet franc", { c: 2, a: 2.5, t: 2 }], [/merlot/, "Merlot", { c: 2.5, a: 2, t: 2 }],
    [/syrah|shiraz/, "Syrah", { c: 2.5, a: 2, t: 2.5 }], [/graciano/, "Graciano", { c: 2, a: 2.5, t: 2.5 }], [/monastrell|mourvedre/, "Monastrell", { c: 3, a: 1.5, t: 3 }],
    [/mencia/, "Mencía", { c: 2, a: 2, t: 2 }], [/sumoll/, "Sumoll", { c: 1.5, a: 3, t: 1.5 }], [/trepat/, "Trepat", { c: 1, a: 2.5, t: 1 }],
    [/caino|espadeiro|sousao/, "Caíño", { c: 1.5, a: 3, t: 1.5 }], [/gamay/, "Gamay", { c: 1, a: 2.5, t: 1 }],
    [/sangiovese/, "Sangiovese", { c: 2, a: 3, t: 2.5 }], [/nebbiolo/, "Nebbiolo", { c: 2.5, a: 3, t: 3 }], [/malbec/, "Malbec", { c: 3, a: 2, t: 2.5 }],
    [/chardonnay/, "Chardonnay", { c: 2.5, a: 2 }], [/xarel/, "Xarel·lo", { c: 2, a: 2.5 }], [/macabeu|macabeo|viura/, "Macabeo", { c: 1.5, a: 2 }],
    [/parellada|montonega/, "Parellada", { c: 1, a: 2.5 }], [/albarin/, "Albariño", { c: 2, a: 3, aro: 1 }], [/godello/, "Godello", { c: 2, a: 2.5 }],
    [/riesling/, "Riesling", { c: 1, a: 3, aro: 1 }], [/gewurz/, "Gewürztraminer", { c: 2.5, a: 1, aro: 1 }], [/moscat|muscat/, "Moscatel", { c: 1.5, a: 2, aro: 1 }],
    [/malvasia/, "Malvasía", { c: 2, a: 1.5, aro: 1 }], [/picapoll/, "Picapoll", { c: 1.5, a: 2.5, aro: 1 }], [/sauvignon blanc/, "Sauvignon blanc", { c: 1.5, a: 3, aro: 1 }],
    [/verdejo/, "Verdejo", { c: 1.5, a: 2.5, aro: 1 }], [/viognier/, "Viognier", { c: 2.5, a: 1.5, aro: 1 }], [/chenin/, "Chenin blanc", { c: 1.5, a: 3 }],
    [/sylvaner/, "Sylvaner", { c: 1.5, a: 2.5 }], [/albillo/, "Albillo", { c: 1.5, a: 1.5 }], [/palomino/, "Palomino", { c: 1.5, a: 1 }],
  ];
  // la uva principal manda; si hay varias, la media (el tanino, solo de las tintas)
  function rasgos(w) {
    const found = (w.uvas || []).map((u) => UVAS.find(([re]) => re.test(norm(u)))).filter(Boolean);
    if (!found.length) return null;
    const avg = (k) => { const v = found.map((f) => f[2][k]).filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
    const alt = /altura|alta montana/.test(norm((w.uvas || []).join(" ")));  // viñedo de altura: más fresco y ligero
    return { uva: found[0][1], c: avg("c") - (alt ? 0.5 : 0), a: avg("a") + (alt ? 0.5 : 0), t: avg("t"), aro: !!found[0][2].aro };
  }
  // la crianza en números: meses en madera y meses sobre lías (o en rima)
  function crianza(w) {
    const cr = norm(w.crianza || ""), m = +((cr.match(/(\d+)\s*meses/) || [])[1] || 0);
    return { madera: /barrica|fudre|roble/.test(cr) ? m || 12 : 0, usada: /usada/.test(cr), lias: /lias|rima|anfora|tinaja/.test(cr) ? m || 6 : 0, gr: /gran reserva/.test(cr), res: /reserva/.test(cr) };
  }

  // ---------- el perfil de cada vino: su uva y su crianza si las conocemos; si no, lo típico de su denominación ----------
  const LBL = { esp_joven: "espumoso fresco", esp_complejo: "espumoso de larga crianza", dulce_ox: "dulce de crianza oxidativa (pasas, frutos secos)", dulce_fruta: "dulce de fruta y acidez",
    gen_salino: "generoso seco y salino (fino, manzanilla)", gen_ox: "generoso oxidativo (amontillado, oloroso, palo cortado)", rosado: "rosado fresco", bl_aromatico: "blanco aromático",
    bl_madera: "blanco con cuerpo y crianza", bl_fresco: "blanco fresco y mineral", tt_ligero: "tinto ligero y fresco", tt_medio: "tinto de cuerpo medio", tt_pleno: "tinto con cuerpo" };
  function perfil(w) {
    const n = norm(`${w.name} ${(w.uvas || []).join(" ")}`), d = norm(w.do), cr = norm(w.crianza || "");
    const r = rasgos(w), c = crianza(w), top = /1er cru|grand cru|gran cru/.test(n);
    if (!c.madera && /barrica|fudre/.test(n)) c.madera = 8;  // la madera a veces solo consta en el nombre
    let k = null, cuerpo = null;
    if (w.tipo === "espumoso") {
      k = c.lias ? (c.lias >= 30 ? "esp_complejo" : "esp_joven")
        : /gran |vintage|millesime|grande annee|enoteca|blanc des millenaires|vieilles vignes|reserva|textures|manuel raventos|gran rovello|extra brut/.test(n) ? "esp_complejo" : "esp_joven";
    } else if (w.tipo === "dulce") {
      k = /px|pedro ximenez|ranci|oloroso|soleado|dolc/.test(n) ? "dulce_ox" : "dulce_fruta";
    } else if (w.tipo === "generoso") {
      k = /fino|manzanilla|en rama/.test(n) && !/amontillado|pasada/.test(n) ? "gen_salino" : "gen_ox";
    } else if (w.tipo === "rosado") {
      k = "rosado";
    } else if (w.tipo === "blanco" && r) {
      cuerpo = r.c + (c.madera >= 8 && !c.usada ? 0.5 : c.madera ? 0.25 : 0) + (c.lias >= 18 ? 0.5 : 0) + (top ? 0.5 : 0);
      k = r.aro && cuerpo < 2.75 ? "bl_aromatico" : cuerpo >= 2.75 || (cuerpo >= 2.5 && (c.madera || c.lias)) ? "bl_madera" : "bl_fresco";
    } else if (w.tipo === "blanco") {
      if (/alsace|mosel|rias baixas|albarin|riesling|gewurz|muscat|moscat|picapoll|malvasia/.test(`${n} ${d}`)) k = "bl_aromatico";
      else if (/meursault|montrachet|corton|pouilly|barrica|fudre|1er cru|grand cru|clochers|pou\b|ria escura|chardonnay|vi de vila|perrieres|cervoles blanc/.test(n) || /bourgogne/.test(d) && !/chablis|petit chablis|macon/.test(n)) k = "bl_madera";
      else k = "bl_fresco";
    } else if (w.tipo === "tinto" && r) {
      const zona = /ribera|toro|priorat|montsant|brunello|castilla|paramo/.test(`${d} ${n}`) ? 0.5 : 0;
      cuerpo = r.c + zona + (c.madera >= 20 || c.gr ? 0.75 : c.madera >= 12 || c.res ? 0.5 : 0) + (top ? 0.5 : 0);
      k = cuerpo < 2 ? "tt_ligero" : cuerpo < 2.75 ? "tt_medio" : "tt_pleno";
    } else if (w.tipo === "tinto") {
      if (top || /pommard/.test(n)) k = "tt_medio";
      else if (/bourgogne|oregon|pinot noir|beaujolais|morgon|primeur|ribeiro|sumoll|parra|calado|rosso di|lledoner|pinot des trois|cote de beaune/.test(`${n} ${d}`) && !c.gr) k = "tt_ligero";
      else if (/ribera|toro|priorat|brunello|castilla|reserva|gran reserva|carinyena|terrassa|paramo/.test(`${n} ${d} ${cr}`)) k = "tt_pleno";
      else k = "tt_medio";
    }
    return { k, label: k ? LBL[k] : "", r, cuerpo };
  }
  // la línea de cada tarjeta: la uva y su estructura
  const nivel = (x, bajo, medio, alto) => (x < 1.75 ? bajo : x < 2.5 ? medio : alto);
  // generosos y dulces: el estilo lo da la crianza, no la uva; rosados y espumosos: la uva y su acidez
  const ficha = (p, tipo) => {
    if (!p.r) return "";
    if (/generoso|dulce/.test(tipo)) return p.r.uva;
    const out = [p.r.uva, `acidez ${nivel(p.r.a, "baja", "media", "alta")}`];
    if (tipo === "tinto" && p.r.t != null) out.push(`tanino ${nivel(p.r.t, "bajo", "medio", "alto")}`);
    if (/tinto|blanco/.test(tipo)) { const x = p.cuerpo ?? p.r.c; out.push(`cuerpo ${x < 2 ? "ligero" : x < 2.75 ? "medio" : "pleno"}`); }
    if (tipo === "blanco" && p.r.aro) out.push("aromática");
    return out.join(" · ");
  };
  const POOL = ALL.filter((w) => w.tipo && w.tipo !== "otros").map((w) => ({ w, p: perfil(w) })).filter((x) => x.p.k);

  // ---------- las preguntas: cada respuesta suma puntos a perfiles y deja el principio que aplica ----------
  const Q = [
    { k: "momento", q: "¿En qué momento se va a beber?", opts: [
      ["aperitivo", "Aperitivo o picoteo", { esp_joven: 4, esp_complejo: 3, gen_salino: 4, bl_fresco: 2, bl_aromatico: 2, rosado: 1, tt_pleno: -3, dulce_fruta: -4, dulce_ox: -4 }, "Para abrir el apetito: burbuja, fino o un blanco fresco, que limpian la boca"],
      ["comida", "Con la comida", {}, ""],
      ["postre", "Postre o sobremesa", { dulce_fruta: 4, dulce_ox: 4, gen_ox: 1, tt_pleno: -4, bl_fresco: -3, esp_joven: -1 }, "El vino tiene que ser al menos tan dulce como el postre"],
      ["brindis", "Un brindis o una celebración", { esp_complejo: 5, esp_joven: 4 }, "Para brindar, burbuja"],
    ] },
    { k: "plato", q: "¿Qué es lo principal del plato?", skip: (a) => a.momento !== "comida", opts: [
      ["marisco", "Marisco o pescado blanco", { bl_fresco: 4, esp_joven: 3, esp_complejo: 2, gen_salino: 3, bl_aromatico: 2, tt_pleno: -4, tt_medio: -2 }, "El pescado blanco es delicado: pide acidez y poca o ninguna tanicidad (el tanino con el pescado da sabor metálico)", { a: 1, t: -1.5 }],
      ["pescado_graso", "Pescado azul, atún o salmón", { bl_madera: 3, rosado: 3, tt_ligero: 3, esp_complejo: 2, bl_fresco: 1, tt_pleno: -2 }, "El pescado graso aguanta más cuerpo: blancos con crianza, rosados o tintos ligeros", { a: 1, t: -0.5 }],
      ["arroz_mar", "Arroz de marisco o paella", { bl_fresco: 3, rosado: 3, esp_joven: 2, bl_madera: 1, gen_salino: 1, tt_pleno: -2 }, "El arroz de marisco va bien con blancos y rosados con buena acidez", { a: 1 }],
      ["arroz_carne", "Arroz de carne o de montaña", { tt_ligero: 3, tt_medio: 3, rosado: 2, bl_madera: 1 }, "El arroz de carne pide tintos ligeros o de cuerpo medio"],
      ["ave", "Ave o cerdo", { tt_ligero: 3, bl_madera: 3, tt_medio: 2, rosado: 1 }, "Las carnes blancas admiten un blanco con cuerpo o un tinto ligero"],
      ["carne", "Carne roja o caza", { tt_pleno: 4, tt_medio: 3, tt_ligero: 1, bl_fresco: -4, bl_aromatico: -4, bl_madera: -4, rosado: -2, esp_joven: -3, esp_complejo: -2 }, "La proteína y la grasa de la carne roja suavizan el tanino: tintos con cuerpo", { t: 1, c: 1 }],
      ["verdura", "Verduras o legumbres", { bl_fresco: 3, bl_aromatico: 2, rosado: 2, tt_ligero: 2 }, "La verdura pide frescura: blancos, rosados o tintos ligeros", { a: 0.5, t: -0.5 }],
      ["picante", "Cocina especiada o picante", { bl_aromatico: 4, rosado: 2, esp_joven: 2, tt_ligero: 1, tt_pleno: -4, bl_madera: -2 }, "El picante se lleva mal con el alcohol alto y el tanino: mejor blancos aromáticos, frescos o con burbuja", { t: -1.5, c: -0.5 }],
      ["iberico", "Ibéricos, embutido o quesos curados", { gen_salino: 4, gen_ox: 3, esp_complejo: 2, tt_medio: 1, dulce_ox: 1 }, "La sal y la grasa de los curados se equilibran con un fino, un amontillado o burbuja", { a: 1 }],
    ] },
    { k: "coccion", q: "¿Cómo está cocinado?", skip: (a) => a.momento !== "comida" || ["picante", "iberico", "arroz_mar", "arroz_carne"].includes(a.plato), opts: [
      ["crudo", "Crudo, marinado o al vapor", { bl_fresco: 2, esp_joven: 1, gen_salino: 1, tt_pleno: -2, bl_madera: -1 }, "Cocciones suaves: vinos ligeros que no tapen el producto", { c: -1 }],
      ["plancha", "A la plancha o al horno", {}, ""],
      ["brasa", "A la brasa, asado o guisado", { tt_pleno: 2, bl_madera: 2, tt_medio: 1, bl_fresco: -1, esp_joven: -1 }, "La brasa y los guisos suben la intensidad: el vino tiene que estar a su altura", { c: 1 }],
    ] },
    { k: "salsa", q: "¿Qué domina en la salsa o el aliño?", skip: (a) => a.momento !== "comida", opts: [
      ["nada", "Sin salsa, el producto tal cual", {}, ""],
      ["citrico", "Cítricos o vinagreta", { bl_fresco: 2, esp_joven: 2, bl_aromatico: 1, bl_madera: -2, tt_pleno: -2 }, "Lo ácido del plato pide un vino al menos igual de ácido", { a: 1.5 }],
      ["crema", "Cremosa, mantequilla o queso", { bl_madera: 3, esp_complejo: 1, tt_pleno: -1 }, "Las salsas cremosas casan con blancos con cuerpo y crianza", { c: 1 }],
      ["tomate", "Tomate", { tt_ligero: 2, tt_medio: 1, rosado: 2 }, "El tomate es ácido: tintos ligeros o rosados con frescura", { a: 1, t: -0.5 }],
      ["setas", "Setas, trufa o fondos de carne", { tt_ligero: 3, tt_medio: 2, bl_madera: 2, gen_ox: 2 }, "Lo terroso y umami va con pinot noir, blancos con crianza o un amontillado"],
      ["dulce", "Agridulce o con fruta", { bl_aromatico: 3, rosado: 1, tt_pleno: -2 }, "Lo dulce del plato hace que un vino seco parezca más ácido y amargo: mejor aromáticos"],
    ] },
    { k: "postre", q: "¿Qué postre?", skip: (a) => a.momento !== "postre", opts: [
      ["fruta", "Fruta, cítricos o crema", { dulce_fruta: 4, esp_joven: 1 }, "Postres de fruta: dulces con acidez (moscatel, tokaji, vendimia tardía)"],
      ["chocolate", "Chocolate, café o frutos secos", { dulce_ox: 4, gen_ox: 2 }, "Chocolate y frutos secos piden dulces oxidativos (PX, rancio)"],
      ["queso", "Quesos azules o muy curados", { dulce_fruta: 3, dulce_ox: 2, gen_ox: 2 }, "Sal y dulce: un clásico con quesos azules"],
    ] },
    { k: "estilo", q: "¿Qué estilo prefiere quien lo va a beber?", skip: (a) => a.momento === "brindis", opts: [
      ["igual", "Lo que mejor case", {}, ""],
      ["fresco", "Fresco y ligero", { bl_fresco: 2, bl_aromatico: 1, rosado: 1, tt_ligero: 2, esp_joven: 1 }, "busca frescura", { a: 0.5, c: -0.5 }],
      ["cuerpo", "Con cuerpo y crianza", { tt_pleno: 2, bl_madera: 2, esp_complejo: 2, gen_ox: 1 }, "busca cuerpo y crianza", { c: 0.5 }],
      ["sorpresa", "Algo que sorprenda", { gen_salino: 2, gen_ox: 2, bl_aromatico: 1, dulce_fruta: 1 }, "quiere salir de lo habitual"],
    ] },
    { k: "origen", q: "¿De dónde?", opts: [
      ["igual", "Me da igual", {}, ""], ["cerca", "De cercanía (Catalunya)", {}, ""], ["espana", "De España", {}, ""], ["mundo", "Internacional", {}, ""],
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
      <div class="rc-q">
        <h2>${q.q}</h2>
        <div class="rc-opts">${q.opts.map(([v, label]) => `<button type="button" class="rc-opt${ans[q.k] === v ? " on" : ""}" data-v="${v}">${esc(label)}</button>`).join("")}</div>
        <div class="rc-nav">${step ? `<button type="button" class="linkish" id="rc-back">← Atrás</button>` : "<span></span>"}<span class="rc-hint">Toca una respuesta</span></div>
      </div>`;
    $("rc-result").hidden = true;
    $("rc-stage").hidden = false;
  }

  function decide() {
    const pts = {};
    const why = [];
    for (const q of steps()) {
      const o = q.opts.find(([v]) => v === ans[q.k]);
      if (!o) continue;
      Object.entries(o[2]).forEach(([k, n]) => (pts[k] = (pts[k] || 0) + n));
      if (o[3] && q.k !== "estilo") why.push(o[3]);
    }
    const pref = ans.origen || "igual";
    const best = Math.max(0, ...Object.values(pts));  // solo perfiles que casan de verdad: al menos la mitad que el mejor
    // dentro de cada perfil, la uva afina: acidez, tanino y cuerpo reales frente a lo que pide el plato
    const rm = {};
    for (const q of steps()) { const o = q.opts.find(([v]) => v === ans[q.k]); if (o && o[4]) Object.entries(o[4]).forEach(([k, n]) => (rm[k] = (rm[k] || 0) + n)); }
    const fino = (r) => (r ? Object.entries(rm).reduce((s, [k, n]) => s + (r[k] != null ? n * (r[k] - 2) * 4 : 0), 0) : 0);
    const score = ({ w, p }) => (pts[p.k] || 0) * 10 + fino(p.r) + (pref === "igual" || origin(w) === pref ? 8 : 0) + (w.tech ? 2 : 0) + (w.video ? 2 : 0);
    const ranked = POOL.map((x) => ({ ...x, s: score(x) })).filter((x) => !Object.keys(pts).length || (pts[x.p.k] || 0) >= Math.max(1, best / 2))
      .sort((a, b) => b.s - a.s || a.w.winery.localeCompare(b.w.winery) || a.w.name.localeCompare(b.w.name));
    // la mejor opción y alternativas de otras bodegas; como mucho tres del mismo perfil
    const pick = [], usedW = new Set(), perK = {};
    for (const x of ranked) {
      if (pick.length >= 6) break;
      if (usedW.has(x.w.winery) || (perK[x.p.k] || 0) >= 3) continue;
      pick.push(x); usedW.add(x.w.winery); perK[x.p.k] = (perK[x.p.k] || 0) + 1;
    }
    for (const x of ranked) { if (pick.length >= 6) break; if (!pick.includes(x)) pick.push(x); }
    const otro = pref !== "igual" && pick.some((x) => origin(x.w) !== pref);
    return { pick, why, pref, otro };
  }

  function paintResult() {
    const { pick, why, pref, otro } = decide();
    const sel = (() => { try { return JSON.parse(localStorage.getItem(SEL) || "[]"); } catch { return []; } })();
    const inSel = (id) => sel.some((o) => o.id === id);
    const zona = { cerca: " de cercanía", espana: " de España", mundo: " de fuera", igual: "" }[pref];
    const first = pick[0], second = pick.find((x) => x.p.k !== first?.p.k);
    $("rc-progress").style.width = "100%";
    $("rc-count").textContent = "Recomendación";
    $("rc-stage").hidden = true;
    $("rc-result").hidden = false;
    $("rc-result").innerHTML = first ? `
      <p class="kicker">La recomendación</p>
      <h2>Un <em>${esc(first.p.label)}${zona}</em>${second ? `; si no, un ${esc(second.p.label)}` : ""}.</h2>
      ${why.length ? `<ul class="rc-why-list">${why.map((s) => `<li>${esc(s)}.</li>`).join("")}</ul>` : ""}
      <div class="rc-cards">${pick.map(({ w, p }, i) => `
        <article class="rc-card${i === 0 ? " first" : ""}">
          ${i === 0 ? `<span class="rc-badge">La primera opción</span>` : ""}
          <a class="rc-img" href="vino.html?id=${encodeURIComponent(w.id)}"><img src="${w.img}" alt="" loading="lazy" /></a>
          <div class="rc-body">
            <small>${esc(w.winery)} · ${esc(w.do)}</small>
            <b>${esc(w.name)}</b>
            ${ficha(p, w.tipo) ? `<span class="rc-uva">${esc(ficha(p, w.tipo))}</span>` : ""}
            <span class="rc-tags"><span>${esc(p.label)}</span>${w.crianza ? `<span>${esc(w.crianza)}</span>` : ""}${w.video ? `<span class="v">▶ Vídeo</span>` : ""}${pref !== "igual" && origin(w) !== pref ? `<span class="o">Otro origen</span>` : ""}</span>
            <button type="button" class="rc-add" data-id="${w.id}" ${inSel(w.id) ? "disabled" : ""}>${inSel(w.id) ? "✓ En la propuesta" : "+ Añadir a la propuesta"}</button>
          </div>
        </article>`).join("")}</div>
      ${otro ? `<p class="rc-note">Del origen elegido no hay bastantes vinos con ese perfil: se completa con otros.</p>` : ""}
      <div class="rc-actions"><button type="button" class="btn" id="rc-edit">← Cambiar respuestas</button><button type="button" class="btn ghost" id="rc-restart">Empezar de nuevo</button><a class="btn solid" href="propuesta.html">Ir a la propuesta</a></div>
      <p class="rc-fine">Criterio de sumiller (principios de maridaje del WSET). El perfil de cada vino sale de su uva y su crianza cuando las conocemos, y si no, de lo típico de su denominación; no es una nota de cata: orientativo. Solo se proponen vinos con su estilo confirmado. La última palabra es del comercial y del cliente.</p>`
      : `<p class="rc-why">No hay vinos con ese perfil en el catálogo todavía.</p><div class="rc-actions"><button type="button" class="btn" id="rc-edit">← Cambiar respuestas</button></div>`;
  }

  $("rc-stage").addEventListener("click", (e) => {
    if (e.target.id === "rc-back") { step = Math.max(0, step - 1); return paintQuestion(); }
    const b = e.target.closest(".rc-opt");
    if (!b) return;
    const q = steps()[step];
    ans[q.k] = b.dataset.v;
    // si cambia una respuesta que decide qué preguntas tocan, se olvidan las que ya no tocan
    for (const x of Q) if (x.skip && x.skip(ans)) delete ans[x.k];
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
