export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

const iconPaths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8"/>',
  chart: '<path d="M4 19V5M4 19h17"/><path d="M8 16v-4m5 4V8m5 8v-7"/>',
  medal: '<circle cx="12" cy="8" r="5"/><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.8-.8-1.8-1.2-3-1.2-1.6 0-2.7.8-2.7 2s1.1 1.8 2.7 2.2 2.7 1 2.7 2.3-1.1 2.2-2.9 2.2c-1.2 0-2.4-.5-3.2-1.3M12 5.8v12.4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  exit: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  filter: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/>',
  edit: '<path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5z"/><path d="m13.8 6.7 3.5 3.5"/>',
  trash: '<path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/>',
};

export function icon(name, className = "icon") {
  return `<svg class="${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.info}</svg>`;
}

export function button(label, variant = "primary", attrs = "", iconName = "") {
  return `<button type="button" class="button button--${variant}" ${attrs}>${iconName ? icon(iconName) : ""}<span>${label}</span></button>`;
}

export function linkButton(label, href, variant = "secondary", iconName = "") {
  return `<a class="button button--${variant}" href="${escapeHtml(href)}">${iconName ? icon(iconName) : ""}<span>${label}</span></a>`;
}

export function card(content, className = "") {
  return `<section class="card ${className}">${content}</section>`;
}

export function pageHeader(title, subtitle = "", action = "") {
  return `<header class="page-heading"><div><h1 tabindex="-1">${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div>${action ? `<div class="page-heading__action">${action}</div>` : ""}</header>`;
}

export function statusPill(label, tone = "neutral", iconName = "") {
  return `<span class="status-pill status-pill--${tone}">${iconName ? icon(iconName) : ""}<span>${label}</span></span>`;
}

export function emptyState(title, message, action = "", tone = "info") {
  return `<div class="empty-state empty-state--${tone}"><span class="empty-state__icon">${icon("info")}</span><div><h3>${title}</h3><p>${message}</p>${action ? `<div class="empty-state__action">${action}</div>` : ""}</div></div>`;
}

export function field({ id, label, type = "text", value = "", placeholder = "", hint = "", required = false, min = "", attrs = "" }) {
  return `<div class="form-field"><label for="${escapeHtml(id)}">${label}${required ? '<span aria-hidden="true"> *</span>' : ""}</label><input id="${escapeHtml(id)}" name="${escapeHtml(id)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ""} ${required ? "required" : ""} ${min ? `min="${escapeHtml(min)}"` : ""} ${attrs}>${hint ? `<small>${hint}</small>` : ""}<span class="field-error" id="${escapeHtml(id)}-error"></span></div>`;
}

export const faNumber = (value) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Number(value) || 0);
export function formatDate(iso, options = { day: "numeric", month: "long" }) {
  if (!iso) return "—";
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { ...options, timeZone: "Asia/Tehran" }).format(date);
}
export function relativeDate(iso) {
  if (!iso) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  const days = Math.round((target - today) / 86400000);
  if (days === 0) return "امروز";
  if (days === 1) return "فردا";
  if (days === -1) return "دیروز";
  return formatDate(iso);
}

export function stageLabel(stage) {
  return ({
    "not-started": "شروع‌نشده",
    attempt: "تلاش",
    familiar: "آشنا",
    proficient: "مسلط",
    mastered: "استادشده",
  })[stage] || "شروع‌نشده";
}

export function stageTone(stage) {
  return stage === "not-started" ? "neutral" : stage === "mastered" ? "success" : "brand";
}
