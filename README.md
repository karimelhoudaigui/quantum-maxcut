# Quantum MaxCut - Rydberg Proxy with PulserDiff Optimization

A comprehensive quantum computing framework implementing the MaxCut problem using Rydberg atom arrays and neutral-atom quantum simulation via the Pulser framework.

## Features

- **MaxCut Problem Formulation**: Direct implementation of the MaxCut optimization problem on quantum hardware
- **Rydberg Proxy**: XY-interaction proxy Hamiltonian for efficient mapping of MaxCut constraints
- **Atom Position Optimization**: Geometric optimization of qubit positions to achieve target interaction couplings
- **Pulser Integration**: Full Pulser framework integration for sequence design and simulation
- **PulserDiff Autodiff**: PyTorch-based automatic differentiation for pulse sequence optimization
- **Benchmarking Suite**: Comprehensive benchmarking tools for performance analysis across problem sizes

## Project Structure

```
├── quantum_main.py              # Main execution script
├── quantum_utils.py             # Core utility functions (Hamiltonians, QMC operators)
├── quantum_optmization.py       # Position optimization algorithms
├── quantum_pulser.py            # Pulser sequence building and evaluation
├── quantum_pulser_opt.py        # PulserDiff-based pulse optimization
├── quantum_benchmark.py         # Benchmarking and evaluation tools
├── quantum_plot.py              # Visualization utilities
├── quantum_io.py                # File I/O and data serialization
└── quantum_config.py            # Configuration constants
```

## Installation

### Requirements
- Python 3.9+
- PyTorch 2.0+
- Pulser 1.6.6+
- PulserDiff 0.1.0+
- NumPy, SciPy, Matplotlib
- QuTiP 5.0+

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/quantum-maxcut
cd quantum-maxcut

# Install dependencies
pip install pulser torchvision torchaudio
git clone https://github.com/pasqal-io/pulser-diff.git
cd pulser-diff
pip install .
```

## Usage

### Run Main Experiments

```bash
python quantum_main.py
```

The script supports multiple execution modes (configurable in `quantum_main.py`):

- **RUN_PULSER_EXPERIMENT**: Standard Pulser XY annealing with time scanning
- **RUN_BENCHMARK**: Large-scale benchmarking across problem sizes
- **RUN_SINGLE_TEST**: Single problem instance debugging

### Customize Configuration

Edit the configuration section in `quantum_main.py`:

```python
RUN_PULSER_EXPERIMENT = True
RUN_BENCHMARK = False
RUN_SINGLE_TEST = False

T_values = [500, 1000, 2000, 4000, 8000, 12000, 16000, 20000]  # Annealing times (µs)
sampling_rate = 0.05  # Simulation sampling rate
```

## Key Algorithms

### 1. Position Optimization
Minimizes geometric mapping error between target MaxCut couplings and Rydberg interaction geometry.

### 2. XY Proxy Hamiltonian
Implements XY-mode MicroWave drive control on neutral atom arrays:
$$H(t) = H_r + \frac{\Omega(t)}{2}\sum_i X_i$$

### 3. Pulse Sequence Optimization
Uses PyTorch autodifferentiation with PulserDiff to optimize constant-pulse sequences.

## Results

### Typical Performance Metrics

- Mapping error: < 0.05% for 4-qubit problems
- Proxy overlap (H_r): > 0.95 for optimized sequences
- QMC approximation ratio: 0.8-0.9 depending on annealing time

### Output Files

- `pulser_scan_results_4atoms.json`: Annealing time scan results
- `benchmark_summary.csv`: Aggregate benchmark statistics
- `benchmark_full.json`: Detailed per-instance results

## References

- Pulser Documentation: https://github.com/pasqal-io/Pulser
- PulserDiff: https://github.com/pasqal-io/pulser-diff
- MaxCut on Neutral Atoms: arXiv:2505.16744

## Author

Karim Elhoudaigui

## License

MIT License

## Notes

- The code includes a patch to `pulser_diff/hamiltonian.py` for XY-mode support (see inline comments)
- PulserSim uses MockDevice for fast prototyping; real hardware deployment requires Pasqal-specific device config
