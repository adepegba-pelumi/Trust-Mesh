//! Deterministic weight binding hash (native; constrained against public instance).
use anyhow::Result;
use halo2curves::bn256::Fr;

use crate::field::i64_to_fr;
use crate::types::WitnessInput;

/// Hash flattened quantized weights + features into a single field element.
pub fn hash_weights(witness: &WitnessInput) -> Result<Fr> {
    let mut acc = Fr::from(0x5a5a_5a5a_u64);
    let mut items: Vec<i64> = Vec::new();
    items.extend_from_slice(&witness.fc1_weight);
    items.extend_from_slice(&witness.fc1_bias);
    items.extend_from_slice(&witness.fc2_weight);
    items.extend_from_slice(&witness.fc2_bias);
    items.extend_from_slice(&witness.fc3_weight);
    items.extend_from_slice(&witness.fc3_bias);
    items.extend_from_slice(&witness.features);

    for (idx, value) in items.iter().enumerate() {
        let term = i64_to_fr(*value);
        let idx_fr = Fr::from(idx as u64 + 1);
        acc = acc + term * idx_fr;
        acc = acc * Fr::from(7919_u64) + term;
    }
    Ok(acc)
}

pub fn kzg_digest_to_field(digest: &[u8; 32]) -> Fr {
    let mut value = Fr::from(0u64);
    for byte in digest {
        value = value * Fr::from(256u64) + Fr::from(*byte as u64);
    }
    value
}

/// Public commitment instance: binds private weights to the registered KZG digest field.
pub fn public_commitment_field(witness: &WitnessInput) -> Result<Fr> {
    Ok(kzg_digest_to_field(&witness.model_commitment) + hash_weights(witness)?)
}
