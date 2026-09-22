"""Mesure le temps d'import (python -X importtime) de plusieurs cibles.

Chaque cible tourne dans un sous-processus python neuf. Une ligne JSON par cible
est ajoutee a --out (par defaut import_profile.jsonl), avec le hostname, l'heure
et la charge machine pour comparer un run rapide et un run lent.

Usage (sur le noeud de calcul, avec le meme env que les vrais jobs) :
    python scripts/profile_imports.py
    python scripts/profile_imports.py --targets baseline pipeline --raw-dir import_raw

En job Slurm, utiliser scripts/slurm_profile_imports.sh (une mesure par noeud).
"""
import argparse
import json
import os
import socket
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

TARGETS = {
    "baseline": "pass",
    "numpy": "import numpy",
    "scipy": "import scipy.optimize",
    "matplotlib": "import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot",
    "qutip": "import qutip",
    "pulser": "import pulser, pulser_simulation",
    "cvxpy": "import cvxpy",
    "pandas": "import pandas",
    "pipeline": "import graph_structure_study, quantum_hybrid.hybrid_graph_study",
    "main": "import quantum_main",
    "schedule": "import pandas, quantum_maxcut.scheduler_manager, quantum_maxcut.schedule_validation",
    "api": "import api.services.pipeline_service",
}
DEFAULT_TARGETS = ["baseline", "numpy", "scipy", "matplotlib", "qutip", "pulser", "cvxpy", "pipeline", "main"]


def parse_importtime(stderr):
    """Retourne la liste (self_us, cumulative_us, module) des lignes 'import time:'."""
    rows = []
    for line in stderr.splitlines():
        if not line.startswith("import time:"):
            continue
        parts = line[len("import time:"):].split("|")
        if len(parts) != 3 or not parts[0].strip().isdigit():
            continue
        # on garde l'indentation du nom : 1 espace = paquet racine, +2 par niveau d'import imbrique
        rows.append((int(parts[0]), int(parts[1]), parts[2].rstrip()))
    return rows


def run_target(name, code, env, raw_dir):
    start = time.perf_counter()
    proc = subprocess.run(
        [sys.executable, "-X", "importtime", "-c", code],
        capture_output=True,
        text=True,
        env=env,
        cwd=ROOT_DIR,
    )
    wall = time.perf_counter() - start

    if raw_dir is not None:
        (raw_dir / f"{name}.log").write_text(proc.stderr)

    result = {"target": name, "wall_s": round(wall, 3), "returncode": proc.returncode}
    if proc.returncode != 0:
        result["error"] = proc.stderr.strip().splitlines()[-1] if proc.stderr.strip() else ""
        return result

    rows = parse_importtime(proc.stderr)
    # cumul des modules importes directement (profondeur 0) : leur somme = temps total d'import
    roots = {}
    for _, cumulative, module in rows:
        if len(module) - len(module.lstrip(" ")) == 1:
            roots[module.strip()] = roots.get(module.strip(), 0) + cumulative
    result["imports_s"] = round(sum(roots.values()) / 1e6, 3)
    result["n_modules"] = len(rows)
    result["top_packages_s"] = {
        m: round(c / 1e6, 3) for m, c in sorted(roots.items(), key=lambda kv: -kv[1])[:8]
    }
    result["top_self_s"] = {
        m.strip(): round(s / 1e6, 3) for s, _, m in sorted(rows, key=lambda r: -r[0])[:8]
    }
    return result


def profile(targets, out, raw_dir=None, label="", entry=""):
    env = dict(os.environ)
    env.setdefault("MPLCONFIGDIR", "/tmp")  # comme dans scripts/run_graph_family_*.py
    env["PYTHONPATH"] = os.pathsep.join(filter(None, [str(ROOT_DIR), env.get("PYTHONPATH")]))

    if raw_dir:
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        raw_dir = Path(raw_dir) / f"{socket.gethostname()}_{stamp}"
        raw_dir.mkdir(parents=True, exist_ok=True)

    context = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "host": socket.gethostname(),
        "label": label,
        "entry": entry,
        "python": sys.executable,
        "python_version": sys.version.split()[0],
        "loadavg": os.getloadavg(),
        "slurm_job_id": os.environ.get("SLURM_JOB_ID"),
        "mplconfigdir": env["MPLCONFIGDIR"],
    }

    print(f"[profile_imports] host={context['host']} python={context['python']} load={context['loadavg']}", flush=True)
    print(f"{'cible':<12}{'mur (s)':>9}{'imports (s)':>13}{'modules':>9}  principaux paquets", flush=True)
    with open(out, "a") as fh:
        for name in targets:
            result = {**context, **run_target(name, TARGETS[name], env, raw_dir)}
            fh.write(json.dumps(result) + "\n")
            if result["returncode"] != 0:
                print(f"{name:<12}{result['wall_s']:>9.2f}  ECHEC: {result.get('error', '')}", flush=True)
                continue
            top = ", ".join(f"{m}={s:.2f}" for m, s in list(result["top_packages_s"].items())[:4])
            print(f"{name:<12}{result['wall_s']:>9.2f}{result['imports_s']:>13.2f}{result['n_modules']:>9}  {top}", flush=True)
    print(f"[profile_imports] -> {out}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--targets", nargs="+", default=DEFAULT_TARGETS, choices=sorted(TARGETS))
    parser.add_argument("--out", default="import_profile.jsonl")
    parser.add_argument("--raw-dir", default=None, help="dossier ou ecrire les sorties -X importtime brutes")
    parser.add_argument("--label", default="", help="etiquette libre (ex: 'run lent', 'cache froid')")
    args = parser.parse_args()
    profile(args.targets, args.out, args.raw_dir, args.label, entry=Path(sys.argv[0]).name)


if __name__ == "__main__":
    main()
