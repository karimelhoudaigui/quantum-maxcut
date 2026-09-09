import {
  ArrowRight,
  Atom,
  BatteryCharging,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  CircuitBoard,
  Code2,
  Cpu,
  ExternalLink,
  Factory,
  FileText,
  Gauge,
  GraduationCap,
  Handshake,
  HelpCircle,
  Microscope,
  Network,
  Plane,
  Satellite,
  Server,
  ShieldCheck,
  Target,
  TrainFront,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const quantinaHeroPosterSrc = `${import.meta.env.BASE_URL}media/simulation-stack-poster.png`;
const quantinaHeroVideoSrc = `${import.meta.env.BASE_URL}media/simulation-stack-4k.mp4`;

interface QuantinaPageProps {
  onNavigate: (route: string) => void;
}

interface UseCase {
  title: string;
  problem: string;
  approach: string;
  partners: string;
  status: string;
  icon: LucideIcon;
  accent: string;
}

interface ProgramItem {
  title: string;
  text: string;
  icon: LucideIcon;
}

interface PlatformModule {
  name: string;
  status: "Available" | "In development" | "Coming soon" | "Research stage";
  description: string;
  tags: string[];
  route?: string;
}

const useCases: UseCase[] = [
  {
    title: "Batteries & materials",
    problem: "Battery calibration, materials screening and parameter spaces with costly experimental feedback.",
    approach: "Hybrid optimization, surrogate modelling and quantum-inspired search over constrained design spaces.",
    partners: "Industrial R&D teams + materials and modelling laboratories",
    status: "Scoping",
    icon: BatteryCharging,
    accent: "text-emerald-300",
  },
  {
    title: "Space & satellites",
    problem: "Scheduling, resource allocation and mission planning under orbital and operational constraints.",
    approach: "Combinatorial formulations, HPC baselines, QAOA-style prototypes and benchmark-driven selection.",
    partners: "Aerospace companies + applied mathematics teams",
    status: "Candidate track",
    icon: Satellite,
    accent: "text-sky-300",
  },
  {
    title: "Rail energy systems",
    problem: "Energy-aware planning, network constraints and infrastructure-level optimization.",
    approach: "Mixed optimization, decomposition strategies and quantum-inspired heuristics compared to classical solvers.",
    partners: "Transport operators + optimization researchers",
    status: "Use-case framing",
    icon: TrainFront,
    accent: "text-amber-300",
  },
  {
    title: "Aeronautics / CFD",
    problem: "Simulation-heavy engineering loops where each evaluation is expensive and high-dimensional.",
    approach: "HPC baselines, linear-solver analysis, reduced-order models and quantum algorithm feasibility studies.",
    partners: "Engineering teams + numerical analysis laboratories",
    status: "Research stage",
    icon: Plane,
    accent: "text-cyan-300",
  },
  {
    title: "Combinatorial optimization",
    problem: "Graph, routing, allocation and partitioning problems that must be solved under real industrial constraints.",
    approach: "Exact baselines, approximation ratios, QAOA, annealing-inspired methods and hybrid rounding.",
    partners: "Industry owners + HybQuant engineers",
    status: "Demo available",
    icon: BrainCircuit,
    accent: "text-teal-300",
  },
  {
    title: "Physical simulation",
    problem: "Physics models that require reliable numerical experiments before any industrial decision.",
    approach: "Hamiltonian modelling, classical simulation, variational workflows and benchmark reports.",
    partners: "LOMA, XLIM, IMB, LaBRI and partner ecosystems",
    status: "Methodology",
    icon: Waves,
    accent: "text-indigo-300",
  },
  {
    title: "Post-quantum cryptography",
    problem: "Anticipating quantum-era cryptographic risks and migration requirements for industrial systems.",
    approach: "Risk mapping, algorithmic review, implementation audits and transition strategy.",
    partners: "Security teams + cryptography researchers",
    status: "Exploratory",
    icon: ShieldCheck,
    accent: "text-rose-300",
  },
];

const projectPrinciples: ProgramItem[] = [
  {
    title: "Technology transfer",
    text: "QuantINA turns industrial pain points into applied research projects around quantum, hybrid and HPC computing.",
    icon: Handshake,
  },
  {
    title: "Scientific discipline",
    text: "The program does not promise quantum advantage. It measures when quantum, hybrid or quantum-inspired methods are relevant.",
    icon: Microscope,
  },
  {
    title: "Regional ecosystem",
    text: "The initiative connects companies, laboratories, engineers, students and shared compute resources in Nouvelle-Aquitaine.",
    icon: Network,
  },
];

const workflow = [
  "Identify",
  "Formalize",
  "Recruit",
  "Simulate",
  "Benchmark",
  "Publish",
  "Industrialize",
];

const platformModules: PlatformModule[] = [
  {
    name: "MaxCut",
    status: "Available",
    description: "Neutral-atom graph optimization demonstrator with configuration, execution and result analysis.",
    tags: ["Optimization", "QAOA", "Graph theory"],
    route: "/simulations/maxcut",
  },
  {
    name: "ALD Simulation",
    status: "In development",
    description: "Atomic Layer Deposition workflows for materials modelling and quantum-enhanced simulation studies.",
    tags: ["Materials", "Simulation", "Chemistry"],
  },
  {
    name: "Satellite Scheduling",
    status: "Coming soon",
    description: "Mission planning and constrained resource allocation for space operations.",
    tags: ["Scheduling", "Aerospace", "Optimization"],
  },
  {
    name: "Battery Calibration",
    status: "Coming soon",
    description: "Calibration and design-space exploration for industrial battery systems.",
    tags: ["Energy", "Surrogates", "Search"],
  },
  {
    name: "CFD / Linear Solvers",
    status: "Research stage",
    description: "Feasibility studies around HPC baselines, reduced-order modelling and quantum linear solvers.",
    tags: ["CFD", "HPC", "Linear systems"],
  },
];

const partners = [
  { name: "Maison du Quantique de Nouvelle-Aquitaine", role: "Regional coordination" },
  { name: "HybQuant", role: "Engineering and applied research" },
  { name: "LaBRI", role: "Computer science and algorithms" },
  { name: "IMB", role: "Mathematics and modelling" },
  { name: "XLIM", role: "Photonics, electronics and systems" },
  { name: "LOMA", role: "Materials and physical modelling" },
  { name: "Industrial partners", role: "Use cases and domain constraints" },
  { name: "HPC / QPU infrastructures", role: "Simulation and execution resources" },
];

const deliverables: ProgramItem[] = [
  {
    title: "Technical reports",
    text: "Clear benchmark notes, modelling assumptions, limits and recommendations for each industrial use case.",
    icon: FileText,
  },
  {
    title: "Scientific publications",
    text: "Research outputs when a case exposes a meaningful algorithmic, modelling or benchmarking contribution.",
    icon: BookOpen,
  },
  {
    title: "Open demonstrators",
    text: "Reusable software prototypes that make the methodology inspectable, testable and shareable.",
    icon: Code2,
  },
];

const joinTracks: ProgramItem[] = [
  {
    title: "I am a company",
    text: "Bring a concrete industrial problem, data constraints and operational criteria for a rigorous feasibility track.",
    icon: Briefcase,
  },
  {
    title: "I am a researcher",
    text: "Contribute methods, models, benchmarks and domain expertise to applied quantum and HPC studies.",
    icon: Microscope,
  },
  {
    title: "I am a student or intern",
    text: "Join a supervised applied research track that can lead to software, publications, CIFRE or long-term partnerships.",
    icon: GraduationCap,
  },
];

export function QuantinaPage({ onNavigate }: QuantinaPageProps) {
  return (
    <main className="min-h-[100svh] overflow-x-clip bg-quantina text-foreground">
      <QuantinaHeader onNavigate={onNavigate} />
      <HeroSection onNavigate={onNavigate} />
      <FlowSection />
      <ProjectSection />
      <UseCasesSection />
      <WorkflowSection />
      <PlatformSection onNavigate={onNavigate} />
      <PartnersSection />
      <DeliverablesSection />
      <JoinSection />
    </main>
  );
}

function QuantinaHeader({ onNavigate }: QuantinaPageProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-5 sm:px-8 sm:pt-7 lg:px-12">
      <div className="relative mx-auto flex max-w-7xl items-start justify-between gap-4">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/35 bg-black/25 text-primary shadow-[0_0_34px_hsl(var(--primary)/0.22)] backdrop-blur-2xl">
            <Atom size={21} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">QuantINA</p>
            <p className="hidden truncate text-xs text-foreground/50 sm:block">Quantum Industrial Networks in Nouvelle-Aquitaine</p>
          </div>
        </a>

        <a
          href="#project"
          className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-black/25 text-foreground/75 shadow-[0_16px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:border-primary/35 hover:text-primary"
          title="Program brief"
        >
          <HelpCircle size={18} strokeWidth={1.5} />
        </a>

        <nav className="hidden items-center gap-5 rounded-full border border-white/10 bg-black/20 px-5 py-3 text-xs font-medium text-foreground/62 backdrop-blur-2xl xl:flex">
          <a className="transition hover:text-primary" href="#project">
            Project
          </a>
          <a className="transition hover:text-primary" href="#use-cases">
            Use cases
          </a>
          <a className="transition hover:text-primary" href="#method">
            Method
          </a>
          <a className="transition hover:text-primary" href="#platform">
            Platform
          </a>
          <a className="transition hover:text-primary" href="#join">
            Join
          </a>
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-white">HYBQUANT</p>
            <p className="text-xs text-foreground/48">Applied quantum transfer</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/25 text-foreground/75 shadow-[0_16px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition hover:border-primary/35 hover:text-primary sm:h-12 sm:w-12"
            title="Open simulation platform"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onNavigate }: QuantinaPageProps) {
  return (
    <section id="top" className="relative min-h-[92svh] overflow-hidden px-5 pb-8 pt-28 sm:px-8 sm:pb-10 sm:pt-32 lg:px-12 xl:min-h-[94svh]">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex min-h-[calc(92svh-8rem)] w-full max-w-7xl flex-col justify-end xl:min-h-[calc(94svh-9rem)]">
        <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,0.92fr)_minmax(480px,0.78fr)] xl:items-end">
          <div className="min-w-0">
            <AnimatedElement direction="down" delay={120}>
              <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary shadow-[0_18px_70px_hsl(var(--primary)/0.12)] backdrop-blur-2xl sm:text-sm">
                <CircuitBoard size={16} className="shrink-0" />
                Regional quantum technology transfer program
              </div>
            </AnimatedElement>

            <AnimatedElement direction="up" delay={260} className="min-w-0 max-w-full">
              <h1 className="max-w-[22rem] break-words text-4xl font-semibold leading-[0.98] text-white sm:max-w-5xl sm:text-7xl lg:text-[92px]">
                QuantINA
                <span className="mt-3 block max-w-4xl text-3xl leading-[1.04] text-foreground/82 sm:text-5xl lg:text-[58px]">
                  Quantum Industrial <span className="block sm:inline">Networks</span>
                  <span className="block">in Nouvelle-Aquitaine</span>
                </span>
              </h1>
            </AnimatedElement>

            <AnimatedElement direction="up" delay={430} className="min-w-0 max-w-full">
              <p className="mt-7 max-w-[22rem] text-2xl font-medium leading-9 text-primary sm:max-w-3xl sm:text-3xl">
                From industrial use cases to quantum experimentation.
              </p>
              <p className="mt-5 max-w-[22rem] text-base leading-8 text-foreground/70 sm:max-w-3xl sm:text-lg">
                A program led by the Maison du Quantique de Nouvelle-Aquitaine to connect companies, researchers and engineers around
                concrete industrial use cases in quantum, hybrid and HPC computing.
              </p>
            </AnimatedElement>

            <AnimatedElement direction="up" delay={620}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#use-cases"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 sm:w-auto"
                >
                  Explore use cases
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#join"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-black/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur-2xl transition hover:border-primary/45 hover:text-primary sm:w-auto"
                >
                  Submit an industrial challenge
                </a>
              </div>
            </AnimatedElement>

            <HeroWorkflowTicker />
          </div>

          <div className="hidden min-w-0 gap-4 md:grid xl:max-w-xl xl:justify-self-end">
            <HeroTransferCard />
            <HeroSignalGrid onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroBackground() {
  const showVideo = useQuantinaHeroVideoEnabled();
  const [videoReady, setVideoReady] = useState(false);

  return (
    <>
      <img
        aria-hidden="true"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35"
        decoding="async"
        src={quantinaHeroPosterSrc}
      />
      {showVideo ? (
        <video
          aria-hidden="true"
          className={[
            "quantina-hero-video absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms]",
            videoReady ? "opacity-[0.32]" : "opacity-0",
          ].join(" ")}
          autoPlay
          loop
          muted
          playsInline
          poster={quantinaHeroPosterSrc}
          preload="metadata"
          src={quantinaHeroVideoSrc}
          onCanPlay={() => setVideoReady(true)}
        />
      ) : null}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,13,0.97)_0%,rgba(5,7,13,0.78)_46%,rgba(5,7,13,0.42)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#05070d] to-transparent" />
    </>
  );
}

function HeroTransferCard() {
  const activeTracks = useCountUp(5, 1800);
  const nodes = ["Challenge", "Model", "Baseline", "Quantum", "Decision"];

  return (
    <AnimatedElement direction="right" delay={520}>
      <div className="relative h-[300px] overflow-hidden rounded-lg border border-white/12 bg-black/22 shadow-[0_32px_120px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <div
          aria-hidden="true"
          className="quantina-spin-bg absolute inset-[-12%] opacity-45"
          style={{
            backgroundImage: `url(${quantinaHeroPosterSrc})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_46%_38%,rgba(45,212,191,0.18),transparent_34%),linear-gradient(180deg,rgba(5,7,13,0.2),rgba(5,7,13,0.88))]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-foreground/42">Transfer engine</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Industrial readiness map</h2>
            </div>
            <span className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">Live method</span>
          </div>

          <div>
            <div className="flex items-end gap-4">
              <p className="font-mono text-[78px] font-semibold leading-[0.82] text-white tabular-nums">{activeTracks}</p>
              <p className="pb-2 text-xs font-semibold uppercase leading-5 text-foreground/55">
                industrial
                <br />
                tracks
              </p>
            </div>
            <p className="mt-2 max-w-md text-sm leading-6 text-foreground/62">
              Companies bring constraints. The ecosystem turns them into models, baselines, prototypes and documented decisions.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {nodes.map((node, index) => (
              <div key={node} className="min-w-0 rounded-md border border-white/10 bg-black/24 p-2">
                <p className="font-mono text-xs font-semibold text-primary">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 truncate text-xs font-semibold text-white">{node}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedElement>
  );
}

function HeroSignalGrid({ onNavigate }: QuantinaPageProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatedElement direction="right" delay={680}>
      <div className="grid grid-cols-2 gap-3">
        <HeroSignalCard icon={Factory} title="Use-case intake" value="5 tracks" note="Industrial problems" />
        <HeroSignalCard icon={Network} title="Research network" value="4 labs" note="Regional ecosystem" />
        <button
          type="button"
          className={[
            "group min-h-[132px] rounded-lg border p-4 text-left transition-all duration-300",
            expanded ? "border-white/80 bg-white text-background" : "border-white/10 bg-[#2f2f2f]/55 text-white backdrop-blur-2xl hover:bg-[#2f2f2f]/70",
          ].join(" ")}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          onClick={() => setExpanded((value) => !value)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold">Benchmark discipline</p>
              <p className={["mt-1 text-xs", expanded ? "text-background/55" : "text-white/55"].join(" ")}>Evidence first</p>
            </div>
            <span className={["flex h-8 w-8 items-center justify-center rounded-full", expanded ? "bg-[#f0f0f0]" : "bg-black/55"].join(" ")}>
              <Gauge size={15} />
            </span>
          </div>
          {expanded ? (
            <p className="mt-4 text-sm leading-6 text-background/68">
              No quantum advantage claim before baselines and benchmark evidence are explicit.
            </p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("/simulations/maxcut")}
          className="group min-h-[132px] rounded-lg border border-primary/25 bg-primary/[0.09] p-4 text-left text-white backdrop-blur-2xl transition hover:border-primary/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold">Simulation platform</p>
              <p className="mt-1 text-xs text-white/55">MaxCut demonstrator</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-background">
              <ArrowRight size={15} />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-foreground/62">Open the first working module.</p>
        </button>
      </div>
    </AnimatedElement>
  );
}

function HeroSignalCard({ icon: Icon, title, value, note }: { icon: LucideIcon; title: string; value: string; note: string }) {
  return (
    <article className="min-h-[132px] rounded-lg border border-white/10 bg-[#2f2f2f]/55 p-4 text-white backdrop-blur-2xl transition hover:bg-[#2f2f2f]/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="mt-1 text-xs text-white/55">{note}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-primary">
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-6 text-2xl font-semibold leading-none">{value}</p>
    </article>
  );
}

function HeroWorkflowTicker() {
  const steps = ["Identify", "Formalize", "Recruit", "Simulate", "Benchmark", "Publish", "Industrialize"];
  const tickerSteps = [...steps, ...steps];

  return (
    <AnimatedElement direction="up" delay={860} className="mt-9 hidden max-w-3xl sm:block">
      <div className="inline-flex items-center rounded-full border border-[#efce96]/45 bg-[#efce96]/16 px-4 py-2 text-xs font-semibold tracking-wide text-white">
        Evidence-first quantum transfer
      </div>
      <div className="quantina-ticker-mask relative mt-3 h-11 overflow-hidden">
        <div className="quantina-ticker flex w-max items-center gap-5">
          {tickerSteps.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-center gap-3">
              <span className="h-6 w-px rounded-full bg-[#efce96]/55" />
              <span className="whitespace-nowrap text-xs font-semibold uppercase text-foreground/58">{step}</span>
            </div>
          ))}
        </div>
        <span className="absolute left-1/2 top-0 h-10 w-0.5 -translate-x-1/2 rounded-full bg-[#efce96]" />
      </div>
    </AnimatedElement>
  );
}

function useQuantinaHeroVideoEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return enabled;
}

function useCountUp(target: number, durationMs: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    let startTime = 0;

    const tick = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [durationMs, target]);

  return value;
}

type AnimationDirection = "up" | "down" | "left" | "right" | "scale";

function AnimatedElement({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: AnimationDirection;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const hiddenTransforms: Record<AnimationDirection, string> = {
    up: "translate3d(0, 40px, 0) scale(1)",
    down: "translate3d(0, -40px, 0) scale(1)",
    left: "translate3d(-40px, 0, 0) scale(1)",
    right: "translate3d(40px, 0, 0) scale(1)",
    scale: "translate3d(0, 0, 0) scale(0.9)",
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0, 0, 0) scale(1)" : hiddenTransforms[direction],
        transition: "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function FlowSection() {
  const flow = [
    { title: "Industrial challenge", icon: Factory },
    { title: "Mathematical modelling", icon: Target },
    { title: "Classical / HPC baseline", icon: Server },
    { title: "Quantum / hybrid algorithm", icon: BrainCircuit },
    { title: "Benchmark & decision", icon: Gauge },
  ];

  return (
    <section className="border-y border-white/10 bg-white/[0.025] px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase text-primary/75">Operating logic</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">From industrial challenges to quantum experiments.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {flow.map(({ title, icon: Icon }, index) => (
            <div key={title} className="relative rounded-md border border-white/10 bg-[#0b1119]/85 p-4">
              <Icon size={18} className="text-primary" />
              <p className="mt-4 text-sm font-semibold leading-5 text-white">{title}</p>
              {index < flow.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-primary md:block" size={18} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectSection() {
  return (
    <section id="project" className="px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionIntro
          eyebrow="The project"
          title="A regional experimentation program for quantum technologies in industry."
          text="QuantINA exists to test real industrial problems with research-grade methodology, strong classical baselines and clear decisions about what quantum, hybrid or quantum-inspired methods can actually bring."
        />

        <div className="grid gap-4">
          {projectPrinciples.map((item) => (
            <ProgramCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section id="use-cases" className="bg-[#07100f] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <SectionIntro
            eyebrow="Use cases"
            title="Industrial problems studied through a rigorous quantum and HPC lens."
            text="Each case starts with the industrial constraint, then moves through modelling, baseline selection, algorithmic exploration and documented benchmarking."
          />
          <div className="rounded-md border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-medium text-amber-100">
            No quantum advantage claim. Evidence first.
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase.title} useCase={useCase} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="method" className="px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionIntro
            eyebrow="How it works"
            title="A repeatable path from problem owner to benchmarked prototype."
            text="The first phase can use internships as an operational mechanism, but the program is built for a wider transfer pipeline: software, publications, CIFRE projects, collaborative grants and long-term partnerships."
          />

          <div className="grid gap-3">
            {workflow.map((step, index) => (
              <div key={step} className="grid grid-cols-[3.25rem_1fr] items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/25 bg-primary/10 font-mono text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="font-semibold text-white">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <ModelPillar icon={Factory} title="Company" text="Industrial problem, constraints and success criteria" />
          <ModelPillar icon={Microscope} title="Researcher" text="Scientific framing, modelling and methods" />
          <ModelPillar icon={Cpu} title="HybQuant engineer" text="Software, simulation, HPC and benchmarks" />
          <ModelPillar icon={GraduationCap} title="Student / intern" text="Focused execution during the first research tracks" />
        </div>
      </div>
    </section>
  );
}

function PlatformSection({ onNavigate }: QuantinaPageProps) {
  return (
    <section id="platform" className="bg-[#0d1016] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionIntro
            eyebrow="Simulation platform"
            title="QuantINA Simulation Platform"
            text="The showcase connects directly to working demonstrators. MaxCut is available now, while ALD and industrial tracks can progressively become simulation modules."
          />
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white transition hover:border-primary/45 hover:text-primary"
            >
              Open platform
              <ExternalLink size={16} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("/simulations/maxcut")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Open MaxCut demo
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {platformModules.map((module) => (
            <PlatformModuleCard key={module.name} module={module} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection() {
  return (
    <section id="partners" className="px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Partners"
          title="A bridge between regional research capacity and industrial execution."
          text="QuantINA is designed around a shared ecosystem: public research, engineering coordination, industrial problem owners and access to compute resources."
        />

        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {partners.map((partner) => (
            <div key={partner.name} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <Building2 size={18} className="text-primary" />
              <h3 className="mt-4 text-sm font-semibold text-white">{partner.name}</h3>
              <p className="mt-2 text-xs leading-5 text-foreground/52">{partner.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeliverablesSection() {
  return (
    <section id="outputs" className="bg-[#07100f] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Results and deliverables"
          title="Every track should leave a decision-ready output."
          text="A QuantINA project is useful only if it produces something inspectable: a benchmark, a technical report, a publication path, a software prototype or a reasoned decision not to use a quantum approach."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {deliverables.map((item) => (
            <ProgramCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function JoinSection() {
  return (
    <section id="join" className="px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionIntro
            eyebrow="Join QuantINA"
            title="Bring a real problem, a method or the energy to build the first demonstrators."
            text="QuantINA is an entry point for companies, researchers and students who want to evaluate quantum technologies with industrial seriousness and scientific humility."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {joinTracks.map((item) => (
              <ProgramCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium uppercase text-primary/75">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-foreground/58 sm:text-base">{text}</p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
      <p className="text-xs text-foreground/45">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ProgramCard({ item }: { item: ProgramItem }) {
  const Icon = item.icon;
  return (
    <article className="rounded-md border border-white/10 bg-white/[0.04] p-5">
      <Icon size={20} className="text-primary" />
      <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-foreground/58">{item.text}</p>
    </article>
  );
}

function UseCaseCard({ useCase }: { useCase: UseCase }) {
  const Icon = useCase.icon;
  return (
    <article className="rounded-md border border-white/10 bg-[#0b1119]/88 p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/[0.055]">
            <Icon size={21} className={useCase.accent} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{useCase.title}</h3>
            <p className="mt-1 text-xs font-medium uppercase text-foreground/42">Industrial track</p>
          </div>
        </div>
        <span className="rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{useCase.status}</span>
      </div>

      <CaseLine label="Industrial problem" value={useCase.problem} />
      <CaseLine label="Approach studied" value={useCase.approach} />
      <CaseLine label="Partners" value={useCase.partners} />
    </article>
  );
}

function CaseLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-white/10 py-3 first:border-t-0 first:pt-0">
      <p className="text-xs font-medium uppercase text-foreground/38">{label}</p>
      <p className="mt-1 text-sm leading-6 text-foreground/62">{value}</p>
    </div>
  );
}

function ModelPillar({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <Icon size={18} className="text-primary" />
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-foreground/52">{text}</p>
    </div>
  );
}

function PlatformModuleCard({ module, onNavigate }: { module: PlatformModule; onNavigate: (route: string) => void }) {
  const isAvailable = module.status === "Available" && Boolean(module.route);
  return (
    <article
      className={[
        "flex min-h-64 flex-col justify-between rounded-md border p-4",
        isAvailable ? "cursor-pointer border-primary/30 bg-primary/[0.08]" : "border-white/10 bg-white/[0.04]",
      ].join(" ")}
      onClick={() => {
        if (isAvailable && module.route) {
          onNavigate(module.route);
        }
      }}
    >
      <div>
        <span
          className={[
            "rounded-md border px-2.5 py-1 text-xs font-semibold",
            module.status === "Available"
              ? "border-primary/35 bg-primary/10 text-primary"
              : module.status === "In development"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                : "border-white/10 bg-white/[0.045] text-foreground/48",
          ].join(" ")}
        >
          {module.status}
        </span>
        <h3 className="mt-5 text-lg font-semibold text-white">{module.name}</h3>
        <p className="mt-3 text-sm leading-6 text-foreground/58">{module.description}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {module.tags.map((tag) => (
          <span key={tag} className="rounded-md border border-white/10 bg-black/15 px-2 py-1 text-xs text-foreground/50">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
