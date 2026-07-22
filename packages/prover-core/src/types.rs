use serde::{Deserialize, Serialize};

use crate::circuit::{HIDDEN_DIM, INPUT_DIM, OUTPUT_DIM};

/// Witness supplied to the Halo2 prover (private inputs + public safety/market data).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WitnessInput {
    pub fc1_weight: Vec<i64>,
    pub fc1_bias: Vec<i64>,
    pub fc2_weight: Vec<i64>,
    pub fc2_bias: Vec<i64>,
    pub fc3_weight: Vec<i64>,
    pub fc3_bias: Vec<i64>,
    pub features: Vec<i64>,
    #[serde(with = "serde_bytes")]
    pub model_commitment: [u8; 32],
    #[serde(with = "serde_u128_string")]
    pub pool_liquidity_wei: u128,
    pub post_trade_concentration_bps: u64,
}

mod serde_u128_string {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    pub fn serialize<S: Serializer>(value: &u128, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&value.to_string())
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<u128, D::Error> {
        let value = serde_json::Value::deserialize(deserializer)?;
        match value {
            serde_json::Value::String(text) => text.parse().map_err(serde::de::Error::custom),
            serde_json::Value::Number(number) => number
                .as_u64()
                .map(u128::from)
                .ok_or_else(|| serde::de::Error::custom("invalid u128 number")),
            _ => Err(serde::de::Error::custom("expected string or number for u128")),
        }
    }
}

mod serde_bytes {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    pub fn serialize<S: Serializer>(bytes: &[u8; 32], serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&hex::encode(bytes))
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<[u8; 32], D::Error> {
        let s = String::deserialize(deserializer)?;
        let raw = hex::decode(s.trim_start_matches("0x")).map_err(serde::de::Error::custom)?;
        raw.try_into()
            .map_err(|_| serde::de::Error::custom("expected 32-byte hex commitment"))
    }
}

impl WitnessInput {
    pub fn validate_dims(&self) -> anyhow::Result<()> {
        anyhow::ensure!(self.features.len() == INPUT_DIM, "features length mismatch");
        anyhow::ensure!(
            self.fc1_weight.len() == HIDDEN_DIM * INPUT_DIM,
            "fc1_weight length mismatch"
        );
        anyhow::ensure!(self.fc1_bias.len() == HIDDEN_DIM, "fc1_bias length mismatch");
        anyhow::ensure!(
            self.fc2_weight.len() == HIDDEN_DIM * HIDDEN_DIM,
            "fc2_weight length mismatch"
        );
        anyhow::ensure!(self.fc2_bias.len() == HIDDEN_DIM, "fc2_bias length mismatch");
        anyhow::ensure!(
            self.fc3_weight.len() == OUTPUT_DIM * HIDDEN_DIM,
            "fc3_weight length mismatch"
        );
        anyhow::ensure!(self.fc3_bias.len() == OUTPUT_DIM, "fc3_bias length mismatch");
        anyhow::ensure!(
            self.post_trade_concentration_bps <= 10_000,
            "concentration bps out of range"
        );
        Ok(())
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProofArtifacts {
    #[serde(with = "serde_bytes_vec")]
    pub proof: Vec<u8>,
    pub public_inputs: Vec<String>,
    pub prove_seconds: f64,
    pub proof_size: usize,
}

mod serde_bytes_vec {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    pub fn serialize<S: Serializer>(bytes: &[u8], serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&STANDARD.encode(bytes))
    }

    pub fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Vec<u8>, D::Error> {
        let s = String::deserialize(deserializer)?;
        STANDARD.decode(s).map_err(serde::de::Error::custom)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BenchmarkReport {
    pub witness_generation_seconds: f64,
    pub prove_seconds: f64,
    pub verify_seconds: f64,
    pub proof_size_bytes: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VerifyReport {
    pub valid: bool,
    pub verify_seconds: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SetupReport {
    pub keys_directory: String,
    pub circuit_k: u32,
    pub public_input_count: usize,
}
