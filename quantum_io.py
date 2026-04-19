import csv
import json
import numpy as np


def _to_serializable(obj):
    """
    Convertit les objets numpy en objets Python sérialisables JSON.
    """
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    if isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    if isinstance(obj, complex):
        return {"real": obj.real, "imag": obj.imag}
    if isinstance(obj, list):
        return [_to_serializable(x) for x in obj]
    if isinstance(obj, tuple):
        return [_to_serializable(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _to_serializable(v) for k, v in obj.items()}
    return obj


def save_results_csv(results, filename="benchmark_summary.csv"):
    """
    Sauvegarde un résumé tabulaire des résultats.
    """
    fieldnames = [
        "n",
        "instance_id",
        "num_edges",
        "density",
        "mapping_error",
        "E0_qmc",
        "E0_r",
        "E_proxy_in_qmc",
        "ratio",
    ]

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for r in results:
            row = {
                "n": r.get("n"),
                "instance_id": r.get("instance_id"),
                "num_edges": r.get("num_edges"),
                "density": r.get("density"),
                "mapping_error": r.get("mapping_error"),
                "E0_qmc": r.get("E0_qmc"),
                "E0_r": r.get("E0_r"),
                "E_proxy_in_qmc": r.get("E_proxy_in_qmc"),
                "ratio": r.get("ratio"),
            }
            writer.writerow(row)


def save_results_json(results, filename="benchmark_full.json"):
    """
    Sauvegarde toutes les données détaillées.
    """
    serializable = [_to_serializable(r) for r in results]
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(serializable, f, indent=2, ensure_ascii=False)