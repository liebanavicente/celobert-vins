// Dibuja en SVG la botella de cada vino ficticio (tools/botellas.json, que genera datos.mjs): forma según el tipo de
// botella, vidrio y vino según el tipo de vino, y una etiqueta inventada con el estilo de su bodega. Sin fotos reales.
// Uso: node tools/botellas.mjs  → assets/botellas/<id>.svg
import fs from "node:fs";

const OUT = new URL("../assets/botellas/", import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;");

// siluetas (viewBox 0 0 120 400; base en y=392). Cada forma: contorno, zona de etiqueta y cápsula.
const SHAPES = {
  bordelesa: { path: "M46 18 H74 V30 H72 V96 C72 118 94 124 94 150 V384 Q94 392 86 392 H34 Q26 392 26 384 V150 C26 124 48 118 48 96 V30 H46 Z", label: [30, 214, 60, 120], cap: [46, 18, 28, 62] },
  borgonona: { path: "M47 18 H73 V30 H71 V86 C71 130 98 150 98 196 V384 Q98 392 90 392 H30 Q22 392 22 384 V196 C22 150 49 130 49 86 V30 H47 Z", label: [27, 226, 66, 118], cap: [47, 18, 26, 56] },
  champan: { path: "M45 14 H75 V28 H73 V80 C73 132 102 150 102 200 V384 Q102 392 94 392 H26 Q18 392 18 384 V200 C18 150 47 132 47 80 V28 H45 Z", label: [23, 236, 74, 110], cap: [44, 14, 32, 104], foil: true },
  flauta: { path: "M50 10 H70 V22 H68 V96 C68 150 84 170 84 210 V386 Q84 392 78 392 H42 Q36 392 36 386 V210 C36 170 52 150 52 96 V22 H50 Z", label: [39, 246, 42, 112], cap: [50, 10, 20, 54] },
  dulce: { path: "M49 120 H71 V130 H69 V176 C69 192 86 198 86 216 V384 Q86 392 79 392 H41 Q34 392 34 384 V216 C34 198 51 192 51 176 V130 H49 Z", label: [37, 266, 46, 92], cap: [49, 120, 22, 40] },
};
const GLASS = {
  tinto: ["#1d2a1f", "#0f1711", null],
  generoso: ["#3a2a17", "#1f160b", null],
  dulce: ["#3b2614", "#1f140a", null],
  espumoso: ["#26381f", "#142012", null],
  blanco: ["#d8e3c4", "#a9b98f", "#e6d58c"],
  rosado: ["#efe7e3", "#d9c9c4", "#f0a69a"],
};

function fit(text, max, base, ratio = 0.56) {
  return Math.min(base, max / Math.max(1, text.length * ratio));
}

function label(b, x, y, w, h) {
  const L = b.label, cx = x + w / 2;
  const serif = "Georgia, 'Times New Roman', serif", sans = "Helvetica, Arial, sans-serif";
  const winery = b.bodega.replace(/^(Celler|Bodega|Bodegas|Adega|Domaine|Maison|Weingut|Viñedos del|Vinyes del) /, (m) => m).toUpperCase();
  const wfs = fit(winery, w - 10, 5.2, 0.8), nfs = fit(b.vino, w - 10, 11, 0.6);
  const doTxt = b.do.toUpperCase();
  const dfs = fit(doTxt, w - 10, 4.2, 0.78);
  let deco = "";
  if (L.layout === "band") {
    deco = `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.22}" fill="${L.accent}"/>
      <text x="${cx}" y="${y + h * 0.14}" font-family="${sans}" font-size="${wfs}" font-weight="700" letter-spacing="0.6" fill="${L.paper}" text-anchor="middle">${esc(winery)}</text>
      <text x="${cx}" y="${y + h * 0.56}" font-family="${serif}" font-size="${nfs}" fill="${L.ink}" text-anchor="middle">${esc(b.vino)}</text>
      <line x1="${cx - w * 0.25}" x2="${cx + w * 0.25}" y1="${y + h * 0.7}" y2="${y + h * 0.7}" stroke="${L.accent}" stroke-width="0.8"/>
      <text x="${cx}" y="${y + h * 0.84}" font-family="${sans}" font-size="${dfs}" letter-spacing="0.4" fill="${L.ink}" text-anchor="middle">${esc(doTxt)}</text>`;
  } else if (L.layout === "frame") {
    deco = `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" fill="none" stroke="${L.accent}" stroke-width="1.2"/>
      <rect x="${x + 5.5}" y="${y + 5.5}" width="${w - 11}" height="${h - 11}" fill="none" stroke="${L.accent}" stroke-width="0.5"/>
      <text x="${cx}" y="${y + h * 0.26}" font-family="${sans}" font-size="${wfs}" letter-spacing="0.6" fill="${L.accent}" text-anchor="middle">${esc(winery)}</text>
      <text x="${cx}" y="${y + h * 0.56}" font-family="${serif}" font-style="italic" font-size="${nfs}" fill="${L.ink}" text-anchor="middle">${esc(b.vino)}</text>
      <text x="${cx}" y="${y + h * 0.82}" font-family="${sans}" font-size="${dfs}" letter-spacing="0.4" fill="${L.ink}" text-anchor="middle">${esc(doTxt)}</text>`;
  } else {
    // «center»: un rombo de baldosa como emblema
    const ey = y + h * 0.22, r = Math.min(w, h) * 0.12;
    deco = `<g transform="translate(${cx} ${ey})"><rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" transform="rotate(45)" fill="none" stroke="${L.accent}" stroke-width="1"/><circle r="${r * 0.35}" fill="${L.accent}"/></g>
      <text x="${cx}" y="${y + h * 0.56}" font-family="${serif}" font-size="${nfs}" fill="${L.ink}" text-anchor="middle">${esc(b.vino)}</text>
      <text x="${cx}" y="${y + h * 0.72}" font-family="${sans}" font-size="${wfs}" letter-spacing="0.6" fill="${L.accent}" text-anchor="middle">${esc(winery)}</text>
      <text x="${cx}" y="${y + h * 0.87}" font-family="${sans}" font-size="${dfs}" letter-spacing="0.4" fill="${L.ink}" text-anchor="middle">${esc(doTxt)}</text>`;
  }
  return `<g clip-path="url(#lc)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${L.paper}"/>${deco}</g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#curve)"/>`;
}

const list = JSON.parse(fs.readFileSync(new URL("./botellas.json", import.meta.url)));
for (const b of list) {
  const S = SHAPES[b.forma], [g1, g2, wine] = GLASS[b.tipo];
  const [lx, ly, lw, lh] = S.label, [cx, cy, cw, ch] = S.cap;
  const foil = S.foil ? `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${b.label.capsule}"/><rect x="${cx}" y="${cy + ch - 10}" width="${cw}" height="3" fill="#d9c08a" opacity="0.8"/>` : `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${b.label.capsule}"/>`;
  // el vino visible en las botellas claras: desde el hombro hasta la base
  const liquid = wine ? `<rect x="0" y="${S.label[1] - 70}" width="120" height="400" fill="${wine}" opacity="0.75" clip-path="url(#bc)"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 400" width="120" height="400">
  <defs>
    <linearGradient id="glass" x1="0" x2="1"><stop offset="0" stop-color="${g2}"/><stop offset="0.45" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient>
    <linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="curve" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.18"/><stop offset="0.25" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>
    <clipPath id="bc"><path d="${S.path}"/></clipPath>
    <clipPath id="lc"><rect x="${lx}" y="${ly}" width="${lw}" height="${lh}"/></clipPath>
  </defs>
  <path d="${S.path}" fill="url(#glass)"/>
  ${liquid}
  ${foil}
  ${label(b, lx, ly, lw, lh)}
  <rect x="${lx + 6}" y="${S.cap[1] + S.cap[3] + 8}" width="5" height="${392 - (S.cap[1] + S.cap[3]) - 18}" fill="url(#shine)" clip-path="url(#bc)" opacity="0.7"/>
  <path d="${S.path}" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="0.8"/>
</svg>`;
  fs.writeFileSync(new URL(`${b.id}.svg`, OUT), svg);
}
console.log(`${list.length} botellas en assets/botellas/`);
