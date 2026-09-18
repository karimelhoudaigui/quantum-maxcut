"""
Quantum Hybrid Control Lab
A modern, professional interface for controlling the hybrid Pulser + SDP + Rounding pipeline.

Interactive quantum annealing scheduler with real-time waveform visualization,
hardware validation, and comprehensive results dashboard.

Run with: streamlit run app_quantum_control_panel.py
"""

import streamlit as st
from streamlit_option_menu import option_menu
import numpy as np
import pandas as pd
from pathlib import Path
import tempfile
from datetime import datetime

from quantum_maxcut.scheduler_manager import (
    AnnealingScheduleConfig,
    GraphFamily,
    HybridScheduleRunner,
)
from quantum_maxcut.schedule_validation import (
    ScheduleValidator,
    PhysicalParameterSweeper,
)
from quantum_maxcut.schedule_visualization import (
    SchedulePlotter,
    ResultDashboard,
    MetricsCard,
    plot_parameter_sweep_results,
)


# ============================================================================
# PAGE CONFIGURATION & STYLING
# ============================================================================

st.set_page_config(
    page_title="Quantum Hybrid Control Lab",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for professional look
st.markdown("""
<style>
    [data-testid="stSidebar"] {background-color: #0F1419;}
    [data-testid="stMetricDelta"] {color: #F18F01;}
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 12px;
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .hardware-valid {background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);}
    .hardware-invalid {background: linear-gradient(135deg, #d63031 0%, #e17055 100%);}
    .info-box {
        background-color: #E3F2FD;
        border-left: 4px solid #2196F3;
        padding: 12px;
        border-radius: 4px;
        margin: 10px 0;
    }
    .success-box {
        background-color: #E8F5E9;
        border-left: 4px solid #4CAF50;
        padding: 12px;
        border-radius: 4px;
        margin: 10px 0;
    }
    .warning-box {
        background-color: #FFF3E0;
        border-left: 4px solid #FF9800;
        padding: 12px;
        border-radius: 4px;
        margin: 10px 0;
    }
    .error-box {
        background-color: #FFEBEE;
        border-left: 4px solid #F44336;
        padding: 12px;
        border-radius: 4px;
        margin: 10px 0;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# SESSION STATE INITIALIZATION
# ============================================================================

if 'config' not in st.session_state:
    st.session_state.config = AnnealingScheduleConfig()

if 'runner' not in st.session_state:
    st.session_state.runner = None

if 'last_result' not in st.session_state:
    st.session_state.last_result = None

if 'results_history' not in st.session_state:
    st.session_state.results_history = []

if 'sweep_configs' not in st.session_state:
    st.session_state.sweep_configs = []

if 'sweep_results' not in st.session_state:
    st.session_state.sweep_results = []


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def display_validation_result(validation):
    """Display validation results with colored boxes."""
    if validation.is_valid:
        st.success("✓ Hardware Status: **VALID**", icon="✅")
        st.markdown("""
        <div class='success-box'>
        All physical constraints are satisfied. Schedule is ready for execution.
        </div>
        """, unsafe_allow_html=True)
    else:
        st.error("✗ Hardware Status: **INVALID**", icon="❌")
        for error in validation.errors:
            st.error(f"  {error}")
    
    if validation.warnings:
        st.warning("⚠ Warnings:", icon="⚠️")
        for warning in validation.warnings:
            st.warning(f"  {warning}")


def display_metrics_card(label: str, value: str, color: str = "#2E86AB"):
    """Display a metric card."""
    st.metric(
        label=label,
        value=value,
    )


def format_duration_display(ns: int) -> str:
    """Format duration in ns for display."""
    if ns < 1000:
        return f"{ns} ns"
    elif ns < 1000000:
        return f"{ns/1000:.2f} μs"
    else:
        return f"{ns/1000000:.2f} ms"


# ============================================================================
# SIDEBAR - MAIN NAVIGATION
# ============================================================================

with st.sidebar:
    st.image(
        "https://img.icons8.com/color/96/000000/quantum.png",
        width=80,
        use_column_width=False,
    )
    
    st.title("⚛️ Quantum Hybrid Control Lab")
    st.markdown("*Interactive quantum annealing scheduler*", help="Version 1.0")
    st.divider()
    
    # Navigation
    page = option_menu(
        menu_title="Navigation",
        options=[
            "Dashboard",
            "Schedule Editor",
            "Run Simulation",
            "Comparison Tool",
            "Parameter Sweep",
            "Results Gallery",
            "Export",
        ],
        icons=[
            "speedometer",
            "sliders",
            "play-circle",
            "bezier",
            "diagram-3",
            "image",
            "download",
        ],
        menu_icon="list",
        default_index=0,
        styles={
            "container": {"padding": "0!important", "background-color": "#0F1419"},
            "icon": {"color": "#F18F01", "font-size": "20px"},
            "nav-link": {
                "text-align": "left",
                "margin": "0px",
                "padding": "12px 15px",
                "font-size": "14px",
            },
            "nav-link-selected": {
                "background-color": "#667eea",
                "border-radius": "8px",
            },
        },
    )
    
    st.divider()
    
    # Quick info
    st.markdown("### Current Config")
    st.text(f"Nodes: {st.session_state.config.n_nodes}")
    st.text(f"Total Duration: {format_duration_display(st.session_state.config.total_duration())}")
    st.text(f"Graph Family: {st.session_state.config.graph_family.value}")


# ============================================================================
# PAGE 1: DASHBOARD
# ============================================================================

if page == "Dashboard":
    st.title("🪄 Quantum Hybrid Control Lab Dashboard")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(
            "Current Config",
            f"n={st.session_state.config.n_nodes}",
            f"Total: {format_duration_display(st.session_state.config.total_duration())}",
        )
    
    with col2:
        status = "✅ Valid" if ScheduleValidator(st.session_state.config).validate().is_valid else "❌ Invalid"
        st.metric("Hardware Status", status)
    
    with col3:
        st.metric(
            "Simulations Run",
            len(st.session_state.results_history),
        )
    
    st.divider()
    
    # Welcome message
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        ### Welcome to the Quantum Hybrid Control Lab
        
        This interface allows you to design and optimize annealing schedules for hybrid 
        **Pulser + SDP + Rounding** quantum circuits.
        
        **Key Features:**
        - 🎚️ **Interactive Sliders** - Adjust annealing parameters in real time
        - ✓ **Hardware Validation** - Automatic constraint checking
        - 📊 **Real-time Visualization** - Watch Ω(t) and Δ(t) waveforms
        - 🚀 **Quantum Simulation** - Full hybrid pipeline execution
        - 🔬 **Parameter Sweeps** - Systematic exploration of parameter space
        - 💾 **Export Results** - Save findings for your research
        """)
    
    with col2:
        st.markdown("""
        ### Quick Start
        1. Go to **Schedule Editor**
        2. Adjust sliders for your preferred parameters
        3. Click **Run Simulation**
        4. Explore results in **Results Gallery**
        5. Export figures for your paper
        """)
    
    st.divider()
    
    # Display last result if available
    if st.session_state.last_result:
        st.markdown("### Last Simulation Result")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                "Pulser Ratio",
                f"{st.session_state.last_result.ratio_pulser:.4f}",
            )
        
        with col2:
            st.metric(
                "Product Ratio",
                f"{st.session_state.last_result.ratio_product:.4f}",
            )
        
        with col3:
            st.metric(
                "Hybrid Ratio (Winner)",
                f"{st.session_state.last_result.ratio_hybrid:.4f}",
                delta=f"Δ={st.session_state.last_result.ratio_hybrid - st.session_state.last_result.ratio_pulser:.4f}",
            )


# ============================================================================
# PAGE 2: SCHEDULE EDITOR
# ============================================================================

elif page == "Schedule Editor":
    st.title("🎚️ Annealing Schedule Editor")
    
    # Create columns for layout
    col_left, col_right = st.columns([1, 2], gap="large")
    
    with col_left:
        st.markdown("### Graph Parameters")
        
        n_nodes = st.slider(
            "Number of Nodes (n)",
            min_value=2,
            max_value=20,
            value=st.session_state.config.n_nodes,
            step=1,
            help="Size of the quantum graph for MaxCut problem"
        )
        st.session_state.config.n_nodes = n_nodes
        
        graph_family = st.selectbox(
            "Graph Family",
            options=[f.value for f in GraphFamily],
            index=0,
            help="Type of graph to generate"
        )
        st.session_state.config.graph_family = GraphFamily(graph_family)
        
        n_instances = st.number_input(
            "Number of Instances",
            min_value=1,
            max_value=100,
            value=st.session_state.config.n_instances,
            step=1,
        )
        st.session_state.config.n_instances = int(n_instances)
        
        seed = st.number_input(
            "Random Seed",
            min_value=0,
            max_value=10000,
            value=st.session_state.config.seed,
            step=1,
        )
        st.session_state.config.seed = int(seed)
        
        st.markdown("---")
        st.markdown("### Annealing Schedule Parameters")
    
    with col_right:
        # Preparation phase
        st.markdown("#### Phase 1: Preparation")
        
        col1, col2 = st.columns(2)
        
        with col1:
            omega_prep = st.slider(
                "ω_prep [MHz]",
                min_value=0.0,
                max_value=20.0,
                value=st.session_state.config.omega_prep,
                step=0.1,
                help="Preparation pulse amplitude"
            )
            st.session_state.config.omega_prep = float(omega_prep)
        
        with col2:
            prep_duration = st.slider(
                "Prep Duration [ns]",
                min_value=10,
                max_value=300,
                value=st.session_state.config.prep_duration,
                step=10,
                help="Preparation pulse duration"
            )
            st.session_state.config.prep_duration = int(prep_duration)
        
        # Ramp-up phase
        st.markdown("#### Phase 2: Ramp-up")
        
        col1, col2 = st.columns(2)
        
        with col1:
            omega_peak = st.slider(
                "ω_peak [MHz]",
                min_value=0.5,
                max_value=20.0,
                value=st.session_state.config.omega_peak,
                step=0.1,
                help="Peak Rydberg coupling amplitude"
            )
            st.session_state.config.omega_peak = float(omega_peak)
        
        with col2:
            rise_duration = st.slider(
                "Rise Duration [ns]",
                min_value=10,
                max_value=500,
                value=st.session_state.config.rise_duration,
                step=10,
                help="Duration of ramp-up phase"
            )
            st.session_state.config.rise_duration = int(rise_duration)
        
        # Hold phase
        st.markdown("#### Phase 3: Hold Plateau")
        
        col1, col2 = st.columns(2)
        
        with col1:
            hold_duration = st.slider(
                "Hold Duration [ns]",
                min_value=10,
                max_value=2000,
                value=st.session_state.config.hold_duration,
                step=10,
                help="Duration of hold plateau at ω_peak"
            )
            st.session_state.config.hold_duration = int(hold_duration)
        
        with col2:
            delta_hold = st.slider(
                "Δ_hold [MHz]",
                min_value=-150.0,
                max_value=50.0,
                value=st.session_state.config.delta_hold,
                step=1.0,
                help="Detuning during hold phase"
            )
            st.session_state.config.delta_hold = float(delta_hold)
        
        # Anneal-down (cooling) phase
        st.markdown("#### Phase 4: Anneal-down (Main Cooling)")
        
        col1, col2 = st.columns(2)
        
        with col1:
            fall_duration = st.slider(
                "Fall Duration [ns]",
                min_value=10,
                max_value=2000,
                value=st.session_state.config.fall_duration,
                step=10,
                help="Duration of anneal-down phase (longer = slower cooling)"
            )
            st.session_state.config.fall_duration = int(fall_duration)
        
        with col2:
            delta_start = st.slider(
                "Δ_start [MHz]",
                min_value=-150.0,
                max_value=0.0,
                value=st.session_state.config.delta_start,
                step=1.0,
                help="Initial detuning"
            )
            st.session_state.config.delta_start = float(delta_start)
        
        delta_end = st.slider(
            "Δ_end [MHz]",
            min_value=-150.0,
            max_value=50.0,
            value=st.session_state.config.delta_end,
            step=1.0,
            help="Final detuning"
        )
        st.session_state.config.delta_end = float(delta_end)
        
        st.markdown("---")
        st.markdown("### Hybrid Pipeline Parameters")
        
        col1, col2 = st.columns(2)
        
        with col1:
            n_roundings = st.number_input(
                "Number of SDP Roundings",
                min_value=1,
                max_value=256,
                value=st.session_state.config.n_roundings,
                step=1,
            )
            st.session_state.config.n_roundings = int(n_roundings)
        
        with col2:
            sampling_rate = st.number_input(
                "Sampling Rate [ns⁻¹]",
                min_value=0.01,
                max_value=1.0,
                value=st.session_state.config.sampling_rate,
                step=0.01,
            )
            st.session_state.config.sampling_rate = float(sampling_rate)
    
    st.divider()
    
    # Validation check
    st.markdown("### ✓ Hardware Validation")
    
    validator = ScheduleValidator(st.session_state.config)
    validation = validator.validate()
    
    display_validation_result(validation)
    
    st.divider()
    
    # Visualization
    st.markdown("### 📊 Waveform Preview")
    
    plotter = SchedulePlotter(figsize=(14, 5))
    fig = plotter.plot_waveform(st.session_state.config, show=False)
    st.pyplot(fig, use_container_width=True)


# ============================================================================
# PAGE 3: RUN SIMULATION
# ============================================================================

elif page == "Run Simulation":
    st.title("🚀 Run Simulation")
    
    st.markdown("""
    This page executes the full hybrid pipeline:
    1. **Geometry Optimization** - Optimize atom positions
    2. **Pulser Simulation** - Rydberg XY evolution
    3. **SDP Relaxation** - Semidefinite programming
    4. **Rounding** - Multiple SDP roundings
    """)
    
    st.divider()
    
    # Show current config
    st.markdown("### Current Schedule Configuration")
    
    config_display = MetricsCard.format_schedule(st.session_state.config)
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    cols = [col1, col2, col3, col4, col5]
    items = list(config_display.items())
    
    for idx, (k, v) in enumerate(items):
        with cols[idx % 5]:
            st.metric(k, v)
    
    st.divider()
    
    # Validation
    validator = ScheduleValidator(st.session_state.config)
    validation = validator.validate()
    
    if not validation.is_valid:
        st.error("❌ Cannot run simulation with invalid parameters!")
        st.markdown("Please fix the errors in the **Schedule Editor** first.")
    else:
        st.success("✓ Configuration is valid and ready for simulation")
        
        # Run button
        col1, col2 = st.columns([2, 3])
        
        with col1:
            if st.button(
                "▶ RUN SIMULATION",
                use_container_width=True,
                type="primary",
                key="run_sim_button",
                help="Execute the hybrid pipeline",
            ):
                with st.spinner("⏳ Running quantum simulation... This may take a moment."):
                    try:
                        # Create runner
                        runner = HybridScheduleRunner(st.session_state.config)
                        
                        # Generate a simple random graph for demo
                        from quantum_hybrid.hybrid_graph_study import generate_random_weighted_graph
                        
                        rng = np.random.default_rng(st.session_state.config.seed)
                        target_edges = generate_random_weighted_graph(
                            n=st.session_state.config.n_nodes,
                            edge_prob=0.6,
                            w_min=0.5,
                            w_max=1.5,
                            rng=rng,
                        )
                        
                        # Run
                        result = runner.run_on_graph(
                            n=st.session_state.config.n_nodes,
                            target_edges=target_edges,
                        )
                        
                        st.session_state.last_result = result
                        st.session_state.results_history.append(result)
                        
                        st.success("✓ Simulation completed successfully!")
                        st.balloons()
                        
                    except Exception as e:
                        st.error(f"❌ Simulation failed: {str(e)}")
                        st.exception(e)
        
        # Display results if available
        if st.session_state.last_result:
            st.divider()
            st.markdown("### 📊 Results")
            
            result = st.session_state.last_result
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    "Pulser Ratio",
                    f"{result.ratio_pulser:.4f}",
                    help="Energy ratio from Pulser alone"
                )
            
            with col2:
                st.metric(
                    "Product Ratio",
                    f"{result.ratio_product:.4f}",
                    help="Best ratio from SDP + rounding"
                )
            
            with col3:
                delta = result.ratio_hybrid - result.ratio_pulser
                delta_color = "inverse" if delta > 0 else "off"
                st.metric(
                    "Hybrid Ratio",
                    f"{result.ratio_hybrid:.4f}",
                    delta=f"{delta:+.4f}",
                    delta_color=delta_color,
                    help="Max of Pulser and Product ratios"
                )
            
            st.divider()
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("#### Metrics")
                st.metric("Winner", result.winner)
                st.metric("Mapping Error", f"{result.mapping_error:.6f}")
                st.metric("SDP Status", result.sdp_status)
                st.metric("Roundings Used", result.n_roundings_used)
            
            with col2:
                st.markdown("#### Energies")
                st.metric("E₀ (exact)", f"{result.E0_qmc:.6f}")
                st.metric("E_pulser", f"{result.E_pulser_in_qmc:.6f}")
                st.metric("E_product", f"{result.E_product_in_qmc:.6f}")
                st.metric("E_hybrid", f"{result.E_hybrid_in_qmc:.6f}")


# ============================================================================
# PAGE 4: COMPARISON TOOL
# ============================================================================

elif page == "Comparison Tool":
    st.title("🔍 Schedule Comparison Tool")
    
    st.markdown("""
    Compare two different annealing schedules on the same problem instance.
    This helps you understand which parameters matter most.
    """)
    
    st.divider()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### Schedule A (Reference)")
        st.write(st.session_state.config.to_dict())
    
    with col2:
        st.markdown("### Schedule B (Experimental)")
        
        # Allow user to modify Schedule B
        config_b = AnnealingScheduleConfig(**st.session_state.config.to_dict())
        
        omega_peak_b = st.slider(
            "ω_peak [MHz] - B",
            min_value=0.5,
            max_value=20.0,
            value=config_b.omega_peak,
            step=0.1,
            key="omega_peak_b"
        )
        config_b.omega_peak = float(omega_peak_b)
        
        fall_duration_b = st.slider(
            "Fall Duration [ns] - B",
            min_value=10,
            max_value=2000,
            value=config_b.fall_duration,
            step=10,
            key="fall_duration_b"
        )
        config_b.fall_duration = int(fall_duration_b)
        
        st.write(config_b.to_dict())
    
    st.divider()
    
    # Plot comparison
    plotter = SchedulePlotter(figsize=(15, 10))
    fig = plotter.plot_comparison(
        st.session_state.config,
        config_b,
        labels=("Schedule A", "Schedule B"),
        show=False,
    )
    st.pyplot(fig, use_container_width=True)


# ============================================================================
# PAGE 5: PARAMETER SWEEP
# ============================================================================

elif page == "Parameter Sweep":
    st.title("🧪 Parameter Sweep Study")
    
    st.markdown("""
    Systematically explore how changing a single parameter affects performance.
    This is useful for finding optimal parameter ranges.
    """)
    
    st.divider()
    
    col1, col2 = st.columns(2)
    
    with col1:
        sweep_param = st.selectbox(
            "Parameter to Sweep",
            options=[
                "omega_peak",
                "fall_duration",
                "delta_start",
                "hold_duration",
            ],
            help="Which parameter to systematically vary"
        )
    
    with col2:
        n_steps = st.slider(
            "Number of Steps",
            min_value=3,
            max_value=20,
            value=8,
            step=1,
        )
    
    st.divider()
    
    if st.button("▶ Generate Sweep Configurations", use_container_width=True, type="primary"):
        sweeper = PhysicalParameterSweeper(st.session_state.config)
        
        if sweep_param == "omega_peak":
            configs = sweeper.sweep_omega_peak(
                omega_min=2.0,
                omega_max=15.0,
                n_steps=n_steps,
            )
        elif sweep_param == "fall_duration":
            configs = sweeper.sweep_fall_duration_adiabatic(
                duration_min=100,
                duration_max=1500,
                n_steps=n_steps,
            )
        elif sweep_param == "delta_start":
            configs = sweeper.sweep_delta_start(
                delta_min=-150.0,
                delta_max=-10.0,
                n_steps=n_steps,
            )
        elif sweep_param == "hold_duration":
            configs = sweeper.sweep_hold_duration(
                duration_min=100,
                duration_max=1500,
                n_steps=n_steps,
            )
        
        st.session_state.sweep_configs = configs
        st.success(f"✓ Generated {len(configs)} valid configurations")
        
        # Display sweep parameters
        st.markdown("### Sweep Configurations")
        df = pd.DataFrame([
            {
                'Step': i,
                sweep_param: getattr(cfg, sweep_param),
                'Total Duration [ns]': cfg.total_duration(),
            }
            for i, cfg in enumerate(configs)
        ])
        st.dataframe(df, use_container_width=True)


# ============================================================================
# PAGE 6: RESULTS GALLERY
# ============================================================================

elif page == "Results Gallery":
    st.title("🖼️ Results Gallery")
    
    st.markdown("""
    View and analyze all simulation results.
    """)
    
    st.divider()
    
    if not st.session_state.results_history:
        st.info("No results yet. Run a simulation first!")
    else:
        st.markdown(f"### {len(st.session_state.results_history)} Results saved")
        
        # Create results table
        results_data = []
        for i, result in enumerate(st.session_state.results_history):
            results_data.append({
                'Run': i + 1,
                'Pulser Ratio': f"{result.ratio_pulser:.4f}",
                'Product Ratio': f"{result.ratio_product:.4f}",
                'Hybrid Ratio': f"{result.ratio_hybrid:.4f}",
                'Winner': result.winner,
                'Mapping Error': f"{result.mapping_error:.6f}",
                'Timestamp': result.timestamp,
            })
        
        df_results = pd.DataFrame(results_data)
        st.dataframe(df_results, use_container_width=True)
        
        st.divider()
        
        # Plot results
        if len(st.session_state.results_history) > 1:
            st.markdown("### Results Comparison Chart")
            
            fig = ResultDashboard.plot_ratio_comparison(
                st.session_state.results_history,
                show=False,
            )
            st.pyplot(fig, use_container_width=True)


# ============================================================================
# PAGE 7: EXPORT
# ============================================================================

elif page == "Export":
    st.title("💾 Export Results")
    
    st.markdown("""
    Export your schedule configurations, results, and visualizations.
    """)
    
    st.divider()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### Current Schedule")
        
        if st.button("📥 Download Schedule as JSON", use_container_width=True):
            json_str = st.session_state.config.to_json()
            st.download_button(
                label="Download JSON",
                data=json_str,
                file_name=f"schedule_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json",
                use_container_width=True,
            )
    
    with col2:
        st.markdown("### Waveform Visualization")
        
        if st.button("📥 Download Waveform Plot (PNG)", use_container_width=True):
            plotter = SchedulePlotter()
            
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                fig = plotter.plot_waveform(
                    st.session_state.config,
                    save_path=tmp.name,
                    show=False,
                )
                
                with open(tmp.name, "rb") as f:
                    st.download_button(
                        label="Download PNG",
                        data=f.read(),
                        file_name=f"waveform_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png",
                        mime="image/png",
                        use_container_width=True,
                    )
    
    st.divider()
    
    if st.session_state.results_history:
        st.markdown("### Results Export")
        
        # Export as CSV
        results_data = []
        for result in st.session_state.results_history:
            results_data.append({
                'timestamp': result.timestamp,
                'ratio_pulser': result.ratio_pulser,
                'ratio_product': result.ratio_product,
                'ratio_hybrid': result.ratio_hybrid,
                'winner': result.winner,
                'mapping_error': result.mapping_error,
                'sdp_status': result.sdp_status,
                'n_roundings_used': result.n_roundings_used,
            })
        
        df_export = pd.DataFrame(results_data)
        
        csv_data = df_export.to_csv(index=False)
        
        st.download_button(
            label="📥 Download Results as CSV",
            data=csv_data,
            file_name=f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv",
            use_container_width=True,
        )
        
        st.dataframe(df_export, use_container_width=True)


# ============================================================================
# FOOTER
# ============================================================================

st.divider()

st.markdown("""
---
**Quantum Hybrid Control Lab** | Version 1.0  
*A professional tool for quantum annealing research*  
Built with Streamlit • Python • NumPy • Matplotlib
""", help="For more info, visit the project documentation")
