// Logo de Celobert Vins: una baldosa hidráulica de patio vista desde arriba, por capas para poder animarlas.
// Simetría de 4 (gira de 90 en 90°). Expone la misma API que usan nav.js y anim.js: window.mandalaLayers / mandalaSvg.
(() => {
  const T = "#b4532f", V = "#3f6b4f", O = "#d9a441", CAL = "#f5f1e8", K = "#1e1b18";
  const corners = (r, fill) => [[-300, -300], [300, -300], [300, 300], [-300, 300]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
  const petals = (d, r, fill) => [[d, 0], [-d, 0], [0, d], [0, -d]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
  // de fuera adentro; cada <g> es una capa
  const LAYERS = [
    ["m-tile", `<rect x="-300" y="-300" width="600" height="600" fill="${T}"/>`],
    ["m-corners", `<g clip-path="url(#cv-clip)">${corners(170, CAL)}${corners(120, V)}</g>`],
    ["m-diamond", `<rect x="-150" y="-150" width="300" height="300" transform="rotate(45)" fill="${CAL}"/>`],
    ["m-petals", petals(78, 72, O)],
    ["m-inner", `<rect x="-62" y="-62" width="124" height="124" transform="rotate(45)" fill="${V}"/>`],
    ["m-core", `<circle r="36" fill="${CAL}"/><circle r="14" fill="${K}"/>`],
  ];
  window.mandalaLayers = () => `<defs><clipPath id="cv-clip"><rect x="-300" y="-300" width="600" height="600"/></clipPath></defs>` + LAYERS.map(([cls, svg]) => `<g class="m-layer ${cls}">${svg}</g>`).join("");
  window.mandalaSvg = (cls = "") => `<svg class="${cls}" viewBox="-320 -320 640 640" aria-hidden="true">${window.mandalaLayers()}</svg>`;
  document.querySelectorAll("[data-mandala]").forEach((el) => (el.innerHTML = window.mandalaSvg()));
})();
