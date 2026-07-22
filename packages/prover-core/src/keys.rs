use halo2_proofs::SerdeFormat;

use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use halo2_proofs::plonk::{keygen_pk, keygen_vk, ProvingKey, VerifyingKey};
use halo2_proofs::poly::commitment::Params;
use halo2curves::bn256::Bn256;

use crate::circuit::{circuit_params, TrustMeshCircuit};

pub struct KeyMaterial {
    pub params: Params<Bn256>,
    pub pk: ProvingKey<Bn256>,
    pub vk: VerifyingKey<Bn256>,
}

pub fn setup_keys() -> Result<KeyMaterial> {
    let k = circuit_params().k;
    let params = Params::<Bn256>::new(k);
    let empty = TrustMeshCircuit::default();
    let vk = keygen_vk(&params, &empty).context("keygen vk")?;
    let pk = keygen_pk(&params, vk.clone(), &empty).context("keygen pk")?;
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

pub fn load_params(dir: &Path) -> Result<Params<Bn256>> {
    read_params(&dir.join("params.bin"))
}

pub fn load_proving_key(dir: &Path, params: &Params<Bn256>) -> Result<ProvingKey<Bn256>> {
    read_pk(&dir.join("pk.bin"), params)
}

pub fn load_verifying_key(dir: &Path, params: &Params<Bn256>) -> Result<VerifyingKey<Bn256>> {
    read_vk(&dir.join("vk.bin"), params)
}

fn write_params(params: &Params<Bn256>, path: &Path) -> Result<()> {
    let file = File::create(path)?;
    params.write(&mut BufWriter::new(file)).context("write params")
}

fn read_params(path: &Path) -> Result<Params<Bn256>> {
    let file = File::open(path)?;
    Params::read(&mut BufReader::new(file)).context("read params")
}

fn write_pk(pk: &ProvingKey<Bn256>, path: &Path) -> Result<()> {
    let file = File::create(path)?;
    pk.write(&mut BufWriter::new(file), SerdeFormat::RawBytes)
        .context("write pk")
}

fn read_pk(path: &Path, params: &Params<Bn256>) -> Result<ProvingKey<Bn256>> {
    let file = File::open(path)?;
    ProvingKey::read(&mut BufReader::new(file), SerdeFormat::RawBytes, params)
        .context("read pk")
}

fn write_vk(vk: &VerifyingKey<Bn256>, path: &Path) -> Result<()> {
    let file = File::create(path)?;
    vk.write(&mut BufWriter::new(file), SerdeFormat::RawBytes)
        .context("write vk")
}

fn read_vk(path: &Path, params: &Params<Bn256>) -> Result<VerifyingKey<Bn256>> {
    let file = File::open(path)?;
    VerifyingKey::read(&mut BufReader::new(file), SerdeFormat::RawBytes, params)
        .context("read vk")
}