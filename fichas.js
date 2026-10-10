// Lo que sabemos de cada vino, con su procedencia, para el buscador y las propuestas.
// Nada inventado: tipo (ficha oficial o denominación, ver carta-data.js), formato (del nombre; si no lo dice, 75 cl),
// uva (de la ficha), gama de precio y bodega/D.O./país/zonas. Celobert es ficticia: todos estos datos son inventados.
(() => {
  const C = window.CATALOG || [];
  const T = Object.fromEntries((window.CARTA || []).map((c) => [c.id, c]));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // uvas que el propio nombre del vino nombra
  const GRAPES = [
    [/xarel.?lo/, "Xarel·lo"], [/albarino/, "Albariño"], [/godello/, "Godello"], [/riesling/, "Riesling"], [/sylvaner/, "Sylvaner"],
    [/pinot blanc/, "Pinot blanc"], [/pinot gris/, "Pinot gris"], [/gewurztraminer/, "Gewurztraminer"], [/\bmuscat\b|moscatel/, "Moscatel"],
    [/pinot noir/, "Pinot noir"], [/garnatxa blanca/, "Garnatxa blanca"], [/garnatxa negra/, "Garnatxa negra"], [/macabeu/, "Macabeu"],
    [/picapoll/, "Picapoll"], [/sumoll/, "Sumoll"], [/montonega/, "Montònega"], [/carinyena/, "Carinyena"], [/\bpx\b/, "Pedro Ximénez"], [/lledoner/, "Lledoner"],
  ];
  const TIPOS = { espumoso: "Espumoso", blanco: "Blanco", rosado: "Rosado", tinto: "Tinto", generoso: "Generoso", dulce: "Dulce", otros: "Destilado o vermut" };

  const formato = (name) => {
    const n = norm(name);
    if (/magnum/.test(n)) return "Magnum 1,5 l";
    if (/37[.,]5/.test(n)) return "37,5 cl";
    if (/50 ?cl|0[.,]5 ?l/.test(n)) return "50 cl";
    return "75 cl";
  };
  const uvas = (x) => {
    const rows = x.tech?.rows || [];
    const r = rows.find(([k]) => /^variedad/i.test(k));
    if (r) return { list: r[1].split(/\s·\s|,\s*|\sy\s/).map((s) => s.replace(/\d+\s*%|grand cru|de viñas.*$/gi, "").trim()).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1)), src: "ficha oficial" };
    const found = GRAPES.filter(([re]) => re.test(norm(x.name))).map(([, g]) => g);
    return { list: found, src: found.length ? "nombre del vino" : null };
  };

  const ALL = C.flatMap((b) => b.wines.map((x) => {
    const t = T[x.id] || {};
    const u = uvas(x);
    return {
      id: x.id, name: x.name, img: x.img_hd || x.img, video: !!x.video, tech: !!x.tech,
      winery: b.name, wineryId: b.id, do: b.do, country: b.country, zones: x.zones || b.zones || [], summary: b.summary || "",
      tipo: t.tipo || null, tipoLabel: t.tipo ? TIPOS[t.tipo] : null, tipoSrc: t.tipo ? (t.fuente && String(t.fuente).startsWith("http") ? "ficha oficial" : "denominación") : null,
      crianza: t.crianza || null, formato: formato(x.name), formatoSrc: /magnum|37[.,]5|50 ?cl|0[.,]5 ?l/.test(norm(x.name)) ? "nombre" : "estándar",
      uvas: u.list, uvasSrc: u.src, gama: t.gama || null,
      search: norm(`${x.name} ${b.name} ${b.do} ${b.country} ${u.list.join(" ")} ${t.tipo ? TIPOS[t.tipo] : ""}`),
    };
  }));
  window.FICHAS = { ALL, byId: Object.fromEntries(ALL.map((w) => [w.id, w])), TIPOS, norm };
})();

// Precios de PRUEBA para probar la herramienta sin tarifa: verosímiles según el tipo y la categoría del vino, redondeados.
// No son precios reales y siempre se marcan como «precio de prueba».
window.precioPrueba = (w) => {
  if (w.gama) return { entrada: 9.5, media: 16.5, alta: 34 }[w.gama] || 14; // Celobert: su gama ficticia
  const base = { espumoso: 15, blanco: 11, rosado: 9, tinto: 13, generoso: 12, dulce: 18, otros: 16 }[w.tipo] || 12;
  const n = String(w.name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  let k = 1;
  if (/grand cru|gran cru|montrachet|chambertin|musigny|reserva especial|unico|eszencia|vors|millesime|vintage|grande annee|vieilles vignes/.test(n)) k = 6;
  else if (/1er cru|premier cru|gran reserva|aszu|clos |reserva/.test(n)) k = 2.5;
  else if (/crianza|seleccion|selection/.test(n)) k = 1.5;
  if (/magnum/.test(n)) k *= 2.2;
  return Math.round(base * k * 2) / 2;
};
