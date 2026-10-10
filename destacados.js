// Destacados = los vinos que tienen vídeo. Una sola lista para la portada (sala de proyección) y el catálogo (fila de
// arriba), siempre en el mismo orden. Un vino entra solo en cuanto tiene vídeo: no hay que tocar nada más.
// Orden: primero el top 3 del catálogo (en el orden de TOP), luego el resto del catálogo con vídeo y al final los vinos
// con página propia (data.js).
(() => {
  const TOP = []; // los primeros de la lista (ids del catálogo), si se quiere fijar un orden
  // datos de la ficha que caben en una línea corta, por orden de preferencia
  const KEYS = ["Edición", "Añada", "Variedad", "Variedades", "Producción", "Dosificación", "Crianza", "Alcohol", "Guarda"];
  const firstSentence = (s) => (s || "").split(/(?<=\.)\s/)[0];

  window.featuredList = () => {
    const out = [];
    for (const b of window.CATALOG || []) {
      for (const x of b.wines) {
        if (!x.video) continue;
        const rows = Object.fromEntries((x.tech?.rows || []).map(([k, v]) => [k, v]));
        const facts = KEYS.filter((k) => rows[k] && rows[k].length <= 36).slice(0, 3).map((k) => [k, rows[k]]);
        if (x.tech?.vintage && !facts.some(([k]) => k === "Edición" || k === "Añada")) facts.unshift([/^\d/.test(x.tech.vintage) ? "Añada" : "Edición", x.tech.vintage.replace(/^edición\s*/i, "")]);
        out.push({
          id: x.id, name: x.name, winery: b.name, region: b.do,
          hook: x.tech?.vintageNote && x.id === TOP[0] ? x.tech.vintageNote : firstSentence(x.tech?.intro) || x.tech?.tasting,
          facts: facts.slice(0, 3),
          video: x.video.src, poster: x.video.poster, download: x.video.downloads?.["9x16"],
          href: `vino.html?id=${encodeURIComponent(x.id)}`, thumb: x.img_hd || x.img,
        });
      }
    }
    out.sort((a, b) => (TOP.indexOf(a.id) + 1 || 99) - (TOP.indexOf(b.id) + 1 || 99));
    for (const w of window.WINES || []) {
      out.push({
        id: w.id, name: w.name, winery: w.winery, region: w.region, hook: w.hook,
        facts: w.chips.slice(0, 3).map((c) => ["", c]),
        video: `assets/vinos/${w.id}.mp4`, poster: `assets/vinos/${w.id}-poster.jpg`, download: `assets/descargas/${w.id}-9x16.mp4`,
        href: `vino.html?id=${encodeURIComponent(w.id)}`, thumb: `assets/vinos/${w.id}${w.multiply ? "-cut" : ""}.png`, multiply: !!w.multiply,
      });
    }
    return out;
  };
})();
