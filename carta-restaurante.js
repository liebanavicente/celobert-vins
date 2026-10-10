// Carta de vinos del restaurante: con los vinos de la selección (la misma del catálogo, el buscador y las propuestas),
// el comercial maqueta la carta del cliente: nombre y logo del restaurante, precio de botella y de copa y una línea por
// vino. Se ordena por estilos, se reparte en hojas A4 sin cortar ningún vino y se descarga en PDF. La vista previa es la
// misma página que va al PDF. Datos de cada vino: los reales del catálogo (fichas.js); precios y textos, los del comercial.
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ALL, byId, norm } = window.FICHAS;
  const BRAND = "celobert", BRAND_NAME = "Celobert Vins";
  const SEL = `${BRAND}-seleccion`, DOC = `${BRAND}-carta`;
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const W = 794, H = 1123; // A4 a 96 ppp

  const GROUPS = [
    ["espumoso", "Espumosos"], ["blanco", "Blancos"], ["rosado", "Rosados"], ["tinto", "Tintos"],
    ["generoso", "Generosos"], ["dulce", "Dulces"], ["otros", "Destilados y vermuts"], [null, "Otros vinos"],
  ];
  const COLORS = ["#6b1d2a", "#2f5d50", "#24425f", "#1c1a1a", "#9a5b1e"];

  let doc = { rest: "", sub: "Carta de vinos", estilo: "clasica", color: COLORS[0], logo: "", firma: true, lineas: {}, ...get(DOC, {}) };
  let ids = get(SEL, []).map((o) => o.id).filter((id) => byId[id]);
  const save = () => {
    if (!put(DOC, doc) && doc.logo) { doc.logo = ""; put(DOC, doc); alert("El logo era demasiado grande para guardarlo: prueba con una imagen más ligera."); }
    const old = get(SEL, []);
    put(SEL, ids.map((id) => old.find((o) => o.id === id) || { id, n: 1 }));
  };

  // ---------- editor ----------
  $("cv-rest").value = doc.rest;
  $("cv-sub").value = doc.sub;
  $("cv-firma").checked = doc.firma;
  $("cv-rest").addEventListener("input", () => { doc.rest = $("cv-rest").value; save(); render(); });
  $("cv-sub").addEventListener("input", () => { doc.sub = $("cv-sub").value; save(); render(); });
  $("cv-firma").addEventListener("change", () => { doc.firma = $("cv-firma").checked; save(); render(); });
  const paintChoices = () => {
    document.querySelectorAll("[data-estilo]").forEach((b) => { b.classList.toggle("on", b.dataset.estilo === doc.estilo); b.setAttribute("aria-checked", b.dataset.estilo === doc.estilo); });
    $("cv-colors").innerHTML = COLORS.map((c) => `<button type="button" role="radio" aria-label="Color ${c}" aria-checked="${c === doc.color}" class="cv-color${c === doc.color ? " on" : ""}" data-color="${c}" style="background:${c}"></button>`).join("");
  };
  $("cv-estilos").addEventListener("click", (e) => { const b = e.target.closest("[data-estilo]"); if (!b) return; doc.estilo = b.dataset.estilo; paintChoices(); save(); render(); });
  $("cv-colors").addEventListener("click", (e) => { const b = e.target.closest("[data-color]"); if (!b) return; doc.color = b.dataset.color; paintChoices(); save(); render(); });
  paintChoices();

  // logo: se reduce a 600 px para que quepa en el navegador y en el PDF
  $("cv-logo").addEventListener("change", () => {
    const f = $("cv-logo").files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      doc.logo = c.toDataURL("image/png");
      URL.revokeObjectURL(img.src);
      save(); render(); paintLogo();
    };
    img.src = URL.createObjectURL(f);
  });
  const paintLogo = () => { $("cv-logo-del").hidden = !doc.logo; };
  $("cv-logo-del").addEventListener("click", () => { doc.logo = ""; $("cv-logo").value = ""; save(); render(); paintLogo(); });
  paintLogo();

  $("cv-find").addEventListener("input", () => {
    const q = norm($("cv-find").value.trim());
    $("cv-sugg").innerHTML = q.length < 2 ? "" : ALL.filter((w) => !ids.includes(w.id) && q.split(/\s+/).every((t) => w.search.includes(t))).slice(0, 6)
      .map((w) => `<button type="button" data-id="${w.id}"><img src="${w.img}" alt="" /><span><b>${esc(w.name)}</b><small>${esc(w.winery)}</small></span></button>`).join("");
  });
  $("cv-sugg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    ids.push(b.dataset.id);
    $("cv-find").value = ""; $("cv-sugg").innerHTML = "";
    save(); paintList(); render();
  });
  // solo los botones redibujan la lista: tocar un campo no pierde el cursor
  $("cv-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-a]");
    const li = btn && btn.closest("li[data-id]");
    if (!li) return;
    ids = ids.filter((id) => id !== li.dataset.id);
    save(); paintList(); render();
  });
  $("cv-list").addEventListener("input", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li || !e.target.dataset.f) return;
    doc.lineas[li.dataset.id] = { ...(doc.lineas[li.dataset.id] || {}), [e.target.dataset.f]: e.target.value };
    save(); render();
  });

  function paintList() {
    $("cv-empty-hint").hidden = ids.length > 0;
    // en el editor, en el mismo orden que la carta
    const sorted = groups().flatMap(([, , list]) => list);
    $("cv-list").innerHTML = sorted.map((w) => {
      const l = doc.lineas[w.id] || {};
      return `
        <li data-id="${w.id}">
          <img src="${w.img}" alt="" />
          <div class="pp-li-main">
            <b>${esc(w.name)}</b><small>${esc(w.winery)}${w.tipoLabel ? ` · ${esc(w.tipoLabel)}` : ""}</small>
            <span class="cv-prices-in"><input data-f="pb" inputmode="decimal" placeholder="Botella" value="${esc(l.pb || "")}" aria-label="Precio de la botella" /><input data-f="pc" inputmode="decimal" placeholder="Copa" value="${esc(l.pc || "")}" aria-label="Precio de la copa" /></span>
            <input data-f="nota" placeholder="Una línea para la carta (opcional)" value="${esc(l.nota || "")}" aria-label="Descripción en la carta" />
          </div>
          <div class="pp-li-ctrl"><button type="button" data-a="del" aria-label="Quitar de la carta">×</button></div>
        </li>`;
    }).join("");
  }

  // ---------- la carta ----------
  function groups() {
    const wines = ids.map((id) => byId[id]).filter(Boolean);
    return GROUPS.map(([k, label]) => [k, label, wines.filter((w) => (w.tipo || null) === k).sort((a, b) => a.name.localeCompare(b.name))]).filter(([, , l]) => l.length);
  }
  const mix = (a, b, k) => {
    const h = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
    const [p, q] = [h(a), h(b)];
    return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * k)).join(",")})`;
  };
  const money = (s) => {
    const t = String(s || "").trim();
    return !t ? "" : /€/.test(t) || !/\d/.test(t) ? t : `${t} €`;
  };
  const item = (w) => {
    const l = doc.lineas[w.id] || {};
    const meta = [w.winery, w.do.replace(/^(DOQ|DOCa|DO|AOC|DOC)\s+/, ""), w.uvas.length ? w.uvas.join(", ") : ""].filter(Boolean).map(esc).join(" · ");
    return `
      <div class="cv-item">
        <div class="cv-main"><b>${esc(w.name)}</b><span class="cv-meta">${meta}</span>${l.nota ? `<em>${esc(l.nota)}</em>` : ""}</div>
        <div class="cv-price">${l.pc ? `<span><small>Copa</small>${esc(money(l.pc))}</span>` : ""}${l.pb ? `<span><small>Botella</small>${esc(money(l.pb))}</span>` : ""}</div>
      </div>`;
  };
  const head = (first) => first
    ? `<header class="cv-head">${doc.logo ? `<img class="cv-logo" src="${doc.logo}" alt="" />` : ""}<h1>${esc(doc.rest || "Nombre del restaurante")}</h1>${doc.sub ? `<p class="cv-sub">${esc(doc.sub)}</p>` : ""}<i class="cv-orn" aria-hidden="true"></i></header>`
    : `<header class="cv-head small"><span>${esc(doc.rest || "")}</span><span>${esc(doc.sub || "")}</span></header>`;
  // el pie va puesto desde el principio (con su altura real) para que el reparto mida bien; el número se pone al final
  const foot = () => `<footer class="cv-foot"><span>${doc.firma ? `Selección de vinos · <b>${BRAND_NAME}</b>` : "&nbsp;"}</span><span class="cv-pn">&nbsp;</span></footer>`;

  // reparte la carta en hojas: cada vino entra entero; si un estilo continúa en otra hoja, se repite su título
  function render() {
    const box = $("cv-pages");
    box.innerHTML = "";
    box.style.setProperty("--cv-acc", doc.color);
    box.style.setProperty("--cv-acc-light", mix(doc.color, "#f2ede3", 0.6)); // para la pizarra (el PDF no entiende color-mix)
    const pages = [];
    const page = () => {
      const p = document.createElement("section");
      p.className = `cv-page t-${doc.estilo}`;
      p.innerHTML = `${head(!pages.length)}<div class="cv-body"></div>${foot()}`;
      box.append(p);
      pages.push(p);
      return p.querySelector(".cv-body");
    };
    let body = page();
    const fits = () => body.scrollHeight <= body.clientHeight + 1;
    const gs = groups();
    if (!gs.length) body.innerHTML = `<p class="cv-empty">Añade vinos para ver la carta.</p>`;
    for (const [, label, list] of gs) {
      let h = document.createElement("h2");
      h.className = "cv-group";
      h.textContent = label;
      body.append(h);
      for (const w of list) {
        const tmp = document.createElement("div");
        tmp.innerHTML = item(w).trim();
        const el = tmp.firstChild;
        body.append(el);
        if (!fits()) {
          el.remove();
          const onlyTitle = body.lastElementChild === h;
          if (onlyTitle) h.remove();
          body = page();
          h = document.createElement("h2");
          h.className = "cv-group";
          h.textContent = onlyTitle ? label : `${label} (continuación)`;
          body.append(h, el);
        }
      }
    }
    if (pages.length > 1) pages.forEach((p, i) => (p.querySelector(".cv-pn").textContent = `${i + 1} / ${pages.length}`));
    fit();
  }
  // la vista previa, a escala de la columna (la página real mide siempre A4)
  function fit() {
    const wrap = $("cv-preview"), box = $("cv-pages");
    const k = Math.min(1, wrap.clientWidth / W);
    box.style.transform = `scale(${k})`;
    box.style.height = "auto";
    wrap.style.height = `${box.scrollHeight * k}px`;
  }
  addEventListener("resize", fit);

  // ---------- PDF: cada hoja, a tamaño A4 exacto ----------
  async function exportPDF(btn) {
    if (!window.html2canvas || !window.jspdf) return window.print();
    const label = btn.textContent;
    btn.disabled = true;
    const stage = document.createElement("div");
    stage.style.cssText = `position:fixed;left:-12000px;top:0;width:${W}px;`;
    const clone = $("cv-pages").cloneNode(true);
    clone.removeAttribute("id");
    clone.style.transform = "none";
    stage.append(clone);
    document.body.append(stage);
    try {
      await document.fonts.ready;
      await Promise.all([...stage.querySelectorAll("img")].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
      const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const pages = [...stage.querySelectorAll(".cv-page")];
      for (const [i, pg] of pages.entries()) {
        btn.textContent = `Preparando el PDF… ${i + 1}/${pages.length}`;
        const canvas = await window.html2canvas(pg, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: W, height: H, windowWidth: W, logging: false });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }
      const name = (doc.rest || "restaurante").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      pdf.save(`carta-de-vinos-${name || "restaurante"}.pdf`);
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      stage.remove();
      btn.disabled = false;
      btn.textContent = label;
    }
  }
  $("cv-pdf").addEventListener("click", (e) => exportPDF(e.currentTarget));

  paintList();
  document.fonts.ready.then(render);
  render();
})();
