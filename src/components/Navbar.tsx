import React from "react";
import { ActiveTab } from "../types";
import { Play, Sparkles } from "lucide-react";

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onRunQuickTest?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onRunQuickTest,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d121c]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-500/20">
            EQ
          </div>
          <button
            onClick={() => onTabChange("workbench")}
            className="text-base font-semibold tracking-tight text-white hover:text-indigo-400 transition-colors whitespace-nowrap text-left"
          >
            EverQuint Reasoning Agent
          </button>
        </div>

        {/* Zone 2: Single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onTabChange("workbench")}
            className={`whitespace-nowrap transition-colors ${
              activeTab === "workbench"
                ? "text-indigo-400 border-b-2 border-indigo-500 pb-1"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Interactive Workbench
          </button>
          <button
            onClick={() => onTabChange("test_suite")}
            className={`whitespace-nowrap transition-colors ${
              activeTab === "test_suite"
                ? "text-indigo-400 border-b-2 border-indigo-500 pb-1"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Batch Test Suite (15 Cases)
          </button>
          <button
            onClick={() => onTabChange("prompts")}
            className={`whitespace-nowrap transition-colors ${
              activeTab === "prompts"
                ? "text-indigo-400 border-b-2 border-indigo-500 pb-1"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Prompt Library
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              onTabChange("test_suite");
              onRunQuickTest?.();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Test Suite</span>
          </button>
        </div>
      </div>
    </header>
  );
};
