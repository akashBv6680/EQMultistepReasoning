import { executePlan } from "./executor.js";
import { generatePlan } from "./planner.js";
import { ReasoningOutput, VerificationCheck } from "./types.js";
import { verifySolution } from "./verifier.js";

export interface AgentOptions {
  maxRetries?: number;
  onPhaseUpdate?: (phase: "planning" | "executing" | "verifying" | "retrying", details: any) => void;
}

/**
 * Main Reasoning Agent with Self-Checking and Automated Retry Loop.
 *
 * Implements the 3-phase reasoning process:
 * 1. Planner: produces concise step-by-step roadmap
 * 2. Executor: produces intermediate numbers, deductions, and candidate answer
 * 3. Verifier: re-checks solution via independent resolution, constraint checks, and consistency checks
 *
 * If verification fails, retries up to maxRetries with diagnostic feedback.
 * If all retries fail, returns status "failed" with failure explanation.
 */
export async function runReasoningAgent(
  question: string,
  options: AgentOptions = {}
): Promise<ReasoningOutput> {
  const startTime = Date.now();
  const maxRetries = options.maxRetries ?? 2;
  let retries = 0;
  let retryFeedback: string | undefined = undefined;
  const feedbackHistory: string[] = [];
  let lastChecks: VerificationCheck[] = [];
  let lastPlanSummary = "";
  let lastIntermediateCalculations: string[] = [];
  let lastRawDeductions = "";
  let lastIndependentSolution = "";

  while (retries <= maxRetries) {
    options.onPhaseUpdate?.("planning", { retries, retryFeedback });

    // Phase 1: Planner
    const plan = await generatePlan(question, retryFeedback);
    lastPlanSummary = plan.abbreviated_plan;

    options.onPhaseUpdate?.("executing", { retries, plan });

    // Phase 2: Executor
    const execution = await executePlan(question, plan, retryFeedback);
    lastIntermediateCalculations = execution.intermediate_calculations;
    lastRawDeductions = execution.raw_deductions;

    options.onPhaseUpdate?.("verifying", { retries, execution });

    // Phase 3: Verifier
    const verification = await verifySolution(question, plan, execution);
    lastChecks = verification.checks;
    lastIndependentSolution = verification.independent_solution || "";

    // Verification Success
    if (verification.passed) {
      const durationMs = Date.now() - startTime;
      return {
        answer: execution.candidate_answer,
        status: "success",
        reasoning_visible_to_user: execution.reasoning_summary,
        metadata: {
          plan: plan.abbreviated_plan,
          checks: verification.checks,
          retries,
          intermediate_calculations: execution.intermediate_calculations,
          raw_deductions: execution.raw_deductions,
          independent_solution: verification.independent_solution,
          feedback_history: feedbackHistory,
          duration_ms: durationMs,
        },
      };
    }

    // Verification Failed
    const feedback = verification.feedback_for_retry || "Verifier found an inconsistency in solution.";
    feedbackHistory.push(`Attempt ${retries + 1} rejected: ${feedback}`);
    retryFeedback = feedback;

    if (retries < maxRetries) {
      retries++;
      options.onPhaseUpdate?.("retrying", {
        retries,
        feedback,
      });
      console.warn(`[Agent Verifier] Attempt ${retries} failed verification. Retrying with feedback: "${feedback}"`);
    } else {
      // Retries exhausted
      break;
    }
  }

  // If we reach here, verification failed and retries were exhausted
  const durationMs = Date.now() - startTime;
  return {
    answer: "Unable to produce a verified answer",
    status: "failed",
    reasoning_visible_to_user: `Verification could not be passed after ${retries} attempt(s). Issues detected: ${retryFeedback || "Inconsistency in constraints or calculations."}`,
    metadata: {
      plan: lastPlanSummary || "Multi-step decomposition and validation plan",
      checks: lastChecks.length > 0 ? lastChecks : [
        {
          check_name: "Self-Checking Verification",
          passed: false,
          details: `Verification failed after ${retries} retries: ${retryFeedback || "Unresolved contradiction"}`,
        },
      ],
      retries,
      intermediate_calculations: lastIntermediateCalculations,
      raw_deductions: lastRawDeductions,
      independent_solution: lastIndependentSolution,
      feedback_history: feedbackHistory,
      duration_ms: durationMs,
    },
  };
}
