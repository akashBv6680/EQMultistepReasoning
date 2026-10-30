export interface VerificationCheck {
  check_name: string;
  passed: boolean;
  details: string;
}

export interface ReasoningMetadata {
  plan: string;
  checks: VerificationCheck[];
  retries: number;
  intermediate_calculations?: string[];
  raw_deductions?: string;
  independent_solution?: string;
  feedback_history?: string[];
  duration_ms?: number;
}

export interface ReasoningOutput {
  answer: string;
  status: "success" | "failed";
  reasoning_visible_to_user: string;
  metadata: ReasoningMetadata;
}

export interface TestCase {
  id: string;
  category: "easy" | "tricky";
  title: string;
  question: string;
  expected_answer_hint?: string;
  focus_area: string;
}

export interface TestRunResult {
  test_case: TestCase;
  output: ReasoningOutput;
  passed_verification: boolean;
  retried: boolean;
  duration_ms: number;
  timestamp: string;
}

export type ActiveTab = "workbench" | "test_suite" | "prompts";
