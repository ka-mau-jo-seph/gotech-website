// GO-TECH Cyber — M-PESA sticker maker
// Draws the sticker on a <canvas>; the same drawing is used for the preview, the PNG download and printing.
(function () {
  const form = document.getElementById("sticker-form");
  if (!form) return;

  const preview = document.getElementById("sticker-preview");
  const status = document.getElementById("sticker-status");
  const printImg = document.getElementById("print-sticker");

  // Paper sizes at 300 dpi (portrait)
  const SIZES = {
    a4l: { label: "A4-landscape", w: 3508, h: 2480, mm: "297mm 210mm" },
  };

  const THEMES = {
    green: { main: "#00843D", dark: "#00592A", tint: "#E7F4EC", ink: "#0F2417" },
    blue:  { main: "#0A5BDB", dark: "#0B1A33", tint: "#EAF2FE", ink: "#0B1A33" },
    mono:  { main: "#111111", dark: "#000000", tint: "#EFEFEF", ink: "#111111" },
  };

  // Field ids used by each sticker type
  const TYPES = {
    till:    { fields: ["f-till", "f-name"] },
    paybill: { fields: ["f-paybill", "f-account", "f-name"] },
    pochi:   { fields: ["f-phone", "f-name"] },
    send:    { fields: ["f-phone", "f-name"] },
    agent:   { fields: ["f-agent", "f-store", "f-name"] },
  };

  const val = (id) => (document.getElementById(id)?.value || "").trim();
  const digits = (s) => s.replace(/\D/g, "");
  const spaced = (s) => s.split("").join(" ");
  const phoneFmt = (p) => (p.length === 10 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p);

  function readData() {
    const type = form.querySelector('input[name="stype"]:checked').value;
    return {
      type,
      till: digits(val("f-till")),
      paybill: digits(val("f-paybill")),
      account: val("f-account"),
      phone: digits(val("f-phone")),
      agent: digits(val("f-agent")),
      store: digits(val("f-store")),
      name: val("f-name").toUpperCase(),
      theme: form.querySelector('input[name="stheme"]:checked').value,
      size: "a4l",
      footer: document.getElementById("f-footer").checked,
      lang: form.querySelector('input[name="slang"]:checked').value,
    };
  }

  // Returns a list of problems, empty when the sticker is ready to download
  function check(d) {
    const errs = [];
    const num = (v, label) => { if (!/^\d{4,8}$/.test(v)) errs.push(`${label} should be 4 to 8 digits.`); };
    if (d.type === "till") num(d.till, "Till number");
    if (d.type === "paybill") num(d.paybill, "Business number");
    if (d.type === "pochi" || d.type === "send") { if (!/^0[17]\d{8}$/.test(d.phone)) errs.push("Phone number should be 10 digits starting with 07 or 01."); }
    if (d.type === "agent") { num(d.agent, "Agent number"); num(d.store, "Store number"); }
    return errs;
  }

  const DISPLAY = "'Sora', 'Segoe UI', Arial, sans-serif";
  const DIGITS = "'Arial Black', Arial, 'Helvetica Neue', Helvetica, sans-serif";

  // Each sticker = a header + a list of blocks, following the standard M-PESA sticker templates
  function layout(d, preview) {
    const sw = d.lang === "sw";
    const ph = (n) => "•".repeat(n);
    const name = d.name || (preview ? "BUSINESS NAME" : "");
    const nameBlock = name ? [{ kind: "name", text: name, ghost: !d.name, red: d.type === "agent" }] : [];
    switch (d.type) {
      case "send": return {
        header: [{ text: "M-PESA", size: 120 }, { text: "SEND MONEY", size: 68 }],
        blocks: [
          { kind: "label", text: "Phone Number", dark: true },
          { kind: "wide", text: d.phone ? phoneFmt(d.phone) : "07XX XXX XXX", ghost: !d.phone, round: true },
          ...nameBlock,
          { kind: "line", text: sw ? "Nenda M-PESA  >>  Send Money  >>  Weka Nambari ya Simu" : "Go to M-PESA  >>  Send Money  >>  Enter Phone Number" },
        ],
      };
      case "till": return {
        header: [{ text: "LIPA NA M-PESA", size: 124 }],
        blocks: [
          { kind: "label", text: "BUY GOODS TILL NUMBER", dark: true },
          { kind: "digits", text: d.till || ph(6) },
          ...nameBlock,
        ],
      };
      case "paybill": return {
        header: [{ text: "LIPA NA M-PESA", size: 124 }],
        blocks: [
          { kind: "label", text: "PAYBILL NUMBER" },
          { kind: "digits", text: d.paybill || ph(7) },
          { kind: "label", text: "ACCOUNT NUMBER" },
          { kind: "wide", text: d.account || "ACCOUNT NUMBER", ghost: !d.account },
          ...nameBlock,
        ],
      };
      case "pochi": return {
        header: [{ text: "LIPA KWA", size: 118 }, { text: "POCHI LA BIASHARA", size: 118 }],
        blocks: [
          { kind: "digits", text: d.phone || ph(10) },
          { kind: "steps", items: sw ? ["Chagua Lipa Na M-PESA", "Chagua Pochi La Biashara", "Weka Nambari ya Simu"] : ["Select Lipa Na M-PESA", "Select Pochi La Biashara", "Enter Phone Number"] },
          ...nameBlock,
        ],
      };
      case "agent": return {
        header: [{ text: "M-PESA", size: 130 }],
        blocks: [
          { kind: "label", text: "AGENT NUMBER" },
          { kind: "digits", text: d.agent || ph(6) },
          { kind: "label", text: "STORE NUMBER" },
          { kind: "digits", text: d.store || ph(6) },
          ...nameBlock,
        ],
      };
    }
    return { header: [], blocks: [] };
  }

  function fitText(ctx, text, weight, size, family, maxW) {
    let sz = size;
    ctx.font = `${weight} ${sz}px ${family}`;
    while (ctx.measureText(text).width > maxW && sz > 8) { sz -= 2; ctx.font = `${weight} ${sz}px ${family}`; }
    return sz;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // Natural height of each block (design units)
  function blockHeight(b, nDigitRows) {
    switch (b.kind) {
      case "label": return 60;
      case "digits": return nDigitRows > 1 ? 128 : 160;
      case "wide": return 140;
      case "name": return 116;
      case "steps": return 44;
      case "line": return 80;
    }
    return 0;
  }

  function draw(canvas, d, W, H, preview) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const u = W / 1414; // A4 landscape designed at 1414 × 1000 units
    const t = THEMES[d.theme] || THEMES.green;
    const L = layout(d, preview);
    const inner = 1274; // content width in units
    const left = (1414 - inner) / 2;
    const nDigitRows = L.blocks.filter((b) => b.kind === "digits").length;
    const busy = L.blocks.length >= 5;

    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);

    // header band
    const bandH = L.header.length > 1 ? 330 : busy ? 200 : 240;
    ctx.fillStyle = t.main; ctx.fillRect(0, 0, W, bandH * u);
    ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    const sizes = L.header.map((h) => fitText(ctx, h.text, 800, h.size * (busy ? 0.85 : 1) * u, DISPLAY, (inner - 60) * u));
    const gapH = 18 * u;
    const totalH = sizes.reduce((a, b) => a + b * 0.74, 0) + gapH * (sizes.length - 1);
    let hy = (bandH * u - totalH) / 2;
    L.header.forEach((h, i) => {
      ctx.font = `800 ${sizes[i]}px ${DISPLAY}`;
      hy += sizes[i] * 0.74;
      ctx.fillText(h.text, W / 2, hy);
      hy += gapH;
    });

    // spread the blocks evenly between the header and the footer
    const footerH = d.footer ? 70 : 20;
    const top = bandH + 30, bottom = 1000 - footerH - 20;
    const heights = L.blocks.map((b) => blockHeight(b, nDigitRows));
    const used = heights.reduce((a, b) => a + b, 0);
    // labels sit close to the block they name
    const gaps = L.blocks.length + 1 - L.blocks.filter((b) => b.kind === "label").length;
    const gap = Math.max(10, (bottom - top - used) / Math.max(1, gaps));
    let y = top + gap;

    L.blocks.forEach((b, i) => {
      const h = heights[i];
      const Y = y * u;
      if (b.kind === "label") {
        ctx.fillStyle = b.dark ? "#111111" : t.main; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        fitText(ctx, b.text, 800, (b.dark ? 52 : 58) * u, DISPLAY, inner * u);
        ctx.fillText(b.text, W / 2, Y + (h / 2) * u);
        y += h + 6;
        return;
      }
      if (b.kind === "digits") {
        const chars = b.text.split("");
        const g = 14;
        const bw = Math.min(h / 1.15, (inner - g * (chars.length - 1)) / chars.length);
        const bh = h;
        const total = bw * chars.length + g * (chars.length - 1);
        let x = 707 - total / 2;
        ctx.lineWidth = 6 * u; ctx.strokeStyle = t.main; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        chars.forEach((ch) => {
          ctx.strokeRect(x * u, Y, bw * u, bh * u);
          // inner hairline like the printed templates
          ctx.save(); ctx.lineWidth = 2 * u; ctx.strokeRect((x + 8) * u, Y + 8 * u, (bw - 16) * u, (bh - 16) * u); ctx.restore();
          ctx.fillStyle = ch === "•" ? "#C8C8C8" : "#111111";
          ctx.font = `900 ${bh * 0.66 * u}px ${DIGITS}`;
          ctx.fillText(ch, (x + bw / 2) * u, Y + (bh / 2 + 4) * u);
          x += bw + g;
        });
      }
      if (b.kind === "wide" || b.kind === "name") {
        const w = b.kind === "name" ? inner * 0.78 : inner * (b.round ? 0.86 : 1);
        const x = 707 - w / 2;
        ctx.lineWidth = 6 * u; ctx.strokeStyle = t.main;
        roundRect(ctx, x * u, Y, w * u, h * u, (b.round ? 34 : 6) * u); ctx.stroke();
        ctx.fillStyle = b.ghost ? "#C8C8C8" : (b.red ? "#B00000" : "#111111");
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const fam = b.kind === "wide" && !b.round ? DISPLAY : DISPLAY;
        fitText(ctx, b.text, 800, (b.kind === "name" ? 70 : 88) * u, fam, (w - 70) * u);
        ctx.fillText(b.text, W / 2, Y + (h / 2 + 3) * u);
      }
      if (b.kind === "steps") {
        const colW = inner / b.items.length;
        let sf = 30 * u;
        b.items.forEach((s, k) => { sf = Math.min(sf, fitText(ctx, `${k + 1}. ${s}`, 500, 30 * u, DISPLAY, (colW - 30) * u)); });
        ctx.font = `500 ${sf}px ${DISPLAY}`; ctx.fillStyle = t.main; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        b.items.forEach((s, k) => ctx.fillText(`${k + 1}. ${s}`, (left + colW * k + colW / 2) * u, Y + (h / 2) * u));
      }
      if (b.kind === "line") {
        const x1 = left + 60, x2 = 1414 - left - 60;
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.moveTo(x1 * u, Y); ctx.lineTo(x2 * u, Y); ctx.stroke();
        ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(x1 * u, Y + h * u); ctx.lineTo(x2 * u, Y + h * u); ctx.stroke();
        ctx.fillStyle = "#111111"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        fitText(ctx, b.text, 600, 34 * u, DISPLAY, (x2 - x1 - 40) * u);
        ctx.fillText(b.text, W / 2, Y + (h / 2) * u);
      }
      y += h + gap;
    });
    ctx.textBaseline = "alphabetic";

    // footer credit with rule
    if (d.footer) {
      const fy = (1000 - 58) * u;
      ctx.fillStyle = t.main; ctx.font = `500 ${24 * u}px ${DISPLAY}`; ctx.textAlign = "center";
      ctx.fillText("Generated by GO-TECH Cyber", W / 2, fy);
      ctx.strokeStyle = t.main; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(W * 0.3, fy + 22 * u); ctx.lineTo(W * 0.7, fy + 22 * u); ctx.stroke();
    }
  }

  function showFields(type) {
    const need = new Set(TYPES[type].fields);
    form.querySelectorAll("[data-field]").forEach((el) => { el.hidden = !need.has(el.dataset.field); });
    const nameLabel = document.querySelector('label[for="f-name"]');
    nameLabel.textContent = (type === "agent" ? "Agent / shop name" : type === "send" || type === "pochi" ? "Name" : "Business name") + " (shown in a bordered box)";
  }

  let pending = false;
  function render() {
    if (pending) return; pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const d = readData();
      showFields(d.type);
      draw(preview, d, 1000, Math.round(1000 / 1.4142), true);
      const errs = check(d);
      status.textContent = errs.length ? errs[0] : "Ready to download or print (A4 landscape).";
      status.dataset.ok = errs.length ? "no" : "yes";
    });
  }

  function fullSize(d) {
    const s = SIZES.a4l;
    const c = document.createElement("canvas");
    draw(c, d, s.w, s.h, false);
    return c;
  }

  function fileName(d) {
    const id = d.till || d.paybill || d.phone || d.agent || "sticker";
    return `mpesa-${d.type}-${id}-${(SIZES.a4l).label}.png`;
  }

  document.getElementById("btn-download").addEventListener("click", () => {
    const d = readData(); const errs = check(d);
    if (errs.length) { status.textContent = errs[0]; status.dataset.ok = "no"; return; }
    fullSize(d).toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = fileName(d);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      status.textContent = `Downloaded ${fileName(d)}.`; status.dataset.ok = "yes";
    }, "image/png");
  });

  document.getElementById("btn-print").addEventListener("click", () => {
    const d = readData(); const errs = check(d);
    if (errs.length) { status.textContent = errs[0]; status.dataset.ok = "no"; return; }
    const s = SIZES.a4l;
    printImg.src = fullSize(d).toDataURL("image/png");
    let pageStyle = document.getElementById("print-page-size");
    if (!pageStyle) { pageStyle = document.createElement("style"); pageStyle.id = "print-page-size"; document.head.appendChild(pageStyle); }
    pageStyle.textContent = `@page { size: ${s.mm}; margin: 0; } @media print { #print-sticker { width: ${s.mm.split(" ")[0]}; height: ${s.mm.split(" ")[1]}; } }`;
    printImg.onload = () => window.print();
  });

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (e) => e.preventDefault());

  // Redraw once the brand fonts have loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  render();
})();
