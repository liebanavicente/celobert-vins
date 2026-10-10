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
  let ids = shared ? shared.ids : get(SEL, []).map((o) => o.id).filter((id) => byId[id]);
  // cantidades: las de «Mi selección» (las mismas que se cambian en el catálogo)
  const qty = shared ? { ...(shared.qty || {}) } : Object.fromEntries(get(SEL, []).map((o) => [o.id, o.n || 1]));
  const q = (id) => Math.max(1, Number(qty[id]) || 1);
  const saveAll = () => {
    if (view) return;
    put(DOC, { cliente: doc.cliente, comercial: doc.comercial, fecha: doc.fecha, intro: doc.intro, tema: doc.tema, notas: doc.notas });
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
      const li = e.target.closest("li[data-id]");
      if (!li) return;
      const i = ids.indexOf(li.dataset.id);
      if (e.target.dataset.a === "up" && i > 0) [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
      if (e.target.dataset.a === "down" && i < ids.length - 1) [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
      if (e.target.dataset.a === "del") ids.splice(i, 1);
      saveAll(); paint();
    });
    $("pp-list").addEventListener("input", (e) => {
      const li = e.target.closest("li[data-id]");
      if (!li || !e.target.dataset.f) return;
      if (e.target.dataset.f === "qty") { qty[li.dataset.id] = Math.max(1, parseInt(e.target.value, 10) || 1); saveAll(); paintDoc(); return; }
      doc.notas[li.dataset.id] = { ...(doc.notas[li.dataset.id] || {}), [e.target.dataset.f]: e.target.value };
      saveAll(); paintDoc();
    });
    $("pp-print").addEventListener("click", (e) => exportPDF(e.currentTarget));
    $("pp-link").addEventListener("click", (e) => {
      const url = `${location.origin}${location.pathname}#v=${enc({ ...doc, ids, qty })}`;
      navigator.clipboard?.writeText(url).then(() => { e.target.textContent = "Enlace copiado ✓"; setTimeout(() => (e.target.textContent = "Copiar enlace"), 2200); });
    });
    $("pp-reset").addEventListener("click", () => {
      if (!confirm("¿Empezar una propuesta nueva? Se vacía la lista de vinos.")) return;
      ids = []; doc = { cliente: "", comercial: doc.comercial, fecha: today, intro: INTRO, tema: doc.tema, notas: {} };
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
            <span class="pp-li-row"><label>Cantidad <input data-f="qty" type="number" min="1" inputmode="numeric" value="${q(id)}" /></label></span>
            <input data-f="precio" placeholder="Precio para el cliente (opcional)" value="${esc(n.precio || "")}" />
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
  const fecha = (s) => { try { return new Date(`${s}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }); } catch { return s; } };
  function paintDoc() {
    const wines = ids.map((id) => byId[id]).filter(Boolean);
    const botellas = wines.reduce((s, w) => s + q(w.id), 0);
    const priced = wines.map((w) => num((doc.notas[w.id] || {}).precio)).map((p, i) => (p != null ? p * q(wines[i].id) : null));
    const conPrecio = priced.filter((p) => p != null).length;
    const total = priced.reduce((s, p) => s + (p || 0), 0);
    $("pp-doc").className = `pp-doc theme-${doc.tema}`;
    $("pp-doc").innerHTML = `
      <section class="pp-page pp-order${wines.length > 9 ? " dense" : ""}">
        <header class="pp-order-head">
          <div class="pp-order-mark">${window.mandalaSvg ? window.mandalaSvg() : ""}</div>
          <p class="pp-k">Propuesta de vinos</p>
          <h2>${doc.cliente ? `Para <em>${esc(doc.cliente)}</em>` : `Para <em>tu cliente</em>`}</h2>
          <p class="pp-order-meta">${[fecha(doc.fecha), doc.comercial ? `Tu comercial: ${doc.comercial}` : "", `${botellas} ${botellas === 1 ? "botella" : "botellas"} · ${wines.length} ${wines.length === 1 ? "vino" : "vinos"}`].filter(Boolean).map(esc).join(" · ")}</p>
        </header>
        ${doc.intro ? `<p class="pp-intro">${esc(doc.intro)}</p>` : ""}
        ${wines.length ? `
        <div class="pp-shelf">${wines.slice(0, 12).map((w) => `<figure><img src="${w.img}" alt="" /><figcaption>×${q(w.id)}</figcaption></figure>`).join("")}</div>
        <table class="pp-table">
          <thead><tr><th>Vino</th><th>Formato</th><th class="r">Cant.</th><th class="r">Precio</th><th class="r">Subtotal</th></tr></thead>
          <tbody>${wines.map((w, i) => {
            const n = doc.notas[w.id] || {}, p = num(n.precio);
            return `<tr><td><b>${String(i + 1).padStart(2, "0")} · ${esc(w.name)}</b><small>${esc(w.winery)} · ${esc(w.do)}</small></td><td>${esc(w.formato)}</td><td class="r">${q(w.id)}</td><td class="r">${n.precio ? esc(n.precio) : "—"}</td><td class="r">${p != null ? eur(p * q(w.id)) : "—"}</td></tr>`;
          }).join("")}</tbody>
          <tfoot><tr><td colspan="2">${conPrecio === wines.length ? "Total" : conPrecio ? `Total de ${conPrecio} de ${wines.length} vinos con precio` : "Total"}</td><td class="r">${botellas}</td><td></td><td class="r">${conPrecio ? eur(total) : "según tarifa"}</td></tr></tfoot>
        </table>` : `<p class="pp-intro">Añade vinos para ver aquí el pedido.</p>`}
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
            <p class="pp-price">${n.precio ? `<span>Precio para ti</span><b>${esc(n.precio)}</b>` : `<span>Precio</span><b class="soft">según tarifa</b>`}</p>
          </div>
        </section>`;
      }).join("") : `<section class="pp-page pp-empty"><p>Añade vinos para ver aquí sus páginas.</p></section>`}
      <section class="pp-page pp-end">
        <p class="pp-k">Siguiente paso</p>
        <h3>¿Te los llevamos <em>para probar</em>?</h3>
        <p>Pide en la plataforma de clientes o responde a ${doc.comercial ? esc(doc.comercial) : "tu comercial"}: ajustamos cantidades, formatos y fechas de entrega.</p>
        <p class="pp-fine">Precios indicados por tu comercial para esta propuesta. Celobert Vins es una distribuidora ficticia: vinos y datos inventados. Disfruta de un consumo responsable.</p>
        <p class="pp-brand"><span class="brand-word">celobert<small>vins</small></span></p>
      </section>`;
  }
  const paint = () => { paintList(); paintDoc(); };
  paint();
})();
