//! Fixed-topology MLP dimensions (must match Python `portfolio_model.py`).
pub const INPUT_DIM: usize = 4;
pub const HIDDEN_DIM: usize = 8;
pub const OUTPUT_DIM: usize = 4;
pub const PUBLIC_INPUT_COUNT: usize = 3;
pub const FIXED_POINT_SCALE: i64 = 256;

use halo2_proofs::{
    circuit::{AssignedCell, Layouter, SimpleFloorPlanner, Value},
    plonk::{Advice, Circuit, Column, ConstraintSystem, Error, Fixed, Instance, Selector},
    poly::Rotation,
};
use halo2curves::bn256::Fr;

use crate::field::{i64_to_fr, u128_to_fr};
use crate::poseidon::{hash_weights, kzg_digest_to_field, public_commitment_field};
use crate::types::WitnessInput;
use crate::witness::{compute_native_forward, concentration_bps_from_logits};

#[derive(Clone, Debug)]
pub struct CircuitParams {
    pub k: u32,
}

pub fn circuit_params() -> CircuitParams {
    CircuitParams { k: 18 }
}

#[derive(Clone, Debug)]
pub struct TrustMeshCircuit {
    pub witness: Option<WitnessInput>,
}

impl Default for TrustMeshCircuit {
    fn default() -> Self {
        Self { witness: None }
    }
}

impl TrustMeshCircuit {
    pub fn new(witness: WitnessInput) -> Self {
        Self {
            witness: Some(witness),
        }
    }
}

#[derive(Clone, Debug)]
pub struct TrustMeshConfig {
    pub instance: Column<Instance>,
    pub advice: [Column<Advice>; 3],
    pub _fixed: Column<Fixed>,
    pub selector_mul: Selector,
    pub selector_add: Selector,
    pub selector_relu: Selector,
}

impl Circuit<Fr> for TrustMeshCircuit {
    type Config = TrustMeshConfig;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        Self { witness: None }
    }

    fn configure(meta: &mut ConstraintSystem<Fr>) -> Self::Config {
        let instance = meta.instance_column();
        meta.enable_equality(instance);

        let advice = [
            meta.advice_column(),
            meta.advice_column(),
            meta.advice_column(),
        ];
        for col in advice {
            meta.enable_equality(col);
        }

        let fixed = meta.fixed_column();
        meta.enable_constant(fixed);

        let selector_mul = meta.selector();
        let selector_add = meta.selector();
        let selector_relu = meta.selector();

        meta.create_gate("mul", |meta| {
            let s = meta.query_selector(selector_mul);
            let a = meta.query_advice(advice[0], Rotation::cur());
            let b = meta.query_advice(advice[1], Rotation::cur());
            let c = meta.query_advice(advice[2], Rotation::cur());
            vec![s * (a * b - c)]
        });

        meta.create_gate("add", |meta| {
            let s = meta.query_selector(selector_add);
            let a = meta.query_advice(advice[0], Rotation::cur());
            let b = meta.query_advice(advice[1], Rotation::cur());
            let c = meta.query_advice(advice[2], Rotation::cur());
            vec![s * (a + b - c)]
        });

        meta.create_gate("relu", |meta| {
            let s = meta.query_selector(selector_relu);
            let x = meta.query_advice(advice[0], Rotation::cur());
            let out = meta.query_advice(advice[1], Rotation::cur());
            vec![s * (x - out.clone()) * out]
        });

        TrustMeshConfig {
            instance,
            advice,
            _fixed: fixed,
            selector_mul,
            selector_add,
            selector_relu,
        }
    }

    fn synthesize(
        &self,
        config: Self::Config,
        mut layouter: impl Layouter<Fr>,
    ) -> Result<(), Error> {
        let witness = self.witness.as_ref().ok_or(Error::Synthesis)?;
        let native = compute_native_forward(witness);

        let liquidity_fr = u128_to_fr(witness.pool_liquidity_wei);
        let concentration_fr = Fr::from(witness.post_trade_concentration_bps);
        let commitment_fr = public_commitment_field(witness).map_err(|_| Error::Synthesis)?;

        let liquidity_cell = expose_public_input(
            &config,
            &mut layouter,
            0,
            liquidity_fr,
            "liquidity",
        )?;
        let _ = liquidity_cell;

        let concentration_cell = expose_public_input(
            &config,
            &mut layouter,
            1,
            concentration_fr,
            "concentration",
        )?;

        let commitment_public_cell = expose_public_input(
            &config,
            &mut layouter,
            2,
            commitment_fr,
            "commitment",
        )?;

        let weight_hash_fr = hash_weights(witness).map_err(|_| Error::Synthesis)?;
        let kzg_fr = kzg_digest_to_field(&witness.model_commitment);
        let weight_hash_cell = assign_private(&config, &mut layouter, "weight_hash", weight_hash_fr)?;
        let kzg_cell = assign_private(&config, &mut layouter, "kzg_digest", kzg_fr)?;
        let recomputed_commitment =
            assign_add(&config, &mut layouter, &weight_hash_cell, &kzg_cell)?;
        constrain_equal_cells(
            &config,
            &mut layouter,
            &recomputed_commitment,
            &commitment_public_cell,
        )?;

        let hidden1_cells = synthesize_relu_layer(
            &config,
            &mut layouter,
            &witness.features,
            &witness.fc1_weight,
            &witness.fc1_bias,
            INPUT_DIM,
            HIDDEN_DIM,
            &native.hidden1,
        )?;

        let hidden1_values: Vec<i64> = native.hidden1.clone();
        let hidden2_cells = synthesize_relu_layer_from_cells(
            &config,
            &mut layouter,
            &hidden1_cells,
            &hidden1_values,
            &witness.fc2_weight,
            &witness.fc2_bias,
            HIDDEN_DIM,
            HIDDEN_DIM,
            &native.hidden2,
        )?;

        let hidden2_values: Vec<i64> = native.hidden2.clone();
        let logit_cells = synthesize_linear_layer_from_cells(
            &config,
            &mut layouter,
            &hidden2_cells,
            &hidden2_values,
            &witness.fc3_weight,
            &witness.fc3_bias,
            HIDDEN_DIM,
            OUTPUT_DIM,
            &native.logits,
        )?;
        let _ = logit_cells;

        let computed_bps = concentration_bps_from_logits(&native.logits);
        let computed_bps_cell = assign_private(
            &config,
            &mut layouter,
            "computed_bps",
            Fr::from(computed_bps as u64),
        )?;
        constrain_equal_cells(
            &config,
            &mut layouter,
            &computed_bps_cell,
            &concentration_cell,
        )?;

        Ok(())
    }
}

fn expose_public_input(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    idx: usize,
    value: Fr,
    name: &str,
) -> Result<AssignedCell<Fr, Fr>, Error> {
    let cell = layouter.assign_region(
        || format!("public_{name}"),
        |mut region| {
            region.assign_advice(|| name, config.advice[0], 0, || Value::known(value))
        },
    )?;
    layouter.constrain_instance(cell.cell(), config.instance, idx)?;
    Ok(cell)
}

fn assign_private(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    name: &str,
    value: Fr,
) -> Result<AssignedCell<Fr, Fr>, Error> {
    layouter.assign_region(
        || name.to_string(),
        |mut region| region.assign_advice(|| name, config.advice[0], 0, || Value::known(value)),
    )
}

fn assign_mul(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    a: &AssignedCell<Fr, Fr>,
    b: &AssignedCell<Fr, Fr>,
) -> Result<AssignedCell<Fr, Fr>, Error> {
    layouter.assign_region(
        || "mul",
        |mut region| {
            config.selector_mul.enable(&mut region, 0)?;
            a.copy_advice(|| "a", &mut region, config.advice[0], 0)?;
            b.copy_advice(|| "b", &mut region, config.advice[1], 0)?;
            let product = a.value().cloned() * b.value().cloned();
            region.assign_advice(|| "c", config.advice[2], 0, || product)
        },
    )
}

fn assign_add(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    a: &AssignedCell<Fr, Fr>,
    b: &AssignedCell<Fr, Fr>,
) -> Result<AssignedCell<Fr, Fr>, Error> {
    layouter.assign_region(
        || "add",
        |mut region| {
            config.selector_add.enable(&mut region, 0)?;
            a.copy_advice(|| "a", &mut region, config.advice[0], 0)?;
            b.copy_advice(|| "b", &mut region, config.advice[1], 0)?;
            let sum = a.value().cloned() + b.value().cloned();
            region.assign_advice(|| "c", config.advice[2], 0, || sum)
        },
    )
}

fn assign_relu(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    pre: &AssignedCell<Fr, Fr>,
    post: Fr,
) -> Result<AssignedCell<Fr, Fr>, Error> {
    layouter.assign_region(
        || "relu",
        |mut region| {
            config.selector_relu.enable(&mut region, 0)?;
            pre.copy_advice(|| "pre", &mut region, config.advice[0], 0)?;
            region.assign_advice(|| "post", config.advice[1], 0, || Value::known(post))
        },
    )
}

fn constrain_equal_cells(
    _config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    left: &AssignedCell<Fr, Fr>,
    right: &AssignedCell<Fr, Fr>,
) -> Result<(), Error> {
    layouter.assign_region(|| "equal", |mut region| {
        region.constrain_equal(left.cell(), right.cell())
    })
}

fn synthesize_relu_layer(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    inputs: &[i64],
    weights: &[i64],
    biases: &[i64],
    input_dim: usize,
    output_dim: usize,
    relu_outputs: &[i64],
) -> Result<Vec<AssignedCell<Fr, Fr>>, Error> {
    let mut out_cells = Vec::with_capacity(output_dim);
    for h in 0..output_dim {
        let bias_cell = assign_private(config, layouter, "bias", i64_to_fr(biases[h]))?;
        let mut acc = bias_cell;
        for i in 0..input_dim {
            let feat = assign_private(config, layouter, "feat", i64_to_fr(inputs[i]))?;
            let weight = assign_private(
                config,
                layouter,
                "weight",
                i64_to_fr(weights[h * input_dim + i]),
            )?;
            let prod = assign_mul(config, layouter, &feat, &weight)?;
            acc = assign_add(config, layouter, &acc, &prod)?;
        }
        let relu_cell = assign_relu(config, layouter, &acc, i64_to_fr(relu_outputs[h]))?;
        out_cells.push(relu_cell);
    }
    Ok(out_cells)
}

fn synthesize_relu_layer_from_cells(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    input_cells: &[AssignedCell<Fr, Fr>],
    input_values: &[i64],
    weights: &[i64],
    biases: &[i64],
    input_dim: usize,
    output_dim: usize,
    relu_outputs: &[i64],
) -> Result<Vec<AssignedCell<Fr, Fr>>, Error> {
    let mut out_cells = Vec::with_capacity(output_dim);
    for h in 0..output_dim {
        let bias_cell = assign_private(config, layouter, "bias", i64_to_fr(biases[h]))?;
        let mut acc = bias_cell;
        for i in 0..input_dim {
            let input = assign_private(config, layouter, "hidden_in", i64_to_fr(input_values[i]))?;
            constrain_equal_cells(config, layouter, &input, &input_cells[i])?;
            let weight = assign_private(
                config,
                layouter,
                "weight",
                i64_to_fr(weights[h * input_dim + i]),
            )?;
            let prod = assign_mul(config, layouter, &input, &weight)?;
            acc = assign_add(config, layouter, &acc, &prod)?;
        }
        let relu_cell = assign_relu(config, layouter, &acc, i64_to_fr(relu_outputs[h]))?;
        out_cells.push(relu_cell);
    }
    Ok(out_cells)
}

fn synthesize_linear_layer_from_cells(
    config: &TrustMeshConfig,
    layouter: &mut impl Layouter<Fr>,
    input_cells: &[AssignedCell<Fr, Fr>],
    input_values: &[i64],
    weights: &[i64],
    biases: &[i64],
    input_dim: usize,
    output_dim: usize,
    logits: &[i64],
) -> Result<Vec<AssignedCell<Fr, Fr>>, Error> {
    let mut out_cells = Vec::with_capacity(output_dim);
    for o in 0..output_dim {
        let bias_cell = assign_private(config, layouter, "bias", i64_to_fr(biases[o]))?;
        let mut acc = bias_cell;
        for i in 0..input_dim {
            let input = assign_private(config, layouter, "hidden_in", i64_to_fr(input_values[i]))?;
            constrain_equal_cells(config, layouter, &input, &input_cells[i])?;
            let weight = assign_private(
                config,
                layouter,
                "weight",
                i64_to_fr(weights[o * input_dim + i]),
            )?;
            let prod = assign_mul(config, layouter, &input, &weight)?;
            acc = assign_add(config, layouter, &acc, &prod)?;
        }
        let logit_cell = assign_private(config, layouter, "logit", i64_to_fr(logits[o]))?;
        constrain_equal_cells(config, layouter, &acc, &logit_cell)?;
        out_cells.push(logit_cell);
    }
    Ok(out_cells)
}
