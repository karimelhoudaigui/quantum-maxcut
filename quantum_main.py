# ================================================
# MAIN QUANTUM FILE - Version propre et organisée
# ================================================

import json
import numpy as np

from quantum_utils import *
from quantum_optmization import *
from quantum_plot import *
from quantum_benchmark import *
from quantum_io import *
from quantum_pulser import *


if __name__ == "__main__":

    print("=" * 80)
    print("               QUANTUM MAX-CUT - RYDBERG PROXY")
    print("=" * 80)

    # ==================== CONFIGURATION ====================
    RUN_BENCHMARK = False
    RUN_SINGLE_TEST = False
    RUN_PULSER_EXPERIMENT = False
    RUN_PULSER_PARAM_SEARCH = False
    RUN_PULSER_GRID_SEARCH = True
    SAVE_RESULTS = True

    n_values = [4, 5, 6, 7, 8]
    n_instances = 60

    # ====================== BENCHMARK ======================
    if RUN_BENCHMARK:
        print(f"\nLancement du benchmark : {n_instances} instances pour n = {n_values}\n")

        results = benchmark_over_n(
            n_values=n_values,
            n_instances_per_n=n_instances,
            edge_prob=0.6,
            w_min=0.5,
            w_max=1.5,
            seed=42
        )

        summarize_results(results)

        if SAVE_RESULTS:
            save_results_csv(results, filename="benchmark_summary.csv")
            save_results_json(results, filename="benchmark_full.json")
            print("✅ Résultats sauvegardés (CSV + JSON)")

        plot_mapping_error_vs_n(results, save_path="figure1_mapping_error_vs_n.png")
        plot_ratio_vs_n(results, save_path="figure2_ratio_vs_n.png")
        plot_ratio_vs_mapping_error(results, save_path="figure3_ratio_vs_mapping_error.png")
        print("✅ Plots sauvegardés")

    # ====================== TEST EXACT / DEBUG ======================
    elif RUN_SINGLE_TEST:
        print("\nMode TEST SINGLE INSTANCE activé\n")

        n = 4
        target_edges = [
            (0, 1, 1.0),
            (1, 2, 0.8),
            (2, 3, 1.2),
            (0, 3, 0.6),
        ]

        best_positions, best_couplings, best_error = optimize_atom_positions(target_edges, n=n)

        print("=== POSITIONS OPTIMISÉES ===")
        for i, pos in enumerate(best_positions):
            print(f"Atome {i}: ({pos[0]:.6f}, {pos[1]:.6f})")

        print("\n=== COUPLAGES GÉOMÉTRIQUES ===")
        for i, j, J in sorted(best_couplings):
            print(f"({i},{j}) -> J = {J:.6f}")

        print(f"\nErreur de mapping = {best_error:.6f}")

    # ====================== EXPÉRIENCE PULSER SIMPLE ======================
    elif RUN_PULSER_EXPERIMENT:
        print("\nMode EXPÉRIENCE PULSER activé\n")

        n = 4
        target_edges = [
            (0, 1, 1.0),
            (1, 2, 0.8),
            (2, 3, 1.2),
            (0, 3, 0.6),
        ]

        best_positions, best_couplings, best_error = optimize_atom_positions(target_edges, n=n)

        print("=== POSITIONS OPTIMISÉES ===")
        for i, pos in enumerate(best_positions):
            print(f"Atome {i}: ({pos[0]:.6f}, {pos[1]:.6f})")

        print(f"\nErreur de mapping = {best_error:.6f}")
        omega_prep = 2 * np.pi * 2.0
        prep_duration = 125

        omega_max = 2 * np.pi * 4.0
        omega_hold = omega_max

        ramp_up_duration = 1000
        hold_duration = 4000

        T0 = 12000
        sampling_rate = 0.05
        scale = 15.5

        T_values = [4000, 8000, 12000, 16000, 20000]

        
        print("\n=== SÉQUENCE PULSER ===")
        seq_test = build_xy_adiabatic_sequence(
        positions=best_positions,
        omega_prep=omega_prep,
        prep_duration=prep_duration,
        omega_hold=omega_hold,
        hold_duration=hold_duration,
        omega_max=omega_max,
        ramp_up_duration=ramp_up_duration,
        anneal_duration=T0,
        scale=scale,
        )   
        seq_test.draw()
        print("Durée totale :", seq_test.get_duration())
        print("Base de mesure :", seq_test.get_measurement_basis())

        print("\n=== ÉVALUATION PULSER ===")
        out = evaluate_pulser_final_state(
            n=n,
            positions=best_positions,
            target_edges=target_edges,
            omega_prep=omega_prep,
            prep_duration=prep_duration,
            omega_hold=omega_hold,
            hold_duration=hold_duration,
            omega_max=omega_max,
            ramp_up_duration=ramp_up_duration,
            T=T0,
            sampling_rate=sampling_rate,
            scale=scale,
        )

        print(f"E0(H_qmc)                 = {out['E0_qmc']:.6f}")
        print(f"E0(H_r)                   = {out['E0_r']:.6f}")
        print(f"E(proxy exact dans QMC)   = {out['E_proxy_exact_in_qmc']:.6f}")
        print(f"E(Pulser final dans QMC)  = {out['E_pulser_in_qmc']:.6f}")
        print(f"Ratio proxy exact         = {out['ratio_proxy_exact']:.6f}")
        print(f"Ratio Pulser              = {out['ratio_pulser']:.6f}")

        overlap_proxy = state_overlap_pure(out["psi_r"], out["psi_T"])
        print(f"Overlap avec le fondamental exact de H_r = {overlap_proxy:.6f}")

        print("\n=== CORRÉLATIONS FINALES SUR LES ARÊTES ===")
        corrs = compute_edge_correlators(out["rho_T"], n, target_edges)
        for item in corrs:
            print(
                f"edge={item['edge']} | "
                f"XX={item['xx']:.6f}, "
                f"YY={item['yy']:.6f}, "
                f"ZZ={item['zz']:.6f}, "
                f"t={item['t']:.6f}"
            )

        print("\n=== SCAN EN TEMPS D'ANNEALING ===")
        scan_results = scan_annealing_times(
            n=n,
            positions=best_positions,
            target_edges=target_edges,
            omega_prep=omega_prep,
            prep_duration=prep_duration,
            omega_hold=omega_hold,
            hold_duration=hold_duration,
            omega_max=omega_max,
            ramp_up_duration=ramp_up_duration,
            T_values=T_values,
            sampling_rate=sampling_rate,
            scale=scale,
        )
        for row in scan_results:
            print(
                f"T={row['T']:7.1f} | "
                f"ratio_pulser={row['ratio_pulser']:.6f} | "
                f"ratio_proxy_exact={row['ratio_proxy_exact']:.6f} | "
                f"overlap_proxy={row['overlap_proxy']:.6f}"
            )

        if SAVE_RESULTS:
            with open("pulser_adiabatic_scan.json", "w", encoding="utf-8") as f:
                json.dump(scan_results, f, indent=2, ensure_ascii=False)
            print("\n✅ Résultats sauvegardés dans pulser_adiabatic_scan.json")

    # ====================== RECHERCHE DE PARAMÈTRES SUR PULSES ======================
    elif RUN_PULSER_PARAM_SEARCH:
        print("\nMode RECHERCHE PARAMÉTRIQUE PULSER activé\n")

        n = 4
        target_edges = [
            (0, 1, 1.0),
            (1, 2, 0.8),
            (2, 3, 1.2),
            (0, 3, 0.6),
        ]

        best_positions, best_couplings, best_error = optimize_atom_positions(target_edges, n=n)

        print("=== POSITIONS OPTIMISÉES ===")
        for i, pos in enumerate(best_positions):
            print(f"Atome {i}: ({pos[0]:.6f}, {pos[1]:.6f})")

        print(f"\nErreur de mapping = {best_error:.6f}")

        search_out = random_search_xy_pulses(
            n=n,
            positions=best_positions,
            target_edges=target_edges,
            n_pulses=6,
            pulse_duration=200,
            n_trials=100,
            sampling_rate=0.05,
            amp_min=0.0,
            amp_max=2 * np.pi * 4.0,
            det_min=-2 * np.pi * 2.0,
            det_max=2 * np.pi * 2.0,
        )

        print("\n=== MEILLEUR RÉSULTAT TROUVÉ ===")
        print(f"Best energy in QMC  = {search_out['best_E_qmc']:.6f}")
        print(f"Best ratio          = {search_out['best_ratio_qmc']:.6f}")
        print(f"Best overlap proxy  = {search_out['best_overlap_proxy']:.6f}")
        print(f"Best params         = {search_out['best_params']}")

        print("\n=== SÉQUENCE GAGNANTE ===")
        search_out["best_seq"].draw()

        if SAVE_RESULTS:
            serializable = {
                "best_E_qmc": float(search_out["best_E_qmc"]),
                "best_ratio_qmc": float(search_out["best_ratio_qmc"]),
                "best_overlap_proxy": float(search_out["best_overlap_proxy"]),
                "best_params": [float(x) for x in search_out["best_params"]],
            }
            with open("pulser_param_search_best.json", "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2, ensure_ascii=False)

            print("\n✅ Résultats sauvegardés dans pulser_param_search_best.json")
        # ====================== GRID SEARCH ADIABATIQUE ======================
    elif RUN_PULSER_GRID_SEARCH:
        print("\nMode GRID SEARCH ADIABATIQUE PULSER activé\n")

        n = 4
        target_edges = [
            (0, 1, 1.0),
            (1, 2, 0.8),
            (2, 3, 1.2),
            (0, 3, 0.6),
        ]

        best_positions, best_couplings, best_error = optimize_atom_positions(target_edges, n=n)

        print("=== POSITIONS OPTIMISÉES ===")
        for i, pos in enumerate(best_positions):
            print(f"Atome {i}: ({pos[0]:.6f}, {pos[1]:.6f})")

        print(f"\nErreur de mapping = {best_error:.6f}")

        omega_prep = 2 * np.pi * 2.0
        prep_duration = 125
        sampling_rate = 0.05
        scale = 15.5

        hold_durations = [1000, 2000, 3000, 4000]

        ramp_up_durations = [1500, 2000, 2500, 3000]

        omega_max_values = [
            2 * np.pi * 2.5,
            2 * np.pi * 3.0,
            2 * np.pi * 3.5,
        ]

        T_values = [18000, 20000, 22000, 24000] 

        search_out = grid_search_adiabatic_parameters(
            n=n,
            positions=best_positions,
            target_edges=target_edges,
            omega_prep=omega_prep,
            prep_duration=prep_duration,
            hold_durations=hold_durations,
            ramp_up_durations=ramp_up_durations,
            omega_max_values=omega_max_values,
            T_values=T_values,
            sampling_rate=sampling_rate,
            scale=scale,
        )

        best_result = search_out["best_result"]
        all_results = search_out["all_results"]

        print("\n=== MEILLEUR RÉSULTAT TROUVÉ ===")
        print(f"hold_duration     = {best_result['hold_duration']}")
        print(f"ramp_up_duration  = {best_result['ramp_up_duration']}")
        print(f"omega_max         = {best_result['omega_max']:.6f}")
        print(f"T                 = {best_result['T']}")
        print(f"E_pulser_in_qmc   = {best_result['E_pulser_in_qmc']:.6f}")
        print(f"E_pulser_in_proxy = {best_result['E_pulser_in_proxy']:.6f}")
        print(f"ratio_pulser      = {best_result['ratio_pulser']:.6f}")
        print(f"overlap_proxy     = {best_result['overlap_proxy']:.6f}")

        print("\n=== TOP 10 ===")
        for i, row in enumerate(all_results[:10], start=1):
            print(
                f"{i:2d} | "
                f"hold={row['hold_duration']:5d} | "
                f"ramp_up={row['ramp_up_duration']:5d} | "
                f"omega_max={row['omega_max']:.6f} | "
                f"T={row['T']:6d} | "
                f"ratio={row['ratio_pulser']:.6f} | "
                f"overlap={row['overlap_proxy']:.6f}"
            )

        if SAVE_RESULTS:
            with open("pulser_adiabatic_grid_search.json", "w", encoding="utf-8") as f:
                json.dump(all_results, f, indent=2, ensure_ascii=False)

            with open("pulser_adiabatic_grid_search_best.json", "w", encoding="utf-8") as f:
                json.dump(best_result, f, indent=2, ensure_ascii=False)

            print("\n✅ Résultats sauvegardés dans :")
            print("   - pulser_adiabatic_grid_search.json")
            print("   - pulser_adiabatic_grid_search_best.json")
    else:
        print("Aucun mode activé.")

    print("\n" + "=" * 80)
    print("Exécution terminée.")