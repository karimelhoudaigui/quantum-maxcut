#!/usr/bin/env python3
"""
Quantum Hybrid Schedule Benchmark CLI
Command-line interface for running parameter studies and benchmarks.

Usage:
    python scripts/run_schedule_benchmark.py --param fall_duration --min 100 --max 1500 --steps 10
    python scripts/run_schedule_benchmark.py --grid --param1 omega_peak --param2 fall_duration
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List
import pandas as pd
import numpy as np

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from quantum_maxcut.scheduler_manager import (
    AnnealingScheduleConfig,
    HybridScheduleRunner,
)
from quantum_maxcut.schedule_validation import (
    ScheduleValidator,
    PhysicalParameterSweeper,
    validate_config,
)
from quantum_maxcut.schedule_visualization import (
    SchedulePlotter,
    ResultDashboard,
    plot_parameter_sweep_results,
)
from quantum_hybrid.hybrid_graph_study import generate_random_weighted_graph


def create_base_config(args) -> AnnealingScheduleConfig:
    """Create base configuration from CLI arguments."""
    config = AnnealingScheduleConfig(
        n_nodes=args.n_nodes,
        n_instances=args.n_instances,
        seed=args.seed,
    )
    return config


def run_single_benchmark(config: AnnealingScheduleConfig, args) -> dict:
    """Run single simulation with given config."""
    
    # Validate
    validation = validate_config(config)
    if not validation.is_valid:
        print(f"❌ Invalid configuration:")
        for err in validation.errors:
            print(f"   {err}")
        return None
    
    # Generate graph
    rng = np.random.default_rng(config.seed)
    target_edges = generate_random_weighted_graph(
        n=config.n_nodes,
        edge_prob=args.edge_prob,
        w_min=args.w_min,
        w_max=args.w_max,
        rng=rng,
    )
    
    # Run
    runner = HybridScheduleRunner(config)
    result = runner.run_on_graph(
        n=config.n_nodes,
        target_edges=target_edges,
    )
    
    return {
        'ratio_pulser': result.ratio_pulser,
        'ratio_product': result.ratio_product,
        'ratio_hybrid': result.ratio_hybrid,
        'winner': result.winner,
        'mapping_error': result.mapping_error,
        'seed': config.seed,
    }


def run_parameter_sweep(args) -> None:
    """Run 1D parameter sweep."""
    
    print(f"\n🧪 Running 1D parameter sweep on '{args.param}'")
    print(f"   Range: [{args.min}, {args.max}]")
    print(f"   Steps: {args.steps}\n")
    
    base_config = create_base_config(args)
    sweeper = PhysicalParameterSweeper(base_config)
    
    # Generate sweep configs
    if args.param == "omega_peak":
        configs = sweeper.sweep_omega_peak(
            omega_min=args.min,
            omega_max=args.max,
            n_steps=args.steps,
        )
    elif args.param == "fall_duration":
        configs = sweeper.sweep_fall_duration_adiabatic(
            duration_min=int(args.min),
            duration_max=int(args.max),
            n_steps=args.steps,
        )
    elif args.param == "delta_start":
        configs = sweeper.sweep_delta_start(
            delta_min=args.min,
            delta_max=args.max,
            n_steps=args.steps,
        )
    elif args.param == "hold_duration":
        configs = sweeper.sweep_hold_duration(
            duration_min=int(args.min),
            duration_max=int(args.max),
            n_steps=args.steps,
        )
    else:
        print(f"❌ Unknown parameter: {args.param}")
        sys.exit(1)
    
    print(f"✓ Generated {len(configs)} valid configurations\n")
    
    # Run benchmarks
    results = []
    for i, config in enumerate(configs):
        print(f"[{i+1}/{len(configs)}] Running benchmark with {args.param}={getattr(config, args.param):.2f}...", end='', flush=True)
        
        result = run_single_benchmark(config, args)
        if result:
            result['param_value'] = getattr(config, args.param)
            results.append(result)
            print(f" ✓ ratio_hybrid={result['ratio_hybrid']:.4f}")
        else:
            print(" ✗ FAILED")
    
    # Save results
    df = pd.DataFrame(results)
    
    output_file = f"benchmark_sweep_{args.param}.csv"
    df.to_csv(output_file, index=False)
    print(f"\n✓ Results saved to {output_file}")
    
    # Plot
    if args.plot:
        print("📊 Generating plots...")
        
        # Create minimal configs for visualization
        plot_configs = [
            AnnealingScheduleConfig(**{
                **config.to_dict(),
                args.param: result['param_value'],
            })
            for config, result in zip(configs, results)
        ]
        
        plot_parameter_sweep_results(
            configs=plot_configs,
            results=[
                type('HybridResult', (), result)()  # Create mock result
                for result in results
            ],
            param_name=args.param,
            save_path=f"benchmark_sweep_{args.param}.png",
        )


def run_grid_sweep(args) -> None:
    """Run 2D grid sweep."""
    
    print(f"\n🧪 Running 2D grid sweep")
    print(f"   Param 1: '{args.param1}' [{args.min1}, {args.max1}] x {args.steps1} steps")
    print(f"   Param 2: '{args.param2}' [{args.min2}, {args.max2}] x {args.steps2} steps\n")
    
    base_config = create_base_config(args)
    sweeper = PhysicalParameterSweeper(base_config)
    
    # Generate grid  
    configs = sweeper.grid_sweep_2d(
        param1=args.param1,
        param1_range=(args.min1, args.max1, args.steps1),
        param2=args.param2,
        param2_range=(args.min2, args.max2, args.steps2),
    )
    
    print(f"✓ Generated {len(configs)} valid configurations\n")
    
    # Run benchmarks
    results = []
    for i, config in enumerate(configs):
        p1_val = getattr(config, args.param1)
        p2_val = getattr(config, args.param2)
        print(f"[{i+1}/{len(configs)}] {args.param1}={p1_val:.2f}, {args.param2}={p2_val:.2f}...", end='', flush=True)
        
        result = run_single_benchmark(config, args)
        if result:
            result['param1_value'] = p1_val
            result['param2_value'] = p2_val
            results.append(result)
            print(f" ✓ {result['ratio_hybrid']:.4f}")
        else:
            print(" ✗ FAILED")
    
    # Save results
    df = pd.DataFrame(results)
    
    output_file = f"benchmark_grid_{args.param1}_vs_{args.param2}.csv"
    df.to_csv(output_file, index=False)
    print(f"\n✓ Results saved to {output_file}")
    
    # Pivot table for heatmap
    pivot_df = df.pivot_table(
        values='ratio_hybrid',
        index='param1_value',
        columns='param2_value',
    )
    print(f"\n📊 2D Results Matrix ({args.param1} x {args.param2}):")
    print(pivot_df.to_string())


def main():
    """Main CLI entry point."""
    
    parser = argparse.ArgumentParser(
        description="Quantum Hybrid Schedule Benchmark CLI"
    )
    
    # Common arguments
    parser.add_argument('--n-nodes', type=int, default=4, help='Number of nodes')
    parser.add_argument('--n-instances', type=int, default=1, help='Number of instances')
    parser.add_argument('--seed', type=int, default=1234, help='Random seed')
    parser.add_argument('--edge-prob', type=float, default=0.6, help='Edge probability')
    parser.add_argument('--w-min', type=float, default=0.5, help='Min edge weight')
    parser.add_argument('--w-max', type=float, default=1.5, help='Max edge weight')
    parser.add_argument('--plot', action='store_true', help='Generate plots')
    
    # Sweep arguments
    parser.add_argument('--param', type=str, help='Parameter to sweep (1D)')
    parser.add_argument('--min', type=float, help='Min value for sweep')
    parser.add_argument('--max', type=float, help='Max value for sweep')
    parser.add_argument('--steps', type=int, default=10, help='Number of steps')
    
    # Grid sweep arguments
    parser.add_argument('--grid', action='store_true', help='Run 2D grid sweep')
    parser.add_argument('--param1', type=str, help='First parameter for grid')
    parser.add_argument('--param2', type=str, help='Second parameter for grid')
    parser.add_argument('--min1', type=float, help='Min for param1')
    parser.add_argument('--max1', type=float, help='Max for param1')
    parser.add_argument('--steps1', type=int, default=5, help='Steps for param1')
    parser.add_argument('--min2', type=float, help='Min for param2')
    parser.add_argument('--max2', type=float, help='Max for param2')
    parser.add_argument('--steps2', type=int, default=5, help='Steps for param2')
    
    args = parser.parse_args()
    
    # Routing
    if args.grid:
        if not all([args.param1, args.param2, args.min1, args.max1, args.min2, args.max2]):
            parser.print_help()
            print("\n❌ Grid sweep requires: --param1, --param2, --min1, --max1, --min2, --max2")
            sys.exit(1)
        run_grid_sweep(args)
    
    elif args.param:
        if not all([args.min, args.max]):
            parser.print_help()
            print("\n❌ 1D sweep requires: --param, --min, --max")
            sys.exit(1)
        run_parameter_sweep(args)
    
    else:
        parser.print_help()
        
        print("\n📚 Examples:")
        print("\n  1D sweep on fall_duration:")
        print("    python scripts/run_schedule_benchmark.py --param fall_duration --min 100 --max 1500 --steps 10 --plot")
        
        print("\n  1D sweep on omega_peak:")
        print("    python scripts/run_schedule_benchmark.py --param omega_peak --min 2 --max 15 --steps 8")
        
        print("\n  2D grid sweep:")
        print("    python scripts/run_schedule_benchmark.py --grid \\")
        print("      --param1 omega_peak --min1 2 --max1 15 --steps1 5 \\")
        print("      --param2 fall_duration --min2 100 --max2 1500 --steps2 5")


if __name__ == '__main__':
    main()
