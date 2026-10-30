import React, { useState } from "react";
import { TestCase, TestRunResult } from "../types";
import {
  Play,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";

interface TestSuiteViewProps {
  testCases: TestCase[];
  onSelectTestCaseForWorkbench: (tc: TestCase) => void;
}

export const TestSuiteView: React.FC<TestSuiteViewProps> = ({
  testCases,
  onSelectTestCaseForWorkbench,
}) => {
  const [running, setRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState<number | null>(null);
  const [results, setResults] = useState<Record<string, TestRunResult>>({});
  const [selectedResult, setSelectedResult] = useState<TestRunResult | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | "easy" | "tricky">("all");

  const runSingleTest = async (tc: TestCase) => {
    setRunning(true);
    try {
      const response = await fetch("/api/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: tc.id }),
      });

      if (!response.ok) throw new Error("Failed to run test");
      const data: TestRunResult[] = await response.json();
      if (data.length > 0) {
        setResults((prev) => ({ ...prev, [tc.id]: data[0] }));
        setSelectedResult(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const runAllTests = async (categoryFilter?: "easy" | "tricky") => {
    setRunning(true);
    const targetCases = categoryFilter
      ? testCases.filter((t) => t.category === categoryFilter)
      : testCases;

    for (let i = 0; i < targetCases.length; i++) {
      const tc = targetCases[i];
      setCurrentTestIndex(i);

      try {
        const response = await fetch("/api/tests/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId: tc.id }),
        });

        if (response.ok) {
          const data: TestRunResult[] = await response.json();
          if (data.length > 0) {
            setResults((prev) => ({ ...prev, [tc.id]: data[0] }));
          }
        }
      } catch (err) {
        console.error(`Error running test ${tc.id}:`, err);
      }
    }

    setCurrentTestIndex(null);
    setRunning(false);
  };

  const exportRunLogsJson = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: Object.keys(results).length,
        passed_count: Object.values(results).filter((r) => r.passed_verification).length,
        retried_count: Object.values(results).filter((r) => r.retried).length,
      },
      test_runs: Object.values(results),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reasoning_agent_test_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTests = testCases.filter((tc) => {
    if (filterCategory === "all") return true;
    return tc.category === filterCategory;
  });

  const totalRun = Object.keys(results).length;
  const passedCount = Object.values(results).filter((r) => r.passed_verification).length;
  const retriedCount = Object.values(results).filter((r) => r.retried).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Evaluation Test Suite & Run Logs
          </h1>
          <p className="text-sm text-slate-400">
            15 pre-loaded evaluation test cases (10 easy arithmetic/time differences + 5 tricky boundary/constraint cases)
            validating verifier pass/fail checks, autonomous retry behavior, and final JSON schema compliance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => runAllTests()}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
          >
            {running ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running ({currentTestIndex !== null ? `${currentTestIndex + 1}/${testCases.length}` : "Batch"})...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run All 15 Tests</span>
              </>
            )}
          </button>

          <button
            onClick={exportRunLogsJson}
            disabled={totalRun === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#111726] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Run Logs JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Test Cases</span>
          <span className="text-2xl font-bold font-mono text-white">15</span>
          <span className="text-xs text-slate-500 block mt-1">10 Easy · 5 Tricky</span>
        </div>

        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Tests Evaluated</span>
          <span className="text-2xl font-bold font-mono text-indigo-400">{totalRun} / 15</span>
          <span className="text-xs text-slate-500 block mt-1">
            {totalRun > 0 ? `${Math.round((totalRun / 15) * 100)}% coverage` : "Not started"}
          </span>
        </div>

        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Verifier Pass Rate</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {totalRun > 0 ? `${Math.round((passedCount / totalRun) * 100)}%` : "—"}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            {passedCount} passed verifier
          </span>
        </div>

        <div className="bg-[#111726] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Retries Triggered</span>
          <span className="text-2xl font-bold font-mono text-amber-400">{retriedCount}</span>
          <span className="text-xs text-slate-500 block mt-1">Self-correction loops</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Category:
        </span>
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All (15)
        </button>
        <button
          onClick={() => setFilterCategory("easy")}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            filterCategory === "easy"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Easy (10)
        </button>
        <button
          onClick={() => setFilterCategory("tricky")}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
            filterCategory === "tricky"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Tricky Boundaries (5)
        </button>
      </div>

      {/* Two Column Layout: Test Table + Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#111726] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0f17] border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Test Case</th>
                  <th className="py-3 px-3 font-semibold">Type</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Retried</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTests.map((tc) => {
                  const run = results[tc.id];
                  const isSelected = selectedResult?.test_case.id === tc.id;

                  return (
                    <tr
                      key={tc.id}
                      onClick={() => run && setSelectedResult(run)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? "bg-slate-800/60" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{tc.title}</div>
                        <div className="text-slate-500 truncate max-w-xs">{tc.question}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase ${
                            tc.category === "easy"
                              ? "bg-slate-800 text-slate-300"
                              : "bg-amber-950/60 text-amber-300 border border-amber-900/40"
                          }`}
                        >
                          {tc.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {run ? (
                          run.passed_verification ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PASS
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              FAIL
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">Pending</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-400">
                        {run ? (
                          run.retried ? (
                            <span className="text-amber-400 font-medium">
                              Yes ({run.output.metadata.retries})
                            </span>
                          ) : (
                            "No"
                          )
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runSingleTest(tc);
                          }}
                          disabled={running}
                          className="px-2.5 py-1 text-indigo-400 hover:text-white hover:bg-indigo-600/30 rounded border border-indigo-900/60 transition-colors"
                        >
                          Run
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Test Run Inspector (5 cols) */}
        <div className="lg:col-span-5 bg-[#111726] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Test Execution Log Inspector
          </h3>

          {selectedResult ? (
            <div className="space-y-4">
              <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <span className="text-slate-500 block">Question</span>
                <p className="text-slate-200 font-medium">
                  {selectedResult.test_case.question}
                </p>
                <div className="pt-2 text-slate-400">
                  <span className="text-indigo-400">Focus: </span>
                  {selectedResult.test_case.focus_area}
                </div>
              </div>

              <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Final Answer:</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedResult.output.answer}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Verifier Status:</span>
                  <span
                    className={`font-semibold ${
                      selectedResult.passed_verification ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {selectedResult.passed_verification ? "PASSED" : "FAILED"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Retries Taken:</span>
                  <span className="font-mono text-slate-300">
                    {selectedResult.output.metadata.retries}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-mono text-slate-300">
                    {selectedResult.duration_ms} ms
                  </span>
                </div>
              </div>

              {/* Checks */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-400 font-medium">Verifier Checks:</span>
                <div className="space-y-2">
                  {selectedResult.output.metadata.checks.map((chk, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#0b0f17] rounded-lg border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-300">{chk.check_name}</span>
                        <span
                          className={`font-mono text-[10px] ${
                            chk.passed ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {chk.passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {chk.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full JSON Dump */}
              <div>
                <span className="text-xs text-slate-400 font-medium block mb-1">
                  Full Output JSON:
                </span>
                <pre className="p-3 bg-[#0b0f17] rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedResult.output, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => onSelectTestCaseForWorkbench(selectedResult.test_case)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-lg transition-colors"
              >
                <span>Load in Interactive Workbench</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Run or click on any test case in the table to inspect its full execution log, verifier checks, and schema output.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
