# Quantum MaxCut - Rydberg Proxy with Pulser

Quantum MaxCut is a research-oriented Python framework for studying MaxCut mappings on neutral-atom arrays. It implements a full pipeline from weighted graph embedding to Rydberg XY proxy evaluation, Pulser pulse-sequence preparation, hybrid SDP rounding, and result visualization.

The repository is designed to support:
- geometric embedding of graph weights via distance-dependent couplings,
- exact quantum benchmark references for small graphs,
- smooth adiabatic-style Pulser sequences,
- hybrid classical/quantum reconstruction with SDP and rounding,
- structure-aware graph studies and dashboard exploration.

## Mathematical Formulation

The main quantum problems inside this repository are:

- The Quantum MaxCut Hamiltonian:

```math
H_{\mathrm{qmc}} = - \sum_{(i,j)\in E} w_{ij} \left(I - X_i X_j - Y_i Y_j - Z_i Z_j\right)
```

- The Rydberg XY proxy Hamiltonian:

```math
H_r = \sum_{(i,j)\in E} J_{ij} \left(X_i X_j + Y_i Y_j\right),\qquad J_{ij} = \frac{C_3}{r_{ij}^3}
```

- The geometry mapping objective for atomic positions $\mathbf r$:

```math
f(\mathbf r) = \sqrt{\frac{\sum_{(i,j)} \left(J_{ij}(\mathbf r) - w_{ij}\right)^2}{\sum_{(i,j)} w_{ij}^2}}
```

- The proxy quality ratio used to compare states:

```math
\mathrm{Ratio} = \frac{\langle \psi_r | H_{\mathrm{qmc}} | \psi_r \rangle}{E_0(H_{\mathrm{qmc}})}
```

## Repository Layout

```text
├── quantum_main.py                    # Main experiment launcher
├── quantum_utils.py                   # Hamiltonians, Pauli operators, exact diagonalization, utility functions
├── quantum_optmization.py             # Atom-position optimization for geometry embedding
├── quantum_benchmark.py               # Benchmark pipelines over random graph instances
├── quantum_plot.py                    # Matplotlib figure generation helpers
├── quantum_io.py                      # JSON/CSV serialization and result I/O helpers
├── quantum_config.py                  # Global numerical constants and defaults
├── graph_structure_study.py           # Graph-structure analysis and classification
├── api/                               # FastAPI API for graph generation and pipeline jobs
├── app/                               # React 18 + TypeScript + Vite production console
├── docker-compose.yml                 # Starts API and frontend together
├── requirements.txt                   # Python dependency manifest
├── .github/workflows/python-app.yml   # GitHub Actions CI workflow
│
├── quantum_pulser/                    # Pulser-based state preparation and evaluation
│   ├── __init__.py                    # Public exports for the Pulser module
│   ├── pulser_core.py                 # Sequence simulation and correlator extraction
│   ├── pulser_sequences.py            # Adiabatic, piecewise, and smooth sequences
│   ├── pulser_eval.py                 # Evaluation of Pulser final states
│   ├── pulser_search.py               # Random search / grid search utilities
│   ├── pulser_smooth.py               # Smooth-sequence implementation and sweep tools
│   └── pulser_graph_study.py          # Graph study helper functions for smooth sequences
│
├── quantum_hybrid/                    # Hybrid SDP and rounding pipeline
│   ├── __init__.py
│   ├── hybrid_core.py                 # Hybrid optimization primitives and MaxCut helpers
│   ├── hybrid_eval.py                 # Hybrid evaluation and scoring helpers
│   ├── hybrid_graph_study.py          # High-level hybrid study scripts and plot helpers
│   ├── hybrid_rounding.py             # SDP rounding to product states and hyperplane rounding
│   └── hybrid_sdp.py                  # SDP relaxation over pseudo-moment matrices
│
├── quantum_frontend.py                # Lightweight local dashboard server
├── quantum_frontend_plots.py          # Plot generation code used by the dashboard
└── frontend/                          # Static browser UI
    ├── index.html
    ├── styles.css
    └── app.js
```

## What’s New

This repository now contains the full `quantum_hybrid/` pipeline and the new `graph_structure_study.py` module, with:
- hybrid SDP relaxation of proxy correlators,
- product-state rounding from the SDP solution,
- graph categorization by density, degree, hub structure and family,
- graph-structure plots and summary JSON outputs,
- a dedicated family-wise hybrid pipeline study at `n=4` avec sorties CSV/PNG dans `results_graph_families_full_pipeline/`.

## Dependencies

The project uses Python and these core scientific libraries:

- `numpy`
- `scipy`
- `matplotlib`
- `qutip`
- `pulser`
- `pulser-simulation`
- `cvxpy`

Legacy/optional experiments may also require:

- `torch`, `torchvision`, `torchaudio`
- `pulser-diff` (external repository)

## Installation

```bash
git clone https://github.com/karimelhoudaigui/quantum-maxcut.git
cd quantum-maxcut
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Modern Web Application

The SaaS-ready console is split into a FastAPI backend and a React/Vite frontend.

Backend:

```bash
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
```

Frontend:

```bash
cd app
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

The Phase 1 surface includes graph generation, optimized atom coordinates when available, asynchronous pipeline jobs, and live polling for the four production steps: geometry embedding, Pulser, SDP, and rounding.

To launch both services together:

```bash
docker compose up
```

Production frontend:

```text
https://karimelhoudaigui.github.io/quantum-maxcut/
```

The GitHub Pages workflow builds the React app from `app/`. Set the repository variable
`VITE_API_BASE_URL` if the production frontend should call a hosted FastAPI backend.

API endpoints:

- `POST /api/graph/generate`: generate path, cycle, star, complete, or random weighted graphs.
- `POST /api/pipeline/run`: start the full Pulser to SDP to rounding pipeline.
- `GET /api/pipeline/{job_id}/status`: poll status and partial step metrics.
- `GET /api/results/{family}`: read existing family-level CSV summaries.

### Optional legacy setup

```bash
pip install torch torchvision torchaudio
git clone https://github.com/pasqal-io/pulser-diff.git
cd pulser-diff
pip install .
```

## Usage

### Configure the main runner

`quantum_main.py` uses boolean flags at the top of the file to select a single execution mode. Only one mode should be `True` at a time.

Example configuration:

```python
RUN_BENCHMARK = False
RUN_SINGLE_TEST = False
RUN_PULSER_EXPERIMENT = False
RUN_PULSER_PARAM_SEARCH = False
RUN_PULSER_GRID_SEARCH = False
RUN_PULSER_SMOOTH_EXPERIMENT = False
RUN_PULSER_SMOOTH_GRID_SEARCH = False
RUN_HYBRID_SINGLE_EXPERIMENT = False
RUN_HYBRID_GRAPH_STUDY = False
RUN_GRAPH_STRUCTURE_STUDY = True
```

### Run the selected experiment

```bash
source .venv/bin/activate
python quantum_main.py
```

Pour lancer la nouvelle étude de la pipeline hybride par famille de graphes :

```bash
python scripts/run_graph_family_full_pipeline.py --n 4 --num-instances 100 --seed 123
```

Pour lancer l'étude de mise à l'échelle par famille à n=4 :

```bash
python scripts/run_graph_family_scaling_analysis.py --n 4 --graph-sizes 20 50 100 150 --seed 123
```

## Experiment Modes

- `RUN_BENCHMARK`: benchmark proxy-quality and geometric embedding across random graphs.
- `RUN_SINGLE_TEST`: run a single exact instance and display diagnostics.
- `RUN_PULSER_EXPERIMENT`: execute standard Pulser adiabatic sequences.
- `RUN_PULSER_PARAM_SEARCH`: random-search piecewise pulse parameters.
- `RUN_PULSER_GRID_SEARCH`: grid-search adiabatic pulse parameters.
- `RUN_PULSER_SMOOTH_EXPERIMENT`: run the selected smooth sequence on a pilot graph.
- `RUN_PULSER_SMOOTH_GRID_SEARCH`: grid-search smooth sequence parameters.
- `RUN_PULSER_SMOOTH_GRAPH_STUDY`: evaluate the best smooth sequence across random `n=4` graphs.
- `RUN_HYBRID_SINGLE_EXPERIMENT`: one hybrid SDP + rounding experiment on a single instance.
- `RUN_HYBRID_GRAPH_STUDY`: hybrid pipeline study over multiple graph instances.
- `RUN_GRAPH_STRUCTURE_STUDY`: analyze graph structural properties and their impact on mapping/proxy quality.

## Local Dashboard

The repository includes a local dashboard served from `quantum_frontend.py`. It is a static browser UI with no frontend build step.

Start it with:

```bash
source .venv/bin/activate
python quantum_frontend.py
```

Then open:

```text
http://127.0.0.1:8765
```

### Dashboard views

- Benchmark proxy results
- Smooth grid-search results
- Smooth graph-study results

The dashboard reads JSON output files and generates SVG/PNG visualizations automatically.

## Hybrid & Graph Structure Study

### Hybrid pipeline

The `quantum_hybrid/` module provides:
- SDP relaxation from measured/estimated correlators,
- pseudo-moment matrix construction,
- product-state rounding via randomized projection,
- additional MaxCut rounding baselines.

The SDP formulation in this project is built over a pseudo-moment matrix $\Delta$ indexed by
operators $\{I, X_1, Y_1, X_2, Y_2, \dots, X_n, Y_n\}$ with constraints:

```math
\Delta \succeq 0, \qquad \Delta_{I,I} = 1, \qquad \Delta_{X_i,X_i} = \Delta_{Y_i,Y_i} = 1
```

and fixed correlator entries:

```math
\Delta_{X_i,X_j} = \langle X_i X_j \rangle, \qquad \Delta_{Y_i,Y_j} = \langle Y_i Y_j \rangle.
```

The objective is:

```math
\min \operatorname{Tr}(C \Delta)
```

where $C$ encodes the proxy cost matrix for $H_r$.

### Graph structure analysis

`graph_structure_study.py` computes graph descriptors and categories such as:
- density, average degree, max degree,
- clustering coefficient, sparsity, degree centralization,
- graph family labels like `path`, `cycle`, `star`, `complete`, `generic_random`.

It evaluates how graph structure impacts mapping error and proxy/hybrid performance.

## Output Files

The repository generates result files and figures such as:

```text
benchmark_summary.csv
benchmark_full.json
pulser_adiabatic_scan.json
pulser_adiabatic_grid_search.json
pulser_adiabatic_grid_search_best.json
pulser_smooth_experiment.json
pulser_smooth_grid_search.json
pulser_smooth_grid_search_best.json
pulser_smooth_graph_study_n4.json
pulser_smooth_graph_study_n4_summary.json
results_graph_families_full_pipeline/summary_by_family.csv
results_graph_families_full_pipeline/all_instances_results.csv
```

and figures such as:

```text
figure1_mapping_error_vs_n.png
figure2_ratio_vs_n.png
figure3_ratio_vs_mapping_error.png
figure_smooth_graph_study_n4.png
figure_smooth_grid_search.png
results_graph_families_full_pipeline/ratio_hybrid_by_graph_family.png
results_graph_families_full_pipeline/gain_by_graph_family.png
results_graph_families_full_pipeline/pulser_vs_hybrid_by_family.png
results_graph_families_full_pipeline/mapping_error_by_family_full_pipeline.png
results_graph_families_full_pipeline/ratio_vs_mapping_error_by_family.png
```

Generated JSON, CSV and PNG files are excluded by `.gitignore`.

## CI / Validation

A GitHub Actions workflow is configured in `.github/workflows/python-app.yml` to:
- install Python dependencies from `requirements.txt`,
- compile all Python files to verify syntax.

## Notes

- The repository is research-oriented and currently focused on small systems (`n <= 8`) where exact diagonalization and SDP are feasible.
- The directory `pulser-diff/` is an optional external experiment package and is not required for the main workflow.
- `quantum_pulser_all/` contains additional legacy helper scripts from earlier PulserDiff experiments.

## Author

Karim El Houdaigui

## License

MIT License
