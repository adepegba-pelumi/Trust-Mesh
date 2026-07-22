use std::fs;
use std::path::Path;

use anyhow::{Context, Result};
use halo2_solidity_verifier::{BatchOpenScheme::Bdfg21, SolidityGenerator};

use crate::circuit::PUBLIC_INPUT_COUNT;
use crate::keys::KeyMaterial;

pub struct SolidityExportReport {
    pub verifier_path: String,
    pub instance_count: usize,
}

pub fn export_solidity_verifier(material: &KeyMaterial, output_dir: &Path) -> Result<SolidityExportReport> {
    fs::create_dir_all(output_dir).context("create solidity output dir")?;
    let generator = SolidityGenerator::new(
        &material.params,
        &material.vk,
        Bdfg21,
        PUBLIC_INPUT_COUNT,
    );
    let solidity = generator.render().context("render halo2 solidity verifier")?;
    let verifier_path = output_dir.join("Halo2Verifier.sol");
    fs::write(&verifier_path, solidity).context("write Halo2Verifier.sol")?;
    Ok(SolidityExportReport {
        verifier_path: verifier_path.display().to_string(),
        instance_count: PUBLIC_INPUT_COUNT,
    })
}
