import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { FamilyExplorer } from "./components/FamilyExplorer";
import { GraphCanvas } from "./components/GraphCanvas";
import { GraphConfigurator } from "./components/GraphConfigurator";
import { PipelineRunner } from "./components/PipelineRunner";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { HomePage } from "./pages/HomePage";
import { QuantinaPage } from "./pages/QuantinaPage";

const maxCutRoute = "/simulations/maxcut";
const quantinaRoute = "/quantina";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const appRoot = basePath ? `${basePath}/` : "/";

function normalizeRoute(route: string) {
  return route.length > 1 ? route.replace(/\/$/, "") : route;
}

function routeFromLocation(pathname: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const simulationRoute = searchParams.get("simulation");
  if (simulationRoute === "maxcut") {
    return maxCutRoute;
  }

  const pageRoute = searchParams.get("page");
  if (pageRoute === "quantina") {
    return quantinaRoute;
  }

  const hashRoute = window.location.hash.replace(/^#/, "");
  if (hashRoute.startsWith("/")) {
    return normalizeRoute(hashRoute);
  }

  if (basePath && pathname.startsWith(basePath)) {
    return normalizeRoute(pathname.slice(basePath.length) || "/");
  }
  return normalizeRoute(pathname);
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [route, setRoute] = useState(() => routeFromLocation(window.location.pathname));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.title =
      route === quantinaRoute
        ? "QuantINA - Quantum Industrial Networks in Nouvelle-Aquitaine"
        : route === maxCutRoute
          ? "Neutral-atom MaxCut Lab"
          : "Quantum Simulation Platform";
  }, [route]);

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromLocation(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  const navigate = (nextRoute: string) => {
    const nextPath =
      nextRoute === maxCutRoute ? `${appRoot}?simulation=maxcut` : nextRoute === quantinaRoute ? `${appRoot}?page=quantina` : appRoot;
    window.history.pushState({}, "", nextPath);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  if (route === quantinaRoute) {
    return <QuantinaPage onNavigate={navigate} />;
  }

  if (route !== maxCutRoute) {
    return <HomePage onNavigate={navigate} />;
  }

  return (
    <div className="h-[100svh] overflow-hidden bg-background text-foreground">
      <div className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)_380px]">
        <GraphConfigurator />
        <main className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto overscroll-contain p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-md border border-border p-2 text-foreground/70 transition hover:bg-muted hover:text-foreground"
                title="Back to simulations"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-xs font-medium uppercase text-foreground/50">Production console</p>
                <h1 className="text-3xl font-semibold">Neutral-atom MaxCut lab</h1>
              </div>
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
          <PipelineRunner />
          <GraphCanvas />
          <FamilyExplorer />
        </main>
        <ResultsDashboard />
      </div>
    </div>
  );
}
