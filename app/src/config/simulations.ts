import { Atom, Boxes, BrainCircuit, FlaskConical, type LucideIcon } from "lucide-react";

export type SimulationStatus = "available" | "coming-soon";

export interface SimulationModule {
  id: string;
  name: string;
  description: string;
  category: string;
  status: SimulationStatus;
  tags: string[];
  route?: string;
  icon: LucideIcon;
  visual: "graph" | "layers";
}

export const simulationModules: SimulationModule[] = [
  {
    id: "maxcut",
    name: "MaxCut Problem",
    description: "Solve graph partitioning problems using quantum and hybrid optimization techniques.",
    category: "Optimization",
    status: "available",
    tags: ["Optimization", "QAOA", "Graph Theory"],
    route: "/simulations/maxcut",
    icon: BrainCircuit,
    visual: "graph",
  },
  {
    id: "ald",
    name: "ALD Simulation",
    description: "Simulate Atomic Layer Deposition processes and explore quantum-enhanced modelling approaches.",
    category: "Materials modelling",
    status: "coming-soon",
    tags: ["Materials", "Simulation", "Coming Soon"],
    icon: FlaskConical,
    visual: "layers",
  },
];

export const futureSimulationModules = [
  { name: "Quantum Chemistry", icon: Atom },
  { name: "Portfolio Optimization", icon: Boxes },
  { name: "Travelling Salesman Problem", icon: BrainCircuit },
  { name: "Molecular Simulation", icon: FlaskConical },
  { name: "PDE Simulation", icon: Boxes },
  { name: "Machine Learning", icon: BrainCircuit },
  { name: "Custom Hamiltonian", icon: Atom },
];
