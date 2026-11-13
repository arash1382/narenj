import { card, button, linkButton, pageHeader, statusPill, emptyState, icon, escapeHtml, faNumber, formatDate, relativeDate, stageLabel, stageTone } from "../ui.js";
import { assignmentForStudent, findSkill, progressFor } from "../store.js";
import { studentAvatars } from "../data/avatars.js";

const STUDENT_ID = "student-demo";
const sourceNotice = `<p class="source-note">داده‌های نمایشی همین مرورگر · نمونهٔ محتوای آموزشی رسمی نیست</p>`;

function assignedSkillRows(assignment, state) {
  const savedOrder = assignment.reorderedSkillRows?.[STUDENT_ID];
  const ordered = Array.isArray(savedOrder) ? savedOrder : assignment.skillRows;
  return ordered.map((row, index) => {
    const skill = findSkill(state.skills, row);
    if (!skill) return "";
    return `<li class="assigned-skill-row">
      <div><strong>${escapeHtml(skill.title)}</strong><span>${escapeHtml(skill.subtopicTitle || "زیرموضوع در فایل مشخص نشده")}</span></div>
      <div class="assigned-skill-row__actions">
        <button class="icon-button" type="button" data-action="reorder-skill" data-assignment="${escapeHtml(assignment.id)}" data-row="${row}" data-direction="up" data-focus-key="reorder-${escapeHtml(assignment.id)}-${row}-up" ${index === 0 ? "disabled" : ""} aria-label="بالا بردن ترتیب ${escapeHtml(skill.title)}">${icon("chevron", "icon icon--up")}</button>
        <button class="icon-button" type="button" data-action="reorder-skill" data-assignment="${escapeHtml(assignment.id)}" data-row="${row}" data-direction="down" data-focus-key="reorder-${escapeHtml(assignment.id)}-${row}-down" ${index === ordered.length - 1 ? "disabled" : ""} aria-label="پایین بردن ترتیب ${escapeHtml(skill.title)}">${icon("chevron", "icon icon--down")}</button>
        <a class="button button--tertiary button--small" href="/student/practice/${row}?assignment=${encodeURIComponent(assignment.id)}">شروع تمرین</a>
      </div>
    </li>`;
  }).join("");
}

function assignmentCard(assignment, state, prominent = false) {
  const skills = assignment.skillRows.map((row) => findSkill(state.skills, row)).filter(Boolean);
  const due = relativeDate(assignment.dueDate);
  const dueTone = due === "امروز" || due === "دیروز" ? "warning" : "neutral";
  return `<article class="assignment-card ${prominent ? "assignment-card--urgent" : ""}">
    <div class="assignment-card__top">
      <div><div class="eyebrow">${assignment.demoFixture ? "نمونهٔ نمایشی" : "تکلیف"}</div><h3>${escapeHtml(assignment.title)}</h3></div>
      ${statusPill(`مهلت: ${due} · ${formatDate(assignment.dueDate)}`, dueTone, "clock")}
    </div>
    <p class="muted assignment-card__meta">${skills.length ? `${faNumber(skills.length)} مهارت` : "مهارت ثبت‌شده‌ای ندارد"} · معلم: معلم نمونه</p>
    <ul class="assigned-skill-list">${assignedSkillRows(assignment, state)}</ul>
  </article>`;
}

export function studentHome(state) {
  const assignments = state.assignments
    .filter((item) => assignmentForStudent(item, STUDENT_ID) && item.status !== "cancelled")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nearest = assignments[0];
  const more = assignments.slice(1, 3);
  const resume = state.practiceSession;
  const resumeSkill = resume ? findSkill(state.skills, resume.skillRow) : null;
  const avatar = studentAvatars.find((item) => item.id === state.studentAvatarId);
  const heading = `<header class="page-heading student-page-heading"><div><h1 tabindex="-1">خانهٔ من</h1><p>قدم بعدی تمرینت را از همین‌جا شروع کن.</p></div>${avatar ? `<span class="student-home-avatar"><img src="${avatar.src}" alt="" /></span>` : ""}</header>`;
  const urgentContent = nearest
    ? `${assignmentCard(nearest, state, true)}${more.length ? `<div class="assignment-secondary-list">${more.map((item) => assignmentCard(item, state)).join("")}</div>` : ""}`
    : emptyState("فعلاً تکلیفی نداری", "می‌توانی یک مهارت را از کتابخانه انتخاب کنی و تمرین را شروع کنی.", linkButton("رفتن به کتابخانه", "/student/library", "primary", "book"));
  const resumeCard = resume && resumeSkill ? card(`<div class="resume-line"><div class="resume-mark">${icon("clock")}</div><div class="resume-line__copy"><span class="eyebrow">ادامهٔ تمرین</span><h3>${escapeHtml(resumeSkill.title)}</h3><p>پاسخ‌های تأییدشده در این مرورگر نگه‌داری می‌شوند.</p></div><a class="button button--secondary" href="/student/practice/${resume.skillRow}${resume.assignmentId ? `?assignment=${encodeURIComponent(resume.assignmentId)}` : ""}">ادامه</a></div>`, "resume-card") : "";
  return `${heading}
    <div class="demo-banner">${icon("info")}<span>دموی محلی؛ اطلاعات در همین مرورگر ذخیره می‌شود و به سرور وصل نیست.</span></div>
    <div class="student-home-grid">
      <section class="student-home-main"><div class="section-heading" data-tour-target="student-home"><div><span class="eyebrow">اولویت امروز</span><h2>تکلیف نزدیک‌تر</h2></div></div>${urgentContent}${resumeCard}</section>
      <aside class="student-home-aside">
        ${card(`<img class="context-illustration context-illustration--learning" src="/illustrations/learning-world.webp" alt="" loading="lazy" decoding="async" /><div class="section-heading section-heading--compact"><div><span class="eyebrow">تمرین مستقل</span><h2>انتخاب با توست</h2></div>${icon("book")}</div><p>از فهرست مهارت‌های موجود در فایل مهارت‌ها یک مورد را انتخاب کن.</p><a href="/student/library" class="text-link">مرور مهارت‌ها ${icon("arrow")}</a>`, "next-action-card")}
        ${card(`<div class="section-heading section-heading--compact"><div><span class="eyebrow">پیشنهادها</span><h2>پیشنهاد بعدی</h2></div></div><p class="muted">ترتیب مهارت‌ها و دلیل پیشنهاد در داده‌های منبع ثبت نشده است؛ چیزی را به‌عنوان پیشنهاد شخصی نمایش نمی‌دهیم.</p><a href="/student/recommendations" class="text-link">دیدن وضعیت پیشنهادها ${icon("arrow")}</a>`, "data-gap-card")}
        ${card(`<div class="support-stat"><span class="support-stat__icon">${icon("coin")}</span><div><span class="eyebrow">سکه‌ها</span><strong>${faNumber(state.coins || 0)}</strong><small>قواعد دریافت سکه هنوز مشخص نشده است.</small></div></div><a href="/student/achievements" class="text-link">نشان‌ها و مدال‌ها ${icon("arrow")}</a>`, "support-card")}
      </aside>
    </div>${sourceNotice}`;
}

function libraryGroupKey(skill) {
  return skill.topicTitle ? `${skill.topicCode}::${skill.topicTitle}` : "unknown::طبقه‌بندی ثبت‌نشده";
}

function skillRow(skill, state) {
  const progress = progressFor(state, skill.sourceRow);
  const label = stageLabel(progress.stage);
  const isAttempted = progress.stage !== "not-started";
  const description = skill.learningObjective ? `<p class="skill-row__objective">${escapeHtml(skill.learningObjective)}</p>` : `<p class="skill-row__objective muted">هدف آموزشی در ردیف منبع ثبت نشده است.</p>`;
  return `<article class="skill-row">
    <div class="skill-row__main"><div class="skill-row__titleline"><h3>${escapeHtml(skill.title)}</h3>${statusPill(label, stageTone(progress.stage))}</div><p class="skill-row__context">${escapeHtml(skill.topicTitle || "موضوع ثبت‌نشده")}${skill.subtopicTitle ? ` · ${escapeHtml(skill.subtopicTitle)}` : ""}</p>${description}</div>
    <a class="button button--tertiary button--small" href="/student/practice/${skill.sourceRow}">${isAttempted ? "تمرین دوباره" : "شروع"}${icon("arrow")}</a>
  </article>`;
}

export function studentLibrary(state, ui) {
  const query = (ui.search || "").trim().toLocaleLowerCase("fa");
  const selectedTopic = ui.topic || "all";
  let matches = state.skills.filter((skill) => {
    const searchable = `${skill.title} ${skill.topicTitle} ${skill.subtopicTitle} ${skill.learningObjective}`.toLocaleLowerCase("fa");
    const topicMatches = selectedTopic === "all" || skill.topicCode === selectedTopic;
    return topicMatches && (!query || searchable.includes(query));
  });
  const limit = ui.libraryLimit || 15;
  const visible = matches.slice(0, limit);
  const groups = new Map();
  for (const skill of visible) {
    const key = libraryGroupKey(skill);
    if (!groups.has(key)) groups.set(key, { title: skill.topicTitle || "طبقه‌بندی ثبت‌نشده", skills: [] });
    groups.get(key).skills.push(skill);
  }
  const topicOptions = state.topics.map((topic) => `<option value="${escapeHtml(topic.code)}" ${selectedTopic === topic.code ? "selected" : ""}>${escapeHtml(topic.title)}</option>`).join("");
  const results = [...groups.values()].map((group) => `<section class="library-topic"><h2>${escapeHtml(group.title)}</h2>${group.skills.map((skill) => skillRow(skill, state)).join("")}</section>`).join("");
  const noResults = emptyState("مهارتی پیدا نشد", query ? `برای «${escapeHtml(query)}» در مهارت‌های بارگذاری‌شده نتیجه‌ای نیست.` : "برای این فیلتر مهارتی در فایل منبع پیدا نشد.", button("پاک کردن جست‌وجو و فیلتر", "secondary", 'data-action="clear-library"'));
  return `<header class="page-heading library-page-heading"><div><h1 tabindex="-1">کتابخانهٔ مهارت‌ها</h1><p>ریاضی · پایهٔ چهارم · مهارت‌های برگرفته از فایل ارسالی</p></div><span class="library-heading-art"><img src="/illustrations/math-exploration.webp" alt="" loading="lazy" decoding="async" /></span></header>
    <div class="library-toolbar">
      <label class="search-field">${icon("search")}<span class="sr-only">جست‌وجوی مهارت یا موضوع</span><input type="search" data-focus-key="library-search" data-ui="search" value="${escapeHtml(ui.search || "")}" placeholder="جست‌وجو در نام مهارت و موضوع" autocomplete="off" /></label>
      <label class="filter-select"><span>موضوع</span><select data-ui="topic"><option value="all">همهٔ موضوع‌های ثبت‌شده</option>${topicOptions}</select></label>
    </div>
    <div class="library-context"><span>${faNumber(matches.length)} مهارت در این نتیجه</span>${query ? statusPill(`جست‌وجو: ${escapeHtml(query)}`, "info") : ""}</div>
    ${matches.length ? `<div class="library-groups">${results}</div>${matches.length > visible.length ? `<div class="load-more">${button("نمایش مهارت‌های بیشتر", "secondary", 'data-action="load-more"')}</div>` : ""}` : noResults}
    <div class="data-gap-inline">${icon("info")}<span>کد شناسه، ترتیب مهارت‌ها، پیش‌نیازها و پیوند سؤال در فایل مهارت‌ها خالی است؛ وضعیت‌ها فقط در همین دمو نگه‌داری می‌شوند.</span></div>${sourceNotice}`;
}

export function studentRecommendations() {
  return `${pageHeader("پیشنهادهای تمرین", "مهارت پیشنهادی باید دلیل روشن و منبع مشخص داشته باشد.")}
    ${emptyState("دادهٔ کافی برای پیشنهاد نداریم", "در فایل‌های پروژه ترتیب آموزشی، بازهٔ زمانی برنامه یا رابطهٔ پیش‌نیاز برای ساخت پیشنهاد ثبت نشده است. برای پرهیز از پیشنهاد ساختگی، مهارت پیشنهادی نمایش داده نمی‌شود.", linkButton("انتخاب مهارت از کتابخانه", "/student/library", "primary", "book"))}${sourceNotice}`;
}

export function studentProgress(state) {
  const started = state.skills.filter((skill) => progressFor(state, skill.sourceRow).stage !== "not-started");
  const stages = [
    ["not-started", "شروع‌نشده"], ["attempt", "تلاش"], ["familiar", "آشنا"], ["proficient", "مسلط"], ["mastered", "استادشده"],
  ];
  const path = stages.map(([key, label], index) => `<div class="mastery-step ${key === "attempt" ? "mastery-step--current" : ""}"><span class="mastery-step__number">${key === "attempt" && started.length ? icon("check") : faNumber(index + 1)}</span><span>${label}</span></div>`).join("");
  const cards = started.length ? started.map((skill) => {
    const data = progressFor(state, skill.sourceRow);
    return `<div class="progress-skill"><div><strong>${escapeHtml(skill.title)}</strong><span>${escapeHtml(skill.subtopicTitle || "زیرموضوع ثبت نشده")}</span></div>${statusPill(stageLabel(data.stage), stageTone(data.stage))}</div>`;
  }).join("") : emptyState("هنوز تمرینی ثبت نشده", "وقتی تمرین نمونه‌ای را شروع کنی، مرحلهٔ «تلاش» در همین مرورگر ثبت می‌شود.", linkButton("انتخاب یک مهارت", "/student/library", "primary"));
  return `<header class="page-heading illustrated-page-heading"><div><h1 tabindex="-1">پیشرفت من</h1><p>وضعیت ثبت‌شده در این مرورگر؛ امتیاز یا درصدی محاسبه نمی‌شود.</p></div><img src="/illustrations/math-exploration.webp" alt="" loading="lazy" decoding="async" /></header>
    <div class="demo-banner">${icon("info")}<span>SmartScore و معیارهای پیشرفت در مستندات تعریف نشده‌اند؛ این صفحه فقط مرحلهٔ ثبت‌شده را نشان می‌دهد.</span></div>
    ${card(`<div class="section-heading"><div><span class="eyebrow">مسیر تسلط</span><h2>مرحله‌های یادگیری مهارت</h2></div></div><div class="mastery-path" aria-label="شروع‌نشده، تلاش، آشنا، مسلط، استادشده">${path}</div><p class="muted mastery-note">تغییر مرحله پس از «تلاش» نیازمند معیار آموزشی تأییدشده است و در دمو انجام نمی‌شود.</p>`, "mastery-card")}
    <section class="content-section"><div class="section-heading"><div><span class="eyebrow">فعالیت من</span><h2>مهارت‌هایی که شروع کرده‌ام</h2></div>${started.length ? statusPill(`${faNumber(started.length)} مورد`, "info") : ""}</div><div class="progress-skill-list">${cards}</div></section>
    <div class="data-gap-inline">${icon("info")}<span>نمودار، درصد دقت، زمان تمرین، SmartScore و بازهٔ گزارش نمایش داده نمی‌شوند؛ تعریف و دادهٔ لازم در منبع موجود نیست.</span></div>${sourceNotice}`;
}

export function studentAchievements(state) {
  const medals = [
    { score: 80, medal: "برنز", tone: "bronze" },
    { score: 90, medal: "نقره", tone: "silver" },
    { score: 100, medal: "طلا", tone: "gold" },
  ];
  return `<header class="page-heading illustrated-page-heading illustrated-page-heading--rewards"><div><h1 tabindex="-1">نشان‌ها و مدال‌ها</h1><p>پاداش‌ها در کنار یادگیری‌اند و رتبه‌بندی عمومی ندارند.</p></div><img src="/illustrations/achievement-medals.webp" alt="" loading="lazy" decoding="async" /></header>
    <div class="reward-summary">
      ${card(`<span class="reward-icon reward-icon--coin">${icon("coin")}</span><div><span class="eyebrow">سکه‌های من</span><strong>${faNumber(state.coins || 0)}</strong><p>قواعد دریافت و مقدار سکه در داده‌های پروژه مشخص نشده است؛ دمو سکه‌ای اضافه نمی‌کند.</p></div>`, "reward-tile")}
      ${card(`<span class="reward-icon">${icon("spark")}</span><div><span class="eyebrow">هدف تمرین</span><strong>هدف ثبت نشده</strong><p>تعریف هدف روزانه یا هفتگی در داده‌های فعلی موجود نیست.</p></div>`, "reward-tile")}
    </div>
    <section class="content-section"><div class="section-heading"><div><span class="eyebrow">آستانه‌های رسمی مدال</span><h2>مدال مهارت</h2></div></div><div class="medal-grid">${medals.map((item) => card(`<div class="medal-mark medal-mark--${item.tone}">${icon("medal")}</div><div><h3>مدال ${item.medal}</h3><p>آستانهٔ SmartScore: ${faNumber(item.score)}</p><span class="muted">برای نمایش مدال، امتیاز مهارت هنوز در دسترس نیست.</span></div>`, "medal-card")).join("")}</div></section>
    ${emptyState("هنوز نشانی برای ثبت وجود ندارد", "شرط نشان‌ها، هدف‌ها و امتیازهای این حساب در فایل‌های دمو تعریف نشده است؛ هیچ نشان ساختگی ثبت نمی‌شود.")}${sourceNotice}`;
}
