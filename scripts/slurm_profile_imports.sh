#!/bin/bash
# A appeler en tete d'un script sbatch, APRES l'activation de l'env python et AVANT les calculs.
# Mesure les temps d'import (scripts/profile_imports.py) une fois par noeud alloue, donc avec
# l'acces disque reel de chaque machine. Ne fait jamais echouer le job.
#
# Exemple dans un script sbatch :
#     source /chemin/vers/env/bin/activate
#     bash /chemin/vers/quantum-maxcut/scripts/slurm_profile_imports.sh
#     python scripts/run_graph_family_full_pipeline.py ...
#
# Variables optionnelles :
#     QMC_PROFILE_IMPORTS=0   desactive (le script ne fait rien)
#     QMC_PROFILE_DIR=...     dossier de sortie (defaut: <repo>/import_profiles)
#     QMC_PROFILE_LABEL=...   etiquette libre ajoutee a chaque ligne
#     PYTHON=...              interpreteur (defaut: python)
# Arguments supplementaires (ex: --targets baseline numpy pipeline) transmis a profile_imports.py.

[ "${QMC_PROFILE_IMPORTS:-1}" = "0" ] && exit 0

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export QMC_PROFILE_DIR="${QMC_PROFILE_DIR:-$ROOT_DIR/import_profiles}"
export QMC_PROFILE_PYTHON="${PYTHON:-python}"
export QMC_PROFILE_ROOT="$ROOT_DIR"
export QMC_PROFILE_LABEL="${QMC_PROFILE_LABEL:-}"
mkdir -p "$QMC_PROFILE_DIR" || exit 0

# Un fichier par job et par noeud : pas d'ecritures concurrentes sur le FS partage.
# Le corps s'execute sur chaque noeud (via srun) : $(hostname) y est donc celui du noeud.
run_one() {
    tag="${SLURM_JOB_ID:-nojob}_$(hostname)"
    "$QMC_PROFILE_PYTHON" "$QMC_PROFILE_ROOT/scripts/profile_imports.py" \
        --out "$QMC_PROFILE_DIR/$tag.jsonl" \
        --raw-dir "$QMC_PROFILE_DIR/raw" \
        --label "$QMC_PROFILE_LABEL" "$@"
}
export -f run_one

if [ -n "${SLURM_JOB_ID:-}" ] && command -v srun >/dev/null 2>&1; then
    srun --nodes="${SLURM_JOB_NUM_NODES:-1}" --ntasks-per-node=1 bash -c 'run_one "$@"' _ "$@" || echo "[profile_imports] echec ignore" >&2
else
    run_one "$@" || echo "[profile_imports] echec ignore" >&2
fi
exit 0
