// Celobert Vins: distribuidora FICTICIA para el portfolio. Todas las bodegas, vinos, fichas y textos son inventados;
// las zonas (Priorat, Rioja, Champagne…) son reales porque son lugares, no marcas.
// Genera: catalogo-data.js (window.CATALOG), carta-data.js (window.CARTA) y la lista para dibujar las botellas.
// Uso: node tools/datos.mjs
import fs from "node:fs";

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const ALL = ["Barcelona", "Girona", "Tarragona", "Madrid"];

// [nombre, tipo, uvas, crianza, gama, forma de botella, nota breve]
//  tipo: espumoso | blanco | rosado | tinto | generoso | dulce · gama: entrada | media | alta
const BODEGAS = [
  {
    name: "Celler Pedra Blava", do: "DOQ Priorat", country: "España", zones: ALL, label: { paper: "#efe6d6", ink: "#2a2220", accent: "#7a2e2a", capsule: "#5b1f1c", layout: "band" },
    summary: "Viñas viejas de garnatxa y carinyena en laderas de llicorella, a 600 metros, trabajadas a mano y con mula.",
    story: "Dos hermanas recuperaron en 2009 las terrazas abandonadas de su abuelo. Elaboran por parcelas, con poca madera nueva, buscando la frescura de la pizarra más que la potencia.",
    wines: [
      ["Llicorella", "tinto", "Garnatxa, carinyena", "8 meses en barrica usada", "media", "bordelesa", "Fruta negra, regaliz y un fondo mineral de pizarra."],
      ["Terrassa Vella", "tinto", "Carinyena de viñas de 1940", "14 meses en fudre", "alta", "bordelesa", "Profundo y sereno: cereza madura, hierbas secas, tanino fino."],
      ["Pedra Blava Blanc", "blanco", "Garnatxa blanca", "Sobre lías 6 meses", "media", "borgonona", "Hinojo, piel de pera y una salinidad larga."],
      ["Mula", "tinto", "Garnatxa", "Depósito, sin madera", "entrada", "bordelesa", "Jugoso y directo, para la mesa de cada día."],
      ["Ranci de l'Àvia", "dulce", "Garnatxa", "Solera oxidativa al sol", "alta", "dulce", "Nuez, higo seco y cacao. Para el final de la comida."],
    ],
  },
  {
    name: "Vinyes del Far", do: "DO Empordà", country: "España", zones: ["Barcelona", "Girona"], label: { paper: "#f4f0e6", ink: "#1f2b33", accent: "#2f6b8a", capsule: "#2f6b8a", layout: "frame" },
    summary: "Viñedo junto al mar del cabo, batido por la tramontana: blancos salinos y tintos ligeros de lledoner.",
    story: "Un antiguo pescador plantó sus primeras cepas al pie del faro. Hoy son doce hectáreas en granito descompuesto, sin riego y con el viento como único tratamiento.",
    wines: [
      ["Tramuntana", "blanco", "Garnatxa blanca, macabeu", "Sin crianza", "entrada", "borgonona", "Fresco, cítrico, con un final salino."],
      ["Far Blanc", "blanco", "Garnatxa gris", "Ánfora de barro 5 meses", "media", "borgonona", "Textura amplia, flor blanca, notas de piedra mojada."],
      ["Rosa de Mar", "rosado", "Lledoner roig", "Sin crianza", "entrada", "borgonona", "Pálido y vivo: fresa ácida y pomelo."],
      ["Lledoner Negre", "tinto", "Lledoner (garnacha)", "Depósito", "entrada", "bordelesa", "Ligero y frutal, para servir fresco."],
      ["Escuma del Far", "espumoso", "Macabeu, garnatxa blanca", "Método tradicional, 24 meses", "media", "champan", "Burbuja fina, manzana verde y pan tostado."],
    ],
  },
  {
    name: "Can Rovelló", do: "DO Penedès", country: "España", zones: ALL, label: { paper: "#f2ede3", ink: "#26301f", accent: "#4f6b3a", capsule: "#c8a45a", layout: "center" },
    summary: "Masía familiar del Alt Penedès dedicada al xarel·lo: espumosos de larga crianza y blancos de parcela.",
    story: "Cinco generaciones de viticultores que en 2015 decidieron embotellar su propia uva. Cultivo ecológico y largas crianzas sobre lías en la cava de la masía.",
    wines: [
      ["Brut Nature Rovelló", "espumoso", "Xarel·lo, macabeu, parellada", "30 meses en rima", "media", "champan", "Seco y fino, almendra y cítricos."],
      ["Gran Rovelló", "espumoso", "Xarel·lo de viñas viejas", "60 meses en rima", "alta", "champan", "Complejo: brioche, fruta blanca madura, burbuja cremosa."],
      ["Rosat d'Estiu", "espumoso", "Trepat", "18 meses en rima", "media", "champan", "Rosado espumoso de frutos rojos, seco y alegre."],
      ["Xarel·lo de Masia", "blanco", "Xarel·lo", "Sobre lías 4 meses", "entrada", "bordelesa", "Hierba fresca, manzana y una punta amarga elegante."],
      ["Vinya del Pou", "blanco", "Xarel·lo", "Fudre 10 meses", "alta", "borgonona", "Parcela única: profundo, mineral, de larga guarda."],
      ["Ancestral", "espumoso", "Xarel·lo", "Método ancestral, sin degüelle", "entrada", "champan", "Natural y turbio, burbuja suave y fruta crujiente."],
    ],
  },
  {
    name: "Bodega Altozano Viejo", do: "DO Ribera del Duero", country: "España", zones: ALL, label: { paper: "#ece4d4", ink: "#1d1a17", accent: "#8a6d3b", capsule: "#1d1a17", layout: "band" },
    summary: "Tempranillo de páramo a 900 metros: tintos con crianza clásica y un rosado de lágrima.",
    story: "Una cooperativa de pueblo reconvertida en bodega de autor. Compran a veinte familias de viticultores con las que trabajan cepa a cepa.",
    wines: [
      ["Altozano Roble", "tinto", "Tempranillo", "6 meses en barrica", "entrada", "bordelesa", "Frutal y especiado, fácil de beber."],
      ["Altozano Crianza", "tinto", "Tempranillo", "Crianza: 14 meses en barrica", "media", "bordelesa", "Cereza, vainilla suave y tanino pulido."],
      ["Altozano Reserva", "tinto", "Tempranillo, cabernet sauvignon", "Reserva: 20 meses en barrica", "alta", "bordelesa", "Serio y largo: fruta negra, cuero y monte bajo."],
      ["Páramo", "tinto", "Tempranillo de viñas de 80 años", "24 meses en barrica", "alta", "bordelesa", "Concentrado y fresco a la vez, para guardar."],
      ["Lágrima Rosado", "rosado", "Tempranillo, albillo", "Sin crianza", "entrada", "bordelesa", "Frambuesa y caramelo de violeta, muy refrescante."],
    ],
  },
  {
    name: "Viñedos del Cierzo Alto", do: "DOCa Rioja", country: "España", zones: ["Barcelona", "Madrid"], label: { paper: "#f1ebdf", ink: "#2b1d1d", accent: "#a33a2f", capsule: "#a33a2f", layout: "frame" },
    summary: "Rioja Alta de viñedo en altura: la elegancia clásica de la región con un toque moderno.",
    story: "Tres amigos de la escuela de enología compraron una bodega centenaria con calados excavados en la roca. Mantienen las crianzas largas, con menos madera nueva.",
    wines: [
      ["Cierzo Blanco", "blanco", "Viura, malvasía", "4 meses en barrica", "entrada", "bordelesa", "Fresco, de manzana y flores blancas."],
      ["Cierzo Crianza", "tinto", "Tempranillo, garnacha", "Crianza: 14 meses en barrica", "media", "bordelesa", "Fruta roja, especias dulces, muy equilibrado."],
      ["Cierzo Gran Reserva", "tinto", "Tempranillo, graciano", "Gran Reserva: 36 meses en barrica", "alta", "bordelesa", "Clásico y fino: tabaco, ciruela y una acidez viva."],
      ["Calado", "tinto", "Garnacha de altura", "12 meses en fudre", "media", "borgonona", "Floral y ligero, una garnacha de montaña."],
      ["Cierzo Rosado", "rosado", "Garnacha", "Sin crianza", "entrada", "bordelesa", "Fresa y cítricos, para el aperitivo."],
    ],
  },
  {
    name: "Adega Pedra Mol", do: "DO Rías Baixas", country: "España", zones: ALL, label: { paper: "#f3f1ea", ink: "#1b2a2a", accent: "#3f7f7a", capsule: "#3f7f7a", layout: "center" },
    summary: "Albariño de parra a dos pasos de la ría: blancos atlánticos, frescos y de largo recorrido.",
    story: "Una pequeña adega familiar del Salnés que se negó a vender su uva a granel. Fermentan cada parcela por separado y guardan los mejores vinos años sobre sus lías.",
    wines: [
      ["Pedra Mol", "blanco", "Albariño", "Sobre lías 3 meses", "entrada", "borgonona", "Melocotón, flor y una acidez marina."],
      ["Pedra Mol Lías", "blanco", "Albariño", "Sobre lías 18 meses", "media", "borgonona", "Más amplio y untuoso, con notas de hinojo."],
      ["Ría Escura", "blanco", "Albariño de parcela", "Sobre lías 36 meses en depósito", "alta", "borgonona", "Profundo y salino, un blanco para guardar."],
      ["Tinto de Parra", "tinto", "Caíño, espadeiro", "Sin crianza", "media", "borgonona", "Tinto atlántico, ligero y de fruta ácida."],
    ],
  },
  {
    name: "Bodegas Albariza Norte", do: "DO Jerez-Xérès-Sherry", country: "España", zones: ALL, label: { paper: "#f5ecd8", ink: "#2b2014", accent: "#9b7a2f", capsule: "#6b4f1d", layout: "band" },
    summary: "Almacenista del Marco de Jerez: finos y manzanillas de velo de flor y viejos oxidativos de solera.",
    story: "Una casa de bodegas de techos altos y suelo de albero. Seleccionan botas de soleras centenarias y las embotellan con la mínima filtración.",
    wines: [
      ["Fino Albariza", "generoso", "Palomino", "Crianza biológica 4 años", "entrada", "bordelesa", "Seco y punzante: almendra, levadura y salinidad."],
      ["Manzanilla Levante", "generoso", "Palomino", "Crianza biológica 5 años", "entrada", "bordelesa", "Ligera, salina, con notas de camomila."],
      ["Amontillado Viejo", "generoso", "Palomino", "Biológica y oxidativa, 15 años", "alta", "bordelesa", "Avellana, madera noble y un final interminable."],
      ["Oloroso Solera", "generoso", "Palomino", "Crianza oxidativa 12 años", "media", "bordelesa", "Nuez, cuero y especias, seco y envolvente."],
      ["PX Soleado", "dulce", "Pedro Ximénez", "Uva pasificada al sol, solera 8 años", "media", "dulce", "Pasas, dátil y café. Para el postre o el queso azul."],
    ],
  },
  {
    name: "Domaine des Trois Clochers", do: "AOC Bourgogne", country: "Francia", zones: ["Barcelona", "Madrid"], label: { paper: "#f0e9db", ink: "#1f1b26", accent: "#5a3e7a", capsule: "#7a1e2e", layout: "frame" },
    summary: "Pequeño domaine de la Côte de Beaune: chardonnay y pinot noir de parcelas de pueblo.",
    story: "Desde la casa se ven tres campanarios, de ahí el nombre. Seis hectáreas repartidas en doce parcelas, vinificadas por separado y con poca intervención.",
    wines: [
      ["Bourgogne Blanc", "blanco", "Chardonnay", "10 meses en barrica usada", "media", "borgonona", "Manzana, avellana y una acidez fina."],
      ["Côte de Beaune Villages", "tinto", "Pinot noir", "12 meses en barrica", "media", "borgonona", "Cereza, flor seca, tanino delicado."],
      ["Les Clochers 1er Cru", "blanco", "Chardonnay", "16 meses en barrica", "alta", "borgonona", "Mantequilla, piedra y cítricos, gran recorrido."],
      ["Pinot des Trois", "tinto", "Pinot noir", "10 meses en barrica usada", "entrada", "borgonona", "Ligero y frutal, la puerta de entrada a Borgoña."],
    ],
  },
  {
    name: "Maison Lefèvre-Aubrac", do: "AOC Champagne", country: "Francia", zones: ALL, label: { paper: "#f6f1e6", ink: "#14161c", accent: "#b08d4a", capsule: "#14161c", layout: "center" },
    summary: "Récoltant-manipulant de la Montagne de Reims: champagnes de viticultor, con poca dosificación.",
    story: "La familia vendía su uva a las grandes casas hasta que la tercera generación decidió elaborar su propio champagne. Hoy producen menos de 40.000 botellas.",
    wines: [
      ["Brut Tradition", "espumoso", "Pinot noir, chardonnay, meunier", "30 meses sobre lías", "media", "champan", "Pan tostado, manzana y una burbuja muy fina."],
      ["Blanc de Blancs", "espumoso", "Chardonnay", "48 meses sobre lías", "alta", "champan", "Tiza, limón y brioche, tenso y elegante."],
      ["Rosé de Saignée", "espumoso", "Pinot noir", "36 meses sobre lías", "alta", "champan", "Frutos rojos, especias y estructura de vino."],
      ["Extra Brut Millésime", "espumoso", "Pinot noir, chardonnay", "72 meses sobre lías", "alta", "champan", "Profundo y seco, con notas de frutos secos."],
    ],
  },
  {
    name: "Weingut Steinwalder", do: "Mosel", country: "Alemania", zones: ["Barcelona", "Madrid"], label: { paper: "#f4f2ec", ink: "#1c1f24", accent: "#2e5a87", capsule: "#c9b27a", layout: "band" },
    summary: "Riesling de pendientes de pizarra junto al río: secos, semisecos y dulces de vendimia tardía.",
    story: "Un viñedo tan empinado que se trabaja con cuerdas. La familia lleva cuatro siglos en el pueblo y vinifica en una bodega excavada bajo la casa.",
    wines: [
      ["Riesling Trocken", "blanco", "Riesling", "Depósito, sobre lías 6 meses", "media", "flauta", "Seco y eléctrico: lima, manzana verde y pizarra."],
      ["Schieferhang", "blanco", "Riesling de ladera", "Fudre 10 meses", "alta", "flauta", "Mineral y profundo, con notas de melocotón blanco."],
      ["Spätlese", "dulce", "Riesling", "Vendimia tardía, fudre", "media", "flauta", "Dulzor ligero y acidez viva: albaricoque y miel."],
      ["Beerenauslese", "dulce", "Riesling botritizado", "Vendimia de granos seleccionados", "alta", "dulce", "Intenso y untuoso: mermelada de cítricos, azafrán."],
    ],
  },
];

// vinos con vídeo (destacados): hechos con la plantilla de Remotion del toolkit, en modo «gratis» (botella SVG + grafismo)
const VIDEOS = { "celler-pedra-blava-terrassa-vella": true };
const CATALOG = [], CARTA = [], BOTELLAS = [];
for (const b of BODEGAS) {
  const id = slug(`${b.name} ${b.do}`);
  const wines = b.wines.map(([name, tipo, uvas, crianza, gama, forma, nota]) => {
    const wid = slug(`${b.name} ${name}`);
    CARTA.push({ id: wid, tipo, crianza, gama, motivo: "Ficha ficticia (portfolio)", fuente: "ficticio" });
    BOTELLAS.push({ id: wid, bodega: b.name, vino: name, do: b.do, tipo, forma, label: b.label });
    return {
      id: wid, name, img: `assets/botellas/${wid}.svg`, zones: b.zones, tipo, gama,
      ...(VIDEOS[wid] ? { video: { src: `assets/videos/${wid}.mp4`, poster: `assets/videos/${wid}-poster.jpg`, downloads: { "9x16": `assets/descargas/${wid}-9x16.mp4`, "4x5": `assets/descargas/${wid}-4x5.mp4` } } } : {}),
      tech: { vintage: "", source: { label: "Ficha ficticia · proyecto de portfolio", url: "" }, intro: "",
        rows: [["Tipo", tipo[0].toUpperCase() + tipo.slice(1)], ["Variedades", uvas], ["Crianza", crianza], ["Gama", gama[0].toUpperCase() + gama.slice(1)], ["Zona", b.do]],
        vintageNote: "", tasting: nota, pairing: null },
    };
  });
  CATALOG.push({ id, name: b.name, do: b.do, country: b.country, zones: b.zones, photo: null, summary: b.summary, story: [b.story], story_src: "Texto ficticio para el portfolio", wines });
}

const head = "// GENERADO por tools/datos.mjs · Celobert Vins es una distribuidora FICTICIA: bodegas, vinos y fichas inventados para un portfolio.\n";
fs.writeFileSync(new URL("../catalogo-data.js", import.meta.url), `${head}window.CATALOG = ${JSON.stringify(CATALOG, null, 1)};\n`);
fs.writeFileSync(new URL("../carta-data.js", import.meta.url), `${head}window.CARTA = ${JSON.stringify(CARTA, null, 1)};\n`);
fs.writeFileSync(new URL("./botellas.json", import.meta.url), JSON.stringify(BOTELLAS, null, 1));
console.log(`${CATALOG.length} bodegas · ${CARTA.length} vinos`, Object.entries(CARTA.reduce((a, c) => ((a[c.tipo] = (a[c.tipo] || 0) + 1), a), {})).map(([k, v]) => `${k} ${v}`).join(", "));
