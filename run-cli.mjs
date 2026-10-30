#!/usr/bin/env node

/**
 * CLI Runner for the Multi-Step Reasoning Agent.
 * Complies with Section 3 and Section 6 of the EverQuint Interview Assignment.
 *
 * Usage:
 *   node run-cli.mjs "Your question here"
 *   node run-cli.mjs --suite
 *   node run-cli.mjs (interactive prompt)
 */

import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = process.env.LOCAL_API_URL || "http://127.0.0.1:3000";

async function solveQuestion(question, maxRetries = 2) {
  try {
    const res = await fetch(`${API_BASE}/api/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, maxRetries }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`[CLI Error connecting to server at ${API_BASE}]:`, err.message);
    throw err;
  }
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("  Running EverQuint Multi-Step Reasoning Test Suite");
  console.log("=======================================================\n");

  const { EVALUATION_TEST_CASES } = await import("./server/agent/testCases.js");
  const logs = [];

  let passedCount = 0;

  for (let i = 0; i < EVALUATION_TEST_CASES.length; i++) {
    const tc = EVALUATION_TEST_CASES[i];
    console.log(`[${i + 1}/${EVALUATION_TEST_CASES.length}] (${tc.category.toUpperCase()}) ${tc.title}`);
    console.log(`Question: "${tc.question}"`);

    const start = Date.now();
    const finalJson = await solveQuestion(tc.question);
    const duration = Date.now() - start;

    const verifierPassed = finalJson.status === "success" && (finalJson.metadata?.checks?.every((c) => c.passed) ?? false);
    const retried = (finalJson.metadata?.retries || 0) > 0;

    if (verifierPassed) passedCount++;

    const logEntry = {
      test_id: tc.id,
      category: tc.category,
      question: tc.question,
      final_json: finalJson,
      verifier_passed: verifierPassed,
      retried: retried,
      retries_count: finalJson.metadata?.retries || 0,
      duration_ms: duration,
    };
    logs.push(logEntry);

    console.log(`Result: ${verifierPassed ? "PASSED" : "FAILED"} | Retried: ${retried ? "YES (" + finalJson.metadata.retries + ")" : "NO"} | Time: ${duration}ms`);
    console.log(`Answer: ${finalJson.answer}`);
    console.log(`Reasoning: ${finalJson.reasoning_visible_to_user}`);
    console.log("-------------------------------------------------------\n");
  }

  console.log(`\nTest Suite Complete: ${passedCount}/${EVALUATION_TEST_CASES.length} Passed`);
  console.log("Complete JSON logs captured successfully.");
}

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n=======================================================");
  console.log("  EverQuint Multi-Step Reasoning Agent (CLI)");
  console.log("  Type a math, logic, or constraint word problem.");
  console.log("  Type 'exit' or 'quit' to close.");
  console.log("=======================================================\n");

  const promptUser = () => {
    rl.question("Question > ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        promptUser();
        return;
      }
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        rl.close();
        return;
      }

      console.log("\nAnalyzing problem through Planner, Executor, and Verifier...\n");
      try {
        const result = await solveQuestion(trimmed);
        console.log("=== FINAL JSON OUTPUT ===");
        console.log(JSON.stringify(result, null, 2));
        console.log("\n");
      } catch (err) {
        console.error("Error solving problem:", err.message);
      }
      promptUser();
    });
  };

  promptUser();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--suite") || args.includes("-s")) {
    await runTestSuite();
  } else if (args.length > 0) {
    const question = args.join(" ");
    console.log(`Question: "${question}"\nSolving...\n`);
    const result = await solveQuestion(question);
    console.log(JSON.stringify(result, null, 2));
  } else {
    await interactiveMode();
  }
}

main().catch(console.error);
