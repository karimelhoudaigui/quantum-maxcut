#!/usr/bin/env python3
import argparse
import csv
import os
import sys
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp")

import matplotlib
matplotlib.use("Agg")

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from quantum_hybrid.hybrid_graph_study import (
    evaluate_fixed_hybrid_sequence_on_graph,
    generate_random_weighted_graph,
    plot_hybrid_scaling_summary,
)

DEFAULT_FAMILIES = [
    "path",
    "cycle",
    "star",
    "complete",
    "generic_random",
    "dense_random",
]


def _all_pairs(n):
    return [(i, j) for i in range(n) for j in range(i + 1, n)]


def _weighted_edges_from_pairs(pairs, rng, w_min, w_max):
    return [
        (int(i), int(j), float(rng.uniform(w_min, w_max)))
        for i, j in pairs
    ]


def generate_family_graph(family, n, rng, w_min=0.5, w_max=1.5):
    family = str(family).lower()

    if family == "path":
        pairs = [(i, i + 1) for i in range(n - 1)]
        return _weighted_edges_from_pairs(pairs, rng, w_min, w_max)

    if family == "cycle":
        if n < 3:
            raise ValueError("cycle nécessite n >= 3.")
        pairs = [(i, i + 1) for i in range(n - 1)] + [(0, n - 1)]
        return _weighted_edges_from_pairs(pairs, rng, w_min, w_max)

    if family == "star":
        if n < 4:
            raise ValueError("star nécessite n >= 4.")
        pairs = [(0, i) for i in range(1, n)]
        return _weighted_edges_from_pairs(pairs, rng, w_min, w_max)

    if family == "complete":
        pairs = _all_pairs(n)
        return _weighted_edges_from_pairs(pairs, rng, w_min, w_max)

    if family == "generic_random":
        return generate_random_weighted_graph(
            n=n,
            edge_prob=0.6,
            w_min=w_min,
            w_max=w_max,
            rng=rng,
            require_connected=True,
        )

    if family == "dense_random":
        return generate_random_weighted_graph(
            n=n,
            edge_prob=0.85,
            w_min=w_min,
            w_max=w_max,
            rng=rng,
            require_connected=True,
        )

    raise ValueError(f"Famille inconnue : {family}")


def parse_existing_results(csv_path, n, families):
    if csv_path is None:
        return {family: [] for family in families}

    csv_path = Path(csv_path)
    if not csv_path.exists():
        return {family: [] for family in families}

    rows = []
    with csv_path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                row_n = int(row["n"])
            except (KeyError, ValueError):
                continue
            if row_n != n:
                continue
            family = row.get("family")
            if family not in families:
                continue
            rows.append({
                "family": family,
                "n": row_n,
                "instance_id": int(row["instance_id"]),
                "mapping_error": float(row["mapping_error"]),
                "ratio_proxy_exact": float(row["ratio_proxy_exact"]),
                "ratio_pulser": float(row["ratio_pulser"]),
                "ratio_product": float(row.get("ratio_product", row.get("ratio_product_best", 0.0))),
                "ratio_hybrid": float(row["ratio_hybrid"]),
                "winner": row.get("winner", ""),
            })

    grouped = {
        family: sorted(
            [row for row in rows if row["family"] == family],
            key=lambda x: x["instance_id"],
        )
        for family in families
    }
    return grouped


def compute_scaling_summary(family, rows):
    ratios_pulser = np.array([r["ratio_pulser"] for r in rows], dtype=float)
    ratios_product = np.array([r["ratio_product"] for r in rows], dtype=float)
    ratios_hybrid = np.array([r["ratio_hybrid"] for r in rows], dtype=float)
    mapping_errors = np.array([r["mapping_error"] for r in rows], dtype=float)
    proxy_ratios = np.array([r["ratio_proxy_exact"] for r in rows], dtype=float)

    rounding_win_count = sum(1 for r in rows if r["winner"] == "rounding")
    pulser_win_count = sum(1 for r in rows if r["winner"] == "pulser")

    return {
        "family": family,
        "n": int(rows[0]["n"]) if rows else None,
        "n_graphs": int(len(rows)),
        "ratio_pulser_mean": float(np.mean(ratios_pulser)),
        "ratio_pulser_min": float(np.min(ratios_pulser)),
        "ratio_pulser_max": float(np.max(ratios_pulser)),
        "ratio_product_mean": float(np.mean(ratios_product)),
        "ratio_product_min": float(np.min(ratios_product)),
        "ratio_product_max": float(np.max(ratios_product)),
        "ratio_hybrid_mean": float(np.mean(ratios_hybrid)),
        "ratio_hybrid_min": float(np.min(ratios_hybrid)),
        "ratio_hybrid_max": float(np.max(ratios_hybrid)),
        "mapping_error_mean": float(np.mean(mapping_errors)),
        "mapping_error_max": float(np.max(mapping_errors)),
        "ratio_proxy_exact_mean": float(np.mean(proxy_ratios)),
        "rounding_win_count": int(rounding_win_count),
        "pulser_win_count": int(pulser_win_count),
    }


def save_csv(path, rows, fieldnames):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def build_missing_graphs(
    family,
    n,
    missing_count,
    rng,
    config,
    next_instance_id,
):
    results = []
    for _ in range(missing_count):
        target_edges = generate_family_graph(
            family=family,
            n=n,
            rng=rng,
            w_min=config["w_min"],
            w_max=config["w_max"],
        )
        result = evaluate_fixed_hybrid_sequence_on_graph(
            n=n,
            target_edges=target_edges,
            omega_prep=config["omega_prep"],
            prep_duration=config["prep_duration"],
            omega_peak=config["omega_peak"],
            rise_duration=config["rise_duration"],
            hold_duration=config["hold_duration"],
            fall_duration=config["fall_duration"],
            delta_start=config["delta_start"],
            delta_hold=config["delta_hold"],
            delta_end=config["delta_end"],
            sampling_rate=config["sampling_rate"],
            scale=config["scale"],
            n_roundings=config["n_roundings"],
            seed=config["seed"] + next_instance_id,
            max_iter=config["max_iter"],
            tol=config["tol"],
        )
        results.append({
            "family": family,
            "n": n,
            "instance_id": int(next_instance_id),
            "mapping_error": float(result["mapping_error"]),
            "ratio_proxy_exact": float(result["ratio_proxy_exact"]),
            "ratio_pulser": float(result["ratio_pulser"]),
            "ratio_product": float(result["ratio_product_best"]),
            "ratio_hybrid": float(result["ratio_hybrid"]),
            "winner": str(result["winner"]),
        })
        print(
            f"[family={family}] new sample {len(results):>3}/{missing_count} | "
            f"pulser={results[-1]['ratio_pulser']:.6f} | "
            f"product={results[-1]['ratio_product']:.6f} | "
            f"hybrid={results[-1]['ratio_hybrid']:.6f}"
        )
        next_instance_id += 1
    return results, next_instance_id


def parse_args():
    parser = argparse.ArgumentParser(
        description="Run family-wise hybrid scaling analysis at n=4."
    )
    parser.add_argument("--n", type=int, default=4, help="Graph size.")
    parser.add_argument(
        "--graph-sizes",
        type=int,
        nargs="+",
        default=[20, 50, 100, 150],
        help="Sample sizes for graph scaling.",
    )
    parser.add_argument(
        "--families",
        type=str,
        nargs="+",
        default=DEFAULT_FAMILIES,
        choices=DEFAULT_FAMILIES,
        help="Graph families to evaluate.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=123,
        help="Seed for graph generation and hybrid rounding.",
    )
    parser.add_argument(
        "--existing-results",
        type=str,
        default=None,
        help="Optional path to existing all-instances CSV to reuse earlier results.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="results",
        help="Directory where the scaling CSV will be saved.",
    )
    parser.add_argument(
        "--figures-dir",
        type=str,
        default="figures/GraphFamilyScaling",
        help="Directory where family scaling figures will be saved.",
    )
    parser.add_argument(
        "--w-min",
        type=float,
        default=0.5,
        help="Minimum edge weight.",
    )
    parser.add_argument(
        "--w-max",
        type=float,
        default=1.5,
        help="Maximum edge weight.",
    )
    parser.add_argument(
        "--n-roundings",
        type=int,
        default=64,
        help="Number of rounding trials.",
    )
    parser.add_argument(
        "--sampling-rate",
        type=float,
        default=0.05,
        help="Pulser sampling rate.",
    )
    parser.add_argument(
        "--scale",
        type=float,
        default=15.5,
        help="Scale of atom positions before Pulser.",
    )
    parser.add_argument(
        "--max-iter",
        type=int,
        default=500,
        help="Maximum optimization iterations.",
    )
    parser.add_argument(
        "--tol",
        type=float,
        default=1e-5,
        help="Tolerance for geometry optimization.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    output_dir = Path(args.output_dir)
    figures_dir = Path(args.figures_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    figures_dir.mkdir(parents=True, exist_ok=True)

    if args.existing_results is None:
        default_existing = ROOT / "results_graph_families_full_pipeline" / "all_instances_results.csv"
        if default_existing.exists():
            args.existing_results = str(default_existing)
            print(f"Reusing existing results from {args.existing_results}")

    existing_rows = parse_existing_results(args.existing_results, args.n, args.families)
    max_existing_instance_id = max(
        (row["instance_id"] for rows in existing_rows.values() for row in rows),
        default=-1,
    )

    config = {
        "omega_prep": 2 * np.pi * 2.0,
        "prep_duration": 125,
        "omega_peak": 2 * np.pi * 2.0,
        "rise_duration": 1000,
        "hold_duration": 1000,
        "fall_duration": 26000,
        "delta_start": np.pi,
        "delta_hold": -np.pi / 2,
        "delta_end": -np.pi,
        "sampling_rate": args.sampling_rate,
        "scale": args.scale,
        "w_min": args.w_min,
        "w_max": args.w_max,
        "n_roundings": args.n_roundings,
        "seed": args.seed,
        "max_iter": args.max_iter,
        "tol": args.tol,
    }

    rng = np.random.default_rng(args.seed)
    global_instance_id = max_existing_instance_id + 1

    scaling_rows = []
    for family in args.families:
        base_rows = list(existing_rows.get(family, []))
        family_rows = []
        if base_rows:
            print(f"Loaded {len(base_rows)} existing samples for family '{family}'")

        for target_size in sorted(args.graph_sizes):
            if len(base_rows) >= target_size:
                family_subset = base_rows[:target_size]
            else:
                missing = target_size - len(base_rows)
                print(
                    f"Generating {missing} additional graphs for family '{family}' "
                    f"to reach sample size {target_size}"
                )
                generated, global_instance_id = build_missing_graphs(
                    family=family,
                    n=args.n,
                    missing_count=missing,
                    rng=rng,
                    config=config,
                    next_instance_id=global_instance_id,
                )
                base_rows.extend(generated)
                family_subset = list(base_rows)

            summary = compute_scaling_summary(family, family_subset)
            scaling_rows.append(summary)

        plot_path = figures_dir / f"figure_hybrid_scaling_{family}_n{args.n}.png"
        plot_hybrid_scaling_summary(
            [row for row in scaling_rows if row["family"] == family],
            save_path=plot_path,
            show=False,
        )
        print(f"Saved scaling figure for family '{family}' to {plot_path}")

    fieldnames = [
        "family",
        "n",
        "n_graphs",
        "ratio_pulser_mean",
        "ratio_pulser_min",
        "ratio_pulser_max",
        "ratio_product_mean",
        "ratio_product_min",
        "ratio_product_max",
        "ratio_hybrid_mean",
        "ratio_hybrid_min",
        "ratio_hybrid_max",
        "mapping_error_mean",
        "mapping_error_max",
        "ratio_proxy_exact_mean",
        "rounding_win_count",
        "pulser_win_count",
    ]
    csv_path = output_dir / f"graph_family_scaling_n{args.n}.csv"
    save_csv(csv_path, scaling_rows, fieldnames)

    print(f"Saved scaling summary to {csv_path}")


if __name__ == "__main__":
    main()
