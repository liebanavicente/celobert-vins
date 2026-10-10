// Calculadora de vino por copas: el restaurante pone sus números (coste de la botella, precio de la copa, copas por
// botella, copas al mes) y ve el beneficio por copa y por botella, el margen, en qué copa queda pagada la botella y lo que
// gana al mes. Compara hasta tres vinos (p. ej. el de la casa frente a uno mejor) y sugiere el precio de copa para el margen
// que el propio restaurante se marca. Ningún dato es nuestro: todo lo introduce el cliente. Sale un resumen en PDF A4.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ALL, byId, norm } = window.FICHAS;
  const BRAND = document.body.dataset.brand || "celobert";
  const BRAND_NAME = document.body.dataset.brandName || "Celobert Vins";
  const KEY = `${BRAND}-copas`;
  const IVA = 0.10; // IVA de hostelería en España: los precios de carta lo incluyen
  const W = 794, H = 1123;

  const blank = (i) => ({ id: "", nombre: i === 0 ? "Vino de la casa" : "", coste: "", copa: "", copas: "6", mes: "" });
  const BLANK = () => ({ cliente: "", iva: true, objetivo: "70", vinos: [blank(0), blank(1)] });
  let st = (() => { try { return { ...BLANK(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return BLANK(); } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };

  // número escrito a mano («18,50 €», «1.234,5») → número
  const num = (s) => {
    let t = String(s ?? "").replace(/[^\d,.]/g, "");
    if (!t || !/\d/.test(t)) return null;
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    const v = parseFloat(t);
    return Number.isFinite(v) ? v : null;
  };
  const eur = (v, d = 2) => (v == null || !Number.isFinite(v) ? "—" : v.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: d, maximumFractionDigits: d }));
  const pct = (v) => (v == null || !Number.isFinite(v) ? "—" : `${Math.round(v * 100)} %`);
  const nameOf = (v) => (v.id && byId[v.id] ? byId[v.id].name : v.nombre || "Vino sin nombre");

  // ---------- las cuentas de un vino ----------
  function calc(v) {
    const coste = num(v.coste), copa = num(v.copa), copas = num(v.copas), mes = num(v.mes);
    if (coste == null || copa == null || !copas) return null;
    const neto = st.iva ? copa / (1 + IVA) : copa; // lo que se queda el restaurante de cada copa
    const costeCopa = coste / copas;
    const r = {
      neto, costeCopa,
      ingresoBotella: neto * copas,
      beneficioCopa: neto - costeCopa,
      beneficioBotella: neto * copas - coste,
      margen: (neto - costeCopa) / neto,
      pagadaEn: neto > 0 ? Math.ceil(coste / neto - 1e-9) : null, // en qué copa la botella ya está pagada
      mes: mes != null ? mes * (neto - costeCopa) : null,
      botellasMes: mes != null ? mes / copas : null,
    };
    const m = num(st.objetivo);
    if (m != null && m > 0 && m < 100) r.sugerido = (costeCopa / (1 - m / 100)) * (st.iva ? 1 + IVA : 1);
    return r;
  }

  // ---------- formulario ----------
  function paintForm() {
    $("cp-cliente").value = st.cliente;
    $("cp-iva").checked = st.iva;
    $("cp-objetivo").value = st.objetivo;
    $("cp-vinos").innerHTML = st.vinos.map((v, i) => {
      const w = v.id && byId[v.id];
      return `
        <fieldset class="cc-step cp-wine" data-i="${i}">
          <legend><span>${String.fromCharCode(65 + i)}</span> ${i === 0 ? "Vino de referencia" : "Vino a comparar"}</legend>
          ${w ? `<div class="cp-picked"><img src="${w.img}" alt="" /><span><b>${esc(w.name)}</b><small>${esc(w.winery)} · ${esc(w.do)}</small></span><button type="button" class="linkish" data-a="unpick">Cambiar</button></div>`
            : `<label class="cc-row">Vino<input data-f="nombre" value="${esc(v.nombre)}" placeholder="Busca en el catálogo o escribe un nombre" autocomplete="off" /></label><div class="pp-sugg" data-sugg></div>`}
          <div class="cp-grid">
            <label class="cc-row">Le cuesta la botella<input data-f="coste" inputmode="decimal" value="${esc(v.coste)}" placeholder="Ej. 9,50 €" /></label>
            <label class="cc-row">Vende la copa a<input data-f="copa" inputmode="decimal" value="${esc(v.copa)}" placeholder="Ej. 4,50 €" /></label>
            <label class="cc-row">Copas por botella<select data-f="copas">${[4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${String(n) === String(v.copas) ? "selected" : ""}>${n}${n === 5 ? " · copa de 15 cl" : n === 6 ? " · copa de 12,5 cl" : ""}</option>`).join("")}</select></label>
            <label class="cc-row">Copas al mes (opcional)<input data-f="mes" inputmode="numeric" value="${esc(v.mes)}" placeholder="Ej. 120" /></label>
          </div>
          ${i > 0 ? `<button type="button" class="linkish cp-del" data-a="del">Quitar este vino</button>` : ""}
        </fieldset>`;
    }).join("") + (st.vinos.length < 3 ? `<button type="button" class="btn" id="cp-add">+ Comparar otro vino</button>` : "");
  }

  $("cp-cliente").addEventListener("input", () => { st.cliente = $("cp-cliente").value; save(); paintResult(); });
  $("cp-iva").addEventListener("change", () => { st.iva = $("cp-iva").checked; save(); paintResult(); });
  $("cp-objetivo").addEventListener("input", () => { st.objetivo = $("cp-objetivo").value; save(); paintResult(); });
  $("cp-vinos").addEventListener("input", (e) => {
    const box = e.target.closest(".cp-wine"), f = e.target.dataset.f;
    if (!box || !f) return;
    const v = st.vinos[+box.dataset.i];
    v[f] = e.target.value;
    if (f === "nombre") {
      const q = norm(v.nombre.trim());
      box.querySelector("[data-sugg]").innerHTML = q.length < 2 ? "" : ALL.filter((w) => q.split(/\s+/).every((t) => w.search.includes(t))).slice(0, 5)
        .map((w) => `<button type="button" data-id="${w.id}"><img src="${w.img}" alt="" /><span><b>${esc(w.name)}</b><small>${esc(w.winery)}</small></span></button>`).join("");
    }
    save(); paintResult();
  });
  $("cp-vinos").addEventListener("change", (e) => {
    const box = e.target.closest(".cp-wine");
    if (!box || e.target.dataset.f !== "copas") return;
    st.vinos[+box.dataset.i].copas = e.target.value;
    save(); paintResult();
  });
  // solo los botones redibujan el formulario (tocar un campo no pierde el cursor)
  $("cp-vinos").addEventListener("click", (e) => {
    if (e.target.id === "cp-add") { st.vinos.push(blank(st.vinos.length)); save(); paintForm(); paintResult(); return; }
    const box = e.target.closest(".cp-wine");
    if (!box) return;
    const i = +box.dataset.i;
    const pick = e.target.closest("button[data-id]");
    if (pick) { st.vinos[i].id = pick.dataset.id; st.vinos[i].nombre = ""; }
    else if (e.target.dataset.a === "unpick") st.vinos[i].id = "";
    else if (e.target.dataset.a === "del") st.vinos.splice(i, 1);
    else return;
    save(); paintForm(); paintResult();
  });
  $("cp-reset").addEventListener("click", () => { st = BLANK(); save(); paintForm(); paintResult(); });

  // ---------- resultado (pantalla y PDF: la misma hoja) ----------
  function verdict(rows) {
    const ok = rows.filter((r) => r.c);
    if (ok.length < 2) return "";
    const [a, ...rest] = ok;
    return rest.map((b) => {
      a.v = a.v || {};
      const d = b.c.beneficioCopa - a.c.beneficioCopa;
      let s = d >= 0
        ? `Cada copa de <b>${esc(b.name)}</b> deja <b>${eur(d)}</b> más que una de <b>${esc(a.name)}</b>.`
        : `Cada copa de <b>${esc(b.name)}</b> deja <b>${eur(-d)}</b> menos que una de <b>${esc(a.name)}</b>.`;
      if (d < 0) {
        const precio = (a.c.beneficioCopa + b.c.costeCopa) * (st.iva ? 1 + IVA : 1);
        s += ` Para ganar lo mismo por copa, habría que venderla a <b>${eur(precio)}</b>.`;
      }
      // al mes, con las mismas copas (las del vino de referencia), para comparar en igualdad
      const copasMes = num(a.v.mes);
      if (copasMes) s += ` Si sus ${copasMes.toLocaleString("es-ES")} copas al mes fueran de ${esc(b.name)}: <b>${eur(copasMes * b.c.beneficioCopa, 0)}</b> al mes, frente a <b>${eur(copasMes * a.c.beneficioCopa, 0)}</b>.`;
      return `<p>${s}</p>`;
    }).join("");
  }
  function paintResult() {
    const rows = st.vinos.map((v) => ({ v, name: nameOf(v), w: v.id && byId[v.id], c: calc(v) }));
    const ready = rows.some((r) => r.c);
    const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const line = (label, f, cls = "") => `<tr class="${cls}"><th>${label}</th>${rows.map((r) => `<td>${r.c ? f(r.c, r) : "—"}</td>`).join("")}</tr>`;
    $("cp-sheet").innerHTML = `
      <header class="cp-head">
        <p class="cp-k">Vino por copas · cálculo para</p>
        <h2>${esc(st.cliente || "el restaurante")}</h2>
        <p class="cp-sub">${fecha} · precios de carta ${st.iva ? "con IVA (10 %)" : "sin IVA"} · margen objetivo ${esc(st.objetivo || "—")} %</p>
      </header>
      ${ready ? `
      <div class="cp-cards">${rows.map((r, i) => `
        <div class="cp-card${r.c ? "" : " empty"}">
          ${r.w ? `<img src="${r.w.img}" alt="" />` : `<span class="cp-letter">${String.fromCharCode(65 + i)}</span>`}
          <p class="cp-name">${esc(r.name)}</p>
          ${r.c ? `<p class="cp-big">${eur(r.c.beneficioCopa)}<small>de beneficio por copa</small></p><p class="cp-mid">${eur(r.c.beneficioBotella)} por botella · margen ${pct(r.c.margen)}</p>` : `<p class="cp-mid">Faltan coste y precio de copa</p>`}
        </div>`).join("")}</div>
      <table class="cp-table">
        <thead><tr><th></th>${rows.map((r, i) => `<th>${String.fromCharCode(65 + i)} · ${esc(r.name)}</th>`).join("")}</tr></thead>
        <tbody>
          ${line("Coste de la botella", (c, r) => eur(num(r.v.coste)))}
          ${line("Precio de la copa", (c, r) => eur(num(r.v.copa)))}
          ${line("Copas por botella", (c, r) => esc(r.v.copas))}
          ${line("Coste por copa", (c) => eur(c.costeCopa))}
          ${line(st.iva ? "Ingreso por copa (sin IVA)" : "Ingreso por copa", (c) => eur(c.neto))}
          ${line("Beneficio por copa", (c) => `<b>${eur(c.beneficioCopa)}</b>`, "hl")}
          ${line("Beneficio por botella", (c) => `<b>${eur(c.beneficioBotella)}</b>`, "hl")}
          ${line("Margen", (c) => pct(c.margen))}
          ${line("Botella pagada en la copa", (c) => (c.pagadaEn ? `${c.pagadaEn}.ª` : "—"))}
          ${line("Al mes (con las copas indicadas)", (c) => (c.mes != null ? `${eur(c.mes, 0)} · ${c.botellasMes.toLocaleString("es-ES", { maximumFractionDigits: 1 })} bot.` : "—"))}
          ${line(`Precio de copa para un margen del ${esc(st.objetivo || "—")} %`, (c) => (c.sugerido ? eur(c.sugerido) : "—"))}
        </tbody>
      </table>
      ${verdict(rows) ? `<div class="cp-verdict">${verdict(rows)}</div>` : ""}`
      : `<p class="cp-empty">Escribe el coste de la botella y el precio de la copa para ver las cuentas.</p>`}
      <footer class="cp-foot"><span>Cálculo orientativo con los datos que ha facilitado el restaurante.${st.iva ? " Los precios de carta incluyen el IVA de hostelería (10 %)." : ""} Disfruta de un consumo responsable.</span><span class="brand-word">${document.body.dataset.brandWord || BRAND}</span></footer>`;
    $("cp-pdf").disabled = !ready;
  }

  // ---------- PDF ----------
  $("cp-pdf").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (!window.html2canvas || !window.jspdf) return window.print();
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "Preparando el PDF…";
    const stage = document.createElement("div");
    stage.style.cssText = `position:fixed;left:-12000px;top:0;width:${W}px;`;
    const clone = $("cp-sheet").cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.add("cp-print");
    stage.append(clone);
    document.body.append(stage);
    try {
      await document.fonts.ready;
      await Promise.all([...stage.querySelectorAll("img")].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
      const canvas = await window.html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: W, height: H, windowWidth: W, logging: false });
      const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      const name = (st.cliente || "restaurante").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      pdf.save(`vino-por-copas-${name || "restaurante"}.pdf`);
    } catch (err) { console.error(err); window.print(); }
    finally { stage.remove(); btn.disabled = false; btn.textContent = label; }
  });

  paintForm();
  paintResult();
})();
