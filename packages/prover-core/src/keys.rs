use halo2_proofs::SerdeFormat;

use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use halo2_proofs::plonk::{keygen_pk, keygen_vk, ProvingKey, VerifyingKey};
use halo2_proofs::poly::commitment::{Params, ParamsProver};
use halo2_proofs::poly::kzg::commitment::ParamsKZG;
use halo2curves::bn256::{Bn256, G1Affine};

use crate::circuit::{circuit_params, TrustMeshCircuit};
use crate::witness::keygen_witness;

pub struct KeyMaterial {
    pub params: ParamsKZG<Bn256>,
    pub pk: ProvingKey<G1Affine>,
    pub vk: VerifyingKey<G1Affine>,
}

pub fn setup_keys() -> Result<KeyMaterial> {
    let k = circuit_params().k;
    let params = ParamsKZG::<Bn256>::new(k);
    let keygen_circuit = TrustMeshCircuit::new(keygen_witness());
    let vk = keygen_vk(&params, &keygen_circuit).context("keygen vk")?;
    let pk = keygen_pk(&params, vk.clone(), &keygen_circuit).context("keygen pk")?;
    Ok(KeyMaterial { params, pk, vk })
}

pub fn keys_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("keys")
}

pub fn save_keys(material: &KeyMaterial, dir: &Path) -> Result<()> {
    std::fs::create_dir_all(dir)?;
    write_params(&material.params, &dir.join("params.bin"))?;
    write_pk(&material.pk, &dir.join("pk.bin"))?;
    write_vk(&material.vk, &dir.join("vk.bin"))?;
    Ok(())
}

pub fn load_params(dir: &Path) -> Result<ParamsKZG<Bn256>> {
    read_params(&dir.join("params.bin"))
}

pub fn load_proving_key(dir: &Path, params: &ParamsKZG<Bn256>) -> Result<ProvingKey<G1Affine>> {
    read_pk(&dir.join("pk.bin"), params)
}

pub fn load_verifying_key(dir: &Path, params: &ParamsKZG<Bn256>) -> Result<VerifyingKey<G1Affine>> {
    read_vk(&dir.join("vk.bin"), params)
}

fn write_params(params: &ParamsKZG<Bn256>, path: &Path) -> Result<()> {
    let file = File::create(path)?;
    Params::write(params, &mut BufWriter::new(file)).context("write params")
}

fn read_params(path: &Path) -> Result<ParamsKZG<Bn256>> {
    let file = File::open(path)?;
    Params::read(&mut BufReader::new(file)).context("read params")
}

fn write_pk(pk: &ProvingKey<G1Affine>, path: &Path) -> Result<()> {
    let file = File::create(path)?;
    pk.write(&mut BufWriter::new(file), SerdeFormat::RawBytes)
        .context("write pk")
}

fn read_pk(path: &Path, _params: &ParamsKZG<Bn256>) -> Result<ProvingKey<G1Affine>> {
    let file = File::open(path)?;
    ProvingKey::read::<_, TrustMeshCircuit>(&mut BufReader::new(file), SerdeFormat::RawBytes)
        .context("read pk")
}

fn write_vk(vk: &VerifyingKey<G1Affine>, path: &Path) -> Result<()> {
    let file = File::create(path)?;
    vk.write(&mut BufWriter::new(file), SerdeFormat::RawBytes)
        .context("write vk")
}

fn read_vk(path: &Path, _params: &ParamsKZG<Bn256>) -> Result<VerifyingKey<G1Affine>> {
    let file = File::open(path)?;
    VerifyingKey::read::<_, TrustMeshCircuit>(&mut BufReader::new(file), SerdeFormat::RawBytes)
        .context("read vk")
}
