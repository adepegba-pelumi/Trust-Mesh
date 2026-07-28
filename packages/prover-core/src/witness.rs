use anyhow::{Context, Result};

use crate::circuit::{FIXED_POINT_SCALE, HIDDEN_DIM, INPUT_DIM, OUTPUT_DIM};
use crate::poseidon::{hash_weights, public_commitment_field};
use crate::types::WitnessInput;

#[derive(Clone, Debug)]
pub struct NativeForward {
    pub hidden1: Vec<i64>,
    pub hidden2: Vec<i64>,
    pub logits: Vec<i64>,
}

pub struct BuiltWitness {
    pub input: WitnessInput,
    pub native: NativeForward,
}

pub fn build_witness(input: WitnessInput) -> Result<BuiltWitness> {
    input.validate_dims()?;
    let native = compute_native_forward(&input);
    let expected_bps = concentration_bps_from_logits(&native.logits);
    anyhow::ensure!(
        input.post_trade_concentration_bps == expected_bps as u64,
        "post_trade_concentration_bps {} does not match inference {expected_bps}",
        input.post_trade_concentration_bps
    );
    Ok(BuiltWitness { input, native })
}

pub fn compute_native_forward(witness: &WitnessInput) -> NativeForward {
    let mut hidden1 = vec![0i64; HIDDEN_DIM];
    for h in 0..HIDDEN_DIM {
        let mut acc = witness.fc1_bias[h];
        for i in 0..INPUT_DIM {
            acc += witness.features[i] * witness.fc1_weight[h * INPUT_DIM + i];
        }
        hidden1[h] = acc.max(0);
    }

    let mut hidden2 = vec![0i64; HIDDEN_DIM];
    for h in 0..HIDDEN_DIM {
        let mut acc = witness.fc2_bias[h];
        for i in 0..HIDDEN_DIM {
            acc += hidden1[i] * witness.fc2_weight[h * HIDDEN_DIM + i];
        }
        hidden2[h] = acc.max(0);
    }

    let mut logits = vec![0i64; OUTPUT_DIM];
    for o in 0..OUTPUT_DIM {
        let mut acc = witness.fc3_bias[o];
        for i in 0..HIDDEN_DIM {
            acc += hidden2[i] * witness.fc3_weight[o * HIDDEN_DIM + i];
        }
        logits[o] = acc;
    }

    NativeForward {
        hidden1,
        hidden2,
        logits,
    }
}

/// Dimension-valid witness for Halo2 keygen (synthesize requires a populated witness).
pub fn keygen_witness() -> WitnessInput {
    let witness = WitnessInput {
        fc1_weight: vec![0; HIDDEN_DIM * INPUT_DIM],
        fc1_bias: vec![0; HIDDEN_DIM],
        fc2_weight: vec![0; HIDDEN_DIM * HIDDEN_DIM],
        fc2_bias: vec![0; HIDDEN_DIM],
        fc3_weight: vec![0; OUTPUT_DIM * HIDDEN_DIM],
        fc3_bias: vec![0; OUTPUT_DIM],
        features: vec![0; INPUT_DIM],
        model_commitment: [0u8; 32],
        pool_liquidity_wei: 0,
        post_trade_concentration_bps: 0,
    };
    let native = compute_native_forward(&witness);
    WitnessInput {
        post_trade_concentration_bps: concentration_bps_from_logits(&native.logits) as u64,
        ..witness
    }
}

pub fn concentration_bps_from_logits(logits: &[i64]) -> u32 {
    let max_logit = *logits.iter().max().unwrap_or(&0);
    let exp_sum: f64 = logits
        .iter()
        .map(|&l| ((l - max_logit) as f64 / FIXED_POINT_SCALE as f64).exp())
        .sum();
    let max_weight = 1.0f64 / exp_sum;
    (max_weight * 10_000.0).round() as u32
}

pub fn commitment_field(witness: &WitnessInput) -> halo2curves::bn256::Fr {
    public_commitment_field(witness).expect("commitment field")
}

pub fn validate_witness_against_kzg(
    witness: &WitnessInput,
    registered_kzg_digest: &[u8; 32],
) -> Result<()> {
    anyhow::ensure!(
        witness.model_commitment == *registered_kzg_digest,
        "witness model commitment does not match registered KZG digest"
    );
    hash_weights(witness).context("hash weights")?;
    Ok(())
}
