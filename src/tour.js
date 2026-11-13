const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Dependency-free, target-based guided tour for the existing vanilla-JS app.
 * Uses a native modal dialog for top-layer rendering, focus containment and
 * keyboard dismissal. Callbacks keep persistence decisions in the caller.
 */
export function openTour({ steps = [], onOpenChange = () => {}, onFinish = () => {}, onSkip = () => {} } = {}) {
  const root = document.querySelector("#dialog-root");
  if (!root || !steps.length) return false;

  const available = steps.filter((step) => document.querySelector(step.target));
  if (!available.length) return false;

  const previousFocus = document.activeElement;
  let index = 0;
  let closed = false;
  let updateFrame = 0;
  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(scheduleUpdate) : null;
  const id = `naranj-tour-${Math.random().toString(36).slice(2)}`;
  const dialog = document.createElement("dialog");
  dialog.className = "tour-layer";
  dialog.setAttribute("aria-label", "راهنمای آشنایی با نارنج");
  root.replaceChildren(dialog);

  function findTarget(step = available[index]) {
    if (!step) return null;
    return [...document.querySelectorAll(step.target)].find((element) => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden") || null;
  }
  function findStep(start, direction) {
    for (let next = start; next >= 0 && next < available.length; next += direction) {
      if (findTarget(available[next])) return next;
    }
    return -1;
  }
  function close(reason) {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(updateFrame);
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("scroll", scheduleUpdate, true);
    window.visualViewport?.removeEventListener("resize", scheduleUpdate);
    window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
    observer.disconnect();
    resizeObserver?.disconnect();
    dialog.removeEventListener("click", onClick);
    dialog.removeEventListener("keydown", onKeyDown);
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("close", onClose);
    if (dialog.open) dialog.close();
    root.replaceChildren();
    if (reason === "finish") onFinish();
    else onSkip();
    onOpenChange(false);
    requestAnimationFrame(() => {
      if (previousFocus?.isConnected && typeof previousFocus.focus === "function") previousFocus.focus({ preventScroll: true });
    });
  }
  function onClose() {
    if (!closed) close("skip");
  }
  function onCancel(event) {
    event.preventDefault();
    close("skip");
  }
  function go(direction) {
    const next = findStep(index + direction, direction);
    if (next < 0) {
      if (direction > 0) close("finish");
      return;
    }
    index = next;
    paint();
  }
  function onClick(event) {
    const button = event.target.closest("[data-tour-action]");
    if (!button) return;
    const action = button.dataset.tourAction;
    if (action === "skip") close("skip");
    else if (action === "back") go(-1);
    else if (action === "next") go(1);
    else if (action === "finish") close("finish");
  }
  function onKeyDown(event) {
    if (event.key === "Escape") { event.preventDefault(); close("skip"); return; }
    if (event.key === "ArrowLeft") { event.preventDefault(); go(1); return; }
    if (event.key === "ArrowRight") { event.preventDefault(); go(-1); return; }
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")];
    if (!controls.length) { event.preventDefault(); dialog.focus(); return; }
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function scheduleUpdate() {
    if (updateFrame) return;
    updateFrame = requestAnimationFrame(() => { updateFrame = 0; place(); });
  }
  function place() {
    const step = available[index];
    let target = findTarget(step);
    if (!target) {
      const next = findStep(index + 1, 1);
      if (next < 0) { close("finish"); return; }
      index = next;
      paint();
      return;
    }
    const rect = target.getBoundingClientRect();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const padding = 8;
    const x = Math.max(8, rect.left - padding);
    const y = Math.max(8, rect.top - padding);
    const w = Math.min(width - x - 8, rect.width + padding * 2);
    const h = Math.min(height - y - 8, rect.height + padding * 2);
    const svg = dialog.querySelector(".tour-shade");
    svg?.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const mask = dialog.querySelector(`#${id}-mask`);
    mask?.setAttribute("width", String(width));
    mask?.setAttribute("height", String(height));
    if (mask) {
      const hole = mask.querySelector("rect[data-hole]");
      hole?.setAttribute("x", String(x));
      hole?.setAttribute("y", String(y));
      hole?.setAttribute("width", String(w));
      hole?.setAttribute("height", String(h));
      const outline = dialog.querySelector("[data-tour-outline]");
      outline?.setAttribute("x", String(x));
      outline?.setAttribute("y", String(y));
      outline?.setAttribute("width", String(w));
      outline?.setAttribute("height", String(h));
    }

    const card = dialog.querySelector(".tour-card");
    if (!card) return;
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width || Math.min(360, width - 32);
    const cardHeight = cardRect.height || 240;
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardWidth / 2), width - cardWidth - 16);
    const spaceAbove = rect.top - 16;
    const spaceBelow = height - rect.bottom - 16;
    let top;
    if (spaceBelow >= cardHeight + 20) top = rect.bottom + 12;
    else if (spaceAbove >= cardHeight + 20) top = rect.top - cardHeight - 12;
    else top = Math.min(Math.max(16, rect.top - cardHeight - 12), height - cardHeight - 16);
    card.style.left = `${left}px`;
    card.style.top = `${Math.max(8, top)}px`;
  }
  function paint() {
    const step = available[index];
    if (!findTarget(step)) {
      const next = findStep(index + 1, 1);
      if (next < 0) { close("finish"); return; }
      index = next;
      return paint();
    }
    const isLast = index === available.length - 1 || findStep(index + 1, 1) < 0;
    dialog.setAttribute("aria-labelledby", `${id}-title`);
    dialog.setAttribute("aria-describedby", `${id}-description`);
    dialog.innerHTML = `<svg class="tour-shade" aria-hidden="true" viewBox="0 0 ${window.innerWidth} ${window.innerHeight}" preserveAspectRatio="none"><defs><mask id="${id}-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="${window.innerWidth}" height="${window.innerHeight}"><rect width="100%" height="100%" fill="white"/><rect data-hole x="0" y="0" width="1" height="1" rx="18" fill="black"/></mask></defs><rect width="100%" height="100%" fill="var(--naranj-overlay-scrim)" opacity=".7" mask="url(#${id}-mask)"/><rect data-tour-outline x="0" y="0" width="1" height="1" rx="18" fill="none" stroke="var(--naranj-interactive-primary)" stroke-width="3"/></svg>
      <section class="tour-card" aria-labelledby="${id}-title" aria-describedby="${id}-description" tabindex="-1" dir="rtl">
        <div class="tour-card__top"><span class="tour-card__progress">مرحلهٔ ${index + 1} از ${available.length}</span><button type="button" class="tour-close" data-tour-action="skip" aria-label="بستن راهنما">×</button></div>
        <div class="tour-progress" role="list" aria-label="پیشرفت راهنما">${available.map((_, number) => `<span role="listitem" aria-label="مرحلهٔ ${number + 1}" aria-current="${number === index ? "step" : "false"}" class="${number === index ? "is-current" : number < index ? "is-done" : ""}"></span>`).join("")}</div>
        <h2 id="${id}-title">${escape(step.title)}</h2><p id="${id}-description">${escape(step.description)}</p>
        <div class="tour-card__actions"><button type="button" class="button button--tertiary" data-tour-action="skip">رد کردن راهنما</button><div class="tour-card__step-actions">${index > 0 ? `<button type="button" class="button button--tertiary" data-tour-action="back">قبلی</button>` : ""}<button type="button" class="button button--primary" data-tour-action="${isLast ? "finish" : "next"}">${isLast ? "پایان راهنما" : "بعدی"}</button></div></div>
      </section>`;
    dialog.querySelector(isLast ? "[data-tour-action='finish']" : "[data-tour-action='next']")?.focus({ preventScroll: true });
    const target = findTarget(step);
    resizeObserver?.disconnect();
    if (target) resizeObserver?.observe(target);
    const rect = target?.getBoundingClientRect();
    if (rect && (rect.top < 12 || rect.bottom > window.innerHeight - 12)) {
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    }
    scheduleUpdate();
  }

  const observer = new MutationObserver(scheduleUpdate);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("keydown", onKeyDown);
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("close", onClose);
  observer.observe(document.querySelector("#app") || document.body, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
  window.visualViewport?.addEventListener("resize", scheduleUpdate, { passive: true });
  window.visualViewport?.addEventListener("scroll", scheduleUpdate, { passive: true });
  dialog.showModal();
  onOpenChange(true);
  paint();
  return true;
}
