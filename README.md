# Celobert Vins · distribuidora de vinos (ficticia)

Web y herramientas de una **distribuidora de vinos ficticia**, hecha como proyecto de portfolio.
Las bodegas, los vinos, las fichas, las gamas de precio y las botellas son **inventados**; las zonas
(Priorat, Rioja, Champagne…) son reales porque son lugares, no marcas. Cualquier parecido con una
bodega real es casual.

## Qué incluye

- **Portada** con identidad propia: logo de baldosa hidráulica que se monta por capas (GSAP),
  cinta de bodegas con tipografías distintas, estanterías de botellas en movimiento y sección de
  destacados con vídeo.
- **Catálogo vivo** por zona, con buscador, filtros y «Mi selección» para hacer el pedido.
- **Bodegas**: índice por país con filtros y una ficha por bodega (historia, datos y sus vinos por estilo).
- **Ficha de cada vino** con sus datos y los demás vinos de la bodega.
- **Buscador avanzado** con filtros combinables (tipo, gama de precio, zona, país, denominación,
  elaborador, uva, formato) y contadores en vivo; la búsqueda queda en el enlace.
- **Propuestas visuales para clientes**: el comercial elige vinos, cantidades, precios y una nota
  por vino; sale un documento con la imagen de la marca (pedido completo en la primera página,
  una ficha por vino y cierre), que se descarga en PDF A4 o se comparte por enlace.
- **Carta de vinos del restaurante**: con los vinos que compra el cliente, maqueta su carta (nombre,
  logo, precios de botella y copa) en tres diseños; se reparte sola en hojas A4 y se descarga en PDF.
- **Área comercial**: una entrada con todas las herramientas del equipo de ventas.
- **Vino por copas**: con los números del restaurante (coste, precio de copa, copas por botella), beneficio
  por copa y botella, margen, botella pagada en la copa N y comparativa entre vinos; resumen en PDF.
- **Guía de carta orientativa**: según la cocina del restaurante, el tamaño de su carta y su gama de
  precio, un reparto equilibrado por estilos e ideas del catálogo para cada uno; se puede reiniciar
  y genera un texto para compartir con el cliente.
- **Botellas dibujadas con código** (SVG): forma, vidrio y etiqueta según el vino y la bodega.

## Cómo está hecho

HTML, CSS y JavaScript sin frameworks, con GSAP para las animaciones y html2canvas + jsPDF para
generar el PDF de las propuestas en el propio navegador.

```bash
node tools/datos.mjs      # genera catalogo-data.js y carta-data.js a partir de los datos inventados
node tools/botellas.mjs   # dibuja las botellas en assets/botellas/
python3 -m http.server    # y abrir http://localhost:8000
```

## Autoría

Concepto, dirección, criterio de diseño y revisión: **Miguel Liébana**.
El código lo escribió **Claude Code** (Anthropic) siguiendo sus indicaciones.

Nace de una propuesta de rediseño para una distribuidora real; esta versión es anónima para poder
enseñarse en público sin usar marcas, logos ni imágenes de terceros.
