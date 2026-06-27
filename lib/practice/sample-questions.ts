// ============================================================
// PLACEHOLDER sample questions — Phase 2.4 demo session only.
// ============================================================
// These never enter the database. They power /practice/session/demo so
// the session UI can be tested before real content seeds in Phase 2.5.
// The `is_demo: true` flag is sniffed by the session client to skip
// any DB writes (no attempts persisted, no mistake notebook inserts).
//
// LaTeX math uses $...$ for inline and $$...$$ for block (rendered via
// the existing react-katex / formula-sheet helpers — see RichText).
//
// Real questions arrive in Phase 2.5 from the seed script and live in
// the `questions` table.

import type { Database } from "@/lib/supabase/database.types";

type QuestionType = Database["public"]["Enums"]["question_type_t"];
type Subject = Database["public"]["Enums"]["subject_t"];
type Difficulty = Database["public"]["Enums"]["difficulty_t"];

export interface SampleQuestion {
  id: string;
  subject: Subject;
  chapter: string;
  topic: string;
  difficulty: Difficulty;
  question_type: QuestionType;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  solution_text: string;
  expected_time_seconds: number;
}

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    id: "demo-q-1",
    subject: "maths",
    chapter: "Coordinate Geometry",
    topic: "Circles",
    difficulty: "easy",
    question_type: "single_correct",
    question_text:
      "Find the equation of the circle whose center is at $(2, 3)$ and which passes through the point $(5, 7)$.",
    options: {
      A: "$(x-2)^2 + (y-3)^2 = 25$",
      B: "$(x-2)^2 + (y-3)^2 = 16$",
      C: "$(x+2)^2 + (y+3)^2 = 25$",
      D: "$(x-2)^2 + (y-3)^2 = 5$",
    },
    correct_answer: "A",
    solution_text:
      "Radius $r = \\sqrt{(5-2)^2 + (7-3)^2} = \\sqrt{9+16} = 5$, so $r^2 = 25$. The center is $(2, 3)$ so the equation is $(x-2)^2 + (y-3)^2 = 25$.",
    expected_time_seconds: 90,
  },
  {
    id: "demo-q-2",
    subject: "physics",
    chapter: "Newton's Laws of Motion",
    topic: "Friction",
    difficulty: "medium",
    question_type: "single_correct",
    question_text:
      "A block of mass $5$ kg rests on a horizontal surface. Coefficient of friction is $0.4$. Minimum horizontal force needed to start motion (take $g = 10\\, \\text{m/s}^2$) is:",
    options: {
      A: "$10$ N",
      B: "$15$ N",
      C: "$20$ N",
      D: "$25$ N",
    },
    correct_answer: "C",
    solution_text:
      "$F = \\mu N = \\mu m g = 0.4 \\times 5 \\times 10 = 20$ N.",
    expected_time_seconds: 75,
  },
  {
    id: "demo-q-3",
    subject: "chemistry",
    chapter: "Redox & Electrochemistry",
    topic: "Cell potentials",
    difficulty: "hard",
    question_type: "single_correct",
    question_text:
      "Standard reduction potentials: $E^\\circ_{Zn^{2+}/Zn} = -0.76$ V, $E^\\circ_{Cu^{2+}/Cu} = +0.34$ V. The EMF of the Daniell cell $Zn\\,|\\,Zn^{2+}\\,||\\,Cu^{2+}\\,|\\,Cu$ is:",
    options: {
      A: "$-1.10$ V",
      B: "$+0.42$ V",
      C: "$+1.10$ V",
      D: "$-0.42$ V",
    },
    correct_answer: "C",
    solution_text:
      "$E^\\circ_{cell} = E^\\circ_{cathode} - E^\\circ_{anode} = 0.34 - (-0.76) = 1.10$ V. Positive value confirms spontaneous reaction.",
    expected_time_seconds: 60,
  },
  {
    id: "demo-q-4",
    subject: "maths",
    chapter: "Differentiation",
    topic: "Chain rule",
    difficulty: "medium",
    question_type: "integer",
    question_text:
      "If $f(x) = \\sin(3x^2)$, then the value of $f'(\\sqrt{\\pi/6})$ is (rounded to nearest integer):",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "0",
    solution_text:
      "$f'(x) = \\cos(3x^2) \\cdot 6x$. At $x = \\sqrt{\\pi/6}$, $3x^2 = \\pi/2$, so $\\cos(\\pi/2) = 0$. Result: $0$.",
    expected_time_seconds: 120,
  },
  {
    id: "demo-q-5",
    subject: "physics",
    chapter: "Electrostatics",
    topic: "Gauss's law",
    difficulty: "very_hard",
    question_type: "single_correct",
    question_text:
      "A uniformly charged spherical shell of radius $R$ has total charge $Q$. The electric field magnitude at distance $r$ from the centre, for $r < R$, is:",
    options: {
      A: "$\\dfrac{kQ}{r^2}$",
      B: "$\\dfrac{kQ}{R^2}$",
      C: "$0$",
      D: "$\\dfrac{kQr}{R^3}$",
    },
    correct_answer: "C",
    solution_text:
      "By Gauss's law, the enclosed charge inside a Gaussian sphere of radius $r < R$ is zero (all charge sits on the shell). Therefore $E = 0$ inside the shell.",
    expected_time_seconds: 90,
  },
];

export function isDemoSessionId(id: string): boolean {
  return id === "demo";
}
