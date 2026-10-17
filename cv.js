// GO-TECH Cyber — CV generator
// Everything stays in this browser tab: nothing is uploaded or saved, so it is safe on a shared cyber computer.
(function () {
  const form = document.getElementById("cv-form");
  if (!form) return;

  const stage = document.getElementById("cv-stage");
  const scaleBox = document.getElementById("cv-scale");
  const badge = document.getElementById("cv-example-badge");
  const status = document.getElementById("cv-status");

  const COLORS = { navy: "#0B1A33", blue: "#0A5BDB", green: "#0F6B3A", maroon: "#7A1F2B", black: "#1A1A1A" };

  const EXAMPLE = {
    name: "Jane Wanjiru Mwangi", title: "Accounts Assistant",
    phone: "0712 345 678", email: "jane.wanjiru@example.com", location: "Limuru, Kiambu County", extra: "",
    profile: "Organised and reliable accounts assistant with two years' experience in bookkeeping, M-PESA reconciliation and customer service. Comfortable with Excel and QuickBooks, and keen to grow in a busy finance team.",
    skills: "Bookkeeping and petty cash\nM-PESA and bank reconciliation\nMicrosoft Excel and Word\nQuickBooks\nCustomer service",
    languages: "English (fluent)\nKiswahili (fluent)\nKikuyu (fluent)",
    hobbies: "Reading, volunteering, football",
    education: [
      { school: "Example University", qualification: "Diploma in Business Management", from: "2019", to: "2021", notes: "" },
      { school: "Example Girls High School", qualification: "Kenya Certificate of Secondary Education (KCSE), Grade B", from: "2015", to: "2018", notes: "" },
    ],
    experience: [
      { role: "Accounts Assistant", org: "Example Traders Ltd, Limuru", from: "2022", to: "Present", duties: "Recorded daily sales and expenses\nReconciled M-PESA till and bank statements every week\nPrepared monthly reports for the manager" },
      { role: "Attachment, Finance Department", org: "Example County Office", from: "May 2021", to: "Aug 2021", duties: "Filed invoices and receipts\nHelped prepare payment vouchers" },
    ],
    referees: [
      { name: "Mr. John Kamau", title: "Finance Manager", org: "Example Traders Ltd", phone: "0722 000 000", email: "" },
      { name: "Ms. Grace Njeri", title: "Lecturer", org: "Example University", phone: "0733 000 000", email: "" },
    ],
  };

  const blankEdu = () => ({ school: "", qualification: "", from: "", to: "", notes: "" });
  const blankExp = () => ({ role: "", org: "", from: "", to: "", duties: "" });
  const blankRef = () => ({ name: "", title: "", org: "", phone: "", email: "" });

  const state = { education: [blankEdu()], experience: [blankExp()], referees: [blankRef(), blankRef()], photo: "" };

  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lines = (s) => String(s || "").split(/\n|,(?=\s)/).map((x) => x.trim()).filter(Boolean);
  const v = (id) => (document.getElementById(id)?.value || "").trim();

  // ---------- repeatable sections (education, experience, referees) ----------
  const LISTS = {
    education: { blank: blankEdu, title: "Education", fields: [
      ["qualification", "Qualification / course", "e.g. Diploma in ICT, KCSE Grade B"], ["school", "School / institution", "e.g. Limuru TVC"],
      ["from", "From", "e.g. 2019"], ["to", "To", "e.g. 2021 or Present"] ] },
    experience: { blank: blankExp, title: "Job", fields: [
      ["role", "Job title", "e.g. Shop Attendant"], ["org", "Employer and town", "e.g. Wamaina Gas Suppliers, Limuru"],
      ["from", "From", "e.g. Jan 2023"], ["to", "To", "e.g. Present"], ["duties", "Duties (one per line)", "e.g. Served customers\nKept daily sales records", true] ] },
    referees: { blank: blankRef, title: "Referee", fields: [
      ["name", "Full name", "e.g. Mr. John Kamau"], ["title", "Position", "e.g. Manager"], ["org", "Organisation", "e.g. Example Ltd"],
      ["phone", "Phone", "e.g. 0722 000 000"], ["email", "Email (optional)", ""] ] },
  };

  function renderList(key) {
    const box = document.getElementById(`list-${key}`);
    const spec = LISTS[key];
    box.innerHTML = state[key].map((item, i) => `
      <div class="rep-item">
        <div class="rep-head"><b>${spec.title} ${i + 1}</b>${state[key].length > 1 ? `<button type="button" class="rep-remove" data-list="${key}" data-i="${i}">Remove</button>` : ""}</div>
        <div class="rep-grid">${spec.fields.map(([f, label, ph, multi]) => {
          const id = `${key}-${i}-${f}`;
          const input = multi
            ? `<textarea id="${id}" data-list="${key}" data-i="${i}" data-f="${f}" rows="3" placeholder="${esc(ph)}">${esc(item[f])}</textarea>`
            : `<input id="${id}" data-list="${key}" data-i="${i}" data-f="${f}" value="${esc(item[f])}" placeholder="${esc(ph)}">`;
          return `<div class="field${multi ? " span2" : ""}"><label for="${id}">${label}</label>${input}</div>`;
        }).join("")}</div>
      </div>`).join("");
  }

  form.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.list) state[el.dataset.list][+el.dataset.i][el.dataset.f] = el.value;
    render();
  });
  form.addEventListener("change", render);
  form.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const rm = e.target.closest(".rep-remove");
    if (add) { const k = add.dataset.add; state[k].push(LISTS[k].blank()); renderList(k); render(); }
    if (rm) { const k = rm.dataset.list; state[k].splice(+rm.dataset.i, 1); renderList(k); render(); }
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  // photo (optional): read locally, never uploaded
  document.getElementById("cv-photo").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) { state.photo = ""; render(); return; }
    const r = new FileReader();
    r.onload = () => { state.photo = r.result; render(); };
    r.readAsDataURL(file);
  });
  document.getElementById("cv-photo-clear").addEventListener("click", () => {
    state.photo = ""; document.getElementById("cv-photo").value = ""; render();
  });

  // ---------- collect data ----------
  const filled = (o) => Object.values(o).some((x) => String(x || "").trim());
  function collect() {
    const d = {
      name: v("cv-name"), title: v("cv-title"), phone: v("cv-phone"), email: v("cv-email"), location: v("cv-location"), extra: v("cv-extra"),
      profile: v("cv-profile"), skills: v("cv-skills"), languages: v("cv-languages"), hobbies: v("cv-hobbies"),
      education: state.education.filter(filled), experience: state.experience.filter(filled), referees: state.referees.filter(filled),
      photo: state.photo,
    };
    const empty = !d.name && !d.profile && !d.education.length && !d.experience.length;
    return { data: empty ? { ...EXAMPLE, photo: "" } : d, example: empty };
  }

  // ---------- CV markup (shared by preview, print and Word) ----------
  function section(title, inner) { return inner ? `<section class="cv-sec"><h2>${title}</h2>${inner}</section>` : ""; }
  function dates(a, b) { return [a, b].filter(Boolean).map(esc).join(" – "); }
  function listHTML(s) { const xs = lines(s); return xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""; }
  function expHTML(d) {
    return d.experience.map((x) => `<div class="cv-entry"><div class="cv-row"><b>${esc(x.role)}</b><span>${dates(x.from, x.to)}</span></div><div class="cv-org">${esc(x.org)}</div>${listHTML(x.duties)}</div>`).join("");
  }
  function eduHTML(d) {
    return d.education.map((x) => `<div class="cv-entry"><div class="cv-row"><b>${esc(x.qualification)}</b><span>${dates(x.from, x.to)}</span></div><div class="cv-org">${esc(x.school)}</div></div>`).join("");
  }
  function refHTML(d) {
    return d.referees.length ? `<div class="cv-refs">${d.referees.map((r) => `<div><b>${esc(r.name)}</b><div>${esc([r.title, r.org].filter(Boolean).join(", "))}</div>${r.phone ? `<div>Tel: ${esc(r.phone)}</div>` : ""}${r.email ? `<div>${esc(r.email)}</div>` : ""}</div>`).join("")}</div>` : "";
  }
  function contacts(d) { return [d.phone, d.email, d.location, d.extra].filter(Boolean).map(esc); }

  function cvHTML(d, tpl, color) {
    if (tpl === "modern") {
      const photo = d.photo ? `<img class="cv-photo" src="${d.photo}" alt="">` : "";
      return `<div class="cv cv-modern" style="--cv:${color}">
        <aside class="cv-side">${photo}
          <div class="cv-name">${esc(d.name)}</div><div class="cv-title">${esc(d.title)}</div>
          ${section("Contact", contacts(d).length ? `<ul class="plain">${contacts(d).map((c) => `<li>${c}</li>`).join("")}</ul>` : "")}
          ${section("Skills", listHTML(d.skills))}
          ${section("Languages", listHTML(d.languages))}
          ${section("Hobbies", d.hobbies ? `<p>${esc(d.hobbies)}</p>` : "")}
        </aside>
        <div class="cv-main">
          ${section("Profile", d.profile ? `<p>${esc(d.profile)}</p>` : "")}
          ${section("Work experience", expHTML(d))}
          ${section("Education", eduHTML(d))}
          ${section("Referees", refHTML(d))}
        </div></div>`;
    }
    const photo = d.photo && tpl === "classic" ? `<img class="cv-photo" src="${d.photo}" alt="">` : "";
    return `<div class="cv cv-${tpl}" style="--cv:${color}">
      <header class="cv-head">${photo}<div><div class="cv-name">${esc(d.name)}</div><div class="cv-title">${esc(d.title)}</div>
      <div class="cv-contacts">${contacts(d).join('<span class="sep">•</span>')}</div></div></header>
      ${section("Profile", d.profile ? `<p>${esc(d.profile)}</p>` : "")}
      ${section("Work experience", expHTML(d))}
      ${section("Education", eduHTML(d))}
      ${section("Skills", listHTML(d.skills) ? `<div class="cv-cols">${listHTML(d.skills)}</div>` : "")}
      ${section("Languages", listHTML(d.languages))}
      ${section("Hobbies", d.hobbies ? `<p>${esc(d.hobbies)}</p>` : "")}
      ${section("Referees", refHTML(d))}
    </div>`;
  }

  // ---------- preview ----------
  const opt = (name) => form.querySelector(`input[name="${name}"]:checked`).value;
  let pending = false;
  function render() {
    if (pending) return; pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const { data, example } = collect();
      scaleBox.innerHTML = cvHTML(data, opt("cvtpl"), COLORS[opt("cvcolor")]);
      badge.hidden = !example;
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

  // ---------- actions ----------
  const ready = () => {
    const { example } = collect();
    if (example) { status.textContent = "Fill in at least your name and one section first. The preview is only an example."; status.dataset.ok = "no"; return false; }
    if (!v("cv-name")) { status.textContent = "Add your full name at the top."; status.dataset.ok = "no"; document.getElementById("cv-name").focus(); return false; }
    return true;
  };
  const fileBase = () => (v("cv-name") || "cv").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") + "-CV";

  document.getElementById("cv-print").addEventListener("click", () => {
    if (!ready()) return;
    let holder = document.getElementById("cv-print-root");
    if (!holder) { holder = document.createElement("div"); holder.id = "cv-print-root"; document.body.appendChild(holder); }
    holder.innerHTML = cvHTML(collect().data, opt("cvtpl"), COLORS[opt("cvcolor")]);
    document.body.classList.add("print-cv");
    const done = () => { document.body.classList.remove("print-cv"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    status.textContent = "In the print window, choose a printer, or choose “Save as PDF” to get a PDF file."; status.dataset.ok = "yes";
    window.print();
  });

  // Word: a simple single-column document Word opens and edits easily
  document.getElementById("cv-word").addEventListener("click", () => {
    if (!ready()) return;
    const d = collect().data; const c = COLORS[opt("cvcolor")];
    const h2 = (t) => `<h2 style="font-family:Calibri,Arial;font-size:13pt;color:${c};border-bottom:1.5pt solid ${c};margin:14pt 0 6pt;padding-bottom:2pt;text-transform:uppercase;letter-spacing:1pt">${t}</h2>`;
    const ul = (s) => { const xs = lines(s); return xs.length ? `<ul style="margin:2pt 0 4pt 18pt">${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""; };
    const entry = (a, b, sub, extra) => `<table width="100%" style="border-collapse:collapse"><tr><td style="font-weight:bold">${a}</td><td align="right" style="color:#555">${b}</td></tr></table><div style="color:#444">${sub}</div>${extra || ""}`;
    const body = `
      <h1 style="font-family:Calibri,Arial;font-size:24pt;color:${c};margin:0">${esc(d.name)}</h1>
      <div style="font-size:13pt;font-weight:bold;margin:2pt 0">${esc(d.title)}</div>
      <div style="color:#444">${contacts(d).join(" &nbsp;|&nbsp; ")}</div>
      ${d.profile ? h2("Profile") + `<p>${esc(d.profile)}</p>` : ""}
      ${d.experience.length ? h2("Work experience") + d.experience.map((x) => entry(esc(x.role), dates(x.from, x.to), esc(x.org), ul(x.duties))).join("<br>") : ""}
      ${d.education.length ? h2("Education") + d.education.map((x) => entry(esc(x.qualification), dates(x.from, x.to), esc(x.school))).join("<br>") : ""}
      ${lines(d.skills).length ? h2("Skills") + ul(d.skills) : ""}
      ${lines(d.languages).length ? h2("Languages") + ul(d.languages) : ""}
      ${d.hobbies ? h2("Hobbies") + `<p>${esc(d.hobbies)}</p>` : ""}
      ${d.referees.length ? h2("Referees") + d.referees.map((r) => `<p style="margin:0 0 8pt"><b>${esc(r.name)}</b><br>${esc([r.title, r.org].filter(Boolean).join(", "))}${r.phone ? `<br>Tel: ${esc(r.phone)}` : ""}${r.email ? `<br>${esc(r.email)}` : ""}</p>`).join("") : ""}`;
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(d.name)} CV</title>
      <style>@page{size:21cm 29.7cm;margin:2cm}body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111}</style></head><body>${body}</body></html>`;
    const blob = new Blob(["﻿", doc], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = fileBase() + ".doc";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    status.textContent = `Downloaded ${fileBase()}.doc. Open it in Microsoft Word or WPS to edit.`; status.dataset.ok = "yes";
  });

  document.getElementById("cv-example").addEventListener("click", () => {
    const E = EXAMPLE;
    [["cv-name", E.name], ["cv-title", E.title], ["cv-phone", E.phone], ["cv-email", E.email], ["cv-location", E.location], ["cv-profile", E.profile],
     ["cv-skills", E.skills], ["cv-languages", E.languages], ["cv-hobbies", E.hobbies]].forEach(([id, val]) => { document.getElementById(id).value = val; });
    state.education = E.education.map((x) => ({ ...x })); state.experience = E.experience.map((x) => ({ ...x })); state.referees = E.referees.map((x) => ({ ...x }));
    ["education", "experience", "referees"].forEach(renderList); render();
    status.textContent = "Example loaded. Replace the details with your own."; status.dataset.ok = "yes";
  });

  // Two-step clear (no pop-up dialogs)
  const clearBtn = document.getElementById("cv-clear");
  let armed = false, timer;
  clearBtn.addEventListener("click", () => {
    if (!armed) { armed = true; clearBtn.textContent = "Click again to clear everything"; timer = setTimeout(() => { armed = false; clearBtn.textContent = "Clear form"; }, 4000); return; }
    clearTimeout(timer); armed = false; clearBtn.textContent = "Clear form";
    form.reset(); state.photo = "";
    state.education = [blankEdu()]; state.experience = [blankExp()]; state.referees = [blankRef(), blankRef()];
    ["education", "experience", "referees"].forEach(renderList); render();
    status.textContent = "Form cleared."; status.dataset.ok = "yes";
  });

  // Details carried over from the cover letter maker (same tab only)
  try {
    const h = JSON.parse(sessionStorage.getItem("gotech-cv-handoff") || "null");
    if (h) {
      [["cv-name", h.name], ["cv-title", h.title], ["cv-phone", h.phone], ["cv-email", h.email], ["cv-location", h.location]]
        .forEach(([id, val]) => { const el = document.getElementById(id); if (el && !el.value && val) el.value = val; });
      const t = form.querySelector(`input[name="cvtpl"][value="${h.tpl}"]`); if (t) t.checked = true;
      const c = form.querySelector(`input[name="cvcolor"][value="${h.color}"]`); if (c) c.checked = true;
      sessionStorage.removeItem("gotech-cv-handoff");
      status.textContent = "Your details from the cover letter have been filled in."; status.dataset.ok = "yes";
    }
  } catch (e) { /* storage blocked: start empty */ }

  ["education", "experience", "referees"].forEach(renderList);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  render();
})();
