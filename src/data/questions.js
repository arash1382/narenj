// Demonstration fixtures transcribed/adapted from the examples in
// Naranj_Product_UX_Architecture_v2.1 §17.9 (Question types workbook).
// These are NOT a published question bank and are intentionally not linked
// to any skill: the supplied skill sheet contains no question mappings.
export const demoQuestions = [
  {
    id: "workbook-example-a04",
    source: "Question types workbook, binary-choice example (A04, row 12)",
    type: "binary-choice",
    prompt: "آیا عدد ۹ یک عدد زوج است؟",
    options: [
      { value: "yes", label: "بله" },
      { value: "no", label: "خیر" },
    ],
    correctAnswer: "no",
    correctAnswerLabel: "خیر",
    explanation: null,
    hint: null,
  },
  {
    id: "workbook-example-a02",
    source: "Question types workbook, short-answer example (A02, row 5)",
    type: "numeric-short-answer",
    prompt: "حاصل عبارت ۵ + ۸ چقدر است؟",
    options: null,
    correctAnswer: "13",
    correctAnswerLabel: "۱۳",
    explanation: null,
    hint: null,
  },
];

// The local evaluator exists only to demonstrate the interaction contract.
// Production correctness evaluation must be supplied by the question service.
export function evaluateDemoAnswer(question, answer) {
  if (question.type === "numeric-short-answer") {
    const normaliseDigits = (value) => String(value ?? "")
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[\s\u200c,٬]/g, "");
    return normaliseDigits(answer) === normaliseDigits(question.correctAnswer);
  }
  return String(answer) === String(question.correctAnswer);
}
