import { demoAccounts, SOURCE_GAPS } from "./data/demo.js";
import { demoQuestions, evaluateDemoAnswer } from "./data/questions.js";
import { readStore, writeStore, resetStore, currentClass, findSkill, markSkillAttempted, progressFor } from "./store.js";
import { escapeHtml, icon, button, linkButton, pageHeader, statusPill, emptyState, field, faNumber, formatDate } from "./ui.js";
import { studentHome, studentLibrary, studentRecommendations, studentProgress, studentAchievements } from "./pages/student.js";
import { practicePage } from "./pages/practice.js";
import { teacherHome, teacherClasses, teacherLibrary, teacherAssignments, teacherAssignmentBuilder, teacherAssignmentTracking, teacherAnalytics } from "./pages/teacher.js";
import { studentAvatars } from "./data/avatars.js";
import { openTour } from "./tour.js";

const APP = document.querySelector("#app");
const DIALOG_ROOT = document.querySelector("#dialog-root");
const state = readStore();
state.skills = [];
state.topics = [];
const ui = {
  search: "", topic: "all", libraryLimit: 15,
  teacherSearch: "", teacherTopic: "all", teacherLibraryLimit: 12,
  rosterSearch: "", selectedSkills: [], showSelection: false,
  draftStep: 0, assignmentDraft: null,
  pendingPractice: null, message: "",
  avatarSelection: null, avatarFirstTime: false,
  startTourAfterRender: false, replayTourAfterRender: false,
};
const APP_BASE_PATH = window.__NARANJ_BASE_PATH__ || "";
function appRoutePath(pathname) {
  let route = pathname.replace(/\/$/, "") || "/";
  if (APP_BASE_PATH && (route === APP_BASE_PATH || route.startsWith(`${APP_BASE_PATH}/`))) route = route.slice(APP_BASE_PATH.length) || "/";
  return route || "/";
}
function browserRoutePath(route) {
  if (!APP_BASE_PATH || route === APP_BASE_PATH || route.startsWith(`${APP_BASE_PATH}/`)) return route;
  return `${APP_BASE_PATH}${route.startsWith("/") ? route : `/${route}`}`;
}
const restoredRequest = new URLSearchParams(location.search).get("__naranj_route");
if (restoredRequest) {
  const restored = new URL(restoredRequest, location.origin);
  if (restored.origin === location.origin && restored.pathname.startsWith("/")) {
    history.replaceState({}, "", browserRoutePath(restored.pathname) + restored.search + restored.hash);
  }
}
let currentRoute = appRoutePath(location.pathname);
let focusAfterRender = false;
let ticker = null;
let routeMotionTimer = null;

fetch("/src/data/skills.json")
  .then((response) => { if (!response.ok) throw new Error("Could not load skill data"); return response.json(); })
  .then((data) => { state.skills = data.skills || []; state.topics = data.topics || []; render(); })
  .catch((error) => {
    console.error(error);
    APP.innerHTML = `<main class="load-failure"><h1>دادهٔ مهارت بارگذاری نشد</h1><p>فایل مهارت‌های پروژه در دسترس نیست.</p><button type="button" class="button button--secondary" data-action="reload-page">تلاش دوباره</button></main>`;
  });

function activeUser() {
  return state.signedInAs ? demoAccounts[state.signedInAs] || null : null;
}
function homePath(role = activeUser()?.role) {
  return role === "teacher" ? "/teacher/home" : "/student/home";
}
function go(path, { replace = false, focus = true } = {}) {
  const url = new URL(path, location.origin);
  const destination = browserRoutePath(url.pathname) + url.search;
  if (replace) history.replaceState({}, "", destination);
  else history.pushState({}, "", destination);
  currentRoute = appRoutePath(url.pathname);
  focusAfterRender = focus;
  ui.routeTransition = true;
  render();
}
function setRouteForRole(path) {
  const user = activeUser();
  if (!user) { go("/", { replace: true, focus: false }); return false; }
  const wanted = path.startsWith("/teacher") ? "teacher" : path.startsWith("/student") ? "student" : user.role;
  if (wanted !== user.role) { go(homePath(user.role), { replace: true, focus: false }); return false; }
  return true;
}
function landingView() {
  return `<div class="public-page" id="main-content" tabindex="-1">
    <header class="public-header"><a class="public-brand" href="/" aria-label="نارنج"><img src="/illustrations/naranj-brand.webp" alt="نارنج" /></a><a class="button button--tertiary public-header__login" href="/login">ورود</a></header>
    <main class="public-hero" aria-labelledby="public-title">
      <section class="public-hero__copy"><span class="eyebrow">نارنج</span><h1 id="public-title">به نارنج خوش آمدی</h1><p>برای ادامه، با حسابی که مدرسه در اختیارت گذاشته وارد شو.</p><a class="button button--primary button--large" href="/login">ورود به نارنج ${icon("arrow")}</a></section>
      <div class="public-hero__art" aria-hidden="true"><span class="hero-stage"></span><img class="hero-brand-visual" src="/illustrations/naranj-brand.webp" alt="" fetchpriority="high" /><img class="hero-book-visual" src="/illustrations/3d-notebook.webp" alt="" /></div>
    </main>
    <footer class="public-footer"><span>دموی محلی</span><span>ورود با حساب آزمایشی</span></footer>
  </div>`;
}
function loginView(error = "") {
  return `<main class="auth-page" id="main-content" tabindex="-1">
    <a class="auth-back" href="/">${icon("arrow")} بازگشت به نارنج</a>
    <section class="auth-card" aria-labelledby="login-title">
      <img class="brand-logo" src="/illustrations/naranj-brand.webp" alt="نارنج" />
      <span class="eyebrow">ورود با حساب مدرسه</span><h1 id="login-title" tabindex="-1">ورود به نارنج</h1><p class="auth-intro">نام کاربری و گذرواژهٔ حساب خود را وارد کن.</p>
      <form id="login-form" novalidate>
        ${field({id:"username",label:"نام کاربری",placeholder:"نام کاربری",attrs:'autocomplete="username"'})}
        ${field({id:"password",label:"گذرواژه",type:"password",placeholder:"گذرواژه",attrs:'autocomplete="current-password"'})}
        ${error ? `<div class="form-error-summary" role="alert">${icon("info")}<span>${escapeHtml(error)}</span></div>` : ""}
        <button type="submit" class="button button--primary button--large auth-submit">ورود</button>
      </form>
      <div class="demo-credentials"><span class="eyebrow">حساب‌های آزمایشی</span><p><bdi dir="ltr">student.demo</bdi> یا <bdi dir="ltr">teacher.demo</bdi></p><p>گذرواژهٔ هر دو: <bdi dir="ltr">naranj-demo</bdi></p><small>ورود و داده‌ها فقط در همین مرورگر شبیه‌سازی می‌شوند؛ سرویس احراز هویت وجود ندارد.</small></div>
      <div class="auth-footnote">${icon("info")}<span>هیچ نقشی پیش از ورود انتخاب نمی‌شود.</span></div>
    </section>
  </main>`;
}

const studentNavigation = [
  ["/student/home", "خانه", "home"],
  ["/student/library", "کتابخانه", "book"],
  ["/student/progress", "پیشرفت", "chart"],
  ["/student/achievements", "نشان‌ها", "medal"],
];
const teacherNavigation = [
  ["/teacher/home", "خانه", "home"],
  ["/teacher/classes", "کلاس‌ها", "people"],
  ["/teacher/assignments", "تکلیف‌ها", "list"],
  ["/teacher/library", "مهارت‌ها", "book"],
  ["/teacher/analytics", "گزارش", "chart"],
];
function navMarkup(entries, path) {
  return entries.map(([href,label,iconName]) => {
    const target = href === "/student/library" ? "student-library" : href === "/student/progress" ? "student-progress" : href === "/student/achievements" ? "student-achievements" : "";
    const active = path === href || (href !== "/student/home" && href !== "/teacher/home" && path.startsWith(href));
    return `<a class="nav-link ${active ? "is-active" : ""}" href="${href}" ${active ? 'aria-current="page"' : ""} ${target ? `data-tour-target="${target}"` : ""}>${icon(iconName)}<span>${label}</span></a>`;
  }).join("");
}
function shell(content, path, user) {
  const teacher = user.role === "teacher";
  const nav = teacher ? teacherNavigation : studentNavigation;
  const brand = `<a class="sidebar-brand" href="${homePath(user.role)}"><img src="/illustrations/naranj-brand.webp" alt="" /><span>نارنج</span><small>فضای ${teacher ? "معلم" : "دانش‌آموز"}</small></a>`;
  const avatar = studentAvatars.find((item) => item.id === state.studentAvatarId);
  const classControl = teacher ? `<label class="class-switcher"><span>کلاس فعال</span><select aria-label="تغییر کلاس فعال" data-ui="activeClassId" ${path.startsWith("/teacher/assignments/new") ? "disabled" : ""}>${state.classes.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === state.activeClassId ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}</select></label>` : `<div class="student-context">${avatar ? `<img class="student-avatar-image" src="${avatar.src}" alt="" />` : `<span class="student-avatar">د</span>`}<span><small>دانش‌آموز</small><strong>دانش‌آموز نمونه</strong></span></div>`;
  const desktop = `<aside class="sidebar">${brand}<nav class="primary-nav" aria-label="ناوبری اصلی">${navMarkup(nav,path)}</nav><div class="sidebar-bottom"><div class="sidebar-demo-note">${icon("info")}<span>دموی محلی<br/>اطلاعات نمایشی</span></div><button class="nav-link nav-utility" type="button" data-action="open-account">${icon("people")}<span>حساب و خروج</span></button></div></aside>`;
  const topbar = `<header class="app-topbar"><div class="app-topbar__mobile-brand"><img src="/illustrations/naranj-brand.webp" alt="" /><strong>نارنج</strong></div><div class="app-topbar__context">${classControl}</div><div class="app-topbar__right"><span class="local-badge">دموی محلی</span><button type="button" class="icon-button account-button" data-action="open-account" aria-label="حساب و خروج">${icon("people")}</button></div></header>`;
  return `<div class="app-shell ${teacher ? "app-shell--teacher" : "app-shell--student"}">${desktop}<div class="app-main">${topbar}<main class="page-content ${ui.routeTransition ? "is-route-entering" : ""}" id="main-content" tabindex="-1">${content}</main></div><nav class="mobile-nav" aria-label="ناوبری اصلی">${navMarkup(nav,path)}</nav></div>`;
}

function accountView(user) {
  const display = user.role === "teacher" ? "معلم نمونه" : "دانش‌آموز نمونه";
  const avatar = user.role === "student" ? studentAvatars.find((item) => item.id === state.studentAvatarId) : null;
  const studentTools = user.role === "student" ? `<div class="profile-tools"><div class="profile-avatar-preview">${avatar ? `<img src="${avatar.src}" alt="" />` : `<span>${icon("people")}</span>`}<div><strong>${avatar ? "شخصیت انتخاب‌شده" : "شخصیتی انتخاب نشده"}</strong><small>این انتخاب فقط نمایشی است و بر یادگیری یا دسترسی اثر ندارد.</small></div></div><div class="account-actions">${button(avatar ? "تغییر شخصیت" : "انتخاب شخصیت", "secondary", 'data-action="change-avatar"', "edit")}${button("پخش دوبارهٔ راهنمای خانه", "tertiary", 'data-action="replay-student-tour"', "spark")}</div></div>` : "";
  return `${pageHeader("حساب و تنظیمات", "حساب و داده‌های این صفحه فقط برای آزمودن دمو هستند.")}
    <section class="account-panel">${cardMarkup(`<div class="account-mark">${icon("people")}</div><div><span class="eyebrow">حساب آزمایشی</span><h2>${display}</h2><p><bdi dir="ltr">${escapeHtml(state.signedInAs)}</bdi> · نقش از حساب تشخیص داده شده است.</p></div>`, "account-card")}
    ${studentTools}<div class="data-gap-inline">${icon("info")}<span>ویرایش اطلاعات شخصی و تنظیمات زبانی در این دمو پیاده‌سازی نشده‌اند؛ زیرساخت حساب واقعی وجود ندارد.</span></div>
    <div class="account-actions">${button("خروج از حساب", "secondary", 'data-action="logout"', "exit")}${button("شروع دوبارهٔ دمو", "tertiary", 'data-action="reset-demo"')}</div></section>`;
}
function cardMarkup(content, className = "") { return `<section class="card ${className}">${content}</section>`; }

function getPage(path) {
  const user = activeUser();
  if (path === "/") return landingView();
  if (path === "/login") return loginView();
  if (path === "/account") return accountView(user);
  if (path === "/student/home") return studentHome(state);
  if (path === "/student/library") return studentLibrary(state,ui);
  if (path === "/student/recommendations") return studentRecommendations();
  if (path === "/student/progress") return studentProgress(state);
  if (path === "/student/achievements") return studentAchievements(state);
  if (path.startsWith("/student/practice/")) return practicePage(state);
  if (path === "/teacher/home") return teacherHome(state);
  if (path === "/teacher/classes") return teacherClasses(state,ui);
  if (path === "/teacher/library") return teacherLibrary(state,ui);
  if (path === "/teacher/assignments") return teacherAssignments(state);
  if (path === "/teacher/assignments/new") return teacherAssignmentBuilder(state,ui);
  if (path.startsWith("/teacher/assignments/")) return teacherAssignmentTracking(state,decodeURIComponent(path.split("/").at(-1)));
  if (path === "/teacher/analytics") return teacherAnalytics(state);
  return `${pageHeader("این صفحه پیدا نشد")} ${emptyState("مسیر در دمو وجود ندارد", "از منوی اصلی یکی از بخش‌های موجود را باز کن.", linkButton("رفتن به خانه", homePath(user.role), "primary"))}`;
}

function render() {
  clearInterval(ticker);
  const user = activeUser();
  let path = appRoutePath(location.pathname);
  if (path === "/" || path === "/login") {
    if (user) { history.replaceState({},"",browserRoutePath(homePath(user.role))); path = homePath(user.role); }
  } else if (!user) {
    history.replaceState({},"",browserRoutePath("/")); path = "/";
  } else if ((path.startsWith("/student") && user.role !== "student") || (path.startsWith("/teacher") && user.role !== "teacher")) {
    history.replaceState({},"",browserRoutePath(homePath(user.role))); path = homePath(user.role);
  }
  if (user?.role === "student" && !state.studentAvatarId && (path.startsWith("/student/") || path === "/account")) {
    history.replaceState({},"",browserRoutePath("/student/home")); path = "/student/home";
  }
  if (path.startsWith("/student/practice/")) {
    const row = Number(path.split("/").at(-1));
    if (!state.practiceSession || Number(state.practiceSession.skillRow) !== row) {
      const assignmentId = new URLSearchParams(location.search).get("assignment") || "";
      beginPractice(row, assignmentId);
    }
  }
  currentRoute = path;
  const content = getPage(path);
  APP.innerHTML = user && path !== "/" && path !== "/login" ? shell(content,path,user) : content;
  if (ui.routeTransition) {
    clearTimeout(routeMotionTimer);
    routeMotionTimer = setTimeout(() => {
      APP.querySelector(".page-content.is-route-entering")?.classList.remove("is-route-entering");
      ui.routeTransition = false;
    }, 220);
  }
  const needsAvatar = user?.role === "student" && !state.studentAvatarId && (path.startsWith("/student/") || path === "/account");
  const autoTour = user?.role === "student" && path === "/student/home" && !!state.studentAvatarId && !state.studentTourSeen;
  if (focusAfterRender) {
    focusAfterRender = false;
    if (!needsAvatar && !autoTour && !ui.startTourAfterRender) requestAnimationFrame(() => {
      const heading = APP.querySelector("#main-content h1") || APP.querySelector("#main-content");
      heading?.focus({ preventScroll: true });
    });
  }
  if (needsAvatar && !DIALOG_ROOT.querySelector("dialog")) openAvatarDialog(true);
  else if (user?.role === "student" && ui.startTourAfterRender && path === "/student/home") {
    const replay = ui.replayTourAfterRender;
    ui.startTourAfterRender = false;
    ui.replayTourAfterRender = false;
    requestAnimationFrame(() => startStudentTour({ replay }));
  } else if (autoTour && !ui.tourActive && !DIALOG_ROOT.querySelector("dialog")) {
    requestAnimationFrame(() => startStudentTour());
  }
  if (path.startsWith("/student/practice/") && state.practiceSession) {
    ticker = setInterval(updateElapsed, 1000);
    updateElapsed();
  }
}
function updateElapsed() {
  const el = APP.querySelector("[data-elapsed]");
  if (!el) return;
  const seconds = Math.max(0, Math.floor((Date.now() - Number(el.dataset.elapsed)) / 1000));
  const minutes = Math.floor(seconds / 60);
  const formatter = new Intl.NumberFormat("fa-IR", { useGrouping: false });
  const minuteText = formatter.format(minutes).padStart(2, "۰");
  const secondText = formatter.format(seconds % 60).padStart(2, "۰");
  el.textContent = `${minuteText}:${secondText}`;
}

function rerenderPreservingFocus() {
  const active = document.activeElement;
  const key = active?.dataset?.focusKey;
  const activeId = active?.id;
  const selectionStart = active && typeof active.selectionStart === "number" ? active.selectionStart : null;
  const selectionEnd = active && typeof active.selectionEnd === "number" ? active.selectionEnd : null;
  const scrollY = window.scrollY;
  render();
  if (key || activeId) {
    const selector = key ? `[data-focus-key="${CSS.escape(key)}"]` : `#${CSS.escape(activeId)}`;
    const replacement = APP.querySelector(selector);
    replacement?.focus({ preventScroll: true });
    if (selectionStart !== null && replacement?.setSelectionRange) replacement.setSelectionRange(selectionStart,selectionEnd);
  }
  window.scrollTo({ top: scrollY, behavior: "auto" });
}

function showDialog({ title, message, confirmLabel = "تأیید", confirmAction, variant = "primary", extra = "", data = "" }) {
  DIALOG_ROOT.innerHTML = `<dialog class="app-dialog" aria-labelledby="dialog-title"><div class="dialog-content"><div class="dialog-heading"><span class="dialog-icon">${icon(variant === "danger" ? "info" : "info")}</span><div><h2 id="dialog-title">${escapeHtml(title)}</h2><p>${message}</p></div><button class="icon-button dialog-close" type="button" data-action="close-dialog" aria-label="بستن">${icon("close")}</button></div>${extra}<div class="dialog-actions"><button type="button" class="button button--tertiary" data-action="close-dialog">بازگشت</button><button type="button" class="button button--${variant}" data-action="${confirmAction}" ${data}>${confirmLabel}</button></div></div></dialog>`;
  const dialog = DIALOG_ROOT.querySelector("dialog");
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { DIALOG_ROOT.innerHTML = ""; });
  dialog.showModal();
  DIALOG_ROOT.querySelector("[data-action='close-dialog']")?.focus();
}
function closeDialog() { DIALOG_ROOT.querySelector("dialog")?.close(); }

function openAvatarDialog(firstTime = false) {
  if (DIALOG_ROOT.querySelector("dialog")) return;
  ui.avatarFirstTime = firstTime;
  ui.avatarSelection = firstTime ? null : state.studentAvatarId;
  const options = studentAvatars.map((avatar) => `<label class="avatar-choice ${ui.avatarSelection === avatar.id ? "is-selected" : ""}"><input type="radio" name="student-avatar" value="${avatar.id}" ${ui.avatarSelection === avatar.id ? "checked" : ""} /><span class="avatar-choice__image"><img src="${avatar.src}" alt="" loading="lazy" decoding="async" /><span class="avatar-choice__check" aria-hidden="true">✓</span></span><span class="avatar-choice__label">${avatar.label}</span></label>`).join("");
  DIALOG_ROOT.innerHTML = `<dialog class="avatar-dialog" aria-labelledby="avatar-dialog-title" aria-describedby="avatar-dialog-description"><div class="avatar-dialog__layout"><div class="avatar-dialog__heading"><span class="eyebrow">${firstTime ? "شروع نارنج" : "شخصیت دانش‌آموز"}</span><h2 id="avatar-dialog-title">${firstTime ? "شخصیت همراهت را انتخاب کن" : "شخصیتت را تغییر بده"}</h2><p id="avatar-dialog-description">${firstTime ? "یکی از شخصیت‌های نارنج را انتخاب و تأیید کن." : "انتخاب فقط نمایشی است و بر محتوا یا دسترسی اثر ندارد."}</p>${!firstTime ? `<button class="icon-button avatar-dialog__close" type="button" data-action="close-dialog" aria-label="بستن">${icon("close")}</button>` : ""}</div><fieldset class="avatar-grid"><legend class="sr-only">انتخاب یکی از ده شخصیت</legend>${options}</fieldset><div class="avatar-dialog__footer"><span class="avatar-selection-status" aria-live="polite">${ui.avatarSelection ? "شخصیت انتخاب شده است." : "برای ادامه، یک شخصیت انتخاب کن."}</span><div class="avatar-dialog__actions">${!firstTime ? `<button type="button" class="button button--tertiary" data-action="close-dialog">بازگشت</button>` : ""}<button type="button" class="button button--primary" data-action="save-avatar" ${ui.avatarSelection ? "" : "disabled"}>${firstTime ? "تأیید و ادامه" : "ذخیرهٔ شخصیت"}</button></div></div></div></dialog>`;
  const dialog = DIALOG_ROOT.querySelector("dialog");
  dialog.addEventListener("cancel", (event) => { if (firstTime) event.preventDefault(); });
  dialog.addEventListener("click", (event) => { if (event.target === dialog && !firstTime) dialog.close(); });
  dialog.addEventListener("close", () => { DIALOG_ROOT.replaceChildren(); });
  dialog.showModal();
  dialog.querySelector("input[name='student-avatar']:checked")?.focus({ preventScroll: true });
  if (!ui.avatarSelection) dialog.querySelector("input[name='student-avatar']")?.focus({ preventScroll: true });
}

const studentTourSteps = [
  { target: '[data-tour-target="student-home"]', title: "خانهٔ دانش‌آموز", description: "از اینجا تکلیف نزدیک‌تر یا تمرینی را که ادامه‌اش مانده پیدا می‌کنی." },
  { target: '[data-tour-target="student-library"]', title: "پیدا کردن مهارت", description: "در کتابخانه، مهارت‌های موجود را جست‌وجو و برای تمرین انتخاب کن." },
  { target: '[data-tour-target="student-progress"]', title: "دیدن پیشرفت", description: "وضعیت مهارت‌هایی را که شروع کرده‌ای در این بخش می‌بینی." },
  { target: '[data-tour-target="student-achievements"]', title: "نشان‌ها و مدال‌ها", description: "سکه‌ها و آستانه‌های مدال در بخش نشان‌ها و مدال‌ها قرار دارند." },
];
function startStudentTour({ replay = false } = {}) {
  if (currentRoute !== "/student/home" || !state.studentAvatarId) return;
  if (!replay && state.studentTourSeen) return;
  state.studentTourSeen = true;
  state.studentTourStatus = "in-progress";
  writeStore(state);
  APP.querySelector("#main-content h1")?.focus({ preventScroll: true });
  const opened = openTour({
    steps: studentTourSteps,
    onOpenChange: (open) => { ui.tourActive = open; },
    onFinish: () => { state.studentTourStatus = "completed"; writeStore(state); },
    onSkip: () => { state.studentTourStatus = "skipped"; writeStore(state); },
  });
  if (!opened) {
    state.studentTourSeen = false;
    state.studentTourStatus = "not-started";
    writeStore(state);
  }
}

function defaultDraft({ recipientIds = [], skillRows = [] } = {}) {
  const active = currentClass(state);
  const today = new Date().toISOString().slice(0,10);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const due = tomorrow.toISOString().slice(0,10);
  const allStudentIds = active.roster.map((item) => item.id);
  return {
    classId: active.id,
    recipientMode: recipientIds.length ? "selected" : "class",
    recipientIds: recipientIds.length ? [...recipientIds] : allStudentIds,
    skillRows: [...skillRows],
    startDate: today,
    dueDate: due,
    skillSearch: "",
  };
}
function beginAssignmentDraft(options = {}) {
  ui.assignmentDraft = defaultDraft(options);
  state.assignmentDraft = ui.assignmentDraft;
  ui.selectedSkills = [];
  ui.draftStep = 0;
  writeStore(state);
  go("/teacher/assignments/new");
}
function beginPractice(skillRow, assignmentId = "") {
  const existing = state.practiceSession;
  if (existing && Number(existing.skillRow) === Number(skillRow)) {
    if (assignmentId && !existing.assignmentId) existing.assignmentId = assignmentId;
    return;
  }
  const pathBefore = currentRoute.startsWith("/student/") && !currentRoute.startsWith("/student/practice/") ? currentRoute : "/student/home";
  state.practiceSession = {
    skillRow: Number(skillRow),
    assignmentId: assignmentId || null,
    originRoute: assignmentId ? "/student/home" : pathBefore,
    questionIndex: 0,
    phase: "answering",
    selectedAnswer: "",
    isCorrect: null,
    answers: [],
    startedAt: Date.now(),
    localDemo: true,
  };
  markSkillAttempted(state,Number(skillRow));
  writeStore(state);
}
function requestPractice(path) {
  const row = Number(path.split("/").at(-1));
  const query = new URLSearchParams(new URL(path,location.origin).search);
  const assignmentId = query.get("assignment") || "";
  if (state.practiceSession && Number(state.practiceSession.skillRow) !== row) {
    ui.pendingPractice = { row, assignmentId, path };
    showDialog({
      title: "تمرین دیگری باز است",
      message: "پاسخ‌های فعلی در همین مرورگر ذخیره شده‌اند. با رفتن به مهارت تازه، نشست قبلی بسته می‌شود و از خانه می‌توانی دوباره ادامه بدهی.",
      confirmLabel: "رفتن به مهارت تازه", confirmAction: "confirm-new-practice", variant: "primary",
    });
    return;
  }
  beginPractice(row,assignmentId);
  go(path);
}
function submitPracticeAnswer() {
  const session = state.practiceSession;
  if (!session || session.phase !== "answering") return;
  const question = demoQuestions[session.questionIndex];
  if (!question) return;
  const answer = String(session.selectedAnswer ?? "").trim();
  const error = APP.querySelector("[data-practice-error]");
  if (!answer) { if (error) error.textContent = "پاسخت را وارد یا انتخاب کن."; return; }
  const correct = evaluateDemoAnswer(question,answer);
  session.phase = "feedback";
  session.isCorrect = correct;
  session.answers.push({ questionId: question.id, answer, isCorrect: correct, savedAt: new Date().toISOString(), localDemo: true });
  writeStore(state);
  render();
  requestAnimationFrame(() => APP.querySelector(".feedback-panel h2")?.focus({preventScroll:true}));
}
function advancePractice() {
  const session = state.practiceSession;
  if (!session || session.phase !== "feedback") return;
  session.questionIndex += 1;
  session.phase = "answering";
  session.selectedAnswer = "";
  session.isCorrect = null;
  writeStore(state);
  render();
  requestAnimationFrame(() => APP.querySelector("#question-title")?.focus({preventScroll:true}));
}
function confirmExitPractice() {
  const session = state.practiceSession;
  if (!session) { closeDialog(); return; }
  const skill = findSkill(state.skills,session.skillRow);
  state.lastSessionSummary = {
    skillRow: session.skillRow,
    answersCount: session.answers.length,
    exited: true,
    endedAt: new Date().toISOString(),
    scored: false,
    localDemo: true,
  };
  const destination = session.originRoute || "/student/home";
  state.practiceSession = null;
  writeStore(state);
  closeDialog();
  go(destination);
  if (skill) ui.message = `התרגול برای «${skill.title}» از همین مرورگر خارج شد؛ هیچ امتیاز نهایی ثبت نشد.`;
}
function reorderAssignmentSkill(assignmentId,row,direction) {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment) return;
  assignment.reorderedSkillRows ||= {};
  const key = "student-demo";
  const list = assignment.reorderedSkillRows[key] || [...assignment.skillRows];
  const index = list.indexOf(Number(row));
  const next = index + (direction === "up" ? -1 : 1);
  if (index < 0 || next < 0 || next >= list.length) return;
  [list[index],list[next]] = [list[next],list[index]];
  assignment.reorderedSkillRows[key] = list;
  writeStore(state);
  rerenderPreservingFocus();
}
function persistDraft() {
  state.assignmentDraft = ui.assignmentDraft;
  writeStore(state);
}
function nextBuilderStep() {
  const draft = ui.assignmentDraft || state.assignmentDraft;
  if (!draft) return;
  const step = ui.draftStep;
  if (step === 0 && (!draft.recipientIds.length || !draft.classId)) {
    setInlineMessage("دست‌کم یک گیرنده انتخاب کن."); return;
  }
  if (step === 1 && !draft.skillRows.length) {
    setInlineMessage("دست‌کم یک مهارت از کتابخانه انتخاب کن."); return;
  }
  if (step === 2) {
    if (!draft.startDate || !draft.dueDate) { setInlineMessage("تاریخ شروع و مهلت را کامل کن."); return; }
    if (draft.dueDate < draft.startDate) { setInlineMessage("مهلت نمی‌تواند پیش از تاریخ شروع باشد."); return; }
    if (draft.dueDate < new Date().toISOString().slice(0,10)) { setInlineMessage("مهلت باید امروز یا پس از آن باشد."); return; }
  }
  ui.draftStep = Math.min(3,step+1);
  persistDraft();
  render();
}
function setInlineMessage(message) {
  const box = APP.querySelector(".builder-card");
  if (!box) return;
  const existing = box.querySelector(".builder-error");
  if (existing) existing.remove();
  box.insertAdjacentHTML("afterbegin",`<div class="form-error-summary builder-error" role="alert" tabindex="-1">${icon("info")}<span>${escapeHtml(message)}</span></div>`);
  box.querySelector(".builder-error")?.focus();
}
function duplicateAssignment(draft) {
  return state.assignments.some((item) => item.status !== "cancelled" && item.classId === draft.classId && [...item.skillRows].sort().join(",") === [...draft.skillRows].sort().join(",") && item.dueDate >= draft.startDate && item.startDate <= draft.dueDate);
}
function askPublish() {
  const draft = ui.assignmentDraft || state.assignmentDraft;
  if (!draft) return;
  const duplicate = duplicateAssignment(draft);
  showDialog({
    title: "انتشار تکلیف نمونه؟",
    message: `تکلیف برای ${draft.recipientMode === "class" ? "تمام کلاس فعال" : `${faNumber(draft.recipientIds.length)} دانش‌آموز انتخاب‌شده`} و ${faNumber(draft.skillRows.length)} مهارت ساخته می‌شود. این تغییر فقط در دادهٔ محلی همین مرورگر ثبت می‌شود.${duplicate ? " هشدار: تکلیفی با مهارت‌ها و بازهٔ زمانی هم‌پوشان وجود دارد؛ انتشار همچنان مجاز است." : ""}`,
    confirmLabel: "انتشار در دمو", confirmAction: "confirm-publish-assignment", variant: "primary",
  });
}
function publishAssignment() {
  const draft = ui.assignmentDraft || state.assignmentDraft;
  if (!draft) return;
  const classInfo = state.classes.find((item) => item.id === draft.classId);
  const recipients = draft.recipientMode === "class" ? classInfo.roster.map((item) => item.id) : [...draft.recipientIds];
  const assignment = {
    id: `demo-assignment-${Date.now()}`,
    title: "تکلیف نمایشی تازه",
    classId: draft.classId,
    recipientMode: draft.recipientMode,
    recipientIds: recipients,
    skillRows: [...draft.skillRows],
    createdAt: new Date().toISOString(),
    startDate: draft.startDate,
    dueDate: draft.dueDate,
    instructions: "",
    status: draft.startDate > new Date().toISOString().slice(0,10) ? "scheduled" : "active",
    demoFixture: true,
    reorderedSkillRows: {},
  };
  state.assignments.unshift(assignment);
  state.assignmentDraft = null;
  ui.assignmentDraft = null;
  ui.selectedSkills = [];
  closeDialog();
  writeStore(state);
  go(`/teacher/assignments/${encodeURIComponent(assignment.id)}`);
}
function openSkillPreview(row) {
  const skill = findSkill(state.skills,row);
  if (!skill) return;
  const objective = skill.learningObjective ? `<p>${escapeHtml(skill.learningObjective)}</p>` : `<p class="muted">هدف آموزشی در ردیف منبع موجود نیست.</p>`;
  const body = `<div class="preview-context">${escapeHtml(skill.topicTitle || "موضوع ثبت‌نشده")} · ${escapeHtml(skill.subtopicTitle || "زیرموضوع ثبت‌نشده")}</div>${objective}<div class="data-gap-inline">${icon("info")}<span>برای این مهارت نمونه‌سؤال، پاسخ، راه‌حل یا پیوند نوع سؤال در فایل منبع ثبت نشده است.</span></div>`;
  showDialog({ title: skill.title, message: body, confirmLabel: "انتخاب این مهارت", confirmAction: "select-previewed-skill", data: `data-row="${skill.sourceRow}"`, variant: "primary" });
}
function openEditAssignment(id) {
  const item = state.assignments.find((assignment) => assignment.id === id);
  if (!item) return;
  showDialog({
    title: "ویرایش مهلت تکلیف",
    message: "پاسخ‌های ثبت‌شدهٔ دانش‌آموزان با تغییر مهلت عوض نمی‌شوند.",
    extra: `<div class="dialog-form">${field({id:"edit-due-date",label:"مهلت تازه · ساعت ایران",type:"date",value:item.dueDate,min:new Date().toISOString().slice(0,10),required:true})}</div>`,
    confirmLabel: "ذخیرهٔ مهلت", confirmAction: "save-assignment-date", data: `data-assignment="${escapeHtml(id)}"`, variant: "primary",
  });
}

APP.addEventListener("click", (event) => {
  const anchor = event.target.closest("a[href]");
  if (anchor && anchor.origin === location.origin && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && anchor.target !== "_blank") {
    const href = anchor.getAttribute("href");
    if (href && href.startsWith("/") && !href.startsWith("//")) {
      event.preventDefault();
      if (href.startsWith("/student/practice/")) { requestPractice(href); return; }
      go(href);
      return;
    }
  }
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "reload-page") { location.reload(); return; }
  if (action === "close-dialog") { closeDialog(); return; }
  if (action === "change-avatar") { openAvatarDialog(false); return; }
  if (action === "replay-student-tour") { ui.startTourAfterRender=true; ui.replayTourAfterRender=true; go("/student/home"); return; }
  if (action === "open-account") { go("/account"); return; }
  if (action === "logout") { state.signedInAs = null; writeStore(state); closeDialog(); go("/",{replace:true}); return; }
  if (action === "reset-demo") {
    showDialog({ title: "شروع دوبارهٔ دمو؟", message: "تکلیف‌های آزمایشی، پاسخ‌ها و پیشرفت ذخیره‌شده در همین مرورگر پاک می‌شوند.", confirmLabel: "پاک کردن و خروج", confirmAction: "confirm-reset-demo", variant: "danger" }); return;
  }
  if (action === "confirm-reset-demo") { resetStore(); location.href = browserRoutePath("/"); return; }
  if (action === "confirm-new-practice") {
    const pending = ui.pendingPractice; ui.pendingPractice = null; closeDialog();
    if (pending) { state.practiceSession = null; beginPractice(pending.row,pending.assignmentId); go(pending.path); }
    return;
  }
  if (action === "exit-practice") {
    const session = state.practiceSession;
    const number = session?.answers.length || 0;
    showDialog({ title: "خروج از تمرین", message: `${number ? `${faNumber(number)} پاسخ نمونه در همین مرورگر ذخیره شده است.` : "هنوز پاسخی ثبت نشده است."} با خروج، این نشست امتیاز نهایی نمی‌گیرد؛ می‌توانی بعداً از خانه ادامه بدهی.`, confirmLabel: "خروج از تمرین", confirmAction: "confirm-exit-practice", variant: "primary" }); return;
  }
  if (action === "confirm-exit-practice") { confirmExitPractice(); return; }
  if (action === "submit-answer") { submitPracticeAnswer(); return; }
  if (action === "continue-question") { advancePractice(); return; }
  if (action === "reorder-skill") { reorderAssignmentSkill(control.dataset.assignment,control.dataset.row,control.dataset.direction); return; }
  if (action === "load-more") { ui.libraryLimit = (ui.libraryLimit || 15)+15; render(); return; }
  if (action === "teacher-load-more") { ui.teacherLibraryLimit = (ui.teacherLibraryLimit || 12)+12; render(); return; }
  if (action === "clear-library") { ui.search = ""; ui.topic = "all"; ui.libraryLimit=15; render(); return; }
  if (action === "clear-roster-search") { ui.rosterSearch=""; render(); return; }
  if (action === "clear-teacher-library") { ui.teacherSearch=""; ui.teacherTopic="all"; render(); return; }
  if (action === "toggle-selection-list") { ui.showSelection = !ui.showSelection; render(); return; }
  if (action === "clear-skills") { ui.selectedSkills = []; render(); return; }
  if (action === "remove-selected-skill") { ui.selectedSkills = ui.selectedSkills.filter((row) => Number(row)!==Number(control.dataset.row)); render(); return; }
  if (action === "create-assignment-from-selection") { beginAssignmentDraft({skillRows:ui.selectedSkills}); return; }
  if (action === "preview-skill") { openSkillPreview(control.dataset.row); return; }
  if (action === "select-previewed-skill") {
    const row = Number(control.dataset.row);
    if (!ui.selectedSkills.includes(row)) ui.selectedSkills.push(row);
    closeDialog(); render(); return;
  }
  if (action === "switch-class") { state.activeClassId=control.dataset.class; state.preferredClassId=control.dataset.class; writeStore(state); render(); return; }
  if (action === "builder-next") { nextBuilderStep(); return; }
  if (action === "builder-back") { ui.draftStep=Math.max(0,ui.draftStep-1); render(); return; }
  if (action === "builder-cancel") {
    showDialog({ title:"لغو ساخت تکلیف؟", message:"این تکلیف هنوز منتشر نشده است. پیش‌نویس محلی پاک می‌شود.", confirmLabel:"لغو ساخت", confirmAction:"confirm-cancel-builder", variant:"danger" }); return;
  }
  if (action === "confirm-cancel-builder") { state.assignmentDraft=null; ui.assignmentDraft=null; ui.draftStep=0; closeDialog(); writeStore(state); go("/teacher/assignments"); return; }
  if (action === "publish-assignment") { askPublish(); return; }
  if (action === "confirm-publish-assignment") { publishAssignment(); return; }
  if (action === "edit-assignment") { openEditAssignment(control.dataset.assignment); return; }
  if (action === "save-assignment-date") {
    const item = state.assignments.find((assignment) => assignment.id === control.dataset.assignment);
    const input = DIALOG_ROOT.querySelector("#edit-due-date");
    if (!item || !input?.value) { input?.focus(); return; }
    if (input.value < item.startDate) { input.setCustomValidity("مهلت نمی‌تواند پیش از تاریخ شروع باشد."); input.reportValidity(); return; }
    item.dueDate=input.value; writeStore(state); closeDialog(); render(); return;
  }
  if (action === "cancel-assignment") {
    showDialog({ title:"لغو تکلیف؟", message:"پس از لغو، تکلیف از فهرست دانش‌آموزان برداشته می‌شود. پاسخ‌های از قبل ثبت‌شده باقی می‌مانند.", confirmLabel:"لغو تکلیف", confirmAction:"confirm-cancel-assignment", variant:"danger", data:`data-assignment="${escapeHtml(control.dataset.assignment)}"` }); return;
  }
  if (action === "confirm-cancel-assignment") {
    const item = state.assignments.find((assignment) => assignment.id === control.dataset.assignment);
    if (item) item.status="cancelled";
    writeStore(state); closeDialog(); render(); return;
  }
  if (action === "follow-up-assignment") {
    const students = control.dataset.students ? [control.dataset.students] : [];
    beginAssignmentDraft({recipientIds:students}); return;
  }
});

APP.addEventListener("submit", (event) => {
  if (event.target.matches("#login-form")) {
    event.preventDefault();
    const form = new FormData(event.target);
    const username = String(form.get("username") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const account = demoAccounts[username];
    if (!account || password !== account.password) {
      APP.innerHTML = loginView("نام کاربری یا گذرواژهٔ آزمایشی درست نیست.");
      APP.querySelector("#username")?.focus();
      return;
    }
    state.signedInAs=username;
    const savedClass=state.preferredClassId || state.classes[0]?.id;
    if (savedClass) state.activeClassId=savedClass;
    writeStore(state);
    go(homePath(account.role),{replace:true});
    return;
  }
  if (event.target.matches("form[data-form='practice']")) { event.preventDefault(); submitPracticeAnswer(); }
});

APP.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-ui='search']")) { ui.search=target.value; ui.libraryLimit=15; rerenderPreservingFocus(); }
  else if (target.matches("[data-ui='teacherSearch']")) { ui.teacherSearch=target.value; ui.teacherLibraryLimit=12; rerenderPreservingFocus(); }
  else if (target.matches("[data-ui='rosterSearch']")) { ui.rosterSearch=target.value; rerenderPreservingFocus(); }
  else if (target.matches("[data-draft-ui='skillSearch']")) { (ui.assignmentDraft || state.assignmentDraft).skillSearch=target.value; persistDraft(); rerenderPreservingFocus(); }
  else if (target.matches("#practice-numeric")) { if (state.practiceSession) state.practiceSession.selectedAnswer=target.value; }
});
APP.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-ui='topic']")) { ui.topic=target.value; ui.libraryLimit=15; rerenderPreservingFocus(); }
  else if (target.matches("[data-ui='teacherTopic']")) { ui.teacherTopic=target.value; ui.teacherLibraryLimit=12; rerenderPreservingFocus(); }
  else if (target.matches("[data-ui='activeClassId']")) { state.activeClassId=target.value; state.preferredClassId=target.value; writeStore(state); rerenderPreservingFocus(); }
  else if (target.matches("[data-ui='search']")) { ui.search=target.value; }
  else if (target.matches("[data-action='toggle-skill']")) {
    const row=Number(target.dataset.row);
    ui.selectedSkills=target.checked ? [...new Set([...ui.selectedSkills,row])] : ui.selectedSkills.filter((item)=>item!==row);
    rerenderPreservingFocus();
  }
  else if (target.matches("input[name='practice-answer']")) {
    if (state.practiceSession) state.practiceSession.selectedAnswer=target.value;
    APP.querySelectorAll(".answer-option").forEach((item)=>item.classList.remove("is-selected"));
    target.closest(".answer-option")?.classList.add("is-selected");
  }
  else if (target.matches("input[name='recipientMode']")) {
    const draft=ui.assignmentDraft || state.assignmentDraft;
    draft.recipientMode=target.value;
    draft.recipientIds=target.value === "class" ? currentClass(state).roster.map((item)=>item.id) : [];
    persistDraft(); rerenderPreservingFocus();
  }
  else if (target.matches("input[name='recipients']")) {
    const draft=ui.assignmentDraft || state.assignmentDraft;
    if (target.checked && !draft.recipientIds.includes(target.value)) draft.recipientIds.push(target.value);
    if (!target.checked) draft.recipientIds=draft.recipientIds.filter((item)=>item!==target.value);
    persistDraft(); rerenderPreservingFocus();
  }
  else if (target.matches("input[name='draftSkills']")) {
    const draft=ui.assignmentDraft || state.assignmentDraft;
    const row=Number(target.value);
    if (target.checked && !draft.skillRows.includes(row)) draft.skillRows.push(row);
    if (!target.checked) draft.skillRows=draft.skillRows.filter((item)=>item!==row);
    persistDraft(); rerenderPreservingFocus();
  }
  else if (target.matches("#draft-start")) { const draft=ui.assignmentDraft || state.assignmentDraft; draft.startDate=target.value; persistDraft(); rerenderPreservingFocus(); }
  else if (target.matches("#draft-due")) { const draft=ui.assignmentDraft || state.assignmentDraft; draft.dueDate=target.value; persistDraft(); rerenderPreservingFocus(); }
});

DIALOG_ROOT.addEventListener("error", (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.closest(".avatar-choice__image")) return;
  const fallback = document.createElement("span");
  fallback.className = "avatar-image-fallback";
  fallback.textContent = "تصویر در دسترس نیست";
  image.closest(".avatar-choice__image").replaceChildren(fallback);
}, true);
DIALOG_ROOT.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches("input[name='student-avatar']")) return;
  ui.avatarSelection = input.value;
  DIALOG_ROOT.querySelectorAll(".avatar-choice").forEach((choice) => choice.classList.toggle("is-selected", choice.contains(input)));
  const save = DIALOG_ROOT.querySelector("[data-action='save-avatar']");
  if (save) save.disabled = !ui.avatarSelection;
  const label = studentAvatars.find((avatar) => avatar.id === ui.avatarSelection)?.label;
  const status = DIALOG_ROOT.querySelector(".avatar-selection-status");
  if (status) status.textContent = `${label || "یک شخصیت"} انتخاب شده است.`;
});
DIALOG_ROOT.addEventListener("click", (event) => {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const action = control.dataset.action;
  if (action === "close-dialog") { closeDialog(); return; }
  if (action === "save-avatar") {
    if (!ui.avatarSelection) { DIALOG_ROOT.querySelector("input[name='student-avatar']")?.focus(); return; }
    state.studentAvatarId=ui.avatarSelection;
    ui.avatarFirstTime=false;
    ui.startTourAfterRender=!state.studentTourSeen;
    ui.replayTourAfterRender=false;
    writeStore(state); closeDialog(); render(); return;
  }
  if (action === "confirm-reset-demo") { resetStore(); location.href = browserRoutePath("/"); return; }
  if (action === "confirm-exit-practice") { confirmExitPractice(); return; }
  if (action === "confirm-publish-assignment") { publishAssignment(); return; }
  if (action === "confirm-cancel-builder") { state.assignmentDraft=null; ui.assignmentDraft=null; ui.draftStep=0; closeDialog(); writeStore(state); go("/teacher/assignments"); return; }
  if (action === "confirm-cancel-assignment") {
    const item=state.assignments.find((assignment)=>assignment.id===control.dataset.assignment);
    if (item) item.status="cancelled";
    writeStore(state); closeDialog(); render(); return;
  }
  if (action === "confirm-new-practice") {
    const pending=ui.pendingPractice; ui.pendingPractice=null; closeDialog();
    if (pending) { state.practiceSession=null; beginPractice(pending.row,pending.assignmentId); go(pending.path); }
    return;
  }
  if (action === "select-previewed-skill") {
    const row=Number(control.dataset.row);
    if (!ui.selectedSkills.includes(row)) ui.selectedSkills.push(row);
    closeDialog(); render(); return;
  }
  if (action === "save-assignment-date") {
    const item=state.assignments.find((assignment)=>assignment.id===control.dataset.assignment);
    const input=DIALOG_ROOT.querySelector("#edit-due-date");
    if (!item || !input?.value) { input?.focus(); return; }
    if (input.value<item.startDate) { input.setCustomValidity("مهلت نمی‌تواند پیش از تاریخ شروع باشد."); input.reportValidity(); return; }
    item.dueDate=input.value; writeStore(state); closeDialog(); render();
  }
});

window.addEventListener("popstate", () => {
  if (appRoutePath(location.pathname).startsWith("/student/practice/") && !state.practiceSession) {
    const row=Number(appRoutePath(location.pathname).split("/").at(-1));
    beginPractice(row,new URLSearchParams(location.search).get("assignment") || "");
  }
  render();
});

render();
