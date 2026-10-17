// GO-TECH Cyber — cover letter maker
// Drafts a standard Kenyan-format cover letter from a few details. Nothing is uploaded or saved.
(function () {
  const form = document.getElementById("cl-form");
  if (!form) return;

  const stage = document.getElementById("cl-stage");
  const scaleBox = document.getElementById("cl-scale");
  const badge = document.getElementById("cl-example-badge");
  const status = document.getElementById("cl-status");
  const bodyEl = document.getElementById("cl-body");
  const redraftBtn = document.getElementById("cl-redraft");

  const COLORS = { navy: "#0B1A33", blue: "#0A5BDB", green: "#0F6B3A", maroon: "#7A1F2B", black: "#1A1A1A" };
  const IDS = ["name", "address", "town", "phone", "email", "rname", "rtitle", "company", "caddress", "ctown",
    "position", "source", "qualification", "experience", "skills", "why", "available"];

  const EXAMPLE = {
    name: "Jane Wanjiru Mwangi", address: "P.O. Box 123 - 00217", town: "Limuru", phone: "0712 345 678", email: "jane.wanjiru@example.com",
    rname: "", rtitle: "The Human Resource Manager", company: "Example Traders Ltd", caddress: "P.O. Box 456 - 00100", ctown: "Nairobi",
    position: "Accounts Assistant", source: "the Daily Nation", qualification: "a Diploma in Business Management from Example University",
    experience: "two years' experience as an accounts assistant, where I record daily sales, reconcile M-PESA and bank statements and prepare monthly reports",
    skills: "bookkeeping, Microsoft Excel, QuickBooks and customer service", why: "", available: "immediately",
  };

  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const v = (k) => (document.getElementById("cl-" + k)?.value || "").trim();
  const opt = (name) => form.querySelector(`input[name="${name}"]:checked`).value;
  const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const dot = (s) => (/[.!?]$/.test(s) ? s : s + ".");

  let bodyEdited = false;

  function details() {
    const d = {}; IDS.forEach((k) => { d[k] = v(k); });
    d.type = opt("cltype"); d.date = v("date") || today();
    return d;
  }
  const isEmpty = (d) => !d.name && !d.company && !d.position;

  // ---------- drafting ----------
  function draft(d) {
    const co = d.company || "your organisation";
    const pos = d.position || "the advertised position";
    const contact = [d.phone, d.email].filter(Boolean).join(" or ");
    const p = [];
    if (d.type === "attachment") {
      p.push(`I am writing to request an industrial attachment opportunity${d.position ? ` in the ${d.position}` : ""} at ${co}.${d.qualification ? ` I am currently pursuing ${d.qualification}.` : ""}${d.available ? ` My attachment period is ${d.available}.` : ""}`);
      p.push(`${d.experience ? cap(dot(`Through my studies and practical work I have gained ${d.experience}`)) + " " : ""}${d.skills ? `I have developed skills in ${d.skills}, which I would like to put into practice and improve under your guidance.` : "I am eager to put what I have learnt into practice and to learn from experienced professionals."}`);
      p.push(`${d.why ? cap(dot(d.why)) + " " : `${co} would give me valuable exposure to a real working environment. `}I am hardworking, reliable and quick to learn, and I will follow all your rules and procedures during my attachment.`);
      p.push(`Please find my CV and supporting documents attached for your consideration. I would be grateful for the opportunity to discuss my request further${contact ? `, and I can be reached on ${contact}` : ""}.`);
    } else if (d.type === "general") {
      p.push(`I am writing to express my interest in joining ${co}${d.position ? ` in any suitable role in ${d.position}` : ""}. I have followed your work with interest and would welcome the chance to contribute to your team.`);
      p.push(`${d.qualification ? `I hold ${d.qualification}. ` : ""}${d.experience ? cap(dot(`I have ${d.experience}`)) + " " : ""}${d.skills ? `My skills include ${d.skills}.` : ""}`.trim());
      p.push(`${d.why ? cap(dot(d.why)) + " " : ""}I am hardworking, reliable and quick to learn, and I am confident I would be a valuable addition to your team.`);
      p.push(`Please find my CV attached for your consideration. I am available ${d.available || "immediately"} and would welcome the opportunity to meet you${contact ? `. I can be reached on ${contact}` : ""}.`);
    } else {
      p.push(`I am writing to apply for the position of ${pos} at ${co}${d.source ? `, as advertised in ${d.source}` : ""}. I believe my qualifications and experience make me a strong candidate for this role.`);
      p.push(`${d.qualification ? `I hold ${d.qualification}. ` : ""}${d.experience ? cap(dot(`I have ${d.experience}`)) + " " : ""}${d.skills ? `Along the way I have built strong skills in ${d.skills}.` : ""}`.trim());
      p.push(`${d.why ? cap(dot(d.why)) + " " : `I am keen to join ${co} and to grow my career with your team. `}I am hardworking, reliable and quick to learn, and I am confident I would add value from my first day.`);
      p.push(`Please find my CV attached for your consideration. I am available ${d.available || "immediately"} and would welcome the opportunity to discuss my application further${contact ? `. I can be reached on ${contact}` : ""}.`);
    }
    p.push("Thank you for your time and consideration.");
    return p.filter(Boolean).join("\n\n");
  }

  function reLine(d) {
    if (d.type === "attachment") return `RE: APPLICATION FOR INDUSTRIAL ATTACHMENT${d.position ? " IN THE " + d.position.toUpperCase() : ""}`;
    if (d.type === "general") return "RE: APPLICATION FOR EMPLOYMENT";
    return `RE: APPLICATION FOR THE POSITION OF ${(d.position || "[POSITION]").toUpperCase()}`;
  }

  // ---------- letter markup (preview, print, Word) ----------
  function letterHTML(d, body, tpl, color) {
    const named = !!d.rname;
    const salutation = named ? `Dear ${esc(d.rname)},` : "Dear Sir/Madam,";
    const closing = named ? "Yours sincerely," : "Yours faithfully,";
    const sender = [d.address, d.town, d.phone, d.email].filter(Boolean).map(esc);
    const recipient = [d.rname, d.rtitle, d.company, d.caddress, d.ctown].filter(Boolean).map(esc);
    const paras = String(body || "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x) => `<p>${esc(x).replace(/\n/g, "<br>")}</p>`).join("");
    const head = tpl === "simple"
      ? `<div class="lt-sender lt-right">${[esc(d.name), ...sender].filter(Boolean).join("<br>")}</div>`
      : `<header class="lt-head"><div class="cv-name">${esc(d.name)}</div><div class="lt-contacts">${sender.join('<span class="sep">•</span>')}</div></header>`;
    return `<div class="cv letter letter-${tpl}" style="--cv:${color}">
      ${head}
      <div class="lt-date">${esc(d.date)}</div>
      <div class="lt-to">${recipient.join("<br>")}</div>
      <p class="lt-salute">${salutation}</p>
      <p class="lt-re">${esc(reLine(d))}</p>
      <div class="lt-body">${paras}</div>
      <div class="lt-close">${closing}<div class="lt-sign"></div><b>${esc(d.name)}</b></div>
    </div>`;
  }

  // ---------- render ----------
  let pending = false;
  function render() {
    if (pending) return; pending = true;
    requestAnimationFrame(() => {
      pending = false;
      let d = details();
      const example = isEmpty(d);
      if (example) d = { ...EXAMPLE, type: d.type, date: d.date };
      if (!bodyEdited) bodyEl.value = example ? "" : draft(d);
      const body = example ? draft(d) : bodyEl.value;
      scaleBox.innerHTML = letterHTML(d, body, opt("cltpl"), COLORS[opt("clcolor")]);
      badge.hidden = !example;
      redraftBtn.hidden = !bodyEdited;
      fit();
    });
  }
  function fit() {
    const page = scaleBox.firstElementChild; if (!page) return;
    const s = Math.min(1, stage.clientWidth / 794);
    scaleBox.style.transform = `scale(${s})`;
    stage.style.height = `${Math.ceil(page.offsetHeight * s)}px`;
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage); else window.addEventListener("resize", fit);

  form.addEventListener("input", (e) => { if (e.target === bodyEl) bodyEdited = true; render(); });
  form.addEventListener("change", render);
  form.addEventListener("submit", (e) => e.preventDefault());
  redraftBtn.addEventListener("click", () => { bodyEdited = false; render(); status.textContent = "Letter redrafted from your details."; status.dataset.ok = "yes"; });

  // ---------- actions ----------
  const ready = () => {
    const d = details();
    if (isEmpty(d)) { status.textContent = "Fill in your name, the company and the position first. The preview is only an example."; status.dataset.ok = "no"; return null; }
    if (!d.name) { status.textContent = "Add your full name."; status.dataset.ok = "no"; document.getElementById("cl-name").focus(); return null; }
    return d;
  };
  const fileBase = () => (v("name") || "cover").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") + "-Cover-Letter";

  document.getElementById("cl-print").addEventListener("click", () => {
    const d = ready(); if (!d) return;
    let holder = document.getElementById("cv-print-root");
    if (!holder) { holder = document.createElement("div"); holder.id = "cv-print-root"; document.body.appendChild(holder); }
    holder.innerHTML = letterHTML(d, bodyEl.value, opt("cltpl"), COLORS[opt("clcolor")]);
    document.body.classList.add("print-cv");
    const done = () => { document.body.classList.remove("print-cv"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    status.textContent = "In the print window, choose a printer, or choose “Save as PDF” to get a PDF file."; status.dataset.ok = "yes";
    window.print();
  });

  document.getElementById("cl-word").addEventListener("click", () => {
    const d = ready(); if (!d) return;
    const c = COLORS[opt("clcolor")];
    const named = !!d.rname;
    const lines = (xs) => xs.filter(Boolean).map(esc).join("<br>");
    const paras = bodyEl.value.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x) => `<p style="margin:0 0 10pt;text-align:justify">${esc(x)}</p>`).join("");
    const html = `
      <p style="margin:0"><b style="font-size:18pt;color:${c}">${esc(d.name)}</b><br>${lines([d.address, d.town, d.phone, d.email])}</p>
      <p style="margin:14pt 0">${esc(d.date)}</p>
      <p style="margin:0 0 14pt">${lines([d.rname, d.rtitle, d.company, d.caddress, d.ctown])}</p>
      <p style="margin:0 0 10pt">${named ? `Dear ${esc(d.rname)},` : "Dear Sir/Madam,"}</p>
      <p style="margin:0 0 10pt"><b><u>${esc(reLine(d))}</u></b></p>
      ${paras}
      <p style="margin:14pt 0 0">${named ? "Yours sincerely," : "Yours faithfully,"}<br><br><br><b>${esc(d.name)}</b></p>`;
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(d.name)} cover letter</title>
      <style>@page{size:21cm 29.7cm;margin:2.2cm}body{font-family:Calibri,Arial,sans-serif;font-size:11.5pt;color:#111;line-height:1.4}</style></head><body>${html}</body></html>`;
    const blob = new Blob(["﻿", doc], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = fileBase() + ".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    status.textContent = `Downloaded ${fileBase()}.doc.`; status.dataset.ok = "yes";
  });

  // Carry the shared details over to the CV maker (this tab only; cleared when the tab closes)
  document.getElementById("cl-next").addEventListener("click", () => {
    try {
      sessionStorage.setItem("gotech-cv-handoff", JSON.stringify({
        name: v("name"), title: v("position"), phone: v("phone"), email: v("email"), location: v("town"),
        tpl: opt("cltpl"), color: opt("clcolor"),
      }));
    } catch (e) { /* storage blocked: the CV maker simply starts empty */ }
  });

  document.getElementById("cl-example").addEventListener("click", () => {
    IDS.forEach((k) => { document.getElementById("cl-" + k).value = EXAMPLE[k]; });
    bodyEdited = false; render();
    status.textContent = "Example loaded. Replace the details with your own."; status.dataset.ok = "yes";
  });

  const clearBtn = document.getElementById("cl-clear");
  let armed = false, timer;
  clearBtn.addEventListener("click", () => {
    if (!armed) { armed = true; clearBtn.textContent = "Click again to clear everything"; timer = setTimeout(() => { armed = false; clearBtn.textContent = "Clear form"; }, 4000); return; }
    clearTimeout(timer); armed = false; clearBtn.textContent = "Clear form";
    form.reset(); bodyEdited = false; document.getElementById("cl-date").value = today(); render();
    status.textContent = "Form cleared."; status.dataset.ok = "yes";
  });

  document.getElementById("cl-date").value = today();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  render();
})();
