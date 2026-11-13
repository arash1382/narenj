import { button, pageHeader, statusPill, icon, escapeHtml, faNumber, stageLabel, stageTone } from "../ui.js";
import { demoQuestions } from "../data/questions.js";
import { findSkill, progressFor } from "../store.js";

const optionLabel = (question, answer) => question.options?.find((item) => item.value === answer)?.label || answer;

export function practicePage(state) {
  const session = state.practiceSession;
  if (!session) return `<main id="main-content" class="practice-empty"><div class="practice-empty__mark">${icon("book")}</div><h1>تمرینی باز نیست</h1><p>برای شروع، از خانه یا کتابخانه یک مهارت انتخاب کن.</p><a class="button button--primary" href="/student/library">رفتن به کتابخانه</a></main>`;
  const skill = findSkill(state.skills, session.skillRow);
  const progress = progressFor(state, session.skillRow);
  const question = demoQuestions[session.questionIndex];
  const time = `<span class="practice-stat"><span>${icon("clock")}</span><span><small>زمان در نشست</small><strong data-elapsed="${escapeHtml(session.startedAt)}">۰۰:۰۰</strong></span></span>`;
  const score = `<span class="practice-stat"><span class="practice-stat__score">S</span><span><small>SmartScore</small><strong>در دسترس نیست</strong></span></span>`;
  const header = `<header class="practice-topbar"><a class="practice-brand" href="/student/home" aria-label="بازگشت به خانهٔ دانش‌آموز">${icon("arrow")}<span>نارنج</span></a><div class="practice-topbar__identity"><span class="eyebrow">تمرین مهارت</span><strong>${escapeHtml(skill?.title || "مهارت انتخاب‌شده")}</strong><small>${escapeHtml(skill?.topicTitle || "موضوع ثبت‌نشده")} · مرحله: ${stageLabel(progress.stage)}</small></div><div class="practice-topbar__stats">${time}${score}</div><button class="button button--tertiary" type="button" data-action="exit-practice">${icon("exit")}<span>خروج</span></button></header>`;
  const source = `<div class="practice-data-notice" role="note">${icon("info")}<span>نمونهٔ تعاملی از فایل انواع سؤال؛ این سؤال به مهارت انتخاب‌شده پیوند ندارد و پاسخ/ارزیابی فقط نمایشی است.</span></div>`;
  if (!question) {
    return `<main class="practice-shell">${header}<div class="practice-content">${source}<section class="sample-exhausted"><div class="sample-exhausted__icon">${icon("info")}</div><span class="eyebrow">پایان نمونه‌های موجود</span><h1>در فایل‌های پروژه سؤال دیگری ثبت نشده است.</h1><p>این تمرین به‌عنوان «تکمیل مهارت» ثبت نمی‌شود. برای پایان، خروج ایمن را انتخاب کن؛ پاسخ‌های نمونه در همین مرورگر باقی می‌مانند.</p>${button("خروج ایمن از تمرین", "primary", 'data-action="exit-practice"', "exit")}</section></div></main>`;
  }
  const feedback = session.phase === "feedback" ? `<section class="feedback-panel ${session.isCorrect ? "feedback-panel--correct" : "feedback-panel--incorrect"}" aria-live="polite" aria-atomic="true">
      <div class="feedback-panel__heading">${icon(session.isCorrect ? "check" : "info")}<div><h2 tabindex="-1">${session.isCorrect ? "پاسخت درست است" : "این پاسخ درست نیست"}</h2><p>${session.isCorrect ? "آفرین؛ پاسخ ثبت شد." : "پاسخ درست را ببین و آمادهٔ ادامه شو."}</p></div></div>
      <div class="feedback-answer"><span>پاسخ درست</span><strong dir="auto">${escapeHtml(question.correctAnswerLabel)}</strong></div>
      <p class="feedback-gap">توضیح راه‌حل و راهنمای این سؤال در فایل‌های داده موجود نیست.</p>
      <div class="feedback-panel__actions">${button("ادامه", "primary", 'data-action="continue-question"', "arrow")}</div>
    </section>` : "";
  const answer = question.type === "binary-choice" ? `<fieldset class="answer-options" ${session.phase === "feedback" ? "disabled" : ""}><legend>یک پاسخ را انتخاب کن</legend>${question.options.map((option,index) => `<label class="answer-option ${session.selectedAnswer === option.value ? "is-selected" : ""}"><input type="radio" name="practice-answer" value="${escapeHtml(option.value)}" ${session.selectedAnswer === option.value ? "checked" : ""} ${session.phase === "feedback" ? "disabled" : ""} /><span class="answer-option__index">${faNumber(index+1)}</span><span>${escapeHtml(option.label)}</span></label>`).join("")}</fieldset>` : `<div class="answer-input-wrap"><label for="practice-numeric">پاسخت را بنویس</label><div class="numeric-answer"><input id="practice-numeric" name="practice-answer" type="text" inputmode="numeric" autocomplete="off" dir="ltr" value="${escapeHtml(session.selectedAnswer || "")}" ${session.phase === "feedback" ? "disabled" : ""} aria-describedby="answer-hint" /><span>پاسخ عددی</span></div><small id="answer-hint">رقم فارسی یا لاتین را وارد کن.</small></div>`;
  const submit = session.phase === "feedback" ? "" : `<div class="practice-submit-row">${button("ثبت پاسخ", "primary", 'data-action="submit-answer"', "check")}</div>`;
  const answerGiven = session.phase === "feedback" ? `<div class="submitted-answer"><span>پاسخ تو</span><strong dir="auto">${escapeHtml(optionLabel(question, session.selectedAnswer))}</strong></div>` : "";
  return `<main class="practice-shell">${header}<div class="practice-content">${source}
    <div class="practice-question-progress"><span>نمونهٔ تعاملی ${faNumber(session.questionIndex + 1)}</span><span>${icon("check")}<span>${faNumber(session.answers?.length || 0)} پاسخ ثبت‌شده در دمو</span></span></div>
    <article class="question-card" aria-labelledby="question-title"><div class="question-card__type">${question.type === "binary-choice" ? "انتخاب دوتایی" : "پاسخ کوتاه عددی"}</div><h1 id="question-title" tabindex="-1" dir="auto">${escapeHtml(question.prompt)}</h1>
      ${answerGiven}<form class="practice-answer-form" data-form="practice">${answer}${submit}<div class="practice-inline-error" data-practice-error role="alert"></div></form>
      <div class="question-content-gap">${icon("info")}<span>در دادهٔ پروژه برای این سؤال راهنما و توضیح آموزشی ثبت نشده است.</span></div>
      ${feedback}
    </article>
    <footer class="practice-footer"><span>${icon("check")}پاسخ‌ها در همین مرورگر ذخیره می‌شوند؛ اتصال به سرور پیاده‌سازی نشده است.</span><span>${statusPill("نمونهٔ نمایشی", "info")}</span></footer>
    </div></main>`;
}
