use std::fs;
use std::io::{self, Write};
use std::path::PathBuf;

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use trustmesh_prover_core::{
    circuit::{circuit_params, PUBLIC_INPUT_COUNT},
    export_solidity_verifier,
    keys::{load_params, load_proving_key, load_verifying_key, save_keys, setup_keys, KeyMaterial},
    prove::{benchmark, prove, verify_local},
    types::{ProofArtifacts, SetupReport, WitnessInput},
};

#[derive(Parser)]
#[command(name = "trustmesh-prove", about = "TrustMesh production Halo2 prover")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate SRS params, proving key, and verification key.
    Setup {
        #[arg(long, default_value = "keys")]
        output: PathBuf,
        #[arg(long, default_value_t = false)]
        json: bool,
    },
    /// Export a Solidity Halo2 verifier for the TrustMesh circuit.
    ExportSolidity {
        #[arg(long, default_value = "keys")]
        keys: PathBuf,
        #[arg(long)]
        output: PathBuf,
        #[arg(long, default_value_t = false)]
        json: bool,
    },
    /// Generate a Halo2 proof from witness JSON.
    Prove {
        #[arg(long)]
        witness: PathBuf,
        #[arg(long, default_value = "keys")]
        keys: PathBuf,
        #[arg(long)]
        output: Option<PathBuf>,
        #[arg(long, default_value_t = false)]
        json: bool,
    },
    /// Verify a proof locally.
    Verify {
        #[arg(long)]
        witness: PathBuf,
        #[arg(long)]
        proof: PathBuf,
        #[arg(long, default_value = "keys")]
        keys: PathBuf,
        #[arg(long, default_value_t = false)]
        json: bool,
    },
    /// Benchmark witness generation, proving, and verification.
    Benchmark {
        #[arg(long)]
        witness: PathBuf,
        #[arg(long, default_value = "keys")]
        keys: PathBuf,
        #[arg(long, default_value_t = false)]
        json: bool,
    },
    /// Write deterministic proof fixtures for Foundry and pytest.
    ExportFixtures {
        #[arg(long)]
        witness: PathBuf,
        #[arg(long, default_value = "keys")]
        keys: PathBuf,
        #[arg(long)]
        output_dir: PathBuf,
        #[arg(long, default_value_t = false)]
        json: bool,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Setup { output, json } => {
            let material = setup_keys().context("setup keys")?;
            save_keys(&material, &output)?;
            let report = SetupReport {
                keys_directory: output.display().to_string(),
                circuit_k: circuit_params().k,
                public_input_count: PUBLIC_INPUT_COUNT,
            };
            emit(json, &report)?;
        }
        Commands::ExportSolidity { keys, output, json } => {
            let material = load_keys_from(&keys)?;
            let report = export_solidity_verifier(&material, &output)?;
            emit(json, &report)?;
        }
        Commands::Prove {
            witness,
            keys,
            output,
            json,
        } => {
            let witness = read_witness(&witness)?;
            let material = load_keys_from(&keys)?;
            let artifacts = prove(&material, witness)?;
            if let Some(path) = output {
                fs::write(&path, serde_json::to_vec_pretty(&artifacts)?)?;
            }
            emit(json, &artifacts)?;
        }
        Commands::Verify {
            witness,
            proof,
            keys,
            json,
        } => {
            let witness = read_witness(&witness)?;
            let proof_bytes = read_proof_bytes(&proof)?;
            let material = load_keys_from(&keys)?;
            let report = verify_local(&material, &proof_bytes, &witness)?;
            emit(json, &report)?;
        }
        Commands::Benchmark {
            witness,
            keys,
            json,
        } => {
            let witness = read_witness(&witness)?;
            let material = load_keys_from(&keys)?;
            let report = benchmark(&material, witness)?;
            emit(json, &report)?;
        }
        Commands::ExportFixtures {
            witness,
            keys,
            output_dir,
            json,
        } => {
            std::env::set_var("TRUSTMESH_PROOF_SEED", "42");
            let witness_input = read_witness(&witness)?;
            let material = load_keys_from(&keys)?;
            let artifacts = prove(&material, witness_input.clone())?;
            fs::create_dir_all(&output_dir)?;
            let bundle_path = output_dir.join("proof_bundle.json");
            fs::write(&bundle_path, serde_json::to_vec_pretty(&artifacts)?)?;
            let mut bundle_json: serde_json::Value =
                serde_json::from_slice(&fs::read(&bundle_path)?)?;
            if let Some(obj) = bundle_json.as_object_mut() {
                obj.insert(
                    "proof_hex".to_string(),
                    serde_json::Value::String(hex::encode(&artifacts.proof)),
                );
            }
            fs::write(&bundle_path, serde_json::to_vec_pretty(&bundle_json)?)?;
            let witness_path = output_dir.join("witness.json");
            fs::write(&witness_path, serde_json::to_vec_pretty(&witness_input)?)?;
            let summary = serde_json::json!({
                "proof_bundle": bundle_path.display().to_string(),
                "witness": witness_path.display().to_string(),
                "model_commitment": hex::encode(witness_input.model_commitment),
                "public_inputs": artifacts.public_inputs,
                "proof_size": artifacts.proof_size,
            });
            emit(json, &summary)?;
        }
    }
    Ok(())
}

fn emit<T: serde::Serialize + std::fmt::Debug>(json: bool, value: &T) -> Result<()> {
    if json {
        println!("{}", serde_json::to_string_pretty(value)?);
    } else {
        writeln!(io::stdout(), "{value:#?}")?;
    }
    Ok(())
}

fn read_witness(path: &PathBuf) -> Result<WitnessInput> {
    let raw = fs::read_to_string(path)?;
    serde_json::from_str(&raw).context("parse witness json")
}

fn read_proof_bytes(path: &PathBuf) -> Result<Vec<u8>> {
    let raw = fs::read(path)?;
    if path.extension().and_then(|ext| ext.to_str()) == Some("json") {
        let artifacts: ProofArtifacts = serde_json::from_slice(&raw).context("parse proof json")?;
        return Ok(artifacts.proof);
    }
    Ok(raw)
}

fn load_keys_from(dir: &PathBuf) -> Result<KeyMaterial> {
    if dir.join("params.bin").exists() {
        let params = load_params(dir)?;
        let pk = load_proving_key(dir, &params)?;
        let vk = load_verifying_key(dir, &params)?;
        Ok(KeyMaterial { params, pk, vk })
    } else {
        setup_keys()
    }
}
