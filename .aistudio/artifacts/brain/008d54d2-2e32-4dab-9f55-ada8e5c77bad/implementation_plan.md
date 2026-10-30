# Multi-Step Reasoning Agent with Self-Checking

A multi-step reasoning agent system and interactive evaluation workbench designed for structured math, logic, and constraint word problems, meeting all specifications from the EverQuint Gen AI Engineer interview assignment.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural decisions below have been confirmed based on your requirements:
> - **Engine**: Gemini API (`gemini-3.8-flash`) with structured output schemas for multi-pass reasoning, step verification, and autonomous retry loop.
> - **Interface**: Full interactive developer workbench + `POST /api/solve` HTTP endpoint + standalone CLI script (`node run-cli.mjs`).
> - **Test Suite & Submission**: Comprehensive 15-case test suite (10 standard + 5 tricky/edge cases), complete prompt design documentation in `README.md`, and exportable run logs.

---

### 1. Overview & Core Concept

The application implements a production-grade multi-step reasoning agent with self-verification and self-correction. Given any word problem (math arithmetic, time intervals, scheduling conflicts, combinatorial counting, or logical constraints), the agent decomposes the solution into three distinct modular stages:

1. **Planner**: Analyzes the problem context, identifies entities and constraints, and produces a step-by-step execution roadmap.
2. **Executor**: Follows each planned step rigorously, producing intermediate calculations, variable assignments, and candidate answers.
3. **Verifier**: Independently validates the intermediate results against constraints (non-negativity, boundary conditions, unit consistency, alternative calculation check). If any check fails, it supplies targeted diagnostic feedback and triggers an automatic retry (plan + execute) up to a configurable maximum limit before safely reporting failure status.

The final output strictly conforms to the assignment's JSON specification:
```json
{
  "answer": "<final short answer, user-facing>",
  "status": "success",
  "reasoning_visible_to_user": "<concise explanation without raw chain-of-thought>",
  "metadata": {
    "plan": "<abbreviated step-by-step plan>",
    "checks": [
      {
        "check_name": "Time format & duration math",
        "passed": true,
        "details": "Calculated 18:05 - 14:30 = 3h 35m, matches positive interval"
      }
    ],
    "retries": 0
  }
}
```

---

### 2. User Experience & Visual Design

The user interface is built as a high-density, professional developer workbench designed to evaluate agent reasoning in real time:

- **Top Navigation Bar**: Single-row 3-zone layout with brand wordmark (`EverQuint Reasoning Agent`), navigation links (`Workbench`, `Batch Test Suite`, `Prompt Library`, `Submission Docs`), and a primary action (`Run Test Suite`).
- **Workspace Layout (Split-Pane Studio)**:
  - **Left Pane (Problem Input & Controls)**:
    - Text question input with quick-load presets (the 3 examples from the assignment PDF, plus arithmetic, time math, constraint scheduling, and tricky edge cases).
    - Model and agent configuration toggles (Max Retries: 1–3, Verification Strictness, Live Streaming Phase updates).
    - Action buttons: "Solve Question" and "Reset".
  - **Right Pane (Live Phase Pipeline & Result Inspector)**:
    - **Step Pipeline Visualizer**: 3 active phase cards (`01. Planner` → `02. Executor` → `03. Verifier`). Each shows state (Pending, Running, Passed, Retried), timing metrics, and expandable raw deductions.
    - **Final User Output Panel**: Clean presentation of user-facing `answer` and `reasoning_visible_to_user`.
    - **JSON Inspector**: Formatted, syntax-highlighted output conforming directly to the assignment schema with 1-click clipboard copy.
    - **Verification Checks Table**: Tabular view of every individual check name, boolean status, and validation diagnostic.
- **Batch Evaluation & Test Runner View**:
  - Interactive table of 15 pre-loaded test cases (10 easy arithmetic/time differences + 5 tricky boundary/ambiguity cases).
  - Bulk "Run All Tests" or individual test execution with real-time pass/fail progress bar, retry counters, and latency measurements.
  - Export test run logs to `run_logs.json` or formatted Markdown for interview submission.
- **Prompt Library & Documentation View**:
  - Full view of the separate Planner, Executor, and Verifier prompts with design rationale, few-shot examples, and failure handling documentation.

---

### 3. Key Product Decisions & Trade-Offs

- **Modular Separation of Prompts & Logic**:
  - *Chosen Approach*: Planner, Executor, and Verifier reside in separate files (`server/agent/planner.ts`, `server/agent/executor.ts`, `server/agent/verifier.ts`) with distinct prompt templates in `server/agent/prompts.ts`.
  - *Why*: Strict compliance with assignment requirement §4 and §5 ("The planner, executor, and verifier are reasonably separated" and "must write separate prompts").
- **Structured JSON Output via Gemini SDK**:
  - *Chosen Approach*: Use `@google/genai` on Express backend (`server.ts`) with defined `responseSchema` and system instructions for deterministic parsing and schema adherence.
  - *Why*: Guarantees well-formed JSON, eliminates fragile regex parsing, and keeps API keys securely server-side.
- **Independent Dual-Pass Verification**:
  - *Chosen Approach*: The Verifier receives the question and proposed answer and performs an independent re-solve and constraint check (detecting negative counts, fractional items, boundary overlaps, or unit mismatches).
  - *Why*: Meets assignment requirement §2.3 ("At least one of: Re-solve independently, Validate constraints, Look for inconsistencies").
- **Standalone CLI & API**:
  - *Chosen Approach*: Provide `run-cli.mjs` for direct terminal execution (`node run-cli.mjs "How many apples..."`) alongside `POST /api/solve`.
  - *Why*: Fulfills assignment requirement §3 ("CLI: python agent.py ... OR a simple HTTP endpoint e.g. /solve").

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client: React Workbench                         │
│  - Problem Input & Presets   - 3-Phase Execution Inspector             │
│  - 15-Case Test Suite Runner - Prompt Viewer & Submission Exporter     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Server: Express Backend (server.ts)                  │
│  - POST /api/solve            - GET /api/tests                         │
│  - POST /api/tests/run        - GET /api/prompts                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
     ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
     │  Phase 1: Plan   │ │ Phase 2: Execute │ │ Phase 3: Verify  │
     │  (planner.ts)    │ │  (executor.ts)   │ │  (verifier.ts)   │
     │ Parse & outline  │ │ Compute & deduce │ │ Constraint check │
     └─────────┬────────┘ └────────┬─────────┘ └────────┬─────────┘
               │                   │                    │
               │                   ▼                    │
               │      ┌───────────────────────────┐     │
               │      │ Verification Pass / Fail? │◄────┘
               │      └─────────────┬─────────────┘
               │       Passed       │ Failed (retry < max)
               │         ┌──────────┴──────────┐
               ▼         ▼                     ▼
        ┌─────────────┐ ┌───────────────────┐ ┌──────────────────┐
        │ Success JSON│ │ Re-plan & Re-exec │ │ Failed JSON +    │
        │ Output Spec │ │ with Feedback     │ │ Diagnostic logs  │
        └─────────────┘ └───────────────────┘ └──────────────────┘
```

#### Core Data Entities

- **ReasoningOutput**:
  - `answer`: string
  - `status`: `"success"` | `"failed"`
  - `reasoning_visible_to_user`: string
  - `metadata`: `{ plan: string, checks: Array<{ check_name: string, passed: boolean, details: string }>, retries: number, chain_of_thought?: string }`
- **TestCase**:
  - `id`: string
  - `category`: `"easy"` | `"tricky"`
  - `question`: string
  - `expected_answer`: string
  - `notes`: string

---

### 5. Implementation Sequence

1. **Backend Agent Modules (`server/agent/`)**:
   - `prompts.ts`: Planner, Executor, and Verifier prompt templates with few-shot examples.
   - `types.ts`: TypeScript interfaces for inputs, plans, execution results, checks, and final JSON.
   - `planner.ts`: Planner module invoking Gemini 3.8 Flash to generate structured decomposition.
   - `executor.ts`: Executor module calculating step solutions and deductions.
   - `verifier.ts`: Verifier module testing constraints and independent resolution.
   - `agent.ts`: Master agent loop handling retries, feedback injection, and schema generation.
2. **Express Server & CLI (`server.ts` & `run-cli.mjs`)**:
   - Express server routing `POST /api/solve`, test runner APIs, and Vite middleware integration.
   - Standalone CLI executable `run-cli.mjs` for terminal execution.
3. **Frontend Workbench (`src/`)**:
   - Layout with domain-native styling, Plus Jakarta Sans & JetBrains Mono typography.
   - Interactive Problem Solver with live stage timeline and JSON tree/viewer.
   - Batch Test Runner running the 15 evaluation questions with pass/fail summary and export.
   - Prompt Library and README documentation viewer with copyable markdown and logs.
4. **Documentation & Git Push Readiness**:
   - Complete `README.md` containing execution instructions, prompt rationale, architectural decisions, and evaluation results.
   - Helper script and instructions for pushing to GitHub repository using Personal Access Token.
