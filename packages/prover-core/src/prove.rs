use std::time::Instant;

use anyhow::{Context, Result};
use halo2_proofs::{
    plonk::{create_proof, verify_proof, SingleVerifier},
    transcript::{Blake2bRead, Blake2bWrite, Challenge255},
};
use halo2curves::bn256::{Bn256, Fr, G1Affine};
use rand::rngs::OsRng;

use crate::circuit::TrustMeshCircuit;
use crate::field::{fr_to_u128_string, u128_to_fr};
use crate::keys::KeyMaterial;
use crate::types::{BenchmarkReport, ProofArtifacts, VerifyReport, WitnessInput};
use crate::witness::{build_witness, commitment_field};

pub fn prove(material: &KeyMaterial, witness: WitnessInput) -> Result<ProofArtifacts> {
    let built = build_witness(witness.clone())?;
    let circuit = TrustMeshCircuit::new(built.input.clone());
    let instances = public_instances(&built.input);

    let start = Instant::now();
    let mut transcript = Blake2bWrite::<_, G1Affine, Challenge255<_>>::init(vec![]);
    create_proof(
        &material.params,
        &material.pk,
        &[circuit],
        &[&[&instances[..]]],
        OsRng,
        &mut transcript,
    )
    .context("create proof")?;
    let proof = transcript.finalize();
    let prove_seconds = start.elapsed().as_secs_f64();

    Ok(ProofArtifacts {
        proof_size: proof.len(),
        proof,
        public_inputs: vec![
            built.input.pool_liquidity_wei.to_string(),
            built.input.post_trade_concentration_bps.to_string(),
            fr_to_u128_string(commitment_field(&built.input)),
        ],
        prove_seconds,
    })
}

pub fn verify_local(
    material: &KeyMaterial,
    proof: &[u8],
    witness: &WitnessInput,
) -> Result<VerifyReport> {
    let instances = public_instances(witness);
    let strategy = SingleVerifier::new(&material.params);
    let mut transcript = Blake2bRead::<_, G1Affine, Challenge255<_>>::init(proof);
    let start = Instant::now();
    verify_proof(
        &material.params,
        &material.vk,
        strategy,
        &[&[&instances[..]]],
        &mut transcript,
    )
    .context("verify proof")?;
    Ok(VerifyReport {
        valid: true,
        verify_seconds: start.elapsed().as_secs_f64(),
    })
}

pub fn benchmark(material: &KeyMaterial, witness: WitnessInput) -> Result<BenchmarkReport> {
    let witness_start = Instant::now();
    let built = build_witness(witness.clone())?;
    let witness_generation_seconds = witness_start.elapsed().as_secs_f64();

    let artifacts = prove(material, built.input.clone())?;
    let verify = verify_local(material, &artifacts.proof, &built.input)?;

    Ok(BenchmarkReport {
        witness_generation_seconds,
        prove_seconds: artifacts.prove_seconds,
        verify_seconds: verify.verify_seconds,
        proof_size_bytes: artifacts.proof_size,
    })
}

fn public_instances(witness: &WitnessInput) -> Vec<Fr> {
    vec![
        u128_to_fr(witness.pool_liquidity_wei),
        Fr::from(witness.post_trade_concentration_bps),
        commitment_field(witness),
    ]
}
