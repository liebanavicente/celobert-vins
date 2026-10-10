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
  // el precio de la copa puede ser un número («4,50») o una horquilla («4–6», «4-6», «4 a 6»)
  const rango = (s) => {
    const parts = String(s ?? "").split(/\s*(?:–|—|-|\ba\b)\s*/).map(num).filter((v) => v != null);
    if (!parts.length) return null;
    const lo = Math.min(...parts), hi = Math.max(...parts);
    return [lo, hi];
  };
  function at(v, copa) {
    const coste = num(v.coste), copas = num(v.copas), mes = num(v.mes);
    const neto = st.iva ? copa / (1 + IVA) : copa; // lo que se queda el restaurante de cada copa
    const costeCopa = coste / copas;
    const r = {
      copa, neto, costeCopa,
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
  // devuelve las cuentas al precio bajo y al alto de la horquilla (iguales si es un precio único) y al punto medio
  function calc(v) {
    const coste = num(v.coste), copas = num(v.copas), r = rango(v.copa);
    if (coste == null || !r || !copas) return null;
    const [lo, hi] = r;
    return { lo: at(v, lo), hi: at(v, hi), mid: at(v, (lo + hi) / 2), range: hi > lo };
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
            <label class="cc-row">Vende la copa a<input data-f="copa" value="${esc(v.copa)}" placeholder="4,50 € o una horquilla: 4–6 €" /></label>
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
    st.prueba = false;
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
  $("cp-reset").addEventListener("click", () => { st = BLANK(); st.prueba = false; save(); paintForm(); paintResult(); });
  // datos de prueba: coste de botella de prueba y una copa a ~3 veces el coste por copa (redondeada); marcado como prueba
  $("cp-test").addEventListener("click", () => {
    st.vinos.forEach((v, i) => {
      const w = v.id && byId[v.id];
      const coste = w ? window.precioPrueba(w) : [4, 9, 14][i] || 8;
      if (!v.coste) v.coste = coste.toLocaleString("es-ES");
      if (!v.copa) v.copa = (Math.round((coste / 6) * 3 * 2) / 2 + 1).toLocaleString("es-ES");
      if (!v.mes) v.mes = String([240, 120, 90][i] || 100);
    });
    st.prueba = true;
    save(); paintForm(); paintResult();
  });

  // ---------- resultado (pantalla y PDF: la misma hoja) ----------
  // una cifra o, si hay horquilla, «de … a …»
  // compacta: «2,55–4,36 €», «56–69 %», «2–3.ª copa» (de menor a mayor, con la unidad una sola vez)
  const two = (c, f) => {
    let x = f(c.lo), y = f(c.hi);
    if (!c.range || x === y) return x;
    const n = (s) => parseFloat(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
    if (n(x) > n(y)) [x, y] = [y, x];
    const suf = (s) => s.match(/[^\d]*$/)[0];
    return suf(x) === suf(y) ? `${x.slice(0, x.length - suf(x).length)}–${y}` : `${x} – ${y}`;
  };
  function verdict(rows) {
    const ok = rows.filter((r) => r.c);
    if (ok.length < 2) return "";
    const [a, ...rest] = ok;
    const medio = ok.some((r) => r.c.range) ? ` <small>(con la copa a mitad de su horquilla)</small>` : "";
    return rest.map((b) => {
      const A = a.c.mid, B = b.c.mid;
      const d = B.beneficioCopa - A.beneficioCopa;
      let s = d >= 0
        ? `Cada copa de <b>${esc(b.name)}</b> deja <b>${eur(d)}</b> más que una de <b>${esc(a.name)}</b>.`
        : `Cada copa de <b>${esc(b.name)}</b> deja <b>${eur(-d)}</b> menos que una de <b>${esc(a.name)}</b>. Para ganar lo mismo por copa, habría que venderla a <b>${eur((A.beneficioCopa + B.costeCopa) * (st.iva ? 1 + IVA : 1))}</b>.`;
      const copasMes = num(a.v.mes);
      if (copasMes) s += ` Si sus ${copasMes.toLocaleString("es-ES")} copas al mes fueran de ${esc(b.name)}: <b>${eur(copasMes * B.beneficioCopa, 0)}</b> al mes, frente a <b>${eur(copasMes * A.beneficioCopa, 0)}</b>.`;
      return `<p>${s}${medio}</p>`;
    }).join("");
  }
  function paintResult() {
    const rows = st.vinos.map((v) => ({ v, name: nameOf(v), w: v.id && byId[v.id], c: calc(v) }));
    const ready = rows.some((r) => r.c);
    const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    const line = (label, f, cls = "") => `<tr class="${cls}"><th>${label}</th>${rows.map((r) => `<td>${r.c ? f(r.c, r) : "—"}</td>`).join("")}</tr>`;
    const hero = (r, i) => {
      const c = r.c;
      if (!c) return `<div class="cp-hero-card empty"><p class="cp-name">${esc(r.name)}</p><p class="cp-mid">Faltan el coste y el precio de la copa</p></div>`;
      return `
        <div class="cp-hero-card">
          <div class="cp-hero-top">
            ${r.w ? `<img src="${r.w.img}" alt="" />` : `<span class="cp-letter">${String.fromCharCode(65 + i)}</span>`}
            <div><p class="cp-name">${esc(r.name)}</p><p class="cp-mid">Copa a ${two(c, (x) => eur(x.copa))} · ${esc(r.v.copas)} copas por botella</p></div>
          </div>
          <p class="cp-huge">${two(c, (x) => eur(x.beneficioCopa))}<small>gana en cada copa</small></p>
          ${c.lo.mes != null ? `<p class="cp-huge month">${two(c, (x) => eur(x.mes, 0))}<small>al mes, con ${esc(r.v.mes)} copas</small></p>` : ""}
          <dl class="cp-kpis">
            <div><dt>Por botella</dt><dd>${two(c, (x) => eur(x.beneficioBotella))}</dd></div>
            <div><dt>Margen</dt><dd>${two(c, (x) => pct(x.margen))}</dd></div>
            <div><dt>Botella pagada</dt><dd>${two(c, (x) => (x.pagadaEn ? `${x.pagadaEn}.ª copa` : "—"))}</dd></div>
          </dl>
        </div>`;
    };
    $("cp-sheet").innerHTML = `
      <header class="cp-head">
        <p class="cp-k">Vino por copas · cálculo para</p>
        <h2>${esc(st.cliente || "el restaurante")}</h2>
        <p class="cp-sub">${fecha} · precios de carta ${st.iva ? "con IVA (10 %)" : "sin IVA"}${num(st.objetivo) ? ` · margen objetivo ${esc(st.objetivo)} %` : ""}</p>
      </header>
      ${ready ? `
      <div class="cp-heroes n${rows.length}">${rows.map(hero).join("")}</div>
      ${verdict(rows) ? `<div class="cp-verdict">${verdict(rows)}</div>` : ""}
      <p class="cp-detail-k">El detalle</p>
      <table class="cp-table">
        <thead><tr><th></th>${rows.map((r, i) => `<th>${String.fromCharCode(65 + i)} · ${esc(r.name)}</th>`).join("")}</tr></thead>
        <tbody>
          ${line("Coste de la botella", (c, r) => eur(num(r.v.coste)))}
          ${line("Precio de la copa", (c) => two(c, (x) => eur(x.copa)))}
          ${line("Coste por copa", (c) => eur(c.lo.costeCopa))}
          ${line(st.iva ? "Ingreso por copa (sin IVA)" : "Ingreso por copa", (c) => two(c, (x) => eur(x.neto)))}
          ${line("Al mes (botellas)", (c) => (c.lo.botellasMes != null ? `${c.lo.botellasMes.toLocaleString("es-ES", { maximumFractionDigits: 1 })} bot.` : "—"))}
          ${num(st.objetivo) ? line(`Precio de copa para un margen del ${esc(st.objetivo)} %`, (c) => (c.lo.sugerido ? eur(c.lo.sugerido) : "—"), "hl") : ""}
        </tbody>
      </table>`
      : `<p class="cp-empty">Escribe el coste de la botella y el precio de la copa (o su horquilla) para ver las cuentas.</p>`}
      <footer class="cp-foot"><span>${st.prueba ? "<b>Datos de prueba: no son precios reales.</b> " : ""}Cálculo orientativo con los datos que ha facilitado el restaurante.${st.iva ? " Los precios de carta incluyen el IVA de hostelería (10 %)." : ""} Disfruta de un consumo responsable.</span><span class="brand-word">${document.body.dataset.brandWord || BRAND}</span></footer>`;
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
