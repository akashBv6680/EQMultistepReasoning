import React, { useState, useEffect } from "react";
import { Copy, Check, FileText, Layers, CheckCircle2, AlertCircle } from "lucide-react";

interface PromptData {
  planner: { role: string; systemPrompt: string; description: string };
  executor: { role: string; systemPrompt: string; description: string };
  verifier: { role: string; systemPrompt: string; description: string };
}

export const PromptLibraryView: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptData | null>(null);
  const [activePromptTab, setActivePromptTab] = useState<"planner" | "executor" | "verifier">("planner");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/prompts")
      .then((res) => res.json())
      .then((data) => setPrompts(data))
      .catch((err) => console.error("Failed to load prompts:", err));
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPrompt = prompts ? prompts[activePromptTab] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Prompt Architecture & Documentation
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl">
          Complies with Section 5 of the EverQuint assignment. Planner, Executor, and Verifier use
          strictly separated prompts, structured JSON output schemas, and few-shot examples for each phase.
        </p>
      </div>

      {/* Rationale Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Layers className="w-4 h-4" />
            1. Why Prompts Are Separated
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Combining planning, execution, and verification into a single call introduces confirmation bias—the LLM
            tends to justify its own immediate calculation. Isolating the Verifier with fresh system instructions ensures
            independent re-solve and objective constraint checking.
          </p>
        </div>

        <div className="bg-[#111726] border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            2. What Didn't Work Well
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Free-form markdown output caused brittle JSON regex extraction. Naive prompts without explicit
            invariants allowed negative time differences when crossing midnight (e.g. 22:45 to 02:15) and missed the
            discrete arrival day in the classic "snail in the well" problem.
          </p>
        </div>

        <div className="bg-[#111726] border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            3. Future Improvements
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Integrate a sandboxed Python code interpreter (or WebAssembly runtime) for high-precision arithmetic,
            Monte Carlo verification of complex probability word problems, and dynamic tool invocation for calendar lookups.
          </p>
        </div>
      </div>

      {/* Prompt Viewer */}
      <div className="bg-[#111726] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-[#0b0f17]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePromptTab("planner")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activePromptTab === "planner"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Planner Prompt
            </button>
            <button
              onClick={() => setActivePromptTab("executor")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activePromptTab === "executor"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Executor Prompt
            </button>
            <button
              onClick={() => setActivePromptTab("verifier")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activePromptTab === "verifier"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Verifier Prompt
            </button>
          </div>

          {currentPrompt && (
            <button
              onClick={() => handleCopy(currentPrompt.systemPrompt)}
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
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          )}
        </div>

        {currentPrompt ? (
          <div className="p-6 space-y-4">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                Role & Responsibility
              </span>
              <p className="text-xs text-slate-300 mt-1">{currentPrompt.description}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                System Prompt Template & Examples
              </span>
              <pre className="mt-2 p-4 bg-[#0b0f17] rounded-lg border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[500px]">
                {currentPrompt.systemPrompt}
              </pre>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading prompt definitions...
          </div>
        )}
      </div>
    </div>
  );
};
