import numpy as np

from pulser import Register
from pulser_simulation import QutipEmulator

from quantum_utils import I2, X, Y, Z, one_body_operator, two_body_correlator


def build_xy_register(positions, scale=15.5):
    scaled_positions = scale * np.asarray(positions, dtype=float)
    qubits = {f"q{i}": scaled_positions[i] for i in range(len(scaled_positions))}
    return Register(qubits)


def _statevector_from_qutip_state(state):
    if hasattr(state, "full"):
        return state.full().flatten()
    return np.asarray(state).flatten()


def extract_final_statevector_from_result(result):
    return _statevector_from_qutip_state(result.states[-1])


def statevector_to_density(psi):
    psi = np.asarray(psi).reshape(-1, 1)
    return psi @ psi.conj().T


def expectation_value(rho, H):
    return np.real(np.trace(rho @ H))


def state_overlap_pure(psi, phi):
    return np.abs(np.vdot(psi, phi)) ** 2


def run_pulser_sequence(seq, sampling_rate=0.05):
    sim = QutipEmulator.from_sequence(seq, sampling_rate=sampling_rate)
    return sim.run()


def extract_magnetization_time_series(result, n, max_points=60):
    """
    Extrait <Sz_i>(t) pour chaque site i à partir des états intermédiaires
    déjà conservés en mémoire par qutip (result.states), sous-échantillonnés
    à au plus max_points instants pour rester léger à transmettre/animer.
    """
    n_states = len(result.states)
    if n_states == 0:
        return {"times": [], "magnetization": []}

    indices = sorted(set(np.linspace(0, n_states - 1, min(max_points, n_states), dtype=int).tolist()))
    sz_ops = [one_body_operator(n, site, Z) for site in range(n)]

    times = [float(result._sim_times[k]) for k in indices]
    magnetization = []
    for k in indices:
        psi = _statevector_from_qutip_state(result.states[k])
        rho = statevector_to_density(psi)
        magnetization.append([expectation_value(rho, op) for op in sz_ops])

    return {"times": times, "magnetization": magnetization}


def compute_edge_correlators(rho, n, edges):
    corrs = []
    for i, j, w in edges:
        xx = two_body_correlator(rho, n, i, j, X, X)
        yy = two_body_correlator(rho, n, i, j, Y, Y)
        zz = two_body_correlator(rho, n, i, j, Z, Z)
        t = 0.5 * (xx + yy)

        corrs.append({
            "edge": (i, j),
            "w": w,
            "xx": xx,
            "yy": yy,
            "zz": zz,
            "t": t,
        })
    return corrs
