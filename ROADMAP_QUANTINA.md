# Roadmap QuantINA - Quantum MaxCut / QUBO Platform

Ce document sert de point d'entree pour reprendre le projet, comprendre ou se trouvent les fichiers importants, et planifier l'evolution de la plateforme QuantINA vers une suite plus generale d'optimisation combinatoire quantique/hybride.

## Liens utiles

- Depot GitHub public : https://github.com/karimelhoudaigui/quantum-maxcut
- Branche principale : https://github.com/karimelhoudaigui/quantum-maxcut/tree/main
- Application web actuelle via GitHub Pages : https://karimelhoudaigui.github.io/quantum-maxcut/
- Documentation TGCC / CEA, quantum software stack : https://www-dcc.extra.cea.fr/tgcc-public/en/html/toc/QuantumSoftwareStack.html

Le lien GitHub Pages fonctionne comme vitrine technique actuelle, mais il reste personnel car il contient le compte GitHub. Pour une diffusion QuantINA/HybQuant, l'objectif est de deployer la plateforme sur un lien non personnel, par exemple `quantina.fr`, `quantina.hybquant.fr`, `quantina.labri.fr`, ou un sous-domaine institutionnel equivalent.

Attention : certains fichiers utiles existent localement mais ne sont pas encore suivis par Git. Ils doivent etre ajoutes, commites et pousses avant que leurs liens GitHub soient accessibles par une autre personne.

## Etat actuel du projet

Le depot contient deja une premiere plateforme MaxCut orientee recherche :

- un coeur Python pour Quantum MaxCut, Hamiltoniens QMC/XY, diagonalisation exacte et couplages geometriques ;
- un pipeline hybride avec embedding geometrique, simulation Pulser, relaxation SDP et rounding ;
- une API FastAPI pour generer des graphes et lancer des jobs de pipeline ;
- une application React/Vite utilisable comme console web ;
- une interface Streamlit plus experimentale pour regler les schedules d'annealing ;
- des scripts de benchmark et d'analyse par familles de graphes.

La plateforme est donc deja pertinente pour MaxCut. La suite naturelle est de factoriser le projet autour d'une couche QUBO commune, puis de brancher MaxCut, TSP et coloration de graphe comme problemes differents utilisant les memes briques d'execution, de benchmark et de visualisation.

## Carte du depot

| Besoin | Fichier ou dossier | Lien GitHub |
| --- | --- | --- |
| Lire la presentation generale | `README.md` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/README.md |
| Lancer rapidement le laboratoire Streamlit | `QUICKSTART.md` | local, a publier |
| Comprendre l'architecture | `ARCHITECTURE.md` | local, a publier |
| Interface Streamlit | `app_quantum_control_panel.py` | local, a publier |
| App web React/Vite | `app/` | https://github.com/karimelhoudaigui/quantum-maxcut/tree/main/app |
| Page QuantINA | `app/src/pages/QuantinaPage.tsx` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/app/src/pages/QuantinaPage.tsx |
| Simulateur navigateur MaxCut | `app/src/lib/localSimulator.ts` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/app/src/lib/localSimulator.ts |
| API FastAPI | `api/` | https://github.com/karimelhoudaigui/quantum-maxcut/tree/main/api |
| Schemas API | `api/schemas.py` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/api/schemas.py |
| Service pipeline API | `api/services/pipeline_service.py` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/api/services/pipeline_service.py |
| Hamiltoniens et utilitaires quantiques | `quantum_utils.py` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/quantum_utils.py |
| Optimisation des positions atomiques | `quantum_optmization.py` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/quantum_optmization.py |
| Pipeline Pulser | `quantum_pulser/` | https://github.com/karimelhoudaigui/quantum-maxcut/tree/main/quantum_pulser |
| Pipeline hybride SDP / rounding | `quantum_hybrid/` | https://github.com/karimelhoudaigui/quantum-maxcut/tree/main/quantum_hybrid |
| Backend du laboratoire de schedules | `quantum_maxcut/` | local, a publier |
| Benchmarks | `scripts/` | https://github.com/karimelhoudaigui/quantum-maxcut/tree/main/scripts |
| Resultats d'etudes par familles | `results_graph_families_full_pipeline/` | https://github.com/karimelhoudaigui/quantum-maxcut/tree/main/results_graph_families_full_pipeline |
| Deploiement GitHub Pages | `.github/workflows/deploy-pages.yml` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/.github/workflows/deploy-pages.yml |
| Lancement API + app en local | `docker-compose.yml` | https://github.com/karimelhoudaigui/quantum-maxcut/blob/main/docker-compose.yml |

## Installation locale

```bash
git clone https://github.com/karimelhoudaigui/quantum-maxcut.git
cd quantum-maxcut
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Lancer l'API :

```bash
uvicorn api.main:app --reload --port 8000
```

Lancer l'application React :

```bash
cd app
npm install
npm run dev
```

Ouvrir ensuite `http://127.0.0.1:5173`.

Lancer le laboratoire Streamlit :

```bash
streamlit run app_quantum_control_panel.py
```

## Roadmap fonctionnelle

### 1. Ajouter une couche QUBO commune

Objectif : ne plus coder chaque probleme directement dans le pipeline MaxCut, mais passer par une representation commune :

```text
Problem instance -> QUBO -> Ising/Hamiltonien -> backend classique, simule ou QPU -> resultats
```

Fichiers a creer :

- `quantum_qubo/__init__.py`
- `quantum_qubo/models.py`
- `quantum_qubo/converters.py`
- `quantum_qubo/solvers.py`
- `quantum_qubo/metrics.py`

API minimale attendue :

```python
class QuboModel:
    linear: dict[int, float]
    quadratic: dict[tuple[int, int], float]
    offset: float
    variable_labels: dict[int, str]
```

Fonctions a prevoir :

- `qubo_to_ising(qubo)`
- `ising_to_hamiltonian(ising)`
- `evaluate_qubo(qubo, bitstring)`
- `decode_solution(problem_type, bitstring)`
- `compare_classical_quantum_results(...)`

### 2. Generaliser MaxCut comme premier probleme QUBO

Etat actuel : MaxCut existe deja dans les modules `quantum_utils.py`, `quantum_hybrid/`, `quantum_pulser/`, `api/`, et `app/src/lib/localSimulator.ts`.

Action recommandee :

- garder le pipeline actuel comme reference scientifique ;
- ajouter un adaptateur `quantum_qubo/problems/maxcut.py` ;
- relier cet adaptateur a l'API sans casser les endpoints existants ;
- conserver les benchmarks actuels comme tests de regression.

Formulation QUBO MaxCut, pour variables binaires `x_i` :

```text
max sum_{(i,j)} w_ij (x_i + x_j - 2 x_i x_j)
min -sum_{(i,j)} w_ij (x_i + x_j - 2 x_i x_j)
```

### 3. Ajouter le TSP

Objectif : integrer le probleme du voyageur de commerce sous forme QUBO.

Variables :

```text
x_{v,t} = 1 si la ville v est visitee au temps t
```

Contraintes :

- chaque ville est visitee exactement une fois ;
- chaque position temporelle contient exactement une ville ;
- la fonction objectif minimise la longueur totale du cycle.

Formulation :

```text
min A * sum_v (1 - sum_t x_{v,t})^2
  + A * sum_t (1 - sum_v x_{v,t})^2
  + B * sum_t sum_{u,v} d_{u,v} x_{u,t} x_{v,t+1}
```

Fichiers a creer :

- `quantum_qubo/problems/tsp.py`
- `examples/example_tsp_qubo.py`
- `tests/test_tsp_qubo.py`

Frontend :

- ajouter un module TSP dans `app/src/config/simulations.ts` ;
- creer une page ou un panneau de configuration TSP ;
- afficher la route decodee, le cout, et la comparaison avec une baseline classique.

### 4. Ajouter la coloration de graphe

Variables :

```text
x_{v,c} = 1 si le sommet v prend la couleur c
```

Contraintes :

- chaque sommet a exactement une couleur ;
- deux sommets adjacents ne doivent pas avoir la meme couleur.

Formulation :

```text
min A * sum_v (1 - sum_c x_{v,c})^2
  + B * sum_{(u,v) in E} sum_c x_{u,c} x_{v,c}
```

Fichiers a creer :

- `quantum_qubo/problems/graph_coloring.py`
- `examples/example_graph_coloring_qubo.py`
- `tests/test_graph_coloring_qubo.py`

Frontend :

- permettre de choisir le nombre de couleurs ;
- afficher la coloration trouvee ;
- signaler les conflits d'aretes ;
- comparer avec une heuristique classique simple.

### 5. Augmenter la taille des problemes traitables

Le code actuel construit encore des objets denses pour certaines operations quantiques, notamment dans `quantum_utils.py`, ce qui limite fortement la taille simulable en local. La priorite est de separer les niveaux de calcul :

| Niveau | Usage | Strategie |
| --- | --- | --- |
| Exact dense | petites instances, validation scientifique | garder `numpy.linalg.eigh` pour `n <= 12` environ |
| Sparse | instances moyennes | utiliser `scipy.sparse`, `eigsh`, operateurs paresseux |
| Tensor network / MPS | circuits et dynamiques plus grands | backend dedie, benchmark separe |
| HPC distribue | gros jobs et sweeps | scripts batch, MPI, Dask/Ray ou Qaptiva-HPC selon backend |
| Hardware QPU | validation experimentale | TGCC / Qaptiva / Pasqal Ruby |

Actions techniques :

- introduire un module `quantum_backends/` ;
- definir une interface `BackendRunner` commune ;
- isoler les appels a Pulser et Qutip dans un backend `local_pulser`;
- ajouter un backend `qaptiva` pour la soumission via TGCC ;
- ajouter des scripts batch sous `hpc/`;
- eviter les matrices `2**n x 2**n` quand le calcul peut etre fait par echantillonnage, sparse linear algebra ou evaluation QUBO directe.

Fichiers proposes :

- `quantum_backends/base.py`
- `quantum_backends/local_exact.py`
- `quantum_backends/local_pulser.py`
- `quantum_backends/qaptiva.py`
- `hpc/README.md`
- `hpc/tgcc_run_quantina.sh`
- `hpc/qaptiva_pulser_job.py`

### 6. Acces TGCC / CEA / hardware quantique

Source officielle : https://www-dcc.extra.cea.fr/tgcc-public/en/html/toc/QuantumSoftwareStack.html

Points importants identifies dans la documentation TGCC :

- l'environnement quantique TGCC est fourni via le conteneur `ccc-quantum` ;
- les calculs peuvent etre lances avec `pcocc-rs run ccc-quantum` ou `ccc_mprun -C ccc-quantum ...` ;
- l'acces aux ressources quantiques TGCC passe par un projet eDARI ;
- Qaptiva permet l'emulation et sert aussi de passerelle vers des QPU physiques ;
- la stack inclut notamment myQLM, Pulser, Pulser-myQLM et Perceval ;
- Qaptiva est annonce pour l'emulation exacte jusqu'a 40 qubits ;
- Ruby correspond au QPU Pasqal a atomes de rubidium, avec jusqu'a 100 atomes ;
- Lucy correspond au QPU photonique Quandela ;
- les jobs Pasqal Ruby passent par l'interface myQLM depuis le supercalculateur Irene.

Demande d'acces a preparer :

1. Decrire le projet QuantINA/HybQuant et l'objectif scientifique.
2. Demander un acces eDARI aux ressources TGCC.
3. Demander l'acces au conteneur `ccc-quantum`.
4. Demander l'acces aux partitions de calcul et, si besoin, de visualisation.
5. Demander explicitement l'acces Qaptiva, puis QPU Pasqal Ruby pour les tests Pulser.
6. Preciser les cas d'usage : MaxCut, TSP, coloration, comparaison classique/simule/QPU.
7. Preciser les besoins : nombre de qubits/atomes, nombre de shots, taille de batch, stockage de resultats, duree de campagne.

Exemple de message court :

```text
Bonjour,

Dans le cadre du projet QuantINA/HybQuant, nous souhaitons demander un acces eDARI aux ressources TGCC pour evaluer une plateforme d'optimisation combinatoire quantique/hybride.

Le projet compare des formulations QUBO de MaxCut, TSP et coloration de graphe sur trois niveaux d'execution : simulations classiques locales/HPC, simulations quantiques via Pulser/Qaptiva, puis executions sur hardware quantique disponible, notamment Pasqal Ruby lorsque l'instance est compatible.

Nous souhaitons acceder au conteneur ccc-quantum, a Qaptiva, aux ressources de calcul/visualisation necessaires, et preparer une campagne de benchmarks reproductibles.

Cordialement,
```

### 7. Documentation en ligne complete

Objectif : transformer les fichiers README actuels en documentation navigable.

Structure recommandee :

```text
docs/
  index.md
  quickstart.md
  architecture.md
  problems/
    maxcut.md
    tsp.md
    graph_coloring.md
    qubo.md
  algorithms/
    pulser.md
    sdp_rounding.md
    exact_baselines.md
  api/
    fastapi.md
  frontend/
    react_app.md
    streamlit_lab.md
  hpc/
    tgcc.md
    qaptiva.md
  examples/
    reproducible_maxcut.md
    reproducible_tsp.md
```

Outil recommande : MkDocs Material.

Taches :

- ajouter `mkdocs.yml` ;
- deplacer ou recopier les informations de `README.md`, `QUICKSTART.md`, `ARCHITECTURE.md` et `README_CONTROL_PANEL.md` ;
- publier la documentation sur un domaine non personnel ;
- ajouter des exemples reproductibles avec commandes, entrees, sorties attendues et donnees de test.

### 8. Plateforme en ligne hors GitHub

Etat actuel :

- l'app React est deployee via GitHub Pages ;
- le frontend contient un simulateur navigateur local, donc il peut fonctionner sans backend pour une demo ;
- le backend FastAPI existe, mais il doit etre heberge separement pour lancer les vrais pipelines Python.

Plan de deploiement recommande :

| Composant | Option simple | Option institutionnelle |
| --- | --- | --- |
| Frontend React | Vercel, Netlify, Cloudflare Pages | serveur web LaBRI/HybQuant |
| API FastAPI | Render, Railway, Fly.io, VPS Docker | serveur institutionnel ou cloud projet |
| Domaine | `quantina.fr` ou sous-domaine | `quantina.labri.fr` / `quantina.hybquant.fr` |
| Docs | MkDocs sur le meme domaine | sous-chemin `/docs` |

Architecture cible :

```text
https://quantina.<domaine>        -> app React
https://api.quantina.<domaine>    -> FastAPI
https://quantina.<domaine>/docs   -> documentation
```

Variables a configurer :

- `VITE_API_BASE_URL=https://api.quantina.<domaine>`
- CORS FastAPI pour autoriser le domaine frontend ;
- service systemd ou container Docker pour l'API ;
- CI/CD de build frontend ;
- certificat HTTPS.

## Priorites proposees

### Court terme

1. Nettoyer et commiter les fichiers de documentation deja presents.
2. Ajouter `ROADMAP_QUANTINA.md` comme guide de reprise.
3. Creer la couche `quantum_qubo`.
4. Porter MaxCut vers cette couche sans casser le pipeline actuel.
5. Ajouter une page de documentation minimale en ligne.

### Moyen terme

1. Ajouter TSP et coloration de graphe.
2. Ajouter les endpoints API generiques `problem -> qubo -> solve`.
3. Brancher les nouveaux problemes dans l'app React.
4. Ajouter des tests automatiques sur les formulations QUBO.
5. Preparer les scripts TGCC/Qaptiva.

### Long terme

1. Deployer sur un domaine non personnel.
2. Obtenir l'acces eDARI/TGCC.
3. Lancer une campagne de benchmarks sur HPC.
4. Comparer local dense, sparse/HPC, Qaptiva et QPU.
5. Publier les resultats et exemples reproductibles.

## Prochaines pull requests recommandees

1. `docs/roadmap-quantina`
   - ajouter ce document ;
   - ajouter un index documentation minimal ;
   - verifier les liens.

2. `feature/qubo-core`
   - creer `quantum_qubo/` ;
   - ajouter MaxCut QUBO ;
   - ajouter tests unitaires.

3. `feature/tsp-coloring`
   - ajouter TSP ;
   - ajouter coloration de graphe ;
   - ajouter exemples reproductibles.

4. `feature/problem-api`
   - ajouter schemas generiques de problemes ;
   - ajouter endpoints FastAPI ;
   - connecter le frontend.

5. `feature/hpc-qaptiva`
   - ajouter `quantum_backends/` ;
   - ajouter scripts TGCC ;
   - documenter la procedure d'execution.

6. `deploy/non-personal-domain`
   - choisir l'hebergeur ;
   - deployer frontend, API et docs ;
   - configurer domaine et HTTPS.
