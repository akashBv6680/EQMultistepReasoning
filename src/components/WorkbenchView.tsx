import React, { useState } from "react";
import { ReasoningOutput, TestCase } from "../types";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface WorkbenchViewProps {
  testCases: TestCase[];
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({ testCases }) => {
  const [question, setQuestion] = useState(
    "If a train leaves at 14:30 and arrives at 18:05, how long is the journey?"
  );
  const [maxRetries, setMaxRetries] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReasoningOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRawDeductions, setShowRawDeductions] = useState(false);
  const [activeStageTab, setActiveStageTab] = useState<"pipeline" | "json">("pipeline");

  const handleSolve = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          maxRetries,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data: ReasoningOutput = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to solve question. Ensure server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectPreset = (tc: TestCase) => {
    setQuestion(tc.question);
  };

  const assignmentPresets = testCases.slice(0, 3);
  const trickyPresets = testCases.filter((tc) => tc.category === "tricky").slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro strip */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Multi-Step Reasoning Agent Workbench
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl">
          An autonomous reasoning agent featuring isolated Planner, Executor, and Verifier modules.
          The agent produces intermediate calculations, validates physical and mathematical constraints,
          and automatically triggers targeted retry loops upon verification failure.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Problem Input & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111726] border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-200">
                Problem Input
              </label>
              <span className="text-xs text-slate-400">Plain text question</span>
            </div>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="Enter a math, logic, or constraint word problem..."
              className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />

            {/* Quick Presets */}
            <div className="mt-4 space-y-2">
              <span className="text-xs font-medium text-slate-400 block">
                Assignment Specification Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {assignmentPresets.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => selectPreset(tc)}
                    className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors text-left"
                  >
                    {tc.title}
                  </button>
                ))}
              </div>

              <span className="text-xs font-medium text-slate-400 block pt-2">
                Tricky Boundary & Constraint Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {trickyPresets.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => selectPreset(tc)}
                    className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-amber-300/90 hover:text-amber-200 rounded-md border border-amber-900/40 transition-colors text-left"
                  >
                    {tc.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Max Retries:</span>
                <select
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className="bg-[#0b0f17] border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none"
                >
                  <option value={1}>1 Retry</option>
                  <option value={2}>2 Retries</option>
                  <option value={3}>3 Retries</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setQuestion("");
                    setResult(null);
                    setError(null);
                  }}
                  disabled={loading}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSolve}
                  disabled={loading || !question.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reasoning...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Solve Problem</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Architecture Summary Card */}
          <div className="bg-[#111726]/60 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-400 space-y-3">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Internal Multi-Stage Architecture
            </h4>
            <div className="space-y-1.5 pl-1">
              <p>
                <strong className="text-slate-200">1. Planner:</strong> Formulates a structured roadmap and parses constraints.
              </p>
              <p>
                <strong className="text-slate-200">2. Executor:</strong> Computes intermediate numbers, maintains raw deductions, and derives candidate solution.
              </p>
              <p>
                <strong className="text-slate-200">3. Verifier:</strong> Re-solves independently, tests invariants (non-negativity, boundaries), and flags contradictions for automated retry.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Phase Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-1">Execution Encountered an Issue</strong>
                {error}
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-[#111726] border border-slate-800 rounded-xl p-8 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  Executing Autonomous Reasoning Agent
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Decomposing plan, computing intermediate deductions, and verifying constraints...
                </p>
              </div>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="bg-[#111726]/40 border border-slate-800/60 rounded-xl p-12 text-center text-slate-500">
              <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Ready to solve</p>
              <p className="text-xs text-slate-500 mt-1">
                Enter a question or click one of the presets on the left, then click Solve Problem.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* User Facing Answer Box (Assignment Requirement: user should only really need answer and reasoning_visible_to_user) */}
              <div className="bg-[#111726] border border-indigo-900/40 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-400 tracking-wide uppercase">
                      User-Facing Result
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                        result.status === "success"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                          : "bg-rose-950 text-rose-300 border border-rose-800/60"
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {result.metadata?.retries !== undefined && (
                      <span>Retries: {result.metadata.retries}</span>
                    )}
                    {result.metadata?.duration_ms && (
                      <span>· {result.metadata.duration_ms}ms</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Answer</span>
                    <p className="text-xl font-bold text-white tracking-tight">
                      {result.answer}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Reasoning (User Visible)</span>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {result.reasoning_visible_to_user}
                    </p>
                  </div>
                </div>
              </div>

              {/* View Switcher: Interactive Pipeline Inspector vs Raw JSON */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#111726] p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveStageTab("pipeline")}
                    className={`px-3 py-1.5 rounded font-medium transition-colors ${
                      activeStageTab === "pipeline"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    3-Phase Execution Pipeline
                  </button>
                  <button
                    onClick={() => setActiveStageTab("json")}
                    className={`px-3 py-1.5 rounded font-medium transition-colors ${
                      activeStageTab === "json"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Raw Output JSON Schema
                  </button>
                </div>

                {activeStageTab === "json" && (
                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* View 1: 3-Phase Execution Pipeline */}
              {activeStageTab === "pipeline" && (
                <div className="space-y-4">
                  {/* Phase 1: Planner */}
                  <div className="bg-[#111726] border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">
                          Phase 1: Planner
                        </h4>
                      </div>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Plan Formulated
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 bg-[#0b0f17] p-3 rounded-lg border border-slate-800 font-mono">
                      {result.metadata?.plan}
                    </p>
                  </div>

                  {/* Phase 2: Executor */}
                  <div className="bg-[#111726] border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">
                          Phase 2: Executor
                        </h4>
                      </div>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Calculations Completed
                      </span>
                    </div>

                    {result.metadata?.intermediate_calculations &&
                      result.metadata.intermediate_calculations.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          <span className="text-xs text-slate-400 font-medium">
                            Intermediate Calculations:
                          </span>
                          <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 space-y-1">
                            {result.metadata.intermediate_calculations.map((calc, idx) => (
                              <div
                                key={idx}
                                className="text-xs font-mono text-indigo-300/90 flex items-start gap-2"
                              >
                                <span className="text-slate-500">[{idx + 1}]</span>
                                <span>{calc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {result.metadata?.raw_deductions && (
                      <div>
                        <button
                          onClick={() => setShowRawDeductions(!showRawDeductions)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {showRawDeductions ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Hide Internal Chain-of-Thought (Metadata Log)</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Inspect Internal Chain-of-Thought (Metadata Log)</span>
                            </>
                          )}
                        </button>

                        {showRawDeductions && (
                          <div className="mt-2 p-3 bg-[#0b0f17] rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                            {result.metadata.raw_deductions}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phase 3: Verifier */}
                  <div className="bg-[#111726] border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">
                          Phase 3: Verifier & Self-Checking
                        </h4>
                      </div>
                      <span
                        className={`text-xs flex items-center gap-1 font-medium ${
                          result.status === "success"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {result.status === "success" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            All Invariants Passed
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Verification Failed
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {result.metadata?.checks?.map((check, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-[#0b0f17] rounded-lg border border-slate-800 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-200 block">
                              {check.check_name}
                            </span>
                            <span className="text-xs text-slate-400 block leading-relaxed">
                              {check.details}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-mono shrink-0 font-medium ${
                              check.passed
                                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                            }`}
                          >
                            {check.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {result.metadata?.feedback_history &&
                      result.metadata.feedback_history.length > 0 && (
                        <div className="mt-3 p-3 bg-amber-950/30 border border-amber-900/40 rounded-lg text-xs text-amber-300">
                          <span className="font-semibold block mb-1">
                            Retry Feedback Loop Triggered:
                          </span>
                          {result.metadata.feedback_history.map((fb, idx) => (
                            <p key={idx} className="text-amber-200/90 text-xs">
                              {fb}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* View 2: Raw JSON View */}
              {activeStageTab === "json" && (
                <div className="bg-[#0b0f17] border border-slate-800 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-emerald-300/90 leading-relaxed">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
