# Quantum Hybrid Control Lab

**Version 1.0** | A Professional Interface for Quantum Annealing Research

## 🎯 What is Quantum Hybrid Control Lab?

The Quantum Hybrid Control Lab is a modern, interactive software suite for optimizing and analyzing hybrid quantum-classical annealing schedules. It combines:

- **Pulser**: Rydberg atom simulator for neutral-atom quantum processors
- **SDP**: Semidefinite programming optimization
- **Rounding**: Classical rounding heuristics for MaxCut problems

This tool transforms complex quantum research into an elegant, user-friendly interface suitable for both researchers and engineers.

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "from quantum_maxcut import scheduler_manager; print('✓ Ready!')"
```

### Launch the Interactive Dashboard

```bash
# Start the Streamlit interface
streamlit run app_quantum_control_panel.py

# The browser will open at http://localhost:8501
```

### Run Command-Line Benchmarks

```bash
# 1D parameter sweep
python scripts/run_schedule_benchmark.py \
  --param fall_duration \
  --min 100 --max 1500 --steps 10 \
  --plot

# 2D grid sweep
python scripts/run_schedule_benchmark.py --grid \
  --param1 omega_peak --min1 2 --max1 15 --steps1 5 \
  --param2 fall_duration --min2 100 --max2 1500 --steps2 5
```

## 📊 Interface Overview

### Dashboard (`Dashboard`)
- Quick overview of current configuration
- Summary of recent results
- Key metrics at a glance

### Schedule Editor (`Schedule Editor`)
- Intuitive sliders for all annealing parameters
- Real-time waveform visualization
- Hardware constraint validation
- **Key Parameters:**
  - `omega_prep`: Preparation pulse amplitude (0-20 MHz)
  - `omega_peak`: Peak Rydberg coupling (0.5-20 MHz)
  - `prep_duration`: Prep phase duration (10-300 ns)
  - `rise_duration`: Ramp-up duration (10-500 ns)
  - `hold_duration`: Hold plateau (10-2000 ns)
  - `fall_duration`: Anneal-down/cooling phase (10-2000 ns)
  - `delta_start`: Initial detuning (-150 to 0 MHz)
  - `delta_hold`: Hold detuning (-150 to 50 MHz)
  - `delta_end`: Final detuning (-150 to 50 MHz)

### Run Simulation (`Run Simulation`)
- Execute the full hybrid pipeline
- Monitor progress with status indicators
- View immediate results:
  - Pulser ratio only
  - Product rounding ratio
  - Hybrid winner (max of both)
- Compare performance metrics

### Comparison Tool (`Comparison Tool`)
- Compare two different schedules side-by-side
- Visualize waveform differences
- Understand parameter sensitivity

### Parameter Sweep (`Parameter Sweep`)
- Generate systematic parameter studies
- Sweep single parameters or 2D grids
- Validate all configurations automatically

### Results Gallery (`Results Gallery`)
- Browse all simulation results
- Compare multiple runs
- Export data for further analysis

### Export (`Export`)
- Save schedules as JSON
- Download waveform plots (PNG)
- Export results as CSV
- Ready for LaTeX/publication

## 🏗️ Architecture

### Backend Modules

#### `quantum_maxcut/scheduler_manager.py`
Core data structures and execution engine:

```python
# Define a schedule
config = AnnealingScheduleConfig(
    n_nodes=4,
    omega_peak=10.0,
    fall_duration=500,
    n_roundings=64,
)

# Run the hybrid pipeline
runner = HybridScheduleRunner(config)
result = runner.run_on_graph(n, target_edges)

# Access results
print(f"Pulser: {result.ratio_pulser:.4f}")
print(f"Hybrid: {result.ratio_hybrid:.4f}")
print(f"Winner: {result.winner}")
```

#### `quantum_maxcut/schedule_validation.py`
Hardware constraint checking:

```python
from quantum_maxcut.schedule_validation import ScheduleValidator

validator = ScheduleValidator(config)
validation = validator.validate()

if validation.is_valid:
    print("✓ Configuration is valid")
else:
    for error in validation.errors:
        print(f"✗ {error}")
```

#### `quantum_maxcut/schedule_visualization.py`
Professional plotting and visualization:

```python
from quantum_maxcut.schedule_visualization import SchedulePlotter

plotter = SchedulePlotter()
fig = plotter.plot_waveform(config, save_path="schedule.png")
```

### Frontend Application

#### `app_quantum_control_panel.py`
Main Streamlit application with 7 pages:

1. **Dashboard**: Overview and status
2. **Schedule Editor**: Parameter configuration with sliders
3. **Run Simulation**: Execute hybrid pipeline
4. **Comparison Tool**: Compare two schedules
5. **Parameter Sweep**: Systematic studies
6. **Results Gallery**: View all results
7. **Export**: Download data and figures

## 🔬 Workflow Examples

### Example 1: Optimize Annealing Speed

```
1. Open Schedule Editor
2. Sweep fall_duration from 100 to 1500 ns
3. Run Parameter Sweep
4. View Results Gallery
5. Identify optimal duration
6. Export findings
```

### Example 2: Study Phase Transitions

```
1. Use Comparison Tool
2. Schedule A: delta_start = -100 MHz
3. Schedule B: delta_start = -50 MHz
4. Run both simulations
5. Compare waveforms side-by-side
```

### Example 3: 2D Optimization Study

```bash
python scripts/run_schedule_benchmark.py --grid \
  --param1 omega_peak --min1 5 --max1 15 --steps1 4 \
  --param2 fall_duration --min2 200 --max2 1000 --steps2 4 \
  --plot
```

## 📈 Understanding the Results

### Key Metrics

- **Ratio Pulser**: Energy ratio $E/E_0$ from Pulser alone
  - Closer to 1 is better (lower energy)
  - Limited by Rydberg blockade physics

- **Ratio Product**: Energy ratio from classical SDP + rounding
  - Often complements Pulser
  - Best polynomial-time approximation for MaxCut

- **Ratio Hybrid**: $\max(\text{Pulser}, \text{Product})$
  - Best achievable with current pipeline
  - Winner indicator shows which method was better

- **Mapping Error**: Geometric constraint violation
  - Should be < 0.1 for good atom placement
  - Too high indicates incompatible graph structure

## 🛠️ Advanced Usage

### Custom Parameter Sweeps

```python
from quantum_maxcut.schedule_validation import PhysicalParameterSweeper

sweeper = PhysicalParameterSweeper(base_config)

# Sweep multiple parameters
configs = sweeper.sweep_omega_peak(
    omega_min=2.0,
    omega_max=15.0,
    n_steps=10,
)

# Run your own analysis
for cfg in configs:
    runner = HybridScheduleRunner(cfg)
    result = runner.run_on_graph(...)
    print(f"omega_peak={cfg.omega_peak:.1f}: {result.ratio_hybrid:.4f}")
```

### Batch Processing

```python
import pandas as pd
from quantum_maxcut.scheduler_manager import HybridScheduleRunner

configs = [...] # List of configurations
results = []

for config in configs:
    runner = HybridScheduleRunner(config)
    result = runner.run_on_graph(n, edges)
    results.append(result.to_dict())

df = pd.DataFrame(results)
df.to_csv("benchmarks.csv", index=False)
```

## 📋 Hardware Validation Rules

The validator checks:

1. **Amplitude Constraints**
   - $\omega_{prep} \leq 20$ MHz
   - $\omega_{peak} \leq 20$ MHz

2. **Duration Constraints**
   - All durations $\geq 10$ ns
   - Total duration $\leq 5000$ ns

3. **Detuning Range**
   - $-150 \leq \Delta \leq 50$ MHz
   - Warnings for extreme values

4. **Geometry**
   - Blockade radius > 4.5 μm
   - Warnings for dense configurations

5. **Adiabaticity**
   - $\Delta t$ should be >> 1/$ \Omega_{peak}$
   - Fall duration affects cooling effectiveness

## 📚 File Structure

```
QUANTUM_MAX_SOFWTARE/
├── quantum_maxcut/               # Main package
│   ├── __init__.py
│   ├── scheduler_manager.py      # Core engine
│   ├── schedule_validation.py    # Constraint checking
│   └── schedule_visualization.py # Plotting
├── app_quantum_control_panel.py  # Streamlit interface
├── scripts/
│   └── run_schedule_benchmark.py # CLI benchmarks
├── requirements.txt               # Dependencies
└── README_CONTROL_PANEL.md        # This file
```

## 🚨 Troubleshooting

### Issue: "Invalid parameters" error

**Solution**: Check the Schedule Editor for red error messages. Typical causes:
- Total duration exceeds 5000 ns
- Amplitudes exceed 20 MHz
- Individual durations < 10 ns

### Issue: Slow simulation

**Solution**: This is normal for large graphs (n > 10). The steps are:
1. Geometry optimization (~30s for n=4)
2. Pulser simulation (~5s)
3. SDP relaxation (~10s)
4. Multiple roundings (~variable)

To speed up: reduce `n_instances` or use smaller graphs for testing.

### Issue: "Import error" for quantum modules

**Solution**: Ensure all dependencies are installed:
```bash
pip install -r requirements.txt --upgrade
```

## 🎓 References

- Pulser: [Pasquale et al., Quantum 6, 747 (2022)](https://quantum-journal.org/)
- SDP MaxCut: [Goemans & Williamson (1995)](https://dl.acm.org/doi/10.1145/227683.227684)
- Neutral atoms: [Barredo et al., Nature 561, 79-82 (2018)](https://nature.com/)

## 📞 Support

For issues or feature requests, please refer to the main project documentation.

---

**Built with ❤️ for quantum research**

*Quantum Hybrid Control Lab • Version 1.0*
