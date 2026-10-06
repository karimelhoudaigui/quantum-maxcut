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
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

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
    accent: "text-sky-300",
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
    affiliation: "IMB",
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
    <main className="quantina-theme min-h-[100svh] overflow-x-clip bg-[#0E1116] text-foreground">
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
    <div className="sticky top-[65px] z-40 border-y border-[#D0D6DC] bg-[#FAFAFA] px-3 py-2.5 text-[#111318] sm:px-8">
      <nav aria-label="QuantINA sections" className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto">
        <a href="#top" className="mr-2 flex shrink-0 items-center gap-2 px-2 py-2 text-sm font-semibold text-[#111318]">
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
                active ? "bg-[#41D8BA] text-[#0E1116]" : "text-[#5F6873] hover:bg-[#E7EBEE] hover:text-[#111318]",
              ].join(" ")}
            >
              {item.label}
            </a>
          );
        })}
        <a
          href="#join"
          className="ml-auto hidden shrink-0 items-center gap-2 rounded-sm border border-[#32B3A2] px-3 py-2 text-xs font-semibold text-[#238E82] transition hover:bg-[#41D8BA] hover:text-[#0E1116] md:inline-flex"
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
    if (sections.length === 0) return;

    let animationFrame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const firstSection = sections[0];
        if (window.scrollY < firstSection.offsetTop - window.innerHeight * 0.2) {
          setActiveSection(firstSection.id);
          return;
        }

        const marker = window.scrollY + 180;
        const current = sections.reduce((active, section) => (section.offsetTop <= marker ? section.id : active), firstSection.id);
        setActiveSection(current);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return activeSection;
}

function QuantinaHeader({ onNavigate }: QuantinaPageProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#29323D] bg-[#0E1116] px-5 sm:px-8 lg:px-12">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <a href="#top" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[#41D8BA] bg-[#FAFAFA] p-1">
            <img alt="" aria-hidden="true" className="h-full w-full object-contain" src={quantinaLogoSrc} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">QuantINA</p>
            <p className="hidden truncate text-xs text-foreground/50 sm:block">Quantum Industrial Networks in Nouvelle-Aquitaine</p>
          </div>
        </a>

        <a
          href="#project"
          className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-[#29323D] text-white/70 transition hover:border-[#41D8BA] hover:bg-[#41D8BA] hover:text-[#0E1116] xl:hidden"
          title="Program brief"
        >
          <HelpCircle size={18} strokeWidth={1.5} />
        </a>

        <nav className="hidden items-center gap-6 text-xs font-medium text-white/65 xl:flex">
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#29323D] text-white/75 transition hover:border-[#41D8BA] hover:bg-[#41D8BA] hover:text-[#0E1116]"
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
    <section id="top" className="relative min-h-[92svh] overflow-hidden bg-[#0E1116] px-5 pb-10 pt-28 sm:px-8 sm:pt-32 lg:px-12 xl:min-h-[94svh]">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex min-h-[calc(92svh-8rem)] w-full max-w-7xl flex-col justify-end xl:min-h-[calc(94svh-9rem)]">
        <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,0.92fr)_minmax(480px,0.78fr)] xl:items-end">
          <div className="min-w-0">
            <AnimatedElement direction="down" delay={120}>
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-sm border border-[#41D8BA] bg-[#181D25] px-3 py-2 text-xs font-semibold text-[#41D8BA] sm:text-sm">
                <CircuitBoard size={16} className="shrink-0" />
                Regional quantum technology transfer program
              </div>
            </AnimatedElement>

            <AnimatedElement direction="up" delay={260} className="min-w-0 max-w-full">
              <h1 className="max-w-[22rem] break-words text-4xl font-semibold leading-[0.98] text-white sm:max-w-5xl sm:text-7xl lg:text-[92px]">
                QuantINA
                <span className="mt-3 block max-w-4xl text-3xl leading-[1.04] text-[#ECF4F4]/82 sm:text-5xl lg:text-[58px]">
                  Quantum Industrial <span className="block sm:inline">Networks</span>
                  <span className="block">in Nouvelle-Aquitaine</span>
                </span>
              </h1>
            </AnimatedElement>

            <AnimatedElement direction="up" delay={430} className="min-w-0 max-w-full">
              <p className="mt-7 max-w-[22rem] text-2xl font-medium leading-9 text-[#41D8BA] sm:max-w-3xl sm:text-3xl">
                From industrial use cases to quantum experimentation.
              </p>
              <p className="mt-5 max-w-[22rem] text-base leading-8 text-white/68 sm:max-w-3xl sm:text-lg">
                A program led by the Maison du Quantique de Nouvelle-Aquitaine to connect companies, researchers and engineers around
                concrete industrial use cases in quantum, hybrid and HPC computing.
              </p>
            </AnimatedElement>

            <AnimatedElement direction="up" delay={620}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#use-cases"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#41D8BA] px-5 py-3 text-sm font-semibold text-[#0E1116] transition hover:bg-[#58DCC3] sm:w-auto"
                >
                  Explore use cases
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#join"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-[#29323D] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#41D8BA] hover:text-[#41D8BA] sm:w-auto"
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
  const qubits = [
    [108, 172],
    [238, 172],
    [368, 172],
    [498, 172],
    [628, 172],
    [108, 342],
    [238, 342],
    [368, 342],
    [498, 342],
    [628, 342],
    [108, 512],
    [238, 512],
    [368, 512],
    [498, 512],
    [628, 512],
  ];

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 bg-[#0E1116]" />
      <svg
        aria-hidden="true"
        className="quantina-quantum-field absolute -right-[22rem] top-12 h-[86%] w-auto min-w-[760px] sm:-right-64 lg:-right-20 xl:right-2"
        viewBox="0 0 760 680"
      >
        <g fill="none" stroke="#29323D" strokeWidth="1">
          <path d="M108 172H628M108 342H628M108 512H628" />
          <path d="M108 172V512M238 172V512M368 172V512M498 172V512M628 172V512" />
          <circle cx="368" cy="342" r="242" />
          <circle cx="368" cy="342" r="178" />
          <path d="M126 342C194 210 286 138 368 138C450 138 542 210 610 342C542 474 450 546 368 546C286 546 194 474 126 342Z" />
        </g>

        <path className="quantina-phase-path" d="M70 262C170 82 276 590 382 262C472 -16 566 528 690 220" />
        <path className="quantina-phase-path quantina-phase-path-delayed" d="M70 426C186 650 280 124 388 426C492 716 570 196 690 470" />

        <g>
          {qubits.map(([cx, cy], index) => (
            <g key={`${cx}-${cy}`} className={`quantina-qubit quantina-qubit-${(index % 5) + 1}`}>
              <circle cx={cx} cy={cy} r="12" fill="#0E1116" stroke="#41D8BA" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="4" fill={index % 4 === 0 ? "#7DD3FC" : "#41D8BA"} />
            </g>
          ))}
        </g>

        <g className="quantina-state-ring" fill="none" stroke="#58DCC3" strokeWidth="2">
          <ellipse cx="368" cy="342" rx="86" ry="196" transform="rotate(28 368 342)" />
          <ellipse cx="368" cy="342" rx="86" ry="196" transform="rotate(-28 368 342)" />
        </g>

        <g className="quantina-measurement" fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="14" fontWeight="700">
          <rect x="344" y="318" width="48" height="48" fill="#181D25" stroke="#7DD3FC" />
          <text x="368" y="348" fill="#ECF4F4" textAnchor="middle">H</text>
          <text x="92" y="145" fill="#58DCC3">|0&gt;</text>
          <text x="612" y="548" fill="#7DD3FC">|1&gt;</text>
        </g>
      </svg>
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-1.5 w-[52%] bg-[#41D8BA]" />
      <div aria-hidden="true" className="absolute bottom-0 left-[52%] h-1.5 w-[30%] bg-[#7DD3FC]" />
      <div aria-hidden="true" className="absolute bottom-0 right-0 h-1.5 w-[18%] bg-[#FF5A6F]" />
    </>
  );
}

function HeroTransferCard() {
  const activeTracks = 5;
  const nodes = ["Challenge", "Model", "Baseline", "Quantum", "Decision"];

  return (
    <AnimatedElement direction="right" delay={520}>
      <div className="relative h-[300px] overflow-hidden rounded-sm border border-[#29323D] bg-[#181D25]">
        <div className="relative z-10 flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-foreground/42">Transfer engine</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Industrial readiness map</h2>
            </div>
            <span className="rounded-sm bg-[#34D399] px-3 py-1.5 text-xs font-semibold text-[#0E1116]">Live method</span>
          </div>

          <div>
            <div className="flex items-end gap-4">
              <p className="font-mono text-[78px] font-semibold leading-[0.82] text-[#41D8BA] tabular-nums">{activeTracks}</p>
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
              <div key={node} className="min-w-0 border-t border-white/25 pt-2">
                <p className="font-mono text-xs font-semibold text-[#7DD3FC]">{String(index + 1).padStart(2, "0")}</p>
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
            "group min-h-[132px] rounded-sm border-2 p-4 text-left transition-all duration-300",
            expanded ? "border-[#FBBF24] bg-[#FBBF24] text-[#0E1116]" : "border-[#29323D] bg-[#181D25] text-white hover:border-[#FBBF24]",
          ].join(" ")}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          onClick={() => setExpanded((value) => !value)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold">Benchmark discipline</p>
              <p className={["mt-1 text-xs", expanded ? "text-[#0E1116]/65" : "text-white/55"].join(" ")}>Evidence first</p>
            </div>
            <span className={["flex h-8 w-8 items-center justify-center rounded-sm", expanded ? "bg-[#0E1116] text-[#FBBF24]" : "bg-[#29323D] text-[#7DD3FC]"].join(" ")}>
              <Gauge size={15} />
            </span>
          </div>
          {expanded ? (
            <p className="mt-4 text-sm leading-6 text-[#0E1116]/72">
              No quantum advantage claim before baselines and benchmark evidence are explicit.
            </p>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="group min-h-[132px] rounded-sm border border-[#41D8BA] bg-[#41D8BA] p-4 text-left text-[#0E1116] transition hover:bg-[#58DCC3]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold">Simulation platform</p>
              <p className="mt-1 text-xs text-[#0E1116]/65">All simulations and demonstrators</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#0E1116] text-[#41D8BA]">
              <ArrowRight size={15} />
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#0E1116]/70">Open the first working module.</p>
        </button>
      </div>
    </AnimatedElement>
  );
}

function HeroSignalCard({ icon: Icon, title, value, note }: { icon: LucideIcon; title: string; value: string; note: string }) {
  return (
    <article className="min-h-[132px] rounded-sm border border-[#29323D] bg-[#181D25] p-4 text-[#ECF4F4] transition hover:-translate-y-0.5 hover:border-[#41D8BA]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{title}</p>
          <p className="mt-1 text-xs text-[#ECF4F4]/55">{note}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#29323D] text-[#41D8BA]">
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-6 text-2xl font-semibold leading-none">{value}</p>
    </article>
  );
}

function HeroWorkflowTicker() {
  const steps = ["Identify", "Formalize", "Recruit", "Simulate", "Benchmark", "Publish", "Industrialize"];

  return (
    <AnimatedElement direction="up" delay={860} className="mt-9 hidden max-w-3xl sm:block">
      <div className="inline-flex items-center rounded-sm border border-[#29323D] px-4 py-2 text-xs font-semibold tracking-wide text-[#41D8BA]">
        Evidence-first quantum transfer
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          {steps.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 bg-[#7DD3FC]" />
              <span className="whitespace-nowrap text-xs font-semibold uppercase text-white/58">{step}</span>
            </div>
          ))}
      </div>
    </AnimatedElement>
  );
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
  return (
    <div
      className={`quantina-enter quantina-enter-${direction} ${className}`}
      style={{
        animationDelay: `${delay}ms`,
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
    <section className="border-y border-[#32B3A2] bg-[#41D8BA] px-5 py-12 text-[#0E1116] sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase text-[#155E56]">Operating logic</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#0E1116]">From industrial challenges to quantum experiments.</h2>
        </div>
        <div className="grid border-t border-black/25 md:grid-cols-5 md:border-l md:border-t-0">
          {flow.map(({ title, icon: Icon }, index) => (
            <div key={title} className="relative border-b border-black/25 p-4 md:border-b-0 md:border-r">
              <Icon size={18} className="text-[#155E56]" />
              <p className="mt-4 text-sm font-semibold leading-5 text-[#0E1116]">{title}</p>
              {index < flow.length - 1 ? (
                <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 bg-[#41D8BA] text-[#155E56] md:block" size={18} />
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
    <section id="project" className="scroll-mt-40 bg-[#FAFAFA] px-5 py-24 text-[#111318] sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionIntro
          tone="light"
          eyebrow="The project"
          title="A regional experimentation program for quantum technologies in industry."
          text="QuantINA exists to test real industrial problems with research-grade methodology, strong classical baselines and clear decisions about what quantum, hybrid or quantum-inspired methods can actually bring."
        />

        <div className="grid gap-4">
          {projectPrinciples.map((item) => (
            <ProgramCard key={item.title} item={item} tone="light" />
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
    <section id="use-cases" className="scroll-mt-40 bg-[#0E1116] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <SectionIntro
            eyebrow="Use cases"
            title="Industrial problems studied through a rigorous quantum and HPC lens."
            text="Each case starts with the industrial constraint, then moves through modelling, baseline selection, algorithmic exploration and documented benchmarking."
          />
          <div className="rounded-sm bg-[#FBBF24] px-4 py-3 text-sm font-semibold text-[#0E1116]">
            No quantum advantage claim. Evidence first.
          </div>
        </div>

        <div className="grid overflow-hidden rounded-sm border border-[#29323D] bg-[#181D25] lg:grid-cols-[0.38fr_0.62fr]">
          <div className="border-b border-white/15 p-2 lg:border-b-0 lg:border-r">
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
                      "flex min-w-[210px] items-center gap-3 rounded-sm border-l-4 px-4 py-3 text-left transition lg:min-w-0",
                      active
                        ? "border-[#41D8BA] bg-[#29323D] text-white"
                        : "border-transparent text-white/55 hover:border-white/30 hover:bg-white/[0.035] hover:text-white",
                    ].join(" ")}
                  >
                    <span className={active ? "text-[#41D8BA]" : useCase.accent}>
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

          <article className="relative min-h-[430px] overflow-hidden border-t-4 border-[#41D8BA] p-6 sm:p-8 lg:p-10">
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#41D8BA] text-[#0E1116]">
                  <SelectedIcon size={23} />
                </div>
                <span className="rounded-sm bg-[#FBBF24] px-3 py-1.5 text-xs font-semibold text-[#0E1116]">
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
    <section id="method" className="scroll-mt-40 border-y border-[#29323D] bg-[#181D25] px-5 py-24 sm:px-8 lg:px-10">
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
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#41D8BA] font-mono text-sm font-semibold text-[#0E1116]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="border-b border-white/35 px-4 py-3">
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
    <section id="ecosystem" className="scroll-mt-40 border-y border-[#D0D6DC] bg-[#E7EBEE] px-5 py-24 text-[#111318] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-black/15 pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-sm border border-[#41D8BA] bg-white p-1.5">
                <img className="h-full w-full object-contain" src={quantinaLogoSrc} alt="QuantINA" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#FF5A6F]">Led by the Maison du Quantique</p>
                <p className="mt-1 text-sm font-medium text-[#5f5b68]">Nouvelle-Aquitaine quantum ecosystem</p>
              </div>
            </div>
            <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-[#111318] sm:text-5xl">
              QuantINA is carried by a regional network built for research, transfer and execution.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-[#5f5b68] lg:justify-self-end">
            The Maison du Quantique brings together universities, national research organisations, laboratories, innovation networks and
            computing infrastructures to turn industrial challenges into rigorous quantum and HPC projects.
          </p>
        </div>

        <div className="grid gap-5 border-b border-black/15 py-8 sm:grid-cols-3">
          {[
            ["15", "institutions and research networks"],
            ["1", "regional coordination hub"],
            ["Research → industry", "a shared transfer pathway"],
          ].map(([value, label]) => (
            <div key={label} className="border-l-2 border-[#FF5A6F] pl-4">
              <p className="text-xl font-semibold text-[#111318]">{value}</p>
              <p className="mt-1 text-sm text-[#5f5b68]">{label}</p>
            </div>
          ))}
        </div>

        <div className="pt-10">
          <div className="mb-7 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <p className="text-xs font-semibold uppercase text-[#5f5b68]">The Maison du Quantique partner network</p>
            <p className="text-xs text-[#5f5b68]">Research · innovation · infrastructure · transfer</p>
          </div>
          <div className="overflow-hidden rounded-sm border border-black/15 bg-white p-4 sm:p-8">
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
    <section id="outputs" className="scroll-mt-40 bg-[#0E1116] px-5 py-24 sm:px-8 lg:px-10">
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
    <section id="join" className="scroll-mt-40 bg-[#FAFAFA] px-5 py-24 text-[#111318] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <SectionIntro
            tone="light"
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

function SectionIntro({
  eyebrow,
  title,
  text,
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  text: string;
  tone?: "dark" | "light";
}) {
  const isLight = tone === "light";

  return (
    <div className="max-w-3xl">
      <p className={isLight ? "text-sm font-medium uppercase text-[#238E82]" : "text-sm font-medium uppercase text-[#41D8BA]"}>{eyebrow}</p>
      <h2 className={isLight ? "mt-2 text-3xl font-semibold leading-tight text-[#111318] sm:text-4xl" : "mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl"}>
        {title}
      </h2>
      <p className={isLight ? "mt-4 text-sm leading-7 text-[#5f5b68] sm:text-base" : "mt-4 text-sm leading-7 text-white/62 sm:text-base"}>
        {text}
      </p>
    </div>
  );
}

function ProgramCard({ item, tone = "dark" }: { item: ProgramItem; tone?: "dark" | "light" }) {
  const Icon = item.icon;
  const isLight = tone === "light";

  return (
    <article className={isLight ? "border-t border-black/20 py-5" : "border-t border-white/20 py-5"}>
      <Icon size={20} className={isLight ? "text-[#238E82]" : "text-[#7DD3FC]"} />
      <h3 className={isLight ? "mt-5 text-lg font-semibold text-[#111318]" : "mt-5 text-lg font-semibold text-white"}>{item.title}</h3>
      <p className={isLight ? "mt-3 text-sm leading-6 text-[#5f5b68]" : "mt-3 text-sm leading-6 text-white/58"}>{item.text}</p>
    </article>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="group overflow-hidden rounded-sm border border-[#D0D6DC] bg-white transition hover:-translate-y-0.5 hover:border-[#41D8BA]">
      <div className="relative aspect-[1.18] overflow-hidden bg-[#E7EBEE]">
        <img
          alt={`${member.name} portrait`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          decoding="async"
          loading="lazy"
          src={member.photo}
        />
        <span className="absolute bottom-4 left-4 rounded-sm bg-[#41D8BA] px-3 py-1 text-xs font-semibold text-[#0E1116]">
          {member.affiliation}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#238E82]">{member.role}</p>
        <h3 className="mt-2 text-xl font-semibold text-[#111318]">{member.name}</h3>
        <a
          href={`mailto:${member.email}`}
          className="mt-4 inline-flex max-w-full items-center gap-2 rounded-sm border border-[#D0D6DC] px-3 py-2 text-sm font-medium text-[#5F6873] transition hover:border-[#41D8BA] hover:text-[#238E82]"
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
    <div className="border-t border-white/40 py-4">
      <Icon size={18} className="text-[#7DD3FC]" />
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-white/60">{text}</p>
    </div>
  );
}
