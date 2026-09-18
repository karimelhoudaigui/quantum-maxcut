"""
Physical and Hardware Constraint Validation for Quantum Annealing Schedules.

This module ensures that annealing parameters respect physical constraints:
- Maximum coupling amplitudes
- Timing constraints
- Geometric/blockade constraints
- Total sequence duration limits
"""

from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional
import numpy as np

from quantum_maxcut.scheduler_manager import AnnealingScheduleConfig


@dataclass
class ValidationResult:
    """Result of parameter validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    
    def add_error(self, msg: str):
        """Add validation error."""
        self.errors.append(msg)
        self.is_valid = False
    
    def add_warning(self, msg: str):
        """Add validation warning."""
        self.warnings.append(msg)
    
    def __str__(self) -> str:
        """Pretty print validation result."""
        lines = []
        
        if self.is_valid:
            lines.append("✓ VALID - All constraints satisfied")
        else:
            lines.append("✗ INVALID - Constraints violated:")
            for err in self.errors:
                lines.append(f"  ✗ {err}")
        
        if self.warnings:
            lines.append("\nWarnings:")
            for warn in self.warnings:
                lines.append(f"  ⚠ {warn}")
        
        return "\n".join(lines)


class ScheduleValidator:
    """
    Comprehensive validator for annealing schedules.
    
    Checks:
    1. Amplitude constraints (omega_prep, omega_peak ≤ max_amplitude)
    2. Duration constraints (all durations ≥ min_duration)
    3. Total duration (prep + rise + hold + fall ≤ max_total_duration)
    4. Timing consistency (no negative durations)
    5. Detuning sweep feasibility
    6. Blockade geometry hint (warn if too dense)
    """
    
    def __init__(self, config: AnnealingScheduleConfig):
        self.config = config
    
    def validate(self) -> ValidationResult:
        """Execute full validation suite."""
        result = ValidationResult(is_valid=True, errors=[], warnings=[])
        
        # Check each constraint category
        self._check_amplitudes(result)
        self._check_durations(result)
        self._check_total_duration(result)
        self._check_detuning(result)
        self._check_geometry(result)
        
        return result
    
    def _check_amplitudes(self, result: ValidationResult):
        """Validate amplitude parameters."""
        max_amp = self.config.max_amplitude
        
        if self.config.omega_prep < 0:
            result.add_error(f"omega_prep must be ≥ 0, got {self.config.omega_prep}")
        elif self.config.omega_prep > max_amp:
            result.add_error(
                f"omega_prep ({self.config.omega_prep} MHz) "
                f"exceeds max_amplitude ({max_amp} MHz)"
            )
        
        if self.config.omega_peak < 0:
            result.add_error(f"omega_peak must be ≥ 0, got {self.config.omega_peak}")
        elif self.config.omega_peak > max_amp:
            result.add_error(
                f"omega_peak ({self.config.omega_peak} MHz) "
                f"exceeds max_amplitude ({max_amp} MHz)"
            )
        
        if self.config.omega_peak < 0.5:
            result.add_warning(
                f"omega_peak is very small ({self.config.omega_peak} MHz), "
                "consider increasing for stronger coupling"
            )
    
    def _check_durations(self, result: ValidationResult):
        """Validate individual pulse durations."""
        min_dur = self.config.min_duration
        
        durations = {
            'prep_duration': self.config.prep_duration,
            'rise_duration': self.config.rise_duration,
            'hold_duration': self.config.hold_duration,
            'fall_duration': self.config.fall_duration,
        }
        
        for name, dur in durations.items():
            if dur < 0:
                result.add_error(f"{name} cannot be negative, got {dur} ns")
            elif dur > 0 and dur < min_dur:
                result.add_error(
                    f"{name} ({dur} ns) < minimum ({min_dur} ns)"
                )
    
    def _check_total_duration(self, result: ValidationResult):
        """Validate total sequence duration."""
        total = self.config.total_duration()
        max_total = self.config.max_total_duration_ns
        
        if total > max_total:
            result.add_error(
                f"Total duration ({total} ns) exceeds max ({max_total} ns)"
            )
        
        if total > 0.8 * max_total:
            result.add_warning(
                f"Total duration ({total} ns) is close to limit ({max_total} ns)"
            )
    
    def _check_detuning(self, result: ValidationResult):
        """Validate detuning sweep parameters."""
        # Check if detuning sweep is reasonable
        detuning_range = abs(self.config.delta_start - self.config.delta_end)
        
        if detuning_range < 1e-6 and self.config.hold_duration > 100:
            result.add_warning(
                "Detuning sweep is very small - consider using finite delta range "
                "for effective adiabatic evolution"
            )
        
        # Check if delta_hold is within expected range
        delta_values = [
            self.config.delta_start,
            self.config.delta_hold,
            self.config.delta_end,
        ]
        
        if not (-200 < self.config.delta_start < 200):
            result.add_warning(
                f"delta_start ({self.config.delta_start} MHz) is very large"
            )
    
    def _check_geometry(self, result: ValidationResult):
        """Warn about geometric constraints (blockade radius)."""
        # This is a soft warning - geometry will be checked during optimization
        
        if self.config.n_nodes > 8:
            result.add_warning(
                f"Large graph size ({self.config.n_nodes} nodes) - "
                "geometry optimization may take longer"
            )
        
        omega_peak = self.config.omega_peak
        blockade = self.config.blockade_radius_um
        
        if omega_peak > 5.0 and blockade < 3.0:
            result.add_warning(
                f"Strong coupling ({omega_peak} MHz) with small blockade "
                f"({blockade} μm) - geometry may be too constrained"
            )


class PhysicalParameterSweeper:
    """
    Generate systematic parameter sweeps with validation.
    Useful for creating comparison studies.
    """
    
    def __init__(self, base_config: AnnealingScheduleConfig):
        self.base_config = base_config
        self.validator = ScheduleValidator(base_config)
    
    def sweep_omega_peak(
        self,
        omega_min: float = 2.0,
        omega_max: float = 20.0,
        n_steps: int = 10,
    ) -> List[AnnealingScheduleConfig]:
        """Generate configs sweeping omega_peak."""
        configs = []
        for omega in np.linspace(omega_min, omega_max, n_steps):
            cfg = AnnealingScheduleConfig(**self.base_config.to_dict())
            cfg.omega_peak = float(omega)
            
            # Validate before adding
            val = ScheduleValidator(cfg).validate()
            if val.is_valid:
                configs.append(cfg)
        
        return configs
    
    def sweep_hold_duration(
        self,
        duration_min: int = 100,
        duration_max: int = 2000,
        n_steps: int = 10,
    ) -> List[AnnealingScheduleConfig]:
        """Generate configs sweeping hold_duration."""
        configs = []
        for dur in np.linspace(duration_min, duration_max, n_steps):
            cfg = AnnealingScheduleConfig(**self.base_config.to_dict())
            cfg.hold_duration = int(dur)
            
            val = ScheduleValidator(cfg).validate()
            if val.is_valid:
                configs.append(cfg)
        
        return configs
    
    def sweep_fall_duration_adiabatic(
        self,
        duration_min: int = 100,
        duration_max: int = 1000,
        n_steps: int = 10,
    ) -> List[AnnealingScheduleConfig]:
        """
        Generate configs sweeping fall_duration (key parameter for adiabatic evolution).
        Longer fall = slower anneal = potentially better adiabatic following.
        """
        configs = []
        for dur in np.linspace(duration_min, duration_max, n_steps):
            cfg = AnnealingScheduleConfig(**self.base_config.to_dict())
            cfg.fall_duration = int(dur)
            
            val = ScheduleValidator(cfg).validate()
            if val.is_valid:
                configs.append(cfg)
        
        return configs
    
    def sweep_delta_start(
        self,
        delta_min: float = -150.0,
        delta_max: float = -10.0,
        n_steps: int = 10,
    ) -> List[AnnealingScheduleConfig]:
        """
        Generate configs sweeping delta_start (initial detuning).
        This controls the initial energy landscape across the Rydberg-blockade manifold.
        """
        configs = []
        for delta in np.linspace(delta_min, delta_max, n_steps):
            cfg = AnnealingScheduleConfig(**self.base_config.to_dict())
            cfg.delta_start = float(delta)
            
            val = ScheduleValidator(cfg).validate()
            if val.is_valid:
                configs.append(cfg)
        
        return configs
    
    def grid_sweep_2d(
        self,
        param1: str,
        param1_range: Tuple[float, float, int],
        param2: str,
        param2_range: Tuple[float, float, int],
    ) -> List[AnnealingScheduleConfig]:
        """
        Generate 2D grid of configs for parameter study.
        
        Args:
            param1: Parameter name (e.g., 'omega_peak')
            param1_range: (min, max, n_steps)
            param2: Parameter name
            param2_range: (min, max, n_steps)
        
        Returns:
            List of valid configs
        """
        configs = []
        
        p1_min, p1_max, p1_steps = param1_range
        p2_min, p2_max, p2_steps = param2_range
        
        for p1_val in np.linspace(p1_min, p1_max, p1_steps):
            for p2_val in np.linspace(p2_min, p2_max, p2_steps):
                cfg = AnnealingScheduleConfig(**self.base_config.to_dict())
                
                # Set parameters dynamically
                setattr(cfg, param1, float(p1_val) if isinstance(p1_val, np.floating) else int(p1_val))
                setattr(cfg, param2, float(p2_val) if isinstance(p2_val, np.floating) else int(p2_val))
                
                val = ScheduleValidator(cfg).validate()
                if val.is_valid:
                    configs.append(cfg)
        
        return configs


def validate_config(config: AnnealingScheduleConfig) -> ValidationResult:
    """Quick validation function."""
    return ScheduleValidator(config).validate()
