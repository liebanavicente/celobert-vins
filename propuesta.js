// Propuestas visuales para clientes: el comercial elige vinos (la misma selección que el catálogo, el buscador y el
// asistente de carta), escribe para quién es, una nota y el precio de cada vino para ese cliente, y sale un documento con
// la imagen de Celobert: portada, una página por vino y cierre. Se guarda en PDF (impresión A4) o se comparte por
// enlace (el estado va en el propio enlace, #v=…; se abre en modo lectura).
// Los datos de cada vino son los reales del catálogo (fichas.js); la nota y el precio los escribe el comercial.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ALL, byId, norm } = window.FICHAS;
  const SEL = "celobert-seleccion", DOC = "celobert-propuesta";
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const today = new Date().toISOString().slice(0, 10);
  const INTRO = "Te dejamos una selección pensada para tu carta. Si quieres probar alguno, lo llevamos a la próxima visita.";

  // ---------- estado: modo lectura (enlace) o edición ----------
  const enc = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const dec = (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
  const shared = location.hash.startsWith("#v=") ? (() => { try { return dec(location.hash.slice(3)); } catch { return null; } })() : null;
  const view = !!shared;
  document.body.classList.toggle("pp-view", view);

  let doc = shared || { cliente: "", comercial: "", fecha: today, intro: INTRO, tema: "noche", notas: {}, ...get(DOC, {}) };
  doc.oferta = { caja: "6", volPct: "", volMin: "", pronto: "", portesMin: "", regalo: "", ...(doc.oferta || {}) };
  let ids = shared ? shared.ids : get(SEL, []).map((o) => o.id).filter((id) => byId[id]);
  // cantidades: las de «Mi selección» (las mismas que se cambian en el catálogo)
  const qty = shared ? { ...(shared.qty || {}) } : Object.fromEntries(get(SEL, []).map((o) => [o.id, o.n || 1]));
  const q = (id) => Math.max(1, Number(qty[id]) || 1);
  const saveAll = () => {
    if (view) return;
    put(DOC, { cliente: doc.cliente, comercial: doc.comercial, fecha: doc.fecha, intro: doc.intro, tema: doc.tema, notas: doc.notas, oferta: doc.oferta });
    const old = get(SEL, []);
    put(SEL, ids.map((id) => ({ ...(old.find((o) => o.id === id) || { id }), n: q(id) })));
  };

  // ---------- editor ----------
  const fields = { cliente: "pp-cliente", comercial: "pp-comercial", fecha: "pp-fecha", intro: "pp-intro" };
  if (!view) {
    Object.entries(fields).forEach(([k, id]) => {
      $(id).value = doc[k] || "";
      $(id).addEventListener("input", () => { doc[k] = $(id).value; saveAll(); paint(); });
    });
    const paintThemes = () => document.querySelectorAll(".pp-theme").forEach((b) => { b.classList.toggle("on", b.dataset.t === doc.tema); b.setAttribute("aria-checked", b.dataset.t === doc.tema); });
    $("pp-themes").addEventListener("click", (e) => { const b = e.target.closest(".pp-theme"); if (!b) return; doc.tema = b.dataset.t; paintThemes(); saveAll(); paint(); });
    paintThemes();

    $("pp-find").addEventListener("input", () => {
      const q = norm($("pp-find").value.trim());
      $("pp-sugg").innerHTML = q.length < 2 ? "" : ALL.filter((w) => !ids.includes(w.id) && q.split(/\s+/).every((t) => w.search.includes(t))).slice(0, 6)
        .map((w) => `<button type="button" data-id="${w.id}"><img src="${w.img}" alt="" /><span><b>${esc(w.name)}</b><small>${esc(w.winery)}</small></span></button>`).join("");
    });
    $("pp-sugg").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-id]");
      if (!b) return;
      ids.push(b.dataset.id);
      qty[b.dataset.id] = 1;
      $("pp-find").value = ""; $("pp-sugg").innerHTML = "";
      saveAll(); paint();
    });
    $("pp-list").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-a]");
      const li = btn && btn.closest("li[data-id]");
      if (!li) return; // tocar un campo (cantidad, precio, nota) no redibuja nada: así no se pierde el cursor
      const a = btn.dataset.a, id = li.dataset.id;
      if (a === "minus" || a === "plus") {
        qty[id] = Math.max(1, q(id) + (a === "plus" ? 1 : -1));
        li.querySelector('input[data-f="qty"]').value = qty[id];
        saveAll(); paintDoc();
        return;
      }
      const i = ids.indexOf(id);
      if (a === "up" && i > 0) [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
      if (a === "down" && i < ids.length - 1) [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
      if (a === "del") ids.splice(i, 1);
      saveAll(); paint();
    });
    $("pp-list").addEventListener("input", (e) => {
      const li = e.target.closest("li[data-id]");
      if (!li || !e.target.dataset.f) return;
      if (e.target.dataset.f === "qty") {
        e.target.value = e.target.value.replace(/\D/g, "");
        if (e.target.value) { qty[li.dataset.id] = Math.max(1, parseInt(e.target.value, 10)); saveAll(); paintDoc(); }
        return;
      }
      doc.notas[li.dataset.id] = { ...(doc.notas[li.dataset.id] || {}), [e.target.dataset.f]: e.target.value };
      saveAll(); paintDoc();
    });
    // al tocar la cantidad se selecciona entera: lo que se escribe la sustituye
    $("pp-list").addEventListener("focusin", (e) => {
      if (e.target.dataset.f === "qty") setTimeout(() => e.target.select(), 0);
    });
    $("pp-list").addEventListener("focusout", (e) => {
      if (e.target.dataset.f === "qty" && !e.target.value) e.target.value = q(e.target.closest("li").dataset.id);
    });
    // el tipo de oferta de un vino cambia los campos que se ven: se redibuja la lista (un desplegable no pierde nada)
    $("pp-list").addEventListener("change", (e) => {
      if (e.target.dataset.f === "ot") { saveAll(); paintList(); paintDoc(); }
    });
    $("pp-ofertas").addEventListener("input", (e) => {
      const k = e.target.dataset.o;
      if (!k) return;
      doc.oferta[k] = e.target.value;
      saveAll(); paintDoc();
    });
    $("pp-print").addEventListener("click", (e) => exportPDF(e.currentTarget));
    $("pp-link").addEventListener("click", (e) => {
      const url = `${location.origin}${location.pathname}#v=${enc({ ...doc, ids, qty })}`;
      navigator.clipboard?.writeText(url).then(() => { e.target.textContent = "Enlace copiado ✓"; setTimeout(() => (e.target.textContent = "Copiar enlace"), 2200); });
    });
    $("pp-reset").addEventListener("click", () => {
      if (!confirm("¿Empezar una propuesta nueva? Se vacía la lista de vinos.")) return;
      ids = []; doc = { cliente: "", comercial: doc.comercial, fecha: today, intro: INTRO, tema: doc.tema, notas: {}, oferta: { caja: doc.oferta.caja || "6", volPct: "", volMin: "", pronto: "", portesMin: "", regalo: "" } };
      paintOferta();
      Object.entries(fields).forEach(([k, id]) => ($(id).value = doc[k] || ""));
      saveAll(); paint();
    });
  }
  $("pp-print2").addEventListener("click", (e) => exportPDF(e.currentTarget));

  // PDF hecho aquí mismo (no con el diálogo de imprimir, que cada navegador ajusta a su manera: Safari mete márgenes,
  // escala y quita fondos): cada página se dibuja a tamaño A4 exacto y se añade a un PDF A4. Si las librerías no
  // cargan, se usa la impresión del navegador.
  async function exportPDF(btn) {
    if (!window.html2canvas || !window.jspdf) return window.print();
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Preparando el PDF…";
    const W = 794, H = 1123; // A4 a 96 ppp
    const stage = document.createElement("div");
    stage.className = "pp-export";
    stage.style.cssText = `position:fixed;left:-12000px;top:0;width:${W}px;`;
    const clone = $("pp-doc").cloneNode(true);
    clone.removeAttribute("id");
    stage.append(clone);
    document.body.append(stage);
    try {
      await document.fonts.ready;
      await Promise.all([...stage.querySelectorAll("img")].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
      const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const pages = [...stage.querySelectorAll(".pp-page")];
      for (const [i, pg] of pages.entries()) {
        btn.textContent = `Preparando el PDF… ${i + 1}/${pages.length}`;
        const canvas = await window.html2canvas(pg, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: W, height: H, windowWidth: W, logging: false });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }
      const name = (doc.cliente || "cliente").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      pdf.save(`propuesta-celobert-${name || "cliente"}.pdf`);
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      stage.remove();
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  function paintOferta() {
    if (view) return;
    document.querySelectorAll("[data-o]").forEach((el) => (el.value = doc.oferta[el.dataset.o] || ""));
  }
  paintOferta();

  function paintList() {
    if (view) return;
    $("pp-empty-hint").hidden = ids.length > 0;
    $("pp-list").innerHTML = ids.map((id, i) => {
      const w = byId[id], n = doc.notas[id] || {};
      return `
        <li data-id="${id}">
          <img src="${w.img}" alt="" />
          <div class="pp-li-main">
            <b>${esc(w.name)}</b><small>${esc(w.winery)}</small>
            <span class="pp-li-row"><span class="pp-qty-label">Cantidad</span><span class="pp-qty"><button type="button" data-a="minus" aria-label="Una menos">−</button><input data-f="qty" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="Cantidad" value="${q(id)}" /><button type="button" data-a="plus" aria-label="Una más">+</button></span></span>
            <input data-f="precio" inputmode="decimal" placeholder="Precio por botella para el cliente" value="${esc(n.precio || "")}" />
            <span class="pp-offer-row">
              <select data-f="ot" aria-label="Oferta de este vino">
                <option value="" ${!n.ot ? "selected" : ""}>Sin oferta</option>
                <option value="dto" ${n.ot === "dto" ? "selected" : ""}>Descuento directo (%)</option>
                <option value="xy" ${n.ot === "xy" ? "selected" : ""}>Bonificación: X cajas + Y gratis</option>
              </select>
              ${n.ot === "dto" ? `<label class="pp-mini"><input data-f="dto" inputmode="decimal" value="${esc(n.dto || "")}" placeholder="10" /> %</label>` : ""}
              ${n.ot === "xy" ? `<label class="pp-mini">Por cada <input data-f="x" inputmode="numeric" value="${esc(n.x || "")}" placeholder="5" /> cajas, <input data-f="y" inputmode="numeric" value="${esc(n.y || "")}" placeholder="1" /> gratis</label>` : ""}
            </span>
            <textarea data-f="nota" rows="2" placeholder="Tu nota: por qué este vino para este cliente">${esc(n.nota || "")}</textarea>
          </div>
          <div class="pp-li-ctrl"><button type="button" data-a="up" aria-label="Subir" ${i ? "" : "disabled"}>↑</button><button type="button" data-a="down" aria-label="Bajar" ${i < ids.length - 1 ? "" : "disabled"}>↓</button><button type="button" data-a="del" aria-label="Quitar">×</button></div>
        </li>`;
    }).join("");
  }

  // ---------- el documento ----------
  // el texto de la bodega, cortado en una palabra completa (el PDF no entiende el recorte por líneas)
  const corto = (s, n = 230) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n))}…`);
  // precio escrito por el comercial («18,50 €», «1.234,5»…) → número, si se puede; si no, se muestra tal cual y no suma
  const num = (s) => {
    let t = String(s || "").replace(/[^\d,.]/g, "");
    if (!t || !/\d/.test(t)) return null;
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    const v = parseFloat(t);
    return Number.isFinite(v) ? v : null;
  };
  const eur = (v) => v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
  const pctTxt = (v) => `${(Math.round(v * 10) / 10).toLocaleString("es-ES")} %`;
  // ---------- ofertas ----------
  // una línea: precio × cantidad, con su descuento directo o su bonificación «X cajas + Y gratis» (en cajas de N botellas)
  function line(w) {
    const n = doc.notas[w.id] || {}, p = num(n.precio), u = q(w.id), caja = Math.max(1, num(doc.oferta.caja) || 6);
    const r = { p, u, base: p != null ? p * u : null, pagado: p != null ? p * u : null, gratis: 0, ahorro: 0, label: "", hint: "" };
    if (p == null) return r;
    if (n.ot === "dto") {
      const d = num(n.dto);
      if (d) { r.pagado = r.base * (1 - d / 100); r.ahorro = r.base - r.pagado; r.label = `−${pctTxt(d)}`; }
    } else if (n.ot === "xy") {
      const x = num(n.x), y = num(n.y);
      if (x && y) {
        r.label = `${x} + ${y} cajas`;
        const tramo = x * caja;
        r.gratis = Math.floor(u / tramo) * y * caja;
        r.ahorro = r.gratis * p;
        if (!r.gratis) r.hint = `con ${tramo - (u % tramo)} bot. más, ${y * caja} gratis`;
      }
    }
    return r;
  }
  // el pedido: suma de las líneas, descuento por volumen, pronto pago, portes
  function totals(wines) {
    const L = wines.map(line), con = L.filter((l) => l.p != null);
    const o = doc.oferta;
    const sub = con.reduce((s, l) => s + l.pagado, 0);
    const valor = con.reduce((s, l) => s + (l.u + l.gratis) * l.p, 0); // lo que valdría todo sin ofertas
    const vPct = num(o.volPct), vMin = num(o.volMin) || 0;
    const vol = vPct && sub >= vMin ? sub * (vPct / 100) : 0;
    const total = sub - vol;
    const pronto = num(o.pronto) ? total * (num(o.pronto) / 100) : 0;
    const gratis = L.reduce((s, l) => s + l.gratis, 0);
    const recibidas = con.reduce((s, l) => s + l.u + l.gratis, 0);
    const ahorro = valor - total;
    return { L, con: con.length, sub, valor, vol, vPct, vMin, faltaVol: vPct && sub < vMin ? vMin - sub : 0, total, pronto, prontoPct: num(o.pronto), gratis, recibidas,
      ahorro, ahorroPct: valor ? ahorro / valor : 0, medio: recibidas ? total / recibidas : null,
      portesMin: num(o.portesMin), portesOk: num(o.portesMin) != null && total >= num(o.portesMin), regalo: o.regalo };
  }
  const fecha = (s) => { try { return new Date(`${s}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }); } catch { return s; } };
  function paintDoc() {
    const wines = ids.map((id) => byId[id]).filter(Boolean);
    const tipos = [...new Set(wines.map((w) => w.tipoLabel).filter(Boolean))];
    const botellas = wines.reduce((s, w) => s + q(w.id), 0);
    const T = totals(wines);
    $("pp-doc").className = `pp-doc theme-${doc.tema}`;
    $("pp-doc").innerHTML = `
      <section class="pp-page pp-cover">
        <div class="pp-cover-mark">${window.mandalaSvg ? window.mandalaSvg() : ""}</div>
        <p class="pp-k">Propuesta de vinos</p>
        <h2>${doc.cliente ? `Para <em>${esc(doc.cliente)}</em>` : `Para <em>tu cliente</em>`}</h2>
        ${doc.intro ? `<p class="pp-intro">${esc(doc.intro)}</p>` : ""}
        <dl class="pp-cover-meta">
          ${doc.cliente ? `<div><dt>Cliente</dt><dd>${esc(doc.cliente)}</dd></div>` : ""}
          ${doc.comercial ? `<div><dt>Tu comercial</dt><dd>${esc(doc.comercial)}</dd></div>` : ""}
          <div><dt>Fecha</dt><dd>${esc(fecha(doc.fecha))}</dd></div>
          <div><dt>Selección</dt><dd>${wines.length} ${wines.length === 1 ? "vino" : "vinos"} · ${botellas} ${botellas === 1 ? "botella" : "botellas"}</dd></div>
          ${tipos.length ? `<div class="wide"><dt>Estilos</dt><dd>${esc(tipos.join(" · "))}</dd></div>` : ""}
        </dl>
        <p class="pp-brand pp-cover-brand"><span class="brand-word">celobert<small>vins</small></span></p>
      </section>
      <section class="pp-page pp-order${wines.length > (T.ahorro > 0.005 || T.regalo ? 6 : 9) ? " dense" : ""}">
        <header class="pp-order-head">
          <div class="pp-order-mark">${window.mandalaSvg ? window.mandalaSvg() : ""}</div>
          <p class="pp-k">Propuesta de vinos${doc.cliente ? ` · ${esc(doc.cliente)}` : ""}</p>
          <h2>El <em>pedido</em></h2>
          <p class="pp-order-meta">${[fecha(doc.fecha), doc.comercial ? `Tu comercial: ${doc.comercial}` : "", `${botellas} ${botellas === 1 ? "botella" : "botellas"} · ${wines.length} ${wines.length === 1 ? "vino" : "vinos"}`].filter(Boolean).map(esc).join(" · ")}</p>
        </header>
        ${wines.length ? `
        <div class="pp-shelf">${wines.slice(0, 12).map((w) => `<figure><img src="${w.img}" alt="" /><figcaption>×${q(w.id)}</figcaption></figure>`).join("")}</div>
        <table class="pp-table">
          <thead><tr><th>Vino</th><th class="r">Cant.</th><th class="r">Precio</th><th>Oferta</th><th class="r">Importe</th></tr></thead>
          <tbody>${wines.map((w, i) => {
            const n = doc.notas[w.id] || {}, l = T.L[i];
            return `<tr><td><b>${String(i + 1).padStart(2, "0")} · ${esc(w.name)}</b><small>${esc(w.winery)} · ${esc(w.formato)}</small></td><td class="r">${l.u}${l.gratis ? `<small class="pp-free">+${l.gratis} gratis</small>` : ""}</td><td class="r">${n.precio ? esc(n.precio) : "—"}</td><td>${l.label ? `<span class="pp-offer">${esc(l.label)}</span>` : ""}${l.hint ? `<small class="pp-nudge">${esc(l.hint)}</small>` : ""}</td><td class="r">${l.pagado != null ? eur(l.pagado) : "—"}${l.ahorro ? `<small class="pp-save">ahorras ${eur(l.ahorro)}</small>` : ""}</td></tr>`;
          }).join("")}</tbody>
          <tfoot>
            ${T.vol ? `<tr class="sub"><td colspan="4">Descuento por volumen (−${pctTxt(T.vPct)})</td><td class="r">−${eur(T.vol)}</td></tr>` : ""}
            <tr><td colspan="4">${T.con === wines.length ? "Total del pedido" : T.con ? `Total de ${T.con} de ${wines.length} vinos con precio` : "Total"}</td><td class="r">${T.con ? eur(T.total) : "según tarifa"}</td></tr>
          </tfoot>
        </table>
        ${T.con && (T.ahorro > 0.005 || T.portesMin != null || T.prontoPct || T.regalo || T.faltaVol) ? `
        <div class="pp-savings">
          ${T.ahorro > 0.005 ? `<div class="pp-save-big"><span>Te ahorras</span><b>${eur(T.ahorro)}</b><small>${pctTxt(T.ahorroPct * 100)} sobre ${eur(T.valor)}${T.gratis ? ` · ${T.gratis} botellas gratis` : ""}</small></div>` : ""}
          <ul class="pp-save-list">
            ${T.medio != null && T.gratis ? `<li><span>Precio medio por botella</span><b>${eur(T.medio)}</b></li>` : ""}
            ${T.prontoPct ? `<li><span>Pagando al contado (−${pctTxt(T.prontoPct)})</span><b>${eur(T.total - T.pronto)}</b></li>` : ""}
            ${T.portesMin != null ? `<li><span>Portes</span><b>${T.portesOk ? "Gratis ✓" : `te faltan ${eur(T.portesMin - T.total)} para que sean gratis`}</b></li>` : ""}
            ${T.faltaVol ? `<li class="nudge"><span>Descuento por volumen</span><b>con ${eur(T.faltaVol)} más, −${pctTxt(T.vPct)} en todo</b></li>` : ""}
            ${T.regalo ? `<li><span>Además</span><b>${esc(T.regalo)}</b></li>` : ""}
          </ul>
        </div>` : ""}` : `<p class="pp-intro">Añade vinos para ver aquí el pedido.</p>`}
        <p class="pp-brand"><span class="brand-word">celobert<small>vins</small></span></p>
      </section>
      ${wines.length ? wines.map((w, i) => {
        const n = doc.notas[w.id] || {};
        return `
        <section class="pp-page pp-wine t-${w.tipo || "x"}">
          <div class="pp-wine-img"><span class="pp-n">${String(i + 1).padStart(2, "0")}</span><img src="${w.img}" alt="Botella de ${esc(w.name)}" /></div>
          <div class="pp-wine-text">
            <p class="pp-k">${esc(w.winery)} · ${esc(w.do)}</p>
            <h3>${esc(w.name)}</h3>
            <p class="pp-tags">${w.tipoLabel ? `<span>${w.tipoLabel}${w.crianza ? ` · ${esc(w.crianza)}` : ""}</span>` : ""}<span>${esc(w.formato)}</span><span>${esc(w.country)}</span>${w.uvas.length ? `<span>${esc(w.uvas.join(", "))}</span>` : ""}</p>
            ${n.nota ? `<blockquote class="pp-note">${esc(n.nota)}${doc.comercial ? `<cite>${esc(doc.comercial)}</cite>` : ""}</blockquote>` : ""}
            ${w.summary ? `<p class="pp-winery"><b>La bodega.</b> ${esc(corto(w.summary))}</p>` : ""}
            ${(() => { const l = line(w); return l.label ? `<p class="pp-wine-offer"><span class="pp-offer">${esc(l.label)}</span>${l.gratis ? ` ${l.u} botellas + <b>${l.gratis} gratis</b>: te sale a <b>${eur(l.pagado / (l.u + l.gratis))}</b> la botella.` : l.ahorro ? ` Te ahorras <b>${eur(l.ahorro)}</b> en este vino.` : l.hint ? ` ${esc(l.hint)}.` : ""}</p>` : ""; })()}
            <p class="pp-price">${n.precio ? `<span>Precio para ti</span><b>${esc(n.precio)}</b>` : `<span>Precio</span><b class="soft">según tarifa</b>`}</p>
          </div>
        </section>`;
      }).join("") : `<section class="pp-page pp-empty"><p>Añade vinos para ver aquí sus páginas.</p></section>`}
      <section class="pp-page pp-end">
        <p class="pp-k">Siguiente paso</p>
        <h3>¿Te los llevamos <em>para probar</em>?</h3>
        <p>Pide en la plataforma de clientes o responde a ${doc.comercial ? esc(doc.comercial) : "tu comercial"}: ajustamos cantidades, formatos y fechas de entrega.</p>
        <p class="pp-fine">Precios y ofertas indicados por tu comercial para esta propuesta${doc.oferta.caja ? `; cajas de ${esc(doc.oferta.caja)} botellas` : ""}. Celobert Vins es una distribuidora ficticia: vinos y datos inventados. Disfruta de un consumo responsable.</p>
        <p class="pp-brand"><span class="brand-word">celobert<small>vins</small></span></p>
      </section>`;
  }
  const paint = () => { paintList(); paintDoc(); };
  paint();
})();
