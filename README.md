# Quantum MaxCut - Rydberg Proxy with Pulser

Quantum MaxCut is a research-oriented framework for studying MaxCut mappings on neutral-atom arrays. It combines exact Hamiltonian utilities, geometric atom-position optimization, Pulser sequence construction, pulse-parameter searches, smooth annealing protocols, random-graph studies, and a lightweight local frontend for inspecting results and generating figures.

The current codebase focuses on an XY Rydberg proxy Hamiltonian and on understanding when performance is limited by the geometric embedding versus by the dynamical state preparation.

## Features

- **Quantum MaxCut formulation**: builds the QMC Hamiltonian and computes exact reference energies.
- **Rydberg XY proxy**: maps weighted graph edges to geometry-induced XY couplings.
- **Atom-position optimization**: optimizes 2D atom coordinates to match target edge weights.
- **Pulser sequence toolkit**: builds adiabatic, piecewise, and smooth microwave-control sequences.
- **Smooth pulse studies**: evaluates fixed smooth protocols, grid-searches their parameters, and studies transfer across random graphs.
- **Benchmarking suite**: evaluates proxy quality across many random instances and system sizes.
- **Article-ready plots**: generates PNG figures for benchmark, grid-search, and multi-graph analyses.
- **Local frontend dashboard**: choose an experiment, inspect metrics/tables, preview plots, and generate PNG outputs from a browser.

## Project Structure

```text
├── quantum_main.py                    # Main experiment launcher
├── quantum_utils.py                   # Hamiltonians, operators, exact diagonalization, couplings
├── quantum_optmization.py             # Atom-position optimization
├── quantum_benchmark.py               # Benchmark pipelines over random graph instances
├── quantum_plot.py                    # Matplotlib figure generation
├── quantum_io.py                      # JSON/CSV serialization helpers
├── quantum_config.py                  # Configuration constants
│
├── quantum_pulser/                    # Pulser package
│   ├── __init__.py                    # Public exports
│   ├── pulser_core.py                 # Shared state, simulation, correlator utilities
│   ├── pulser_sequences.py            # Classical annealing / adiabatic / piecewise sequences
│   ├── pulser_eval.py                 # Evaluation functions for standard and piecewise sequences
│   ├── pulser_search.py               # Random search and adiabatic grid search
│   ├── pulser_smooth.py               # Smooth sequence, evaluation, and grid search
│   └── pulser_graph_study.py          # Fixed smooth sequence on random graph ensembles
│
├── quantum_frontend.py                # Local web server for result exploration
├── quantum_frontend_plots.py          # Extra PNG plot helpers for the frontend
└── frontend/
    ├── index.html                     # Browser UI
    ├── styles.css                     # Dashboard styling
    └── app.js                         # Frontend logic and SVG plots
```

Note: the historical filename is `quantum_optmization.py` in this repository.

## Installation

### Requirements

- Python 3.9+
- NumPy
- SciPy
- Matplotlib
- QuTiP
- Pulser
- pulser-simulation
- CVXPY (pour les modes SDP / hybride)

PulserDiff/PyTorch are only needed for the older PulserDiff optimization experiments, not for the core smooth-sequence and frontend workflow.

### Setup

```bash
git clone https://github.com/karimelhoudaigui/quantum-maxcut.git
cd quantum-maxcut

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

Optional, for PulserDiff-related experiments:

```bash
pip install torch torchvision torchaudio
git clone https://github.com/pasqal-io/pulser-diff.git
cd pulser-diff
pip install .
```

## Usage

### Run Experiments

Edit the configuration flags at the top of `quantum_main.py`. Exactly one mode should be enabled at a time:

```python
RUN_BENCHMARK = False
RUN_SINGLE_TEST = False
RUN_PULSER_EXPERIMENT = False
RUN_PULSER_PARAM_SEARCH = False
RUN_PULSER_GRID_SEARCH = False
RUN_PULSER_SMOOTH_EXPERIMENT = False
RUN_PULSER_SMOOTH_GRID_SEARCH = False
RUN_PULSER_SMOOTH_GRAPH_STUDY = True
```

Then run:

```bash
source .venv/bin/activate
python quantum_main.py
```

### Experiment Modes

- **RUN_BENCHMARK**: benchmarks the exact proxy quality across random graph instances and saves CSV/JSON summaries.
- **RUN_SINGLE_TEST**: optimizes one small graph and prints geometry/coupling diagnostics.
- **RUN_PULSER_EXPERIMENT**: runs a standard Pulser adiabatic sequence and scans annealing times.
- **RUN_PULSER_PARAM_SEARCH**: random-searches piecewise pulse parameters.
- **RUN_PULSER_GRID_SEARCH**: grid-searches adiabatic sequence parameters.
- **RUN_PULSER_SMOOTH_EXPERIMENT**: evaluates the selected smooth sequence on a pilot graph.
- **RUN_PULSER_SMOOTH_GRID_SEARCH**: grid-searches smooth pulse parameters.
- **RUN_PULSER_SMOOTH_GRAPH_STUDY**: evaluates the fixed optimized smooth sequence over random weighted graphs at `n=4`.

## Local Dashboard

The repository includes a modern local dashboard for exploring experiment outputs without opening notebooks or manually parsing JSON files. It is built with plain HTML/CSS/JavaScript and a lightweight Python standard-library server, so it does not require Streamlit, Dash, Plotly, or a frontend build step.

Start it with:

```bash
source .venv/bin/activate
python quantum_frontend.py
```

Open:

```text
http://127.0.0.1:8765
```

The dashboard detects available result files and exposes three experiment views:

### 1. Benchmark proxy

This view summarizes the large-scale proxy benchmark. It is meant to answer:

- how the Rydberg proxy quality changes with the number of qubits `n`
- whether the geometric embedding error remains controlled across graph instances
- how the proxy approximation ratio correlates with mapping error

Input files:

```text
benchmark_summary.csv
benchmark_full.json
```

Displayed outputs:

- number of benchmarked instances
- `n` range
- average proxy ratio
- average mapping error
- ratio-by-system-size plot
- ratio-versus-mapping diagnostic scatter plot

PNG generation:

```text
figure1_mapping_error_vs_n.png
figure2_ratio_vs_n.png
figure3_ratio_vs_mapping_error.png
```

### 2. Smooth grid search

This view analyzes the parameter search over smooth Pulser sequences. It is meant to identify which pulse schedule gives the best final-state quality.

Input files:

```text
pulser_smooth_grid_search.json
pulser_smooth_grid_search_best.json
```

Displayed outputs:

- total number of tested parameter combinations
- best Pulser ratio
- best proxy overlap
- best fall duration
- top-20 smooth schedules ranked by `ratio_pulser`
- ratio-versus-overlap diagnostic scatter plot

PNG generation:

```text
figure_smooth_grid_search.png
```

### 3. Smooth multi-graph study

This view studies whether the best smooth sequence found on a pilot case transfers to several random weighted graphs at `n=4`. It is the main visualization for the claim that the sequence produces non-trivial states across varied instances, while performance remains graph-dependent.

Input files:

```text
pulser_smooth_graph_study_n4.json
pulser_smooth_graph_study_n4_summary.json
```

Displayed outputs:

- number of random graphs
- mean Pulser ratio
- min/max Pulser ratio
- maximum mapping error
- bar plot of `ratio_pulser` per graph
- proxy-exact reference curve
- mapping-error versus ratio diagnostic scatter plot

PNG generation:

```text
figure_smooth_graph_study_n4.png
```

Use the **Générer PNG** button to regenerate figure files from the selected experiment.

## Smooth Sequence Study

The optimized smooth sequence used in the multi-graph study is:

```python
omega_prep = 2 * np.pi * 2.0
prep_duration = 125

omega_peak = 2 * np.pi * 2.0
rise_duration = 1000
hold_duration = 1000
fall_duration = 26000

delta_start = np.pi
delta_hold = -np.pi / 2
delta_end = -np.pi

sampling_rate = 0.05
scale = 15.5
```

A study over 10 random graphs at `n=4` showed that the fixed smooth sequence produces non-trivial states on varied instances. The average Pulser ratio is around `0.42`, with values ranging roughly from `0.23` to `0.62`. The geometric mapping error remains very small across the instances, suggesting that the dominant limitation is not the atom-position embedding but the dynamical preparation.

## Output Files

Typical generated files include:

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

figure1_mapping_error_vs_n.png
figure2_ratio_vs_n.png
figure3_ratio_vs_mapping_error.png
figure_smooth_graph_study_n4.png
figure_smooth_grid_search.png
```

The repository `.gitignore` excludes generated JSON/CSV/PNG files by default.

## Core Algorithms

### 1. Geometric Embedding

Target graph weights are compared to geometry-induced couplings:

```text
J_ij = c3 / R_ij^3
```

The optimizer minimizes the relative mapping error between target weights and available geometric couplings.

### 2. XY Proxy Hamiltonian

The proxy Hamiltonian uses geometry-induced XY couplings:

```text
H_r = Σ_ij J_ij (X_i X_j + Y_i Y_j)
```

This proxy is evaluated against the Quantum MaxCut Hamiltonian to measure how well the Rydberg geometry encodes the target instance.

### 3. Smooth Dynamical Preparation

The smooth sequence separates the protocol into:

- preparation pulse
- smooth rise to `omega_peak`
- optional hold plateau
- smooth fall with detuning sweep

This structure makes it easier to study which part of the protocol controls final-state quality.

## References

- Pulser: https://github.com/pasqal-io/Pulser
- PulserDiff: https://github.com/pasqal-io/pulser-diff
- QuTiP: https://qutip.org/
- MaxCut on Neutral Atoms: arXiv:2505.16744

## Author

Karim Elhoudaigui

## License

MIT License
