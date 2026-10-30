import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { runReasoningAgent } from "./server/agent/agent.js";
import { EVALUATION_TEST_CASES } from "./server/agent/testCases.js";
import {
  PLANNER_SYSTEM_PROMPT,
  EXECUTOR_SYSTEM_PROMPT,
  VERIFIER_SYSTEM_PROMPT,
} from "./server/agent/prompts.js";
import { TestRunResult } from "./server/agent/types.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === "production";

  app.use(express.json());

  // 1. Core HTTP Endpoint: POST /api/solve (Required by Assignment Section 3)
  app.post("/api/solve", async (req: Request, res: Response) => {
    try {
      const { question, maxRetries } = req.body;
      if (!question || typeof question !== "string" || question.trim().length === 0) {
        return res.status(400).json({
          error: "A valid 'question' string must be provided in the request body.",
        });
      }

      const result = await runReasoningAgent(question.trim(), {
        maxRetries: typeof maxRetries === "number" ? Math.max(0, Math.min(maxRetries, 5)) : 2,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/solve:", error);
      return res.status(500).json({
        answer: "Error processing reasoning request",
        status: "failed",
        reasoning_visible_to_user: "Internal server error during agent reasoning execution.",
        metadata: {
          plan: "Error occurred",
          checks: [
            {
              check_name: "System Execution",
              passed: false,
              details: error?.message || "Unknown server error",
            },
          ],
          retries: 0,
        },
      });
    }
  });

  // 2. Test Suite APIs (Required by Assignment Section 6)
  app.get("/api/tests", (_req: Request, res: Response) => {
    return res.json(EVALUATION_TEST_CASES);
  });

  app.post("/api/tests/run", async (req: Request, res: Response) => {
    try {
      const { testId } = req.body;
      const testsToRun = testId
        ? EVALUATION_TEST_CASES.filter((t) => t.id === testId)
        : EVALUATION_TEST_CASES;

      if (testsToRun.length === 0) {
        return res.status(404).json({ error: `Test case '${testId}' not found.` });
      }

      const results: TestRunResult[] = [];

      for (const tc of testsToRun) {
        const start = Date.now();
        const output = await runReasoningAgent(tc.question, { maxRetries: 2 });
        const duration = Date.now() - start;

        const allChecksPassed =
          output.metadata.checks.length > 0 &&
          output.metadata.checks.every((c) => c.passed);

        results.push({
          test_case: tc,
          output,
          passed_verification: output.status === "success" && allChecksPassed,
          retried: (output.metadata.retries ?? 0) > 0,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
        });
      }

      return res.json(results);
    } catch (error: any) {
      console.error("Error running test suite:", error);
      return res.status(500).json({ error: error?.message || "Failed running test suite" });
    }
  });

  // 3. Prompt Documentation API (Required by Assignment Section 5)
  app.get("/api/prompts", (_req: Request, res: Response) => {
    return res.json({
      planner: {
        role: "Planner",
        systemPrompt: PLANNER_SYSTEM_PROMPT,
        description:
          "Reads the user question and produces a structured, numbered execution roadmap without calculating the final answer.",
      },
      executor: {
        role: "Executor",
        systemPrompt: EXECUTOR_SYSTEM_PROMPT,
        description:
          "Executes the plan step-by-step, calculates intermediate numerical values, maintains raw chain-of-thought, and formats a candidate answer.",
      },
      verifier: {
        role: "Verifier",
        systemPrompt: VERIFIER_SYSTEM_PROMPT,
        description:
          "Independently re-solves the problem, validates physical/temporal/mathematical constraints, checks for reasoning contradictions, and generates retry feedback if issues are identified.",
      },
    });
  });

  // Vite Integration: Development vs Production
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
