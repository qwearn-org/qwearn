/**
 * API client for the Qwearn FastAPI backend.
 *
 * All backend communication goes through this module.
 * The API_URL is set via NEXT_PUBLIC_API_URL environment variable.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** A single gate in a circuit specification. */
export interface GateSpec {
  gate: string;
  qubits: number[];
  params?: Record<string, number>;
}

/** Complete circuit specification sent to the backend. */
export interface CircuitSpec {
  num_qubits: number;
  gates: GateSpec[];
}

/** Result from circuit execution. */
export interface CircuitResult {
  statevector: number[][];
  probabilities: Record<string, number>;
  counts: Record<string, number>;
  generated_code: string;
  backend_name: string;
}

/** Bloch sphere coordinates for one qubit. */
export interface BlochCoordinates {
  qubit_index: number;
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
}

/** Gate metadata from the backend. */
export interface GateInfo {
  name: string;
  display_name: string;
  num_qubits: number;
  has_params: boolean;
  description: string;
  category: string;
  matrix?: string;
  qubit_roles?: string[];
  params?: { name: string; type: string; description: string }[];
}

/** Execute a circuit and return results. */
export async function executeCircuit(
  circuit: CircuitSpec,
  shots: number = 1024
): Promise<CircuitResult> {
  const res = await fetch(`${API_URL}/api/circuits/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ circuit, shots }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Execution failed');
  }
  return res.json();
}

/** Get Bloch sphere coordinates from a statevector. */
export async function getBlochCoordinates(
  statevector: number[][],
  numQubits: number
): Promise<BlochCoordinates[]> {
  const res = await fetch(`${API_URL}/api/circuits/bloch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statevector, num_qubits: numQubits }),
  });
  if (!res.ok) throw new Error('Failed to get Bloch coordinates');
  return res.json();
}

/** Get list of supported gates. */
export async function getSupportedGates(): Promise<GateInfo[]> {
  const res = await fetch(`${API_URL}/api/circuits/gates`);
  if (!res.ok) throw new Error('Failed to get gates');
  return res.json();
}

/** Validate a circuit without executing. */
export async function validateCircuit(
  circuit: CircuitSpec
): Promise<{ valid: boolean; errors: string[] }> {
  const res = await fetch(`${API_URL}/api/circuits/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(circuit),
  });
  if (!res.ok) throw new Error('Validation request failed');
  return res.json();
}

// ---------------------------------------------------------------------------
// Session ID (anonymous user identification)
// ---------------------------------------------------------------------------

const SESSION_ID_KEY = 'qwearn_session_id';

/** Get or create an anonymous session ID stored in localStorage. */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Circuit Save/Load
// ---------------------------------------------------------------------------

/** A saved circuit from the backend. */
export interface CircuitSaveResponse {
  id: string;
  title: string;
  description: string;
  circuit_spec: CircuitSpec;
  session_id: string;
  created_at: string;
  updated_at: string;
}

/** Save a new circuit. */
export async function saveCircuit(
  title: string,
  circuitSpec: CircuitSpec,
  description: string = ''
): Promise<CircuitSaveResponse> {
  const res = await fetch(`${API_URL}/api/circuits/saves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-ID': getSessionId(),
    },
    body: JSON.stringify({
      title,
      description,
      circuit_spec: circuitSpec,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to save circuit');
  }
  return res.json();
}

/** List all saved circuits for the current session. */
export async function listSavedCircuits(): Promise<CircuitSaveResponse[]> {
  const res = await fetch(`${API_URL}/api/circuits/saves`, {
    headers: { 'X-Session-ID': getSessionId() },
  });
  if (!res.ok) return [];
  return res.json();
}

/** Load a specific saved circuit. */
export async function loadSavedCircuit(
  saveId: string
): Promise<CircuitSaveResponse> {
  const res = await fetch(`${API_URL}/api/circuits/saves/${saveId}`, {
    headers: { 'X-Session-ID': getSessionId() },
  });
  if (!res.ok) throw new Error('Failed to load circuit');
  return res.json();
}

/** Delete a saved circuit. */
export async function deleteSavedCircuit(saveId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/circuits/saves/${saveId}`, {
    method: 'DELETE',
    headers: { 'X-Session-ID': getSessionId() },
  });
  if (!res.ok) throw new Error('Failed to delete circuit');
}
