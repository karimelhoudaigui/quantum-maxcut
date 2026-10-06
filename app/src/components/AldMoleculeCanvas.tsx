import { useEffect } from "react";

import { MoleculeCanvas } from "@qchem-lab/components/chemistry/MoleculeCanvas";
import { useChemistryStore } from "@qchem-lab/stores/chemistryStore";

import { useAldStore } from "../stores/aldStore";

// Vue 3D de la molécule sélectionnée, réutilisant tel quel le composant
// MoleculeCanvas.tsx du dépôt quantum-ald-simulation de Karim (importé via
// l'alias "@qchem-lab", cf. vite.config.ts/tsconfig.json — vendored par
// scripts/fetch-qchem-lab.sh, jamais copié/dupliqué dans ce dépôt).
//
// MoleculeCanvas lit atoms/unit/selectedAtomId depuis le store de qchem-lab
// (useChemistryStore), pas depuis aldStore : les deux apps ont des modèles
// de données différents (qchem-lab permet d'éditer une molécule libre,
// aldStore ne propose que 3 presets fixes, cf. AldPipelineRunner.tsx). On ne
// fait donc pas d'adaptateur de données dans l'autre sens — on se contente
// de pousser le preset choisi dans aldStore vers useChemistryStore.setPreset
// (même clés "h2"/"lih"/"h2o" des deux côtés, cf. config/chemistry.ts), et
// MoleculeCanvas se débrouille avec son propre état pour le rendu/la
// sélection d'atome au clic (purement visuel, sans effet sur le calcul).
export function AldMoleculeCanvas() {
  const moleculePreset = useAldStore((state) => state.moleculePreset);

  useEffect(() => {
    useChemistryStore.getState().setPreset(moleculePreset);
  }, [moleculePreset]);

  return <MoleculeCanvas />;
}
