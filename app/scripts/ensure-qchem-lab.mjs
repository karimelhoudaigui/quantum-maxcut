#!/usr/bin/env node
// Lance fetch-qchem-lab.sh uniquement si vendor/qchem-lab est absent — pour
// que `npm run dev`/`npm run build` en local fonctionnent sans étape manuelle
// sur un nouveau checkout, sans re-cloner à chaque lancement une fois peuplé
// (cf. fetch-qchem-lab.sh, vendor/ n'est jamais versionné).
//
// Les builds Docker (Dockerfile/Dockerfile.fast) appellent déjà
// fetch-qchem-lab.sh explicitement avant chaque build (image jetable, donc
// toujours absent) : ce script-ci ne les remplace pas, il couvre juste le
// cas dev local / premier clone.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const vendorDir = path.join(appDir, "vendor", "qchem-lab");

if (existsSync(vendorDir)) {
  process.exit(0);
}

console.log("ensure-qchem-lab: vendor/qchem-lab absent, exécution de fetch-qchem-lab.sh ...");
const result = spawnSync("sh", ["scripts/fetch-qchem-lab.sh"], {
  cwd: appDir,
  stdio: "inherit",
});

if (result.status !== 0) {
  console.error(
    "ensure-qchem-lab: fetch-qchem-lab.sh a échoué — vérifiez la connectivité réseau " +
      "(clone de quantum-ald-simulation) ou lancez-le manuellement : sh scripts/fetch-qchem-lab.sh",
  );
  process.exit(result.status ?? 1);
}
