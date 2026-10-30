# Multi-Step Reasoning Agent with Self-Checking

> **EverQuint Gen AI Engineer Interview Assignment**  
> An autonomous reasoning agent for solving structured math, logic, and constraint word problems using multi-phase decomposition, independent verification, and self-correction retry loops.

---

Deployed link : https://multi-step-reasoning-agent-with-self-checking.ai.studio/

## 1. Quick Start & How to Run

### Prerequisites
- Node.js $\ge 18$
- Gemini API Key (set in `.env` as `GEMINI_API_KEY=...`)

### Installation & Server
```bash
# Install dependencies
npm install

# Start the full-stack development server (Workbench + REST API)
npm run dev
```
Visit **`http://localhost:3000`** to access the interactive web workbench.

### CLI Execution
Run questions directly from your terminal:
```bash
# Solve an individual question
node run-cli.mjs "If a train leaves at 14:30 and arrives at 18:05, how long is the journey?"

# Run the complete 15-case evaluation test suite in terminal
node run-cli.mjs --suite

# Interactive prompt loop
node run-cli.mjs
```

### HTTP REST API
```bash
# POST /api/solve
curl -X POST http://localhost:3000/api/solve \
  -H "Content-Type: application/json" \
  -d '{"question": "Alice has 3 red apples and twice as many green apples as red. How many apples does she have in total?"}'
```

---

## 2. Output Schema

The output strictly follows the required assignment specification:
```json
{
  "answer": "9 apples",
  "status": "success",
  "reasoning_visible_to_user": "Alice has 3 red apples and 6 green apples (twice 3), giving a total of 9 apples.",
  "metadata": {
    "plan": "Extract red apple count, multiply by 2 to find green apples, and sum red and green counts to find total apples.",
    "checks": [
      {
        "check_name": "Independent Re-solve Check",
        "passed": true,
        "details": "Independent calculation confirmed 3 + (2 * 3) = 9."
      },
      {
        "check_name": "Constraint Validation",
        "passed": true,
        "details": "Non-negative integer counts verified."
      },
      {
        "check_name": "Reasoning Consistency",
        "passed": true,
        "details": "Explanation and answer are mathematically aligned with no contradictions."
      }
    ],
    "retries": 0
  }
}
```

---

## 3. Architecture & Separation of Concerns

The agent is modularized into three distinct phases located in `server/agent/`:

```
server/
├── agent/
│   ├── types.ts          # Assignment JSON schema and stage interfaces
│   ├── prompts.ts        # Isolated system prompts for Planner, Executor, Verifier
│   ├── planner.ts        # Phase 1: Roadmap generation & constraint parsing
│   ├── executor.ts       # Phase 2: Intermediate deductions & candidate answer
│   ├── verifier.ts       # Phase 3: Independent re-solve & constraint checks
│   ├── agent.ts          # Master loop orchestrator with retry feedback
│   └── testCases.ts      # 15 pre-loaded evaluation cases (10 easy + 5 tricky)
├── geminiClient.ts       # Configured Google GenAI SDK client
└── server.ts             # Express server with /api/solve and Vite middleware
```

### Phase Breakdown
1. **Planner (`server/agent/planner.ts`)**:
   - Reads the user question.
   - Formulates a numbered, step-by-step roadmap without committing to final calculations.
   - If previous verification failed, accepts diagnostic feedback to adjust the plan.
2. **Executor (`server/agent/executor.ts`)**:
   - Executes each planned step sequentially.
   - Records intermediate numbers and explicit calculation lines.
   - Preserves full chain-of-thought in internal deductions (stored in metadata).
   - Generates user-facing short answer and concise explanation.
3. **Verifier (`server/agent/verifier.ts`)**:
   - Performs independent re-solve from scratch.
   - Validates invariants (positive counts, whole numbers for discrete items, time boundary validity).
   - Verifies reasoning consistency.
   - If any check fails, generates targeted feedback and triggers an automated retry (`plan` + `execute`) up to `maxRetries`.

---

## 4. Prompt Documentation

### Why Designed This Way
Single-pass prompting suffers from *rationalization bias*: if an LLM makes an early arithmetic mistake in a word problem, its subsequent reasoning will actively rationalize the erroneous number. 
By cleanly separating:
1. **Planning**: focuses purely on decomposition and extracting variables.
2. **Execution**: focuses strictly on following the plan and calculating intermediate quantities.
3. **Verification**: receives the candidate answer with an independent prompt that solves the problem from first principles and tests invariant boundaries.

### What Didn't Work Well
- **Unstructured Markdown outputs**: Relying on markdown parsing or free text caused JSON parsing errors and inconsistent schema adherence. We migrated to strict structured JSON schemas with the Gemini TypeScript SDK.
- **Vague retry prompts**: Saying "try again, that was incorrect" resulted in the agent repeating identical mistakes. Supplying the specific failing check and a diagnostic feedback string (e.g. *"Answer only reported green apples; question asked for total apples"*) produced reliable self-correction.
- **Midnight boundary arithmetic**: Naive time subtraction for overnight journeys (e.g. 22:45 to 02:15) resulted in negative numbers without an explicit modulo/day wrap invariant.

### What Would Be Improved With More Time
- **Sandboxed Code Interpreter**: Integrating a sandboxed Python or WebAssembly execution environment (SymPy / Math.js) for arbitrary precision arithmetic on high-digit calculations.
- **Parallel Independent Solvers**: Running two distinct prompt techniques in parallel and having the Verifier arbitrate between them.
- **Semantic Caching**: Caching frequently validated sub-proofs or mathematical invariants to minimize latency.

---

## 5. Assumptions

1. **Discrete Entities**: Items such as people, apples, boxes, and animals must evaluate to non-negative integers unless fractional values are explicitly allowed by the prompt.
2. **Time & Clock Boundaries**: Clock times without dates default to the same 24-hour cycle unless the arrival time is numerically earlier than departure, in which case a 24-hour day wrap is assumed.
3. **Contiguous Meeting Slots**: Meeting scheduling problems assume slots cannot be divided or spliced across disjoint windows unless specified.

---

## 6. Example Run Logs (5–10 Assignment Examples)

### Example 1 (Time Difference)
- **Question**: "If a train leaves at 14:30 and arrives at 18:05, how long is the journey?"
- **Output**:
```json
{
  "answer": "3 hours 35 minutes",
  "status": "success",
  "reasoning_visible_to_user": "The journey from 14:30 to 18:05 spans 3 hours and 35 minutes (215 minutes total).",
  "metadata": {
    "plan": "Convert departure and arrival times into minutes since midnight, calculate the difference, and format into hours and minutes.",
    "checks": [
      { "check_name": "Independent Re-solve Check", "passed": true, "details": "14:30 to 17:30 = 3h. 17:30 to 18:05 = 35m. Total = 3h 35m. Matches." },
      { "check_name": "Constraint Validation", "passed": true, "details": "Positive time duration (215m > 0)." },
      { "check_name": "Reasoning Consistency", "passed": true, "details": "Directly answers duration." }
    ],
    "retries": 0
  }
}
```

### Example 2 (Summation & Ratio)
- **Question**: "Alice has 3 red apples and twice as many green apples as red. How many apples does she have in total?"
- **Output**:
```json
{
  "answer": "9 apples",
  "status": "success",
  "reasoning_visible_to_user": "Alice has 3 red apples and 6 green apples (twice 3), giving a total of 9 apples.",
  "metadata": {
    "plan": "Extract red apple count, multiply by 2 to find green apples, and sum red and green counts to find total apples.",
    "checks": [
      { "check_name": "Independent Re-solve Check", "passed": true, "details": "3 + (2 * 3) = 9. Confirmed." },
      { "check_name": "Constraint Validation", "passed": true, "details": "Non-negative integer counts verified." },
      { "check_name": "Reasoning Consistency", "passed": true, "details": "No contradictions." }
    ],
    "retries": 0
  }
}
```

### Example 3 (Constraint Meeting Scheduling)
- **Question**: "A meeting needs 60 minutes. There are free slots: 09:00–09:30, 09:45–10:30, 11:00–12:00. Which slots can fit the meeting?"
- **Output**:
```json
{
  "answer": "11:00–12:00",
  "status": "success",
  "reasoning_visible_to_user": "The first slot is 30 minutes and the second is 45 minutes, both too short. Only the 11:00–12:00 slot provides the required 60 minutes.",
  "metadata": {
    "plan": "Determine slot lengths, compare each to 60 minutes, and return qualifying slots.",
    "checks": [
      { "check_name": "Independent Re-solve Check", "passed": true, "details": "09:00-09:30 (30m), 09:45-10:30 (45m), 11:00-12:00 (60m). Only 11:00-12:00 is >= 60m." },
      { "check_name": "Constraint Validation", "passed": true, "details": "Slot duration >= 60 min constraint satisfied." },
      { "check_name": "Reasoning Consistency", "passed": true, "details": "Unambiguous match." }
    ],
    "retries": 0
  }
}
```

### Example 4 (Tricky Boundary: Snail in the Well)
- **Question**: "A snail is at the bottom of a 10-meter well. Each day it climbs up 3 meters, but each night it slips back 2 meters. On which day does the snail first reach the top of the well?"
- **Output**:
```json
{
  "answer": "Day 8",
  "status": "success",
  "reasoning_visible_to_user": "By the end of Day 7, the snail is at 7 meters. On Day 8, it climbs 3 meters, reaching the top (10 meters) during the daytime before any nightly slipping can occur.",
  "metadata": {
    "plan": "Simulate daily net climb up to 7m, check daylight climb of 3m on day 8 hitting the 10m rim.",
    "checks": [
      { "check_name": "Independent Re-solve Check", "passed": true, "details": "Day 7 end = 7m. Day 8 climb = 7 + 3 = 10m reached. Snail escapes." },
      { "check_name": "Constraint Validation", "passed": true, "details": "Arrival occurs prior to night slip." },
      { "check_name": "Reasoning Consistency", "passed": true, "details": "Prevents naive 10-day net rate error." }
    ],
    "retries": 0
  }
}
```

### Example 5 (Tricky Multi-Variable: Ducks and Cows)
- **Question**: "A farmer has 10 animals consisting only of ducks and cows. Together they have 28 legs. How many ducks and how many cows does the farmer have?"
- **Output**:
```json
{
  "answer": "6 ducks and 4 cows",
  "status": "success",
  "reasoning_visible_to_user": "With 10 animals and 28 legs total: 6 ducks (12 legs) and 4 cows (16 legs) sum to exactly 10 animals and 28 legs.",
  "metadata": {
    "plan": "Formulate system of linear equations: d + c = 10 and 2d + 4c = 28. Solve for d and c.",
    "checks": [
      { "check_name": "Independent Re-solve Check", "passed": true, "details": "d = 10 - c; 2(10-c) + 4c = 28 => 20 + 2c = 28 => c = 4, d = 6." },
      { "check_name": "Constraint Validation", "passed": true, "details": "Both counts are positive integers (6 >= 0, 4 >= 0)." },
      { "check_name": "Reasoning Consistency", "passed": true, "details": "2*6 + 4*4 = 12 + 16 = 28 legs." }
    ],
    "retries": 0
  }
}
```

---

## 7. Pushing to Your GitHub Repository

When you are ready to publish this codebase to your own GitHub repo:
1. Open the **README & Git Push Guide** tab in the web interface (or run via terminal):
```bash
git remote remove origin 2>/dev/null || true
git remote add origin https://<YOUR_PERSONAL_ACCESS_TOKEN>@github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git branch -M main
git add .
git commit -m "feat: complete EverQuint multi-step reasoning agent with self-checking"
git push -u origin main
```
