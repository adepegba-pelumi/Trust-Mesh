//! TrustMesh Halo2 proving core (Stage 6.75A production pipeline).

pub mod circuit;
pub mod field;
pub mod keys;
pub mod poseidon;
pub mod prove;
pub mod solidity;
pub mod types;
pub mod witness;

pub use circuit::{
    circuit_params, TrustMeshCircuit, INPUT_DIM, HIDDEN_DIM, OUTPUT_DIM, PUBLIC_INPUT_COUNT,
};
pub use keys::{load_params, load_proving_key, load_verifying_key, save_keys, setup_keys, KeyMaterial};
pub use prove::{benchmark, prove, verify_local};
pub use solidity::{export_solidity_verifier, SolidityExportReport};
pub use types::{
    BenchmarkReport, ProofArtifacts, SetupReport, VerifyReport, WitnessInput,
};
pub use witness::{build_witness, validate_witness_against_kzg};
