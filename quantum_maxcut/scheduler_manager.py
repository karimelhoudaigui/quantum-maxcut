"""
AnnealingScheduleManager - Core backend for Hybrid Pulser + SDP + Rounding control.

This module provides:
1. Data classes for schedule configuration
2. Schedule parameter management and validation
3. Integration with backend quantum simulators
4. Export and serialization
"""

from dataclasses import dataclass, asdict, field
from typing import Optional, Dict, Any, List, Tuple
from enum import Enum
import numpy as np
from pathlib import Path
import json
from datetime import datetime


class GraphFamily(str, Enum):
    """Graph family types for benchmarking."""
    RANDOM = "random"
    STAR = "star"
    CYCLE = "cycle"
    GRID = "grid"
    COMPLETE = "complete"
    BIPARTITE = "bipartite"


@dataclass
class AnnealingScheduleConfig:
    """
    Complete annealing schedule configuration for hybrid pipeline.
    
    Waveform structure:
    1. Preparation phase (omega_prep pulse)
    2. Ramp-up (0 → omega_peak over rise_duration)
    3. Hold plateau (omega_peak at hold_duration)
    4. Anneal-down (omega_peak → 0 over fall_duration)
    
    Detuning follows similar structure but with delta parameters.
    """
    # Graph parameters
    n_nodes: int = 4
    graph_family: GraphFamily = GraphFamily.RANDOM
    n_instances: int = 1
    seed: int = 1234
    
    # Annealing schedule parameters (from DEFAULT_PULSE)
    omega_prep: float = 16.33  # MHz, preparation pulse amplitude
    prep_duration: int = 100   # ns
    
    omega_peak: float = 10.0   # MHz, peak Rydberg coupling
    rise_duration: int = 200   # ns, ramp-up duration  
    hold_duration: int = 500   # ns, hold plateau
    fall_duration: int = 200   # ns, anneal down (main cooling phase)
    
    delta_start: float = -80.0  # MHz, initial detuning
    delta_hold: float = 0.0     # MHz, hold detuning
    delta_end: float = 0.0      # MHz, final detuning
    
    # Simulation parameters
    sampling_rate: float = 0.05  # ns^-1
    scale: float = 15.5          # μm, geometric scale
    
    # Hybrid pipeline parameters
    n_roundings: int = 64   # Multiple SDP roundings
    max_iter: int = 500     # Geometry optimization iterations
    tol: float = 1e-5       # Geometry optimization tolerance
    
    # Hardware constraints
    max_total_duration_ns: int = 5000  # Total sequence duration limit
    min_duration: int = 10             # Minimum pulse duration
    max_amplitude: float = 25.0        # Max Rydberg coupling amplitude
    min_spacing_ns: int = 4            # Min spacing between pulses
    
    # Blockade constraint
    c3_coefficient: float = 1.0  # C3 interaction coefficient
    blockade_radius_um: float = 4.5  # Blockade radius
    
    class Config:
        """Allow enum serialization."""
        use_enum_values = True
    
    def __post_init__(self):
        """Validate constraints after initialization."""
        self._validate_basic_constraints()
    
    def _validate_basic_constraints(self):
        """Check basic consistency of parameters."""
        if self.n_nodes < 2:
            raise ValueError(f"n_nodes must be ≥ 2, got {self.n_nodes}")
        if self.n_instances < 1:
            raise ValueError(f"n_instances must be ≥ 1, got {self.n_instances}")
        if self.omega_prep < 0 or self.omega_peak < 0:
            raise ValueError("Amplitudes must be non-negative")
        if self.prep_duration < self.min_duration:
            raise ValueError(f"prep_duration < {self.min_duration} ns")
    
    def total_duration(self) -> int:
        """Total sequence duration in nanoseconds."""
        return (
            self.prep_duration + 
            self.rise_duration + 
            self.hold_duration + 
            self.fall_duration
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return asdict(self)
    
    def to_json(self, filepath: Optional[str] = None) -> str:
        """Serialize to JSON."""
        data = self.to_dict()
        data['graph_family'] = self.graph_family.value
        data['total_duration_ns'] = self.total_duration()
        
        if filepath:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        
        return json.dumps(data, indent=2)
    
    @staticmethod
    def from_json(filepath: str) -> 'AnnealingScheduleConfig':
        """Load from JSON file."""
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Convert graph_family back to enum
        if isinstance(data.get('graph_family'), str):
            data['graph_family'] = GraphFamily(data['graph_family'])
        
        # Remove computed fields
        data.pop('total_duration_ns', None)
        
        return AnnealingScheduleConfig(**data)


@dataclass
class PulserResult:
    """Output from Pulser quantum simulation."""
    ratio_pulser: float
    ratio_proxy_exact: float
    E_pulser_in_qmc: float
    E0_qmc: float
    mapping_error: float
    positions: List[Tuple[float, float]]
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class HybridResult:
    """Output from full hybrid pipeline."""
    ratio_pulser: float
    ratio_product: float
    ratio_hybrid: float
    winner: str  # "pulser" or "rounding"
    
    E_pulser_in_qmc: float
    E_product_in_qmc: float
    E_hybrid_in_qmc: float
    E0_qmc: float
    
    sdp_status: str
    n_roundings_used: int
    best_rounding_seed: int
    
    mapping_error: float
    positions: List[Tuple[float, float]]
    
    schedule_config: AnnealingScheduleConfig = field(default_factory=AnnealingScheduleConfig)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize result."""
        return {
            'ratio_pulser': self.ratio_pulser,
            'ratio_product': self.ratio_product,
            'ratio_hybrid': self.ratio_hybrid,
            'winner': self.winner,
            'E_pulser_in_qmc': self.E_pulser_in_qmc,
            'E_product_in_qmc': self.E_product_in_qmc,
            'E_hybrid_in_qmc': self.E_hybrid_in_qmc,
            'E0_qmc': self.E0_qmc,
            'sdp_status': self.sdp_status,
            'n_roundings_used': self.n_roundings_used,
            'best_rounding_seed': self.best_rounding_seed,
            'mapping_error': self.mapping_error,
            'timestamp': self.timestamp,
            'schedule': self.schedule_config.to_dict() if self.schedule_config else None,
        }


class HybridScheduleRunner:
    """
    High-level runner for the complete hybrid pipeline with a given schedule.
    
    Workflow:
    1. Initialize with AnnealingScheduleConfig
    2. Call run() to execute: geometry → pulser → SDP → rounding
    3. Retrieve results via get_last_result()
    """
    
    def __init__(self, config: AnnealingScheduleConfig):
        self.config = config
        self.results: List[HybridResult] = []
        self._last_result: Optional[HybridResult] = None
    
    def run_on_graph(
        self,
        n: int,
        target_edges: List[Tuple[int, int, float]],
    ) -> HybridResult:
        """
        Execute hybrid pipeline on a single graph instance.
        
        Args:
            n: Number of nodes
            target_edges: List of (i, j, weight) tuples
        
        Returns:
            HybridResult object with all metrics and metadata
        """
        
        # Import here to avoid circular dependencies
        from quantum_hybrid.hybrid_graph_study import evaluate_fixed_hybrid_sequence_on_graph
        
        result_dict = evaluate_fixed_hybrid_sequence_on_graph(
            n=n,
            target_edges=target_edges,
            omega_prep=self.config.omega_prep,
            prep_duration=self.config.prep_duration,
            omega_peak=self.config.omega_peak,
            rise_duration=self.config.rise_duration,
            hold_duration=self.config.hold_duration,
            fall_duration=self.config.fall_duration,
            delta_start=self.config.delta_start,
            delta_hold=self.config.delta_hold,
            delta_end=self.config.delta_end,
            sampling_rate=self.config.sampling_rate,
            scale=self.config.scale,
            n_roundings=self.config.n_roundings,
            seed=self.config.seed,
            max_iter=self.config.max_iter,
            tol=self.config.tol,
        )
        
        result = HybridResult(
            ratio_pulser=float(result_dict['ratio_pulser']),
            ratio_product=float(result_dict['ratio_product_best']),
            ratio_hybrid=float(result_dict['ratio_hybrid']),
            winner=str(result_dict['winner']),
            E_pulser_in_qmc=float(result_dict['E_pulser_in_qmc']),
            E_product_in_qmc=float(result_dict['E_product_best_in_qmc']),
            E_hybrid_in_qmc=float(result_dict['E_hybrid_in_qmc']),
            E0_qmc=0.0,  # Will be set below if available
            sdp_status=str(result_dict['sdp_status']),
            n_roundings_used=int(result_dict['n_roundings']),
            best_rounding_seed=int(result_dict['best_seed']),
            mapping_error=float(result_dict['mapping_error']),
            positions=result_dict['positions'],
            schedule_config=self.config,
        )
        
        self.results.append(result)
        self._last_result = result
        return result
    
    def get_last_result(self) -> Optional[HybridResult]:
        """Get the last computed result."""
        return self._last_result
    
    def get_all_results(self) -> List[HybridResult]:
        """Get all computed results in order."""
        return self.results.copy()
    
    def clear_results(self):
        """Clear all stored results."""
        self.results.clear()
        self._last_result = None


@dataclass 
class ScheduleComparison:
    """Compare two different annealing schedules."""
    config_a: AnnealingScheduleConfig
    config_b: AnnealingScheduleConfig
    
    result_a: HybridResult
    result_b: HybridResult
    
    def gain_ab(self) -> float:
        """Ratio gain: result_b / result_a."""
        if self.result_a.ratio_hybrid == 0:
            return np.nan
        return self.result_b.ratio_hybrid / self.result_a.ratio_hybrid
    
    def delta_ab(self) -> float:
        """Absolute difference in ratio."""
        return self.result_b.ratio_hybrid - self.result_a.ratio_hybrid
    
    def winner(self) -> str:
        """Which schedule is better?"""
        if self.result_a.ratio_hybrid > self.result_b.ratio_hybrid:
            return "Schedule A"
        elif self.result_b.ratio_hybrid > self.result_a.ratio_hybrid:
            return "Schedule B"
        else:
            return "Tie"
    
    def to_dict(self) -> Dict[str, Any]:
        """Comparison as dictionary."""
        return {
            'config_a': self.config_a.to_dict(),
            'config_b': self.config_b.to_dict(),
            'result_a': self.result_a.to_dict(),
            'result_b': self.result_b.to_dict(),
            'gain_ab': float(self.gain_ab()),
            'delta_ab': float(self.delta_ab()),
            'winner': self.winner(),
        }
