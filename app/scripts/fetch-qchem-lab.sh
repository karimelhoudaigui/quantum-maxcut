#!/bin/sh
# Clone (ou met à jour) le dépôt quantum-ald-simulation de Karim dans
# vendor/qchem-lab, pour que le code applicatif ALD de cette app puisse
# importer ses composants (MoleculeCanvas.tsx notamment) via l'alias
# "@qchem-lab" (cf. vite.config.ts / tsconfig.json) sans en dupliquer le
# code dans ce dépôt — même esprit que `hpc_worker.py --quantum-repo` côté
# Python (cf. hpc-bridge/README.md) : deux dépôts clonés séparément plutôt
# qu'un copier-coller entretenu à la main dans les deux sens.
#
# Lancé depuis Dockerfile(.fast) avant `npm run build` (OKD n'a accès qu'au
# contexte app/, pas au reste du dépôt) et à la main en dev local :
#   sh scripts/fetch-qchem-lab.sh
#
# vendor/ n'est pas versionné (cf. .gitignore) : il est reconstruit à
# chaque build, jamais commité.
set -eu

REPO_URL="${QCHEM_LAB_REPO_URL:-https://github.com/karimelhoudaigui/quantum-ald-simulation.git}"
REPO_REF="${QCHEM_LAB_REPO_REF:-main}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENDOR_DIR="$APP_DIR/vendor/qchem-lab"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT INT TERM

echo "fetch-qchem-lab: clonage de $REPO_URL@$REPO_REF ..."
git clone --depth 1 --branch "$REPO_REF" "$REPO_URL" "$TMP_DIR"

if [ ! -d "$TMP_DIR/qchem-lab/src" ]; then
  echo "fetch-qchem-lab: qchem-lab/src introuvable dans $REPO_URL@$REPO_REF — le dépôt a-t-il changé de structure ?" >&2
  exit 1
fi

rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"
cp -r "$TMP_DIR/qchem-lab/src/." "$VENDOR_DIR/"

echo "fetch-qchem-lab: qchem-lab/src -> $VENDOR_DIR"
