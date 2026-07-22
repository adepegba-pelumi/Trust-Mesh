use std::fs;
use std::io::{self, Write};
use std::path::PathBuf;

use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use trustmesh_prover_core::{
    circuit::{circuit_params, PUBLIC_INPUT_COUNT},
    keys::{load_params, load_proving_key, load_verifying_key, save_keys, setup_keys, KeyMaterial},
    prove::{benchmark, prove, verify_local},
    types::{BenchmarkReport, ProofArtifacts, SetupReport, VerifyReport, WitnessInput},
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
            let proof_bytes = fs::read(&proof)?;
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
    }
    Ok(())
}

fn emit<T: serde::Serialize>(json: bool, value: &T) -> Result<()> {
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
