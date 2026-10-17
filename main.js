// GO-TECH site script

// Replace with your WhatsApp number in international format, no + or spaces (e.g. 254712345678)
const WHATSAPP_NUMBER = "254720113852"; // main WhatsApp line (second line: 0711 789 682)

// Footer year
document.querySelectorAll(".year").forEach((el) => { el.textContent = new Date().getFullYear(); });

// Light / dark mode switch
const themeBtn = document.querySelector(".theme-btn");
const darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
function currentTheme() {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return darkQuery && darkQuery.matches ? "dark" : "light";
}
function labelThemeBtn() {
  if (!themeBtn) return;
  const next = currentTheme() === "dark" ? "light" : "dark";
  themeBtn.setAttribute("aria-label", `Switch to ${next} mode`);
}
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("gotech-theme", next); } catch (e) { /* storage blocked: still switches for this page */ }
    labelThemeBtn();
  });
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener("change", labelThemeBtn);
  labelThemeBtn();
}

// Mobile menu
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");
if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
}

// Contact form: opens WhatsApp with the message filled in
const form = document.getElementById("enquiry");
if (form) {
  const note = document.getElementById("form-note");
  const params = new URLSearchParams(location.search);
  const want = params.get("service") || (location.hash || "").replace("#", "");
  if (want) {
    const opt = [...form.need.options].find((o) => o.value === want);
    if (opt) form.need.value = want;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const biz = form.business.value.trim();
    if (!name || !biz) {
      note.textContent = "Please add your name and business name so we know who we're talking to.";
      (name ? form.business : form.name).focus();
      return;
    }
    const type = form.type.value.trim();
    const extra = form.message.value.trim();
    const text = `Hello GO-TECH, I'm ${name} from ${biz}` + (type ? ` (${type})` : "") +
      `. I'm interested in: ${form.need.options[form.need.selectedIndex].text}.` + (extra ? ` ${extra}` : "");
    const link = document.createElement("a");
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    note.textContent = "WhatsApp should open with your message. If it doesn't, message us on the number shown.";
  });
}
