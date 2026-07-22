//! Field element helpers for BN254 public inputs.
use halo2curves::bn256::Fr;
use halo2curves::ff::PrimeField;

pub fn i64_to_fr(value: i64) -> Fr {
    if value >= 0 {
        Fr::from(value as u64)
    } else {
        -Fr::from((-value) as u64)
    }
}

pub fn u128_to_fr(value: u128) -> Fr {
    Fr::from_str_vartime(&value.to_string()).expect("u128 fits in field for demo inputs")
}

pub fn fr_to_u128_string(value: Fr) -> String {
    let repr = value.to_repr();
    let mut acc = 0u128;
    for byte in repr.as_ref().iter().rev().take(16) {
        acc = (acc << 8) + (*byte as u128);
    }
    acc.to_string()
}
