import {
  ArrowRight,
  Binary,
  CircuitBoard,
  Cpu,
  Gauge,
  Lock,
  Network,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { SimulationModule } from "../config/simulations";
import { futureSimulationModules, simulationModules } from "../config/simulations";

const simulationStackVideoMp4Src = `${import.meta.env.BASE_URL}media/simulation-stack-4k.mp4`;
const simulationStackVideoMovSrc = `${import.meta.env.BASE_URL}media/simulation-stack-4k.mov`;

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const showHeroVideo = useHeroVideoEnabled();

  return (
    <main className="min-h-[100svh] overflow-x-clip bg-platform text-foreground">
      <section className="relative overflow-x-clip px-5 py-6 sm:px-8 lg:px-10">
        <QuantumBackdrop />

        <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/35 bg-primary/[0.12] text-primary shadow-[0_0_28px_hsl(var(--primary)/0.18)]">
                <CircuitBoard size={21} />
              </div>
              <div>
                <p className="text-sm font-semibold">Quantum Simulation Platform</p>
                <p className="text-xs text-foreground/50">Scientific computing workspace · Created by HYBQUANT</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-foreground/60 backdrop-blur md:flex">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
              Research environment
            </div>
          </header>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-center gap-12 py-14 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:py-12">
            <div className="platform-hero-copy min-w-0">
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary sm:text-sm">
                <Sparkles size={16} className="shrink-0" />
                <span className="min-w-0">Quantum algorithms, HPC workflows, optimization</span>
              </div>
              <h1 className="max-w-full text-4xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                Quantum Simulation Platform
              </h1>
              <p className="mt-6 max-w-full text-lg leading-8 text-foreground/70 sm:max-w-2xl sm:text-xl">
                Explore, simulate and analyze
                <br className="sm:hidden" /> quantum algorithms through an
                <br className="sm:hidden" /> interactive scientific environment.
              </p>
              <p className="mt-4 text-base font-medium text-foreground/60">
                Choose a problem to start your simulation.
              </p>

              <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                <PlatformMetric icon={Cpu} label="Compute" value="Hybrid" />
                <PlatformMetric icon={Network} label="Models" value="Modular" />
                <PlatformMetric icon={Gauge} label="Analysis" value="Live" />
              </div>
            </div>

            <div className="platform-hero-visual relative min-h-[420px] min-w-0 lg:min-h-[520px]">
              <HeroInstrument showVideo={showHeroVideo} />
            </div>
          </div>

          <section className="pb-12">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium uppercase text-primary/75">Choose a simulation</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Select a scientific problem</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-foreground/50">
                Each module packages configuration, execution and result analysis inside the same research-grade interface.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {simulationModules.map((module) => (
                <SimulationCard key={module.id} module={module} onNavigate={onNavigate} />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {futureSimulationModules.map(({ name, icon: Icon }) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-foreground/50"
                >
                  <Icon size={14} />
                  {name}
                </span>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function useHeroVideoEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return enabled;
}

function SimulationCard({ module, onNavigate }: { module: SimulationModule; onNavigate: (route: string) => void }) {
  const isAvailable = module.status === "available";
  const Icon = module.icon;

  return (
    <article
      className={[
        "group relative min-h-[320px] overflow-hidden rounded-lg border p-5 transition duration-300",
        isAvailable
          ? "cursor-pointer border-primary/25 bg-card-premium shadow-[0_24px_90px_rgba(0,0,0,0.28)] hover:border-primary/45"
          : "border-white/10 bg-white/[0.035] opacity-[0.68]",
      ].join(" ")}
      onClick={() => {
        if (isAvailable && module.route) {
          onNavigate(module.route);
        }
      }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
        <div className="absolute right-0 top-0 h-40 w-40 bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-foreground/40">{module.category}</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">{module.name}</h3>
              </div>
            </div>
            <span
              className={[
                "shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold",
                isAvailable
                  ? "border-primary/35 bg-primary/[0.12] text-primary"
                  : "border-white/10 bg-white/[0.055] text-foreground/50",
              ].join(" ")}
            >
              {isAvailable ? "Available" : "Coming Soon"}
            </span>
          </div>

          <p className="max-w-xl text-sm leading-6 text-foreground/60">{module.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {module.tags.map((tag) => (
              <span key={tag} className="rounded-md border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs text-foreground/60">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid items-end gap-5 sm:grid-cols-[1fr_auto]">
          <ModuleVisual type={module.visual} />
          {isAvailable ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
              onClick={(event) => {
                event.stopPropagation();
                if (module.route) {
                  onNavigate(module.route);
                }
              }}
            >
              Open simulation
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.045] px-4 py-2.5 text-sm font-semibold text-foreground/35"
            >
              <Lock size={15} />
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function PlatformMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-3 backdrop-blur">
      <Icon size={17} className="text-primary" />
      <p className="mt-3 text-xs text-foreground/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function QuantumBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(45,212,191,0.16),transparent_27%),radial-gradient(circle_at_80%_12%,rgba(125,211,252,0.11),transparent_24%),linear-gradient(135deg,#060914_0%,#0b1221_45%,#081017_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-35" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#05070d] to-transparent" />
    </div>
  );
}

function HeroInstrument({ showVideo }: { showVideo: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!showVideo) {
      return;
    }

    let resumeTimer = 0;
    const pauseDuringScroll = () => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      video.pause();
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (video.isConnected) {
          void video.play().catch(() => undefined);
        }
      }, 220);
    };

    window.addEventListener("scroll", pauseDuringScroll, { passive: true });
    return () => {
      window.clearTimeout(resumeTimer);
      window.removeEventListener("scroll", pauseDuringScroll);
    };
  }, [showVideo]);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.09),rgba(255,255,255,0.015))] shadow-[0_32px_120px_rgba(0,0,0,0.42)]" />
      <div className="absolute left-6 right-6 top-6 flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-4 py-3">
        <div>
          <p className="text-xs uppercase text-foreground/40">Simulation stack</p>
          <p className="mt-1 text-sm font-semibold text-white">Hamiltonian pipeline</p>
        </div>
        <Binary className="text-primary" size={20} />
      </div>
      <div className="absolute inset-x-8 bottom-8 top-24">
        <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          {showVideo ? (
            <video
              ref={videoRef}
              aria-hidden="true"
              autoPlay
              className="simulation-stack-video absolute inset-0 h-full w-full object-cover opacity-45"
              loop
              muted
              onLoadedMetadata={(event) => {
                event.currentTarget.playbackRate = 0.72;
              }}
              playsInline
              preload="metadata"
            >
              <source src={simulationStackVideoMp4Src} type="video/mp4" />
              <source src={simulationStackVideoMovSrc} type="video/quicktime" />
            </video>
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.1),rgba(5,7,13,0.62)),radial-gradient(circle_at_50%_45%,rgba(45,212,191,0.13),transparent_56%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(45,212,191,0.08),transparent)]" />
          <div className="absolute left-[10%] top-[15%] h-3 w-3 rounded-full bg-primary shadow-[0_0_28px_hsl(var(--primary))]" />
          <div className="absolute left-[36%] top-[32%] h-4 w-4 rounded-full border border-primary bg-primary/30 shadow-[0_0_28px_hsl(var(--primary)/0.7)]" />
          <div className="absolute left-[72%] top-[18%] h-3 w-3 rounded-full bg-sky-300 shadow-[0_0_26px_rgba(125,211,252,0.9)]" />
          <div className="absolute left-[22%] top-[68%] h-4 w-4 rounded-full border border-sky-200 bg-sky-300/25 shadow-[0_0_28px_rgba(125,211,252,0.7)]" />
          <div className="absolute left-[64%] top-[72%] h-3 w-3 rounded-full bg-primary shadow-[0_0_28px_hsl(var(--primary))]" />
          <div className="absolute left-[12%] top-[17%] h-px w-[28%] rotate-[20deg] bg-primary/60" />
          <div className="absolute left-[38%] top-[35%] h-px w-[34%] -rotate-[13deg] bg-sky-200/40" />
          <div className="absolute left-[24%] top-[68%] h-px w-[40%] rotate-[4deg] bg-primary/50" />
          <div className="absolute left-[66%] top-[22%] h-px w-[26%] rotate-[99deg] bg-sky-200/35" />
          <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3">
            {["Embed", "Anneal", "Analyze"].map((label, index) => (
              <div key={label} className="rounded-md border border-white/10 bg-white/[0.045] p-3">
                <p className="font-mono text-xs text-primary">0{index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleVisual({ type }: { type: SimulationModule["visual"] }) {
  if (type === "layers") {
    return (
      <div className="relative h-24 min-w-56 overflow-hidden rounded-md border border-white/10 bg-black/20">
        {[0, 1, 2, 3].map((layer) => (
          <div
            key={layer}
            className="absolute left-5 right-5 h-3 rounded-full border border-sky-200/25 bg-sky-200/10"
            style={{ top: 18 + layer * 16 }}
          />
        ))}
        <div className="absolute left-8 top-4 h-16 w-1 rounded-full bg-primary/40" />
        <div className="absolute right-10 top-7 h-11 w-1 rounded-full bg-sky-300/40" />
      </div>
    );
  }

  return (
    <div className="relative h-24 min-w-56 overflow-hidden rounded-md border border-white/10 bg-black/20">
      <div className="absolute left-7 top-8 h-3 w-3 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
      <div className="absolute left-24 top-5 h-4 w-4 rounded-full border border-primary bg-primary/30" />
      <div className="absolute left-36 top-14 h-3 w-3 rounded-full bg-sky-300" />
      <div className="absolute right-9 top-9 h-4 w-4 rounded-full border border-sky-200 bg-sky-300/25" />
      <div className="absolute left-8 top-9 h-px w-20 -rotate-12 bg-primary/50" />
      <div className="absolute left-28 top-9 h-px w-20 rotate-[24deg] bg-sky-200/40" />
      <div className="absolute left-40 top-16 h-px w-24 -rotate-[22deg] bg-primary/40" />
    </div>
  );
}
