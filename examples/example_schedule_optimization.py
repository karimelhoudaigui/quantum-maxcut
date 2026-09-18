#!/usr/bin/env python3
"""
Example: Using the Quantum Hybrid Control Lab Programmatically
Demonstrates the complete workflow for researchers.

Run with: python examples/example_schedule_optimization.py
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd
from datetime import datetime

from quantum_maxcut.scheduler_manager import (
    AnnealingScheduleConfig,
    GraphFamily,
    HybridScheduleRunner,
    ScheduleComparison,
)
from quantum_maxcut.schedule_validation import (
    ScheduleValidator,
    PhysicalParameterSweeper,
)
from quantum_maxcut.schedule_visualization import (
    SchedulePlotter,
    ResultDashboard,
)
from quantum_hybrid.hybrid_graph_study import generate_random_weighted_graph


def example_1_basic_simulation():
    """
    Example 1: Run a simple simulation with default parameters.
    """
    print("\n" + "="*70)
    print("EXAMPLE 1: Basic Simulation with Default Parameters")
    print("="*70 + "\n")
    
    # Create configuration (uses default values)
    config = AnnealingScheduleConfig(
        n_nodes=4,
        graph_family=GraphFamily.RANDOM,
    )
    
    print("📋 Configuration:")
    print(f"  n_nodes: {config.n_nodes}")
    print(f"  ω_peak: {config.omega_peak} MHz")
    print(f"  Fall duration: {config.fall_duration} ns")
    print(f"  Total duration: {config.total_duration()} ns")
    
    # Validate
    validator = ScheduleValidator(config)
    validation = validator.validate()
    print(f"\n✓ Validation: {'VALID' if validation.is_valid else 'INVALID'}")
    
    # Generate a test graph
    rng = np.random.default_rng(1234)
    target_edges = generate_random_weighted_graph(
        n=config.n_nodes,
        edge_prob=0.6,
        w_min=0.5,
        w_max=1.5,
        rng=rng,
    )
    
    print(f"\n📊 Graph:")
    print(f"  Nodes: {config.n_nodes}")
    print(f"  Edges: {len(target_edges)}")
    for i, j, w in target_edges[:3]:
        print(f"    ({i},{j}) weight={w:.2f}")
    
    # Run simulation
    print("\n⏳ Running simulation...")
    runner = HybridScheduleRunner(config)
    result = runner.run_on_graph(
        n=config.n_nodes,
        target_edges=target_edges,
    )
    
    # Display results
    print("\n📈 Results:")
    print(f"  Pulser Ratio:   {result.ratio_pulser:.6f}")
    print(f"  Product Ratio:  {result.ratio_product:.6f}")
    print(f"  Hybrid Ratio:   {result.ratio_hybrid:.6f} ← Winner")
    print(f"  Winner: {result.winner}")
    print(f"  Mapping Error: {result.mapping_error:.6f}")
    
    delta = result.ratio_hybrid - result.ratio_pulser
    print(f"\n🎯 Performance:")
    print(f"  Gain vs Pulser: {delta:+.6f}")
    
    return result


def example_2_parameter_sweep():
    """
    Example 2: Sweep the main cooling phase duration.
    This shows how fall_duration affects the quality of adiabatic evolution.
    """
    print("\n" + "="*70)
    print("EXAMPLE 2: Parameter Sweep - Annealing Speed Study")
    print("="*70 + "\n")
    
    # Base configuration
    base_config = AnnealingScheduleConfig(n_nodes=4)
    
    print("🧪 Sweeping fall_duration (cooling phase)...")
    print("   This determines how quickly the system is cooled.")
    print("   Longer duration → slower cooling → potentially better adiabatic following\n")
    
    # Create sweeper
    sweeper = PhysicalParameterSweeper(base_config)
    
    # Generate sweep configurations
    configs = sweeper.sweep_fall_duration_adiabatic(
        duration_min=100,
        duration_max=1000,
        n_steps=6,
    )
    
    print(f"✓ Generated {len(configs)} configurations:\n")
    
    # Run simulations
    results_data = []
    
    rng = np.random.default_rng(4242)
    target_edges = generate_random_weighted_graph(
        n=base_config.n_nodes,
        edge_prob=0.6,
        rng=rng,
    )
    
    for i, config in enumerate(configs):
        print(f"  [{i+1}/{len(configs)}] fall_duration={config.fall_duration:4d} ns", end='', flush=True)
        
        runner = HybridScheduleRunner(config)
        result = runner.run_on_graph(
            n=config.n_nodes,
            target_edges=target_edges,
        )
        
        print(f" → Hybrid={result.ratio_hybrid:.6f} (winner: {result.winner})")
        
        results_data.append({
            'fall_duration_ns': config.fall_duration,
            'ratio_pulser': result.ratio_pulser,
            'ratio_product': result.ratio_product,
            'ratio_hybrid': result.ratio_hybrid,
            'winner': result.winner,
        })
    
    # Create dataframe and show summary
    df = pd.DataFrame(results_data)
    
    print("\n📊 Summary Statistics:")
    print(f"  Best Hybrid Ratio: {df['ratio_hybrid'].max():.6f}")
    print(f"  Mean Hybrid Ratio: {df['ratio_hybrid'].mean():.6f}")
    print(f"  Worst Hybrid Ratio: {df['ratio_hybrid'].min():.6f}")
    
    # Find optimal
    best_idx = df['ratio_hybrid'].idxmax()
    best_duration = df.loc[best_idx, 'fall_duration_ns']
    best_ratio = df.loc[best_idx, 'ratio_hybrid']
    
    print(f"\n🏆 Optimal Configuration:")
    print(f"  fall_duration = {best_duration:.0f} ns")
    print(f"  Achieved ratio_hybrid = {best_ratio:.6f}")
    
    return df


def example_3_schedule_comparison():
    """
    Example 3: Compare two different schedules.
    Shows how different parameters lead to different performance.
    """
    print("\n" + "="*70)
    print("EXAMPLE 3: Schedule Comparison - Parameter Sensitivity")
    print("="*70 + "\n")
    
    # Create two schedules
    config_a = AnnealingScheduleConfig(
        n_nodes=4,
        omega_peak=8.0,
        fall_duration=300,
    )
    
    config_b = AnnealingScheduleConfig(
        n_nodes=4,
        omega_peak=12.0,
        fall_duration=600,
    )
    
    print("📋 Schedule A (Conservative):")
    print(f"  ω_peak: {config_a.omega_peak} MHz")
    print(f"  Fall duration: {config_a.fall_duration} ns")
    print(f"  Total: {config_a.total_duration()} ns")
    
    print("\n📋 Schedule B (Aggressive):")
    print(f"  ω_peak: {config_b.omega_peak} MHz")
    print(f"  Fall duration: {config_b.fall_duration} ns")
    print(f"  Total: {config_b.total_duration()} ns")
    
    # Generate same graph for fair comparison
    rng = np.random.default_rng(5678)
    target_edges = generate_random_weighted_graph(
        n=4,
        edge_prob=0.6,
        rng=rng,
    )
    
    # Run both
    print("\n⏳ Running simulations...")
    
    runner_a = HybridScheduleRunner(config_a)
    result_a = runner_a.run_on_graph(n=4, target_edges=target_edges)
    
    runner_b = HybridScheduleRunner(config_b)
    result_b = runner_b.run_on_graph(n=4, target_edges=target_edges)
    
    # Compare
    print("\n📊 Results Comparison:")
    print(f"\n  Schedule A:")
    print(f"    Pulser:  {result_a.ratio_pulser:.6f}")
    print(f"    Product: {result_a.ratio_product:.6f}")
    print(f"    Hybrid:  {result_a.ratio_hybrid:.6f}")
    
    print(f"\n  Schedule B:")
    print(f"    Pulser:  {result_b.ratio_pulser:.6f}")
    print(f"    Product: {result_b.ratio_product:.6f}")
    print(f"    Hybrid:  {result_b.ratio_hybrid:.6f}")
    
    # Calculate improvement
    improvement = result_b.ratio_hybrid - result_a.ratio_hybrid
    improvement_pct = (improvement / result_a.ratio_hybrid) * 100
    
    print(f"\n🎯 Improvement from A to B:")
    print(f"  Δ Ratio: {improvement:+.6f}")
    print(f"  Δ %:     {improvement_pct:+.2f}%")
    
    if improvement > 0:
        print(f"  Winner: Schedule B! 🏆")
    elif improvement < 0:
        print(f"  Winner: Schedule A! 🏆")
    else:
        print(f"  Tie!")
    
    return result_a, result_b


def example_4_waveform_visualization():
    """
    Example 4: Visualize the annealing waveforms.
    """
    print("\n" + "="*70)
    print("EXAMPLE 4: Waveform Visualization")
    print("="*70 + "\n")
    
    config = AnnealingScheduleConfig(
        n_nodes=4,
        omega_prep=16.33,
        prep_duration=100,
        omega_peak=10.0,
        rise_duration=200,
        hold_duration=500,
        fall_duration=500,
        delta_start=-80.0,
        delta_hold=0.0,
        delta_end=0.0,
    )
    
    print("📊 Schedule Parameters:")
    print(f"  Total Duration: {config.total_duration()} ns")
    print(f"  Peak Coupling: {config.omega_peak} MHz")
    print(f"  Detuning Range: {config.delta_start} to {config.delta_end} MHz")
    
    # Create plotter
    plotter = SchedulePlotter(figsize=(14, 5))
    
    # Plot and save
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        fig = plotter.plot_waveform(
            config,
            save_path=tmp.name,
            show=False,
        )
        print(f"\n✓ Waveform saved to: {tmp.name}")
    
    return fig


def main():
    """Run all examples."""
    
    print("\n" + "█"*70)
    print("█" + " "*68 + "█")
    print("█" + "  Quantum Hybrid Control Lab - Usage Examples".center(68) + "█")
    print("█" + " "*68 + "█")
    print("█"*70 + "\n")
    
    try:
        # Example 1
        result_1 = example_1_basic_simulation()
        
        # Example 2
        df_sweep = example_2_parameter_sweep()
        
        # Example 3
        result_a, result_b = example_3_schedule_comparison()
        
        # Example 4
        fig = example_4_waveform_visualization()
        
        # Summary
        print("\n" + "="*70)
        print("✓ ALL EXAMPLES COMPLETED SUCCESSFULLY")
        print("="*70)
        
        print("\n📚 Next Steps:")
        print("  1. Run: streamlit run app_quantum_control_panel.py")
        print("  2. Explore the interactive dashboard")
        print("  3. Design your own schedules")
        print("  4. Export results for your research paper")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
