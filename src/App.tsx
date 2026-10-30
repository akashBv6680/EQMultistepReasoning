import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { WorkbenchView } from "./components/WorkbenchView";
import { TestSuiteView } from "./components/TestSuiteView";
import { PromptLibraryView } from "./components/PromptLibraryView";
import { ActiveTab, TestCase } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("workbench");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);

  useEffect(() => {
    fetch("/api/tests")
      .then((res) => res.json())
      .then((data) => setTestCases(data))
      .catch((err) => console.error("Failed to load test cases:", err));
  }, []);

  const handleSelectTestCaseForWorkbench = (tc: TestCase) => {
    setSelectedTestCase(tc);
    setActiveTab("workbench");
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRunQuickTest={() => setActiveTab("test_suite")}
      />

      <main className="flex-1">
        {activeTab === "workbench" && (
          <WorkbenchView testCases={testCases} />
        )}

        {activeTab === "test_suite" && (
          <TestSuiteView
            testCases={testCases}
            onSelectTestCaseForWorkbench={handleSelectTestCaseForWorkbench}
          />
        )}

        {activeTab === "prompts" && <PromptLibraryView />}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#0d121c] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            EverQuint Gen AI Engineer Interview Assignment · Multi-Step Reasoning Agent
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Planner · Executor · Verifier</span>
            <span>·</span>
            <span>Gemini API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
