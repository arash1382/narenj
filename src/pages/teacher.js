import { card, button, linkButton, pageHeader, statusPill, emptyState, icon, escapeHtml, faNumber, formatDate, field, stageLabel, stageTone } from "../ui.js";
import { assignmentForStudent, currentClass, findSkill, progressFor } from "../store.js";

const STUDENT_ID = "student-demo";
const sourceNotice = `<p class="source-note">داده‌های نمایشی · اطلاعات کلاس و افراد، دادهٔ واقعی نیست</p>`;

function assignmentLabel(assignment) {
  if (assignment.status === "cancelled") return "لغوشده";
  if (assignment.startDate > new Date().toISOString().slice(0, 10)) return "زمان‌بندی‌شده";
  if (assignment.dueDate < new Date().toISOString().slice(0, 10)) return "مهلت گذشته";
  return "فعال";
}
function assignmentTone(label) {
  return label === "مهلت گذشته" ? "warning" : label === "لغوشده" ? "neutral" : "brand";
}

function assignmentListItem(assignment, state, compact = false) {
  const active = state.classes.find((item) => item.id === assignment.classId);
  const skillNames = assignment.skillRows.map((row) => findSkill(state.skills, row)?.title).filter(Boolean);
  const label = assignmentLabel(assignment);
  return `<article class="teacher-assignment-row ${compact ? "teacher-assignment-row--compact" : ""}">
    <div class="teacher-assignment-row__identity"><span class="eyebrow">${escapeHtml(active?.title || "کلاس در دسترس نیست")}</span><h3>${escapeHtml(assignment.title)}</h3><p>${skillNames.map(escapeHtml).join("، ") || "مهارت ثبت‌شده ندارد"}</p></div>
    <div class="teacher-assignment-row__due"><span class="meta-label">مهلت · ساعت ایران</span><strong>${formatDate(assignment.dueDate)}</strong></div>
    ${statusPill(label, assignmentTone(label))}
    <a class="button button--tertiary button--small" href="/teacher/assignments/${encodeURIComponent(assignment.id)}">پیگیری ${icon("arrow")}</a>
  </article>`;
}

export function teacherHome(state) {
  const active = currentClass(state);
  const assignments = state.assignments.filter((item) => item.classId === active.id && item.status !== "cancelled").sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const nearest = assignments[0];
  const main = nearest ? card(`<div class="section-heading"><div><span class="eyebrow">${assignmentLabel(nearest)}</span><h2>${escapeHtml(nearest.title)}</h2></div>${statusPill(`مهلت ${formatDate(nearest.dueDate)}`, "warning", "clock")}</div><p class="muted">${nearest.skillRows.length ? `${faNumber(nearest.skillRows.length)} مهارت` : "مهارتی ثبت نشده"} · ${active.title}</p><a class="button button--primary" href="/teacher/assignments/${encodeURIComponent(nearest.id)}">دیدن وضعیت تکلیف</a>`, "teacher-focus-card") : emptyState("تکلیفی برای این کلاس ثبت نشده", "برای شروع، از مهارت‌های موجود یک یا چند مورد انتخاب و تکلیف بساز.", linkButton("ساخت تکلیف", "/teacher/assignments/new", "primary", "plus"));
  return `${pageHeader("خانهٔ معلم", "کلاس و کارهای نزدیک را از همین صفحه پیگیری کن.", linkButton("ساخت تکلیف", "/teacher/assignments/new", "primary", "plus"))}
    <div class="demo-banner">${icon("info")}<span>دموی محلی · اطلاعات کلاس، تکلیف و فهرست دانش‌آموزان نمونه است.</span></div>
    <div class="teacher-home-grid"><section class="teacher-home-primary"><div class="section-heading"><div><span class="eyebrow">کلاس فعال</span><h2>${escapeHtml(active.title)}</h2></div><a href="/teacher/classes" class="text-link">دیدن کلاس‌ها ${icon("arrow")}</a></div>${main}
      ${assignments.length > 1 ? `<div class="content-section"><div class="section-heading"><h2>تکلیف‌های دیگر</h2><a href="/teacher/assignments" class="text-link">همهٔ تکلیف‌ها</a></div>${assignments.slice(1,3).map((item) => assignmentListItem(item,state,true)).join("")}</div>` : ""}
    </section><aside class="teacher-home-aside">
      ${card(`<div class="quick-action-icon">${icon("people")}</div><h3>فهرست کلاس</h3><p>اعضا و وضعیت عضویت را ببین.</p><a class="text-link" href="/teacher/classes">باز کردن کلاس ${icon("arrow")}</a>`, "quick-action-card")}
      ${card(`<div class="quick-action-icon quick-action-icon--teal">${icon("book")}</div><h3>انتخاب مهارت</h3><p>از محتوای موجود مهارت پیدا و پیش‌نمایش کن.</p><a class="text-link" href="/teacher/library">رفتن به کتابخانه ${icon("arrow")}</a>`, "quick-action-card")}
      ${card(`<div class="quick-action-icon quick-action-icon--neutral">${icon("chart")}</div><h3>گزارش پیشرفت</h3><p>تا وقتی شاخص‌ها و داده‌ها تأیید نشده‌اند، آمار ساخته نمی‌شود.</p><a class="text-link" href="/teacher/analytics">دیدن وضعیت داده‌ها ${icon("arrow")}</a>`, "quick-action-card")}
    </aside></div>${sourceNotice}`;
}

export function teacherClasses(state, ui) {
  const active = currentClass(state);
  const query = (ui.rosterSearch || "").trim().toLocaleLowerCase("fa");
  const roster = active.roster.filter((item) => `${item.name} ${item.username}`.toLocaleLowerCase("fa").includes(query));
  return `${pageHeader("کلاس‌ها و دانش‌آموزان", "کلاس فعال از نوار بالای صفحه تغییر می‌کند.")}
    <div class="class-cards">${state.classes.map((item) => card(`<div class="class-card__head"><div><span class="eyebrow">پایهٔ ${escapeHtml(item.grade)} · ${escapeHtml(item.subject)}</span><h2>${escapeHtml(item.title)}</h2></div>${item.id === state.activeClassId ? statusPill("کلاس فعال", "success", "check") : ""}</div><p>${escapeHtml(item.school)} · ${faNumber(item.roster.length)} دانش‌آموز نمونه</p>${item.id === state.activeClassId ? `<a class="text-link" href="#roster">رفتن به فهرست کلاس ${icon("arrow")}</a>` : `<button class="button button--secondary" type="button" data-action="switch-class" data-class="${escapeHtml(item.id)}">فعال کردن این کلاس</button>`}`, "class-card")).join("")}</div>
    <section class="content-section" id="roster"><div class="section-heading"><div><span class="eyebrow">فهرست کلاس فعال</span><h2>${escapeHtml(active.title)}</h2></div><span class="muted">${faNumber(active.roster.length)} دادهٔ نمایشی</span></div>
      <div class="table-toolbar"><label class="search-field">${icon("search")}<span class="sr-only">جست‌وجو در فهرست</span><input type="search" data-focus-key="roster-search" data-ui="rosterSearch" value="${escapeHtml(ui.rosterSearch || "")}" placeholder="جست‌وجوی نام نمونه" /></label></div>
      ${roster.length ? `<div class="responsive-table-wrap"><table class="data-table"><caption class="sr-only">دانش‌آموزان نمونه در کلاس فعال</caption><thead><tr><th scope="col">دانش‌آموز</th><th scope="col">نام کاربری نمایشی</th><th scope="col">عضویت</th><th scope="col">فعالیت تمرین</th><th scope="col">گزارش</th></tr></thead><tbody>${roster.map((student) => `<tr><th scope="row">${escapeHtml(student.name)}</th><td><bdi dir="ltr">${escapeHtml(student.username)}</bdi></td><td>${escapeHtml(student.membership)}</td><td><span class="muted">دادهٔ تمرین در دسترس نیست</span></td><td><a class="table-link" href="/teacher/analytics?student=${encodeURIComponent(student.id)}">دیدن وضعیت ${icon("arrow")}</a></td></tr>`).join("")}</tbody></table></div>` : emptyState("نتیجه‌ای نیست", "نام دیگری را جست‌وجو کن یا عبارت جست‌وجو را پاک کن.", button("پاک کردن جست‌وجو", "secondary", 'data-action="clear-roster-search"'))}
    </section><div class="data-gap-inline">${icon("info")}<span>نام و عضویت کلاس برای آزمودن مسیرهای دمو ساخته شده‌اند؛ دادهٔ واقعی مدرسه، کد کلاس و دسترسی همکار در فایل‌ها موجود نیست.</span></div>${sourceNotice}`;
}

function teacherSkillRow(skill, selected, state) {
  const objective = skill.learningObjective ? `<p>${escapeHtml(skill.learningObjective)}</p>` : `<p class="muted">هدف آموزشی در فایل ثبت نشده است.</p>`;
  return `<article class="teacher-skill-row">
    <label class="check-control"><input type="checkbox" data-action="toggle-skill" data-focus-key="teacher-skill-${skill.sourceRow}" data-row="${skill.sourceRow}" ${selected ? "checked" : ""} /><span class="check-control__box" aria-hidden="true">${icon("check")}</span><span class="sr-only">انتخاب ${escapeHtml(skill.title)}</span></label>
    <div class="teacher-skill-row__body"><div class="skill-row__titleline"><h3>${escapeHtml(skill.title)}</h3>${skill.skillCode ? statusPill(`کد ${escapeHtml(skill.skillCode)}`, "neutral") : ""}</div><p class="teacher-skill-row__context">${escapeHtml(skill.topicTitle || "موضوع ثبت‌نشده")}${skill.subtopicTitle ? ` · ${escapeHtml(skill.subtopicTitle)}` : ""}</p>${objective}</div>
    <button class="button button--tertiary button--small" type="button" data-action="preview-skill" data-row="${skill.sourceRow}">پیش‌نمایش</button>
  </article>`;
}

export function teacherLibrary(state, ui) {
  const selected = new Set(ui.selectedSkills || []);
  const query = (ui.teacherSearch || "").trim().toLocaleLowerCase("fa");
  const topic = ui.teacherTopic || "all";
  const matches = state.skills.filter((skill) => {
    const searchable = `${skill.title} ${skill.topicTitle} ${skill.subtopicTitle} ${skill.learningObjective}`.toLocaleLowerCase("fa");
    return (!query || searchable.includes(query)) && (topic === "all" || skill.topicCode === topic);
  });
  const displayed = matches.slice(0, ui.teacherLibraryLimit || 12);
  const options = state.topics.map((item) => `<option value="${escapeHtml(item.code)}" ${topic === item.code ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("");
  const traySkills = [...selected].map((row) => findSkill(state.skills,row)).filter(Boolean);
  return `${pageHeader("کتابخانهٔ مهارت‌ها", "مهارت‌های موجود را ببین، پیش‌نمایش کن و برای تکلیف انتخاب کن.", selected.size ? button(`ساخت تکلیف · ${faNumber(selected.size)} مهارت`, "primary", 'data-action="create-assignment-from-selection"', "plus") : "")}
    <div class="teacher-library-context"><img src="/illustrations/learning-world.webp" alt="" loading="lazy" decoding="async" /><span>مهارت‌های ثبت‌شده در فایل منبع</span></div>
    <div class="library-toolbar"><label class="search-field">${icon("search")}<span class="sr-only">جست‌وجوی مهارت</span><input type="search" data-focus-key="teacher-search" data-ui="teacherSearch" value="${escapeHtml(ui.teacherSearch || "")}" placeholder="جست‌وجو در مهارت‌ها" /></label><label class="filter-select"><span>موضوع</span><select data-ui="teacherTopic"><option value="all">همهٔ موضوع‌های ثبت‌شده</option>${options}</select></label></div>
    <div class="library-context"><span>${faNumber(matches.length)} مهارت</span><span class="muted">انتخاب‌ها با تغییر فیلتر حفظ می‌شوند.</span></div>
    ${matches.length ? `<div class="teacher-skill-list">${displayed.map((skill) => teacherSkillRow(skill, selected.has(skill.sourceRow), state)).join("")}</div>${matches.length > displayed.length ? `<div class="load-more">${button("نمایش مهارت‌های بیشتر", "secondary", 'data-action="teacher-load-more"')}</div>` : ""}` : emptyState("مهارتی پیدا نشد", "فیلتر یا جست‌وجو را تغییر بده.", button("پاک کردن فیلترها", "secondary", 'data-action="clear-teacher-library"'))}
    ${selected.size ? `<aside class="selection-tray" aria-label="مهارت‌های انتخاب‌شده"><div><span class="eyebrow">انتخاب پایدار</span><strong>${faNumber(selected.size)} مهارت انتخاب شده</strong><button class="text-button" type="button" data-action="toggle-selection-list">${ui.showSelection ? "بستن فهرست" : "دیدن فهرست"}</button></div>${ui.showSelection ? `<ul>${traySkills.map((skill) => `<li>${escapeHtml(skill.title)} <span class="muted">· ${escapeHtml(skill.topicTitle || "موضوع نامشخص")}</span><button class="icon-button" type="button" data-action="remove-selected-skill" data-row="${skill.sourceRow}" aria-label="حذف ${escapeHtml(skill.title)}">${icon("close")}</button></li>`).join("")}</ul>` : ""}<div class="selection-tray__actions">${button("پاک کردن انتخاب", "tertiary", 'data-action="clear-skills"')}${button("ادامه برای ساخت تکلیف", "primary", 'data-action="create-assignment-from-selection"', "arrow")}</div></aside>` : ""}
    <div class="data-gap-inline">${icon("info")}<span>پیش‌نیاز، ترتیب، شناسهٔ مهارت و نمونه‌سؤال‌های پیوندخورده در صفحه‌گسترده خالی است. معلم فقط از مهارت‌های موجود انتخاب می‌کند؛ امکان ساخت یا ویرایش سؤال وجود ندارد.</span></div>${sourceNotice}`;
}

export function teacherAssignments(state) {
  const assignments = [...state.assignments].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return `${pageHeader("تکلیف‌ها", "تکلیف‌های ساخته‌شده در این دمو؛ مهلت و کلاس در هر ردیف مشخص است.", linkButton("ساخت تکلیف", "/teacher/assignments/new", "primary", "plus"))}
    ${assignments.length ? `<div class="teacher-assignment-list">${assignments.map((item) => assignmentListItem(item,state)).join("")}</div>` : emptyState("تکلیفی ثبت نشده", "برای ساخت تکلیف، مهارت‌های موجود را انتخاب کن.", linkButton("انتخاب مهارت", "/teacher/library", "primary"))}
    <div class="data-gap-inline">${icon("info")}<span>Quiz Generator در این دمو فعال نیست: پارامترها و مسیر تجربهٔ دانش‌آموز در معماری هنوز تصمیم‌گیری نشده‌اند (D-22).</span></div>${sourceNotice}`;
}

function draftStudents(active, draft) {
  return active.roster.map((student) => `<label class="recipient-option"><input type="checkbox" name="recipients" data-focus-key="recipient-${escapeHtml(student.id)}" value="${escapeHtml(student.id)}" ${draft.recipientIds.includes(student.id) ? "checked" : ""} /><span><strong>${escapeHtml(student.name)}</strong><small><bdi dir="ltr">${escapeHtml(student.username)}</bdi></small></span></label>`).join("");
}

function builderStepContent(state, draft, step) {
  const active = currentClass(state);
  if (step === 0) {
    return `<fieldset class="choice-fieldset"><legend>این تکلیف برای چه کسانی است؟</legend><label class="radio-option"><input type="radio" name="recipientMode" data-focus-key="recipient-mode-class" value="class" ${draft.recipientMode === "class" ? "checked" : ""} /><span><strong>تمام کلاس</strong><small>${escapeHtml(active.title)} · ${faNumber(active.roster.length)} دانش‌آموز نمونه</small></span></label><label class="radio-option"><input type="radio" name="recipientMode" data-focus-key="recipient-mode-selected" value="selected" ${draft.recipientMode === "selected" ? "checked" : ""} /><span><strong>دانش‌آموزان انتخابی</strong><small>یک یا چند نفر از همین کلاس</small></span></label></fieldset>
      ${draft.recipientMode === "selected" ? `<fieldset class="recipient-picker"><legend>انتخاب دانش‌آموزان</legend>${draftStudents(active,draft)}</fieldset>` : ""}
      ${!active.roster.length ? emptyState("این کلاس دانش‌آموزی ندارد", "نمی‌توان تا ثبت عضو، تکلیف ساخت.") : ""}`;
  }
  if (step === 1) {
    const q = (draft.skillSearch || "").trim().toLocaleLowerCase("fa");
    const list = state.skills.filter((skill) => `${skill.title} ${skill.topicTitle} ${skill.subtopicTitle}`.toLocaleLowerCase("fa").includes(q)).slice(0,10);
    return `<label class="search-field builder-search">${icon("search")}<span class="sr-only">جست‌وجوی مهارت</span><input type="search" data-focus-key="draft-skill-search" data-draft-ui="skillSearch" value="${escapeHtml(draft.skillSearch || "")}" placeholder="جست‌وجوی مهارت" /></label><p class="muted">مهارت‌ها به ترتیب فایل منبع؛ ترتیب در تکلیف الزامی نیست.</p><div class="builder-skill-choices">${list.map((skill) => `<label class="builder-skill-choice"><input type="checkbox" name="draftSkills" data-focus-key="draft-skill-${skill.sourceRow}" value="${skill.sourceRow}" ${draft.skillRows.includes(skill.sourceRow) ? "checked" : ""} /><span><strong>${escapeHtml(skill.title)}</strong><small>${escapeHtml(skill.topicTitle || "موضوع ثبت‌نشده")} · ${escapeHtml(skill.subtopicTitle || "زیرموضوع ثبت‌نشده")}</small></span></label>`).join("")}</div>${!list.length ? emptyState("مهارتی پیدا نشد", "عبارت دیگری را جست‌وجو کن.") : ""}`;
  }
  if (step === 2) {
    const today = new Date().toISOString().slice(0,10);
    return `<div class="form-grid">${field({id:"draft-start",label:"تاریخ شروع",type:"date",value:draft.startDate,min:today,required:true,hint:"زمان‌بندی بر اساس ساعت ایران است."})}${field({id:"draft-due",label:"مهلت انجام",type:"date",value:draft.dueDate,min:today,required:true,hint:"مهلت باید امروز یا پس از آن باشد."})}</div>
      <div class="data-gap-inline">${icon("info")}<span>فیلد راهنمای تکلیف در سند به تصمیم وابسته است (D-09)، برای همین در این دمو اضافه نشده است.</span></div>`;
  }
  const classTitle = active.title;
  const recipientNames = draft.recipientMode === "class" ? `تمام کلاس · ${faNumber(active.roster.length)} دانش‌آموز` : active.roster.filter((s) => draft.recipientIds.includes(s.id)).map((s) => s.name).join("، ");
  const chosenSkills = draft.skillRows.map((row) => findSkill(state.skills,row)).filter(Boolean);
  const duplicate = state.assignments.some((assignment) => assignment.status !== "cancelled" && assignment.classId === active.id && [...assignment.skillRows].sort().join(",") === [...draft.skillRows].sort().join(",") && assignment.dueDate >= draft.startDate && assignment.startDate <= draft.dueDate);
  return `<div class="review-list"><div><span>کلاس</span><strong>${escapeHtml(classTitle)}</strong></div><div><span>گیرندگان</span><strong>${escapeHtml(recipientNames || "انتخاب نشده")}</strong></div><div><span>مهارت‌ها</span><ul>${chosenSkills.map((skill) => `<li>${escapeHtml(skill.title)} <small>${escapeHtml(skill.topicTitle || "موضوع ثبت‌نشده")}</small></li>`).join("") || "<li>مهارتی انتخاب نشده است.</li>"}</ul></div><div><span>شروع</span><strong>${formatDate(draft.startDate)}</strong></div><div><span>مهلت</span><strong>${formatDate(draft.dueDate)} · ساعت ایران</strong></div><div><span>راهنمای تکلیف</span><strong class="muted">در این دمو تعریف نشده (D-09)</strong></div></div>
    ${duplicate ? `<div class="inline-notice inline-notice--warning" role="status">${icon("info")}<span>هشدار: تکلیفی با همین مهارت‌ها و بازهٔ زمانی برای این کلاس پیدا شد. می‌توانی با آگاهی از هم‌پوشانی ادامه بدهی.</span></div>` : ""}
    <div class="publish-note">با انتشار، تکلیف در تجربهٔ دانش‌آموز نمونه دیده می‌شود. رفتار واقعی سرور شبیه‌سازی نشده است.</div>`;
}

export function teacherAssignmentBuilder(state, ui) {
  const draft = state.assignmentDraft || ui.assignmentDraft;
  if (!draft) return `${pageHeader("ساخت تکلیف")}${emptyState("پیش‌نویسی وجود ندارد", "از کتابخانه یا دکمهٔ ساخت تکلیف شروع کن.", linkButton("رفتن به کتابخانه", "/teacher/library", "primary"))}`;
  const step = Math.max(0, Math.min(3, Number(ui.draftStep || 0)));
  const steps = ["گیرندگان", "مهارت‌ها", "زمان‌بندی", "بازبینی"];
  const summary = `<aside class="builder-summary"><span class="eyebrow">خلاصهٔ تکلیف</span><strong>${escapeHtml(currentClass(state).title)}</strong><span>${draft.recipientMode === "class" ? "تمام کلاس" : `${faNumber(draft.recipientIds.length)} دانش‌آموز`}</span><span>${faNumber(draft.skillRows.length)} مهارت</span><span>مهلت ${formatDate(draft.dueDate)}</span></aside>`;
  const controls = `<div class="builder-actions">${step > 0 ? button("بازگشت", "tertiary", 'data-action="builder-back"') : button("لغو ساخت", "tertiary", 'data-action="builder-cancel"')}${step < 3 ? button(step === 2 ? "بازبینی" : "ادامه", "primary", 'data-action="builder-next"', "arrow") : button("انتشار تکلیف", "primary", 'data-action="publish-assignment"', "check")}</div>`;
  return `${pageHeader("ساخت تکلیف", "گیرنده، مهارت و مهلت را مشخص کن؛ انتشار پس از بازبینی انجام می‌شود.")}
    <div class="stepper" aria-label="مرحلهٔ ${faNumber(step+1)} از چهار">${steps.map((name,index) => `<div class="stepper__item ${index === step ? "is-current" : index < step ? "is-done" : ""}"><span>${index < step ? icon("check") : faNumber(index+1)}</span><strong>${name}</strong></div>`).join("")}</div>
    <div class="builder-layout"><section class="builder-main">${card(`<div class="section-heading"><div><span class="eyebrow">مرحلهٔ ${faNumber(step+1)} از ${faNumber(4)}</span><h2>${steps[step]}</h2></div></div>${builderStepContent(state,draft,step)}${controls}`, "builder-card")}</section>${summary}</div>${sourceNotice}`;
}

export function teacherAssignmentTracking(state, assignmentId) {
  const assignment = state.assignments.find((item) => item.id === assignmentId);
  if (!assignment) return `${pageHeader("پیگیری تکلیف")}${emptyState("تکلیف پیدا نشد", "ممکن است در دمو پاک یا تغییر داده شده باشد.", linkButton("بازگشت به تکلیف‌ها", "/teacher/assignments", "primary"))}`;
  const classInfo = state.classes.find((item) => item.id === assignment.classId);
  const students = classInfo?.roster.filter((student) => assignmentForStudent(assignment, student.id)) || [];
  const skills = assignment.skillRows.map((row) => findSkill(state.skills,row)).filter(Boolean);
  const cancelled = assignment.status === "cancelled";
  return `${pageHeader("پیگیری تکلیف", escapeHtml(assignment.title), linkButton("همهٔ تکلیف‌ها", "/teacher/assignments", "tertiary"))}
    <div class="tracking-summary">${card(`<span class="eyebrow">کلاس</span><strong>${escapeHtml(classInfo?.title || "کلاس در دسترس نیست")}</strong>`, "tracking-summary__item")}${card(`<span class="eyebrow">گیرندگان</span><strong>${assignment.recipientMode === "class" ? `تمام کلاس · ${faNumber(students.length)}` : faNumber(students.length)}</strong>`, "tracking-summary__item")}${card(`<span class="eyebrow">مهلت · ساعت ایران</span><strong>${formatDate(assignment.dueDate)}</strong>`, "tracking-summary__item")}${card(`<span class="eyebrow">وضعیت زمان‌بندی</span>${statusPill(cancelled ? "لغوشده" : assignmentLabel(assignment), cancelled ? "neutral" : assignmentTone(assignmentLabel(assignment)))}`, "tracking-summary__item")}</div>
    <section class="content-section"><div class="section-heading"><div><span class="eyebrow">مهارت‌ها</span><h2>${faNumber(skills.length)} مهارت در این تکلیف</h2></div></div><div class="tracking-skill-list">${skills.map((skill) => `<div><strong>${escapeHtml(skill.title)}</strong><span>${escapeHtml(skill.topicTitle || "موضوع ثبت‌نشده")}</span></div>`).join("") || `<p>مهارتی ثبت نشده است.</p>`}</div></section>
    <section class="content-section"><div class="section-heading"><div><span class="eyebrow">دادهٔ نمایشی</span><h2>وضعیت دانش‌آموزان</h2></div></div>
      ${students.length ? `<div class="responsive-table-wrap"><table class="data-table"><caption class="sr-only">وضعیت تمرین برای تکلیف نمونه</caption><thead><tr><th scope="col">دانش‌آموز</th><th scope="col">وضعیت تمرین</th><th scope="col">مهارت</th><th scope="col">اقدام</th></tr></thead><tbody>${students.map((student) => {
        const first = skills[0];
        const progress = first && student.id === STUDENT_ID ? progressFor(state,first.sourceRow) : null;
        return `<tr><th scope="row">${escapeHtml(student.name)}</th><td>${progress ? statusPill(stageLabel(progress.stage),stageTone(progress.stage)) : `<span class="muted">داده ثبت نشده</span>`}</td><td>${first ? escapeHtml(first.title) : "—"}</td><td><a class="table-link" href="/teacher/analytics?student=${encodeURIComponent(student.id)}">وضعیت فردی ${icon("arrow")}</a></td></tr>`;
      }).join("")}</tbody></table></div>` : emptyState("گیرنده‌ای وجود ندارد", "برای این تکلیف گیرنده‌ای در دادهٔ نمونه ثبت نشده است.")}
    </section>
    <div class="tracking-actions">${button("ویرایش مهلت", "secondary", `data-action="edit-assignment" data-assignment="${escapeHtml(assignment.id)}"`, "edit")}${button("لغو تکلیف", "danger-quiet", `data-action="cancel-assignment" data-assignment="${escapeHtml(assignment.id)}"`, "trash")}${button("ساخت تکلیف پیگیری", "tertiary", 'data-action="follow-up-assignment"', "plus")}</div>
    <div class="data-gap-inline">${icon("info")}<span>تکمیل تکلیف، معیار تسلط و آمار کلاس از این داده‌ها استنتاج نمی‌شود. اگر تکلیف ویرایش شود، پاسخ‌های ثبت‌شده تغییری نمی‌کنند.</span></div>${sourceNotice}`;
}

export function teacherAnalytics(state) {
  const active = currentClass(state);
  const studentId = new URLSearchParams(location.search).get("student");
  const student = active.roster.find((item) => item.id === studentId);
  const subject = student ? `نمای نمایشی برای ${escapeHtml(student.name)} در ${escapeHtml(active.title)}` : `کلاس فعال: ${escapeHtml(active.title)}`;
  return `${pageHeader(student ? "گزارش دانش‌آموز" : "تحلیل کلاس", subject)}
    <div class="demo-banner">${icon("info")}<span>این صفحه هیچ درصد، میانگین یا برچسب «نیازمند حمایت» نمی‌سازد؛ تعریف شاخص‌ها در معماری باز است.</span></div>
    ${emptyState("دادهٔ پیشرفت برای گزارش در دسترس نیست", "فایل‌های پروژه شاخص، بازهٔ زمانی، مخرج یا سابقهٔ پاسخ دانش‌آموزان را تعریف نمی‌کنند. وضعیت کلاس و تکلیف نمونه را می‌توان از صفحهٔ تکلیف دید.", linkButton("رفتن به تکلیف‌ها", "/teacher/assignments", "secondary", "list"))}
    ${card(`<span class="quick-action-icon">${icon("plus")}</span><h2>اقدام بعدی</h2><p>می‌توانی یک مهارت موجود را برای کلاس یا دانش‌آموزان انتخاب کنی؛ این کار از پیشرفت ساختگی استفاده نمی‌کند.</p><button class="button button--primary" type="button" data-action="follow-up-assignment" data-students="${student ? escapeHtml(student.id) : ""}">ساخت تکلیف پیگیری</button>`, "analytics-action-card")}
    <div class="data-gap-inline">${icon("info")}<span>شاخص‌های دانش‌آموز و معلم هنوز تأیید نشده‌اند؛ دادهٔ تمرین در این نمونه فقط در همین مرورگر ذخیره می‌شود.</span></div>${sourceNotice}`;
}
