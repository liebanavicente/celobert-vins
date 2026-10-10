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
- **Ficha de cada vino** con sus datos y los demás vinos de la bodega.
- **Asistente de carta para comerciales**: según la cocina del restaurante, el tamaño de su carta,
  su gama de precio y lo que ya tiene, propone qué estilos le faltan y con qué vinos cubrirlos, y
  genera un texto para compartir con el cliente.
- **Botellas dibujadas con código** (SVG): forma, vidrio y etiqueta según el vino y la bodega.

## Cómo está hecho

HTML, CSS y JavaScript sin frameworks, con GSAP para las animaciones.

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
