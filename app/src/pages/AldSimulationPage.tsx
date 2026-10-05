import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { AldPipelineRunner } from "../components/AldPipelineRunner";
import { AldResultsDashboard } from "../components/AldResultsDashboard";

export function AldSimulationPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-[100svh] bg-background text-foreground lg:h-[100svh] lg:overflow-hidden">
      <div className="grid min-h-0 grid-cols-1 lg:h-full lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate("/")}
                className="rounded-md border border-border p-2 text-foreground/70 transition hover:bg-muted hover:text-foreground"
                title="Back to simulations"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate("/")}
                className="min-w-0 rounded-md text-left transition hover:opacity-80"
                title="Back to simulations"
              >
                <p className="text-xs font-medium uppercase text-foreground/50">Production console</p>
                <h1 className="truncate text-xl font-semibold sm:text-3xl">ALD Quantum Chemistry Lab</h1>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="rounded-md border border-border p-2 text-foreground/75 transition hover:bg-muted"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <AldPipelineRunner />
        </main>
        <AldResultsDashboard />
      </div>
    </div>
  );
}
