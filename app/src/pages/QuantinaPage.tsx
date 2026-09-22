import {
  ArrowRight,
  BatteryCharging,
  BookOpen,
  BrainCircuit,
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
  Mail,
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
const quantinaLogoSrc = `${import.meta.env.BASE_URL}media/brand/quantina-logo.png`;
const maisonDuQuantiquePartnersSrc = `${import.meta.env.BASE_URL}media/brand/maison-du-quantique-partners.png`;

const sectionLinks = [
  { id: "project", label: "Overview" },
  { id: "use-cases", label: "Use cases" },
  { id: "method", label: "Method" },
  { id: "ecosystem", label: "Ecosystem" },
  { id: "outputs", label: "Outputs" },
  { id: "join", label: "Team" },
];

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

interface TeamMember {
  name: string;
  role: string;
  affiliation: string;
  email: string;
  photo: string;
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

const teamMembers: TeamMember[] = [
  {
    name: "Yassine Hamoudi",
    role: "HYBQUANT Project Coordinator",
    affiliation: "LaBRI",
    email: "yassine.hamoudi@labri.fr",
    photo: `${import.meta.env.BASE_URL}media/team/yassine-hamoudi.jpg`,
  },
  {
    name: "Adrian Tanasa",
    role: "Deputy HYBQUANT Project Coordinator",
    affiliation: "LaBRI",
    email: "adrian.tanasa@labri.fr",
    photo: `${import.meta.env.BASE_URL}media/team/adrian-tanasa.jpg`,
  },
  {
    name: "Karim El Houdaigui",
    role: "HYBQUANT Research Engineer",
    affiliation: "LaBRI",
    email: "karim.el-houdaigui@labri.fr",
    photo: `${import.meta.env.BASE_URL}media/team/karim-el-houdaigui.jpg`,
  },
  {
    name: "Laurent Facq",
    role: "Research Engineer",
    affiliation: "LaBRI",
    email: "Laurent.Facq@math.u-bordeaux.fr",
    photo: `${import.meta.env.BASE_URL}media/team/laurent-facq.jpg`,
  },
  {
    name: "Audrey Durand",
    role: "Regional Initiative Coordinator - Naquidis",
    affiliation: "Institut d'Optique",
    email: "audrey.durand@institutoptique.fr",
    photo: `${import.meta.env.BASE_URL}media/team/audrey-durand.jpg`,
  },
];

export function QuantinaPage({ onNavigate }: QuantinaPageProps) {
  return (
    <main className="min-h-[100svh] overflow-x-clip bg-quantina text-foreground">
      <QuantinaHeader onNavigate={onNavigate} />
      <HeroSection onNavigate={onNavigate} />
      <SectionDock />
      <FlowSection />
      <ProjectSection />
      <UseCasesSection />
      <WorkflowSection />
      <EcosystemSection />
      <DeliverablesSection />
      <JoinSection />
    </main>
  );
}

function SectionDock() {
  const activeSection = useActiveSection();

  return (
    <div className="sticky top-[76px] z-40 border-y border-white/10 bg-[#070b11]/92 px-3 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:top-[92px] sm:px-8">
      <nav aria-label="QuantINA sections" className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto">
        <a href="#top" className="mr-2 flex shrink-0 items-center gap-2 px-2 py-2 text-sm font-semibold text-white">
          <img alt="" aria-hidden="true" className="h-6 w-6 object-contain" src={quantinaLogoSrc} />
          <span className="hidden sm:inline">QuantINA</span>
        </a>
        {sectionLinks.map((item) => {
          const active = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active ? "location" : undefined}
              className={[
                "shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition",
                active ? "bg-primary text-background" : "text-foreground/55 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </a>
          );
        })}
        <a
          href="#join"
          className="ml-auto hidden shrink-0 items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 md:inline-flex"
        >
          Start a project
          <ArrowRight size={14} />
        </a>
      </nav>
    </div>
  );
}

function useActiveSection() {
  const [activeSection, setActiveSection] = useState(sectionLinks[0].id);

  useEffect(() => {
    const sections = sectionLinks.map(({ id }) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    if (!("IntersectionObserver" in window) || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.1, 0.4] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return activeSection;
}

function QuantinaHeader({ onNavigate }: QuantinaPageProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-5 sm:px-8 sm:pt-7 lg:px-12">
      <div className="relative mx-auto flex max-w-7xl items-start justify-between gap-4">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/12 bg-black/25 p-1 shadow-[0_0_34px_hsl(var(--primary)/0.22)] backdrop-blur-2xl">
            <img alt="" aria-hidden="true" className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(255,79,116,0.32)]" src={quantinaLogoSrc} />
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
          <a className="transition hover:text-primary" href="#ecosystem">
            Ecosystem
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
    <section id="project" className="scroll-mt-40 px-5 py-20 sm:px-8 lg:px-10">
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = useCases[selectedIndex];
  const SelectedIcon = selected.icon;

  return (
    <section id="use-cases" className="scroll-mt-40 bg-[#07100f] px-5 py-20 sm:px-8 lg:px-10">
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

        <div className="grid overflow-hidden rounded-lg border border-white/10 bg-[#0b1119]/82 shadow-[0_28px_90px_rgba(0,0,0,0.24)] lg:grid-cols-[0.38fr_0.62fr]">
          <div className="border-b border-white/10 p-2 lg:border-b-0 lg:border-r">
            <div className="flex gap-2 overflow-x-auto lg:grid">
              {useCases.map((useCase, index) => {
                const Icon = useCase.icon;
                const active = selectedIndex === index;
                return (
                  <button
                    key={useCase.title}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={[
                      "flex min-w-[210px] items-center gap-3 rounded-md border px-4 py-3 text-left transition lg:min-w-0",
                      active
                        ? "border-primary/35 bg-primary/10 text-white"
                        : "border-transparent text-foreground/55 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                    ].join(" ")}
                  >
                    <span className={active ? "text-primary" : useCase.accent}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{useCase.title}</span>
                      <span className="mt-1 block text-xs opacity-60">{useCase.status}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <article className="relative min-h-[430px] overflow-hidden p-6 sm:p-8 lg:p-10">
            <div aria-hidden="true" className="absolute right-0 top-0 h-48 w-48 bg-[radial-gradient(circle,rgba(45,212,191,0.12),transparent_68%)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                  <SelectedIcon size={23} />
                </div>
                <span className="rounded-md border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {selected.status}
                </span>
              </div>
              <p className="mt-8 text-xs font-semibold uppercase text-foreground/38">Selected industrial track</p>
              <h3 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{selected.title}</h3>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <CaseLine label="Industrial problem" value={selected.problem} />
                <CaseLine label="Research approach" value={selected.approach} />
              </div>
              <div className="mt-auto border-t border-white/10 pt-6">
                <CaseLine label="Potential partners" value={selected.partners} />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="method" className="scroll-mt-40 px-5 py-20 sm:px-8 lg:px-10">
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

function EcosystemSection() {
  return (
    <section id="ecosystem" className="scroll-mt-40 border-y border-white/10 bg-[#090e16] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-md border border-primary/25 bg-primary/10 p-1.5 shadow-[0_0_32px_hsl(var(--primary)/0.15)]">
                <img className="h-full w-full object-contain" src={quantinaLogoSrc} alt="QuantINA" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#ff4f74]">Led by the Maison du Quantique</p>
                <p className="mt-1 text-sm font-medium text-foreground/55">Nouvelle-Aquitaine quantum ecosystem</p>
              </div>
            </div>
            <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              QuantINA is carried by a regional network built for research, transfer and execution.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-foreground/62 lg:justify-self-end">
            The Maison du Quantique brings together universities, national research organisations, laboratories, innovation networks and
            computing infrastructures to turn industrial challenges into rigorous quantum and HPC projects.
          </p>
        </div>

        <div className="grid gap-5 border-b border-white/10 py-8 sm:grid-cols-3">
          {[
            ["15", "institutions and research networks"],
            ["1", "regional coordination hub"],
            ["Research → industry", "a shared transfer pathway"],
          ].map(([value, label]) => (
            <div key={label} className="border-l-2 border-[#ff4f74] pl-4">
              <p className="text-xl font-semibold text-white">{value}</p>
              <p className="mt-1 text-sm text-foreground/48">{label}</p>
            </div>
          ))}
        </div>

        <div className="pt-10">
          <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <p className="text-xs font-semibold uppercase text-foreground/45">The Maison du Quantique partner network</p>
            <p className="text-xs text-foreground/35">Research · innovation · infrastructure · transfer</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/12 bg-[#f4f7f8] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.32)] sm:p-8">
            <img
              alt="Maison du Quantique partner institutions"
              className="mx-auto block h-auto w-full max-w-[1120px] object-contain"
              decoding="async"
              loading="lazy"
              src={maisonDuQuantiquePartnersSrc}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliverablesSection() {
  return (
    <section id="outputs" className="scroll-mt-40 bg-[#07100f] px-5 py-20 sm:px-8 lg:px-10">
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
    <section id="join" className="scroll-mt-40 px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <SectionIntro
            eyebrow="Join QuantINA"
            title="Connect with the QuantINA coordination team."
            text="Companies, researchers and students can enter the program through a coordinated HYBQUANT and regional initiative team."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.email} member={member} />
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

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="group overflow-hidden rounded-md border border-white/10 bg-white/[0.04] transition hover:border-primary/35 hover:bg-white/[0.06]">
      <div className="relative aspect-[1.18] overflow-hidden bg-black/25">
        <img
          alt={`${member.name} portrait`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          decoding="async"
          loading="lazy"
          src={member.photo}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#05070d]/78 via-transparent to-transparent" />
        <span className="absolute bottom-4 left-4 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-xl">
          {member.affiliation}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/72">{member.role}</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{member.name}</h3>
        <a
          href={`mailto:${member.email}`}
          className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium text-foreground/62 transition hover:border-primary/35 hover:text-primary"
        >
          <Mail size={15} className="shrink-0" />
          <span className="truncate">{member.email}</span>
        </a>
      </div>
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
