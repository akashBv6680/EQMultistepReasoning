/**
 * Type definitions for the Multi-Step Reasoning Agent with Self-Checking.
 * Strictly adheres to the EverQuint Interview Assignment specification.
 */

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

/**
 * The exact JSON output required by the assignment specification.
 */
export interface ReasoningOutput {
  answer: string;
  status: "success" | "failed";
  reasoning_visible_to_user: string;
  metadata: ReasoningMetadata;
}

export interface PlanStep {
  step_number: number;
  description: string;
}

export interface PlanResult {
  abbreviated_plan: string;
  steps: PlanStep[];
  extracted_quantities: string[];
  constraints_identified: string[];
}

export interface ExecutionResult {
  candidate_answer: string;
  intermediate_calculations: string[];
  raw_deductions: string;
  reasoning_summary: string;
}

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  feedback_for_retry?: string;
  independent_solution?: string;
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
