use trustmesh_prover_core::{
    circuit::{HIDDEN_DIM, INPUT_DIM, OUTPUT_DIM},
    keys::{save_keys, setup_keys},
    prove::{benchmark, prove, verify_local},
    witness::{compute_native_forward, concentration_bps_from_logits},
    WitnessInput,
};

fn make_test_witness() -> WitnessInput {
    let mut witness = WitnessInput {
        fc1_weight: vec![
            2, -1, 0, 1, 1, 0, -1, 2, 0, 1, -1, 1, 2, 0, -1, 1, 1, -2, 0, 1, 2, -1, 1, 0, 1, 0,
            -1, 2, 1, -1, 0, 2,
        ],
        fc1_bias: vec![1, -1, 0, 2, 1, -2, 0, 1],
        fc2_weight: vec![1; HIDDEN_DIM * HIDDEN_DIM],
        fc2_bias: vec![0; HIDDEN_DIM],
        fc3_weight: vec![
            1, 0, -1, 1, 0, 2, -1, 0, 1, -1, 2, 0, 1, 0, -1, 1, 2, 0, -1, 1, 0, 2, -1, 1, 0, 1,
            -1, 0, 2, 1, -1, 0,
        ],
        fc3_bias: vec![0, 1, -1, 0],
        features: vec![3, -2, 1, 0],
        model_commitment: [7u8; 32],
        pool_liquidity_wei: 2_000_000_000_000_000_000_000,
        post_trade_concentration_bps: 0,
    };
    let native = compute_native_forward(&witness);
    witness.post_trade_concentration_bps = concentration_bps_from_logits(&native.logits) as u64;
    witness
}

#[test]
fn witness_dimensions_validate() {
    let witness = make_test_witness();
    witness.validate_dims().expect("valid dims");
    assert_eq!(witness.features.len(), INPUT_DIM);
    assert_eq!(witness.fc1_weight.len(), HIDDEN_DIM * INPUT_DIM);
    assert_eq!(witness.fc3_weight.len(), OUTPUT_DIM * HIDDEN_DIM);
}

#[test]
fn setup_keys_succeeds() {
    setup_keys().expect("keygen");
}

#[test]
fn prove_and_verify_roundtrip() {
    let material = setup_keys().expect("setup");
    let witness = make_test_witness();
    let artifacts = prove(&material, witness.clone()).expect("prove");
    assert!(artifacts.proof_size > 0);
    assert_eq!(artifacts.public_inputs.len(), 3);
    let report = verify_local(&material, &artifacts.proof, &witness).expect("verify");
    assert!(report.valid);
}

#[test]
fn benchmark_pipeline() {
    let material = setup_keys().expect("setup");
    let witness = make_test_witness();
    let report = benchmark(&material, witness).expect("benchmark");
    assert!(report.proof_size_bytes > 0);
    assert!(report.prove_seconds >= 0.0);
}

#[test]
fn keys_roundtrip_on_disk() {
    let dir = tempfile::tempdir().expect("tempdir");
    let material = setup_keys().expect("setup");
    save_keys(&material, dir.path()).expect("save");
    assert!(dir.path().join("params.bin").exists());
    assert!(dir.path().join("pk.bin").exists());
    assert!(dir.path().join("vk.bin").exists());
}
