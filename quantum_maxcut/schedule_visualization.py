"""
Schedule Visualization - Interactive plots and graphics for annealing schedules.

Features:
- Real-time Omega(t) and Delta(t) plots
- Schedule comparison charts
- Result dashboards
- Export to PNG/SVG for reports
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path

from quantum_maxcut.scheduler_manager import (
    AnnealingScheduleConfig,
    HybridResult,
    ScheduleComparison,
)


class SchedulePlotter:
    """Plot annealing waveforms Omega(t) and Delta(t)."""
    
    def __init__(self, figsize: Tuple[int, int] = (14, 5)):
        self.figsize = figsize
    
    def plot_waveform(
        self,
        config: AnnealingScheduleConfig,
        save_path: Optional[str] = None,
        show: bool = True,
    ) -> plt.Figure:
        """
        Plot omega(t) and delta(t) schedules side-by-side.
        
        Returns:
            matplotlib Figure object
        """
        fig, axes = plt.subplots(1, 2, figsize=self.figsize, dpi=150)
        
        # Build time arrays
        t_prep = np.linspace(0, config.prep_duration, 50)
        t_rise = np.linspace(0, config.rise_duration, 50) + config.prep_duration
        t_hold = np.linspace(0, config.hold_duration, 50) + config.prep_duration + config.rise_duration
        t_fall = np.linspace(
            0,
            config.fall_duration,
            50
        ) + config.prep_duration + config.rise_duration + config.hold_duration
        
        # === LEFT: Omega(t) ===
        ax = axes[0]
        
        # Preparation pulse
        omega_prep_vals = np.ones_like(t_prep) * config.omega_prep
        ax.plot(t_prep, omega_prep_vals, 'b-', linewidth=2.5, label='Prep')
        
        # Ramp-up
        omega_rise_vals = np.linspace(0, config.omega_peak, len(t_rise))
        ax.plot(t_rise, omega_rise_vals, 'g-', linewidth=2.5, label='Ramp-up')
        
        # Hold
        omega_hold_vals = np.ones_like(t_hold) * config.omega_peak
        ax.plot(t_hold, omega_hold_vals, 'r-', linewidth=2.5, label='Hold')
        
        # Anneal down (main cooling phase)
        omega_fall_vals = np.linspace(config.omega_peak, 0, len(t_fall))
        ax.plot(t_fall, omega_fall_vals, 'm-', linewidth=2.5, label='Anneal-down')
        
        ax.set_xlabel('Time (ns)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Rydberg Coupling Ω(t) [MHz]', fontsize=12, fontweight='bold')
        ax.set_title('Rydberg Coupling Waveform', fontsize=13, fontweight='bold')
        ax.grid(True, alpha=0.3)
        ax.legend(loc='upper right', fontsize=10)
        ax.set_xlim(0, config.total_duration())
        ax.set_ylim(-0.5, config.omega_peak * 1.1)
        
        # === RIGHT: Delta(t) ===
        ax = axes[1]
        
        # Preparation phase: delta ~ 0 (off-resonant)
        delta_prep_vals = np.zeros_like(t_prep)
        ax.plot(t_prep, delta_prep_vals, 'b-', linewidth=2.5, label='Prep')
        
        # Ramp-up: delta ~ constant (preparing)
        delta_rise_vals = np.ones_like(t_rise) * config.delta_start
        ax.plot(t_rise, delta_rise_vals, 'g-', linewidth=2.5, label='Ramp-up')
        
        # Hold: transition towards hold value
        delta_hold_vals = np.linspace(config.delta_start, config.delta_hold, len(t_hold))
        ax.plot(t_hold, delta_hold_vals, 'r-', linewidth=2.5, label='Hold')
        
        # Fall: sweep to final detuning
        delta_fall_vals = np.linspace(config.delta_hold, config.delta_end, len(t_fall))
        ax.plot(t_fall, delta_fall_vals, 'm-', linewidth=2.5, label='Anneal-down')
        
        ax.set_xlabel('Time (ns)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Detuning Δ(t) [MHz]', fontsize=12, fontweight='bold')
        ax.set_title('Detuning Waveform', fontsize=13, fontweight='bold')
        ax.grid(True, alpha=0.3)
        ax.legend(loc='best', fontsize=10)
        ax.set_xlim(0, config.total_duration())
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"✓ Schedule plot saved to {save_path}")
        
        if show:
            plt.show()
        
        return fig
    
    def plot_comparison(
        self,
        config_a: AnnealingScheduleConfig,
        config_b: AnnealingScheduleConfig,
        labels: Tuple[str, str] = ("Schedule A", "Schedule B"),
        save_path: Optional[str] = None,
        show: bool = True,
    ) -> plt.Figure:
        """
        Compare two schedule waveforms side-by-side.
        
        Returns:
            matplotlib Figure object
        """
        fig, axes = plt.subplots(2, 2, figsize=(15, 10), dpi=150)
        
        configs = [config_a, config_b]
        
        for col_idx, config in enumerate(configs):
            label = labels[col_idx]
            
            # TIME ARRAYS
            t_prep = np.linspace(0, config.prep_duration, 30)
            t_rise = np.linspace(0, config.rise_duration, 30) + config.prep_duration
            t_hold = np.linspace(0, config.hold_duration, 30) + config.prep_duration + config.rise_duration
            t_fall = (
                np.linspace(0, config.fall_duration, 30)
                + config.prep_duration + config.rise_duration + config.hold_duration
            )
            
            # === OMEGA PLOT ===
            ax = axes[0, col_idx]
            
            omega_prep = np.ones_like(t_prep) * config.omega_prep
            omega_rise = np.linspace(0, config.omega_peak, len(t_rise))
            omega_hold = np.ones_like(t_hold) * config.omega_peak
            omega_fall = np.linspace(config.omega_peak, 0, len(t_fall))
            
            ax.plot(t_prep, omega_prep, 'b-', linewidth=2, marker='o', markersize=3)
            ax.plot(t_rise, omega_rise, 'g-', linewidth=2, marker='s', markersize=3)
            ax.plot(t_hold, omega_hold, 'r-', linewidth=2, marker='^', markersize=3)
            ax.plot(t_fall, omega_fall, 'm-', linewidth=2, marker='v', markersize=3)
            
            ax.set_ylabel('Ω(t) [MHz]', fontsize=11, fontweight='bold')
            ax.set_title(f'{label} - Rydberg Coupling', fontsize=12, fontweight='bold')
            ax.grid(True, alpha=0.3)
            ax.set_xlim(0, config.total_duration())
            
            # === DELTA PLOT ===
            ax = axes[1, col_idx]
            
            delta_prep = np.zeros_like(t_prep)
            delta_rise = np.ones_like(t_rise) * config.delta_start
            delta_hold = np.linspace(config.delta_start, config.delta_hold, len(t_hold))
            delta_fall = np.linspace(config.delta_hold, config.delta_end, len(t_fall))
            
            ax.plot(t_prep, delta_prep, 'b-', linewidth=2, marker='o', markersize=3)
            ax.plot(t_rise, delta_rise, 'g-', linewidth=2, marker='s', markersize=3)
            ax.plot(t_hold, delta_hold, 'r-', linewidth=2, marker='^', markersize=3)
            ax.plot(t_fall, delta_fall, 'm-', linewidth=2, marker='v', markersize=3)
            
            ax.set_xlabel('Time (ns)', fontsize=11, fontweight='bold')
            ax.set_ylabel('Δ(t) [MHz]', fontsize=11, fontweight='bold')
            ax.set_title(f'{label} - Detuning', fontsize=12, fontweight='bold')
            ax.grid(True, alpha=0.3)
            ax.set_xlim(0, config.total_duration())
        
        plt.suptitle(
            'Annealing Schedule Comparison',
            fontsize=14,
            fontweight='bold',
            y=0.995
        )
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"✓ Comparison plot saved to {save_path}")
        
        if show:
            plt.show()
        
        return fig


class ResultDashboard:
    """Visualize hybrid pipeline results."""
    
    @staticmethod
    def plot_ratio_comparison(
        results: List[HybridResult],
        labels: Optional[List[str]] = None,
        save_path: Optional[str] = None,
        show: bool = True,
    ) -> plt.Figure:
        """
        Compare ratio_pulser, ratio_product, and ratio_hybrid across multiple results.
        
        Args:
            results: List of HybridResult objects
            labels: Optional labels for each result (defaults to indices)
            save_path: Optional path to save figure
            show: Whether to display the plot
        
        Returns:
            matplotlib Figure
        """
        if not results:
            raise ValueError("No results to plot")
        
        if labels is None:
            labels = [f"Run {i+1}" for i in range(len(results))]
        
        n_results = len(results)
        x = np.arange(n_results)
        width = 0.25
        
        pulser_ratios = [r.ratio_pulser for r in results]
        product_ratios = [r.ratio_product for r in results]
        hybrid_ratios = [r.ratio_hybrid for r in results]
        
        fig, ax = plt.subplots(figsize=(12, 6), dpi=150)
        
        bars1 = ax.bar(x - width, pulser_ratios, width, label='Pulser', color='#2E86AB', alpha=0.8)
        bars2 = ax.bar(x, product_ratios, width, label='Product Rounding', color='#A23B72', alpha=0.8)
        bars3 = ax.bar(x + width, hybrid_ratios, width, label='Hybrid', color='#F18F01', alpha=0.8)
        
        ax.set_ylabel('Approximation Ratio (E/E₀)', fontsize=12, fontweight='bold')
        ax.set_title('Hybrid Pipeline Results Comparison', fontsize=13, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(labels, fontsize=10)
        ax.legend(fontsize=11, loc='upper left')
        ax.grid(True, alpha=0.2, axis='y')
        ax.set_ylim(0, max(max(pulser_ratios), max(product_ratios), max(hybrid_ratios)) * 1.15)
        
        # Add value labels on bars
        for bars in [bars1, bars2, bars3]:
            for bar in bars:
                height = bar.get_height()
                ax.text(
                    bar.get_x() + bar.get_width()/2.,
                    height,
                    f'{height:.3f}',
                    ha='center',
                    va='bottom',
                    fontsize=8,
                )
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"✓ Results plot saved to {save_path}")
        
        if show:
            plt.show()
        
        return fig
    
    @staticmethod
    def plot_metric_line(
        results: List[HybridResult],
        metric: str = 'ratio_hybrid',
        labels: Optional[List[str]] = None,
        save_path: Optional[str] = None,
        show: bool = True,
    ) -> plt.Figure:
        """
        Plot a single metric across multiple results as a line chart.
        
        Args:
            results: List of HybridResult objects
            metric: Metric name ('ratio_pulser', 'ratio_product', 'ratio_hybrid', 'mapping_error', etc.)
            labels: Optional labels
            save_path: Optional path to save
            show: Whether to display
        
        Returns:
            matplotlib Figure
        """
        if not results:
            raise ValueError("No results to plot")
        
        if labels is None:
            labels = [f"Run {i+1}" for i in range(len(results))]
        
        # Extract metric values
        values = []
        for r in results:
            val = getattr(r, metric, None)
            if val is None:
                raise ValueError(f"Metric '{metric}' not found in result")
            values.append(val)
        
        fig, ax = plt.subplots(figsize=(11, 6), dpi=150)
        
        x = np.arange(len(values))
        ax.plot(x, values, 'o-', linewidth=2.5, markersize=8, color='#2E86AB')
        ax.fill_between(x, values, alpha=0.2, color='#2E86AB')
        
        ax.set_ylabel(metric, fontsize=12, fontweight='bold')
        ax.set_title(f'{metric} vs Run', fontsize=13, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(labels, fontsize=10)
        ax.grid(True, alpha=0.3)
        
        # Add value labels
        for xi, yi in zip(x, values):
            ax.text(xi, yi, f'{yi:.4f}', ha='center', va='bottom', fontsize=9)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches='tight')
            print(f"✓ Metric plot saved to {save_path}")
        
        if show:
            plt.show()
        
        return fig


class MetricsCard:
    """Create metric cards for dashboard display (can be used with Streamlit)."""
    
    @staticmethod
    def create_result_card(result: HybridResult) -> Dict[str, Any]:
        """
        Create a card dict for a single result.
        
        Returns:
            Dict with formatted metrics ready for display
        """
        return {
            'ratio_pulser': f"{result.ratio_pulser:.4f}",
            'ratio_product': f"{result.ratio_product:.4f}",
            'ratio_hybrid': f"{result.ratio_hybrid:.4f}",
            'winner': result.winner,
            'mapping_error': f"{result.mapping_error:.4f}",
            'sdp_status': result.sdp_status,
            'n_roundings': result.n_roundings_used,
            'total_duration_ns': result.schedule_config.total_duration() if result.schedule_config else "N/A",
        }
    
    @staticmethod
    def format_schedule(config: AnnealingScheduleConfig) -> Dict[str, Any]:
        """Format schedule config for display card."""
        return {
            'omega_prep': f"{config.omega_prep:.2f} MHz",
            'omega_peak': f"{config.omega_peak:.2f} MHz",
            'prep_duration': f"{config.prep_duration} ns",
            'rise_duration': f"{config.rise_duration} ns",
            'hold_duration': f"{config.hold_duration} ns",
            'fall_duration': f"{config.fall_duration} ns",
            'delta_start': f"{config.delta_start:.2f} MHz",
            'delta_hold': f"{config.delta_hold:.2f} MHz",
            'delta_end': f"{config.delta_end:.2f} MHz",
            'total_duration': f"{config.total_duration()} ns",
        }


def plot_parameter_sweep_results(
    configs: List[AnnealingScheduleConfig],
    results: List[HybridResult],
    param_name: str,
    save_path: Optional[str] = None,
    show: bool = True,
) -> plt.Figure:
    """
    Plot results from a parameter sweep study.
    
    Shows how changing a single parameter affects three metrics:
    - ratio_pulser
    - ratio_product
    - ratio_hybrid
    """
    if len(configs) != len(results):
        raise ValueError("Number of configs must match number of results")
    
    # Extract parameter values
    param_values = []
    for cfg in configs:
        val = getattr(cfg, param_name, None)
        if val is None:
            raise ValueError(f"Parameter '{param_name}' not found in config")
        param_values.append(val)
    
    # Extract metrics
    pulser_ratios = [r.ratio_pulser for r in results]
    product_ratios = [r.ratio_product for r in results]
    hybrid_ratios = [r.ratio_hybrid for r in results]
    
    # Create plot
    fig, axes = plt.subplots(1, 3, figsize=(16, 5), dpi=150)
    
    # Plot 1: Pulser ratio
    axes[0].plot(param_values, pulser_ratios, 'o-', linewidth=2.5, markersize=8, color='#2E86AB')
    axes[0].set_xlabel(param_name, fontsize=11, fontweight='bold')
    axes[0].set_ylabel('Pulser Ratio', fontsize=11, fontweight='bold')
    axes[0].set_title('Pulser Performance', fontsize=12, fontweight='bold')
    axes[0].grid(True, alpha=0.3)
    
    # Plot 2: Product ratio
    axes[1].plot(param_values, product_ratios, 's-', linewidth=2.5, markersize=8, color='#A23B72')
    axes[1].set_xlabel(param_name, fontsize=11, fontweight='bold')
    axes[1].set_ylabel('Product Ratio', fontsize=11, fontweight='bold')
    axes[1].set_title('Product Rounding Performance', fontsize=12, fontweight='bold')
    axes[1].grid(True, alpha=0.3)
    
    # Plot 3: Hybrid ratio (winner)
    axes[2].plot(param_values, hybrid_ratios, '^-', linewidth=2.5, markersize=8, color='#F18F01')
    axes[2].set_xlabel(param_name, fontsize=11, fontweight='bold')
    axes[2].set_ylabel('Hybrid Ratio', fontsize=11, fontweight='bold')
    axes[2].set_title('Hybrid Winner Performance', fontsize=12, fontweight='bold')
    axes[2].grid(True, alpha=0.3)
    
    plt.suptitle(
        f'Parameter Sweep: {param_name}',
        fontsize=14,
        fontweight='bold',
        y=1.00
    )
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"✓ Sweep plot saved to {save_path}")
    
    if show:
        plt.show()
    
    return fig
