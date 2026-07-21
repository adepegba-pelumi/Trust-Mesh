import os
from dataclasses import dataclass
from pathlib import Path

import requests
from py_ecc.bls.constants import POW_2_381, POW_2_382, POW_2_383
from py_ecc.bls.point_compression import decompress_G1, decompress_G2
from py_ecc.optimized_bls12_381 import Z1, Z2

from trustmesh_prover.kzg.field import FR_MODULUS

# Optimized Jacobian points from py_ecc (3-tuple) or point-at-infinity sentinel.
G1Point = tuple | None
G2Point = tuple | None

TRUSTED_SETUP_URL = (
    "https://raw.githubusercontent.com/ethereum/c-kzg-4844/main/src/trusted_setup.txt"
)
DEFAULT_CACHE_DIR = Path(
    os.environ.get("TRUSTMESH_SRS_CACHE", Path.home() / ".cache" / "trustmesh")
)
DEFAULT_SETUP_FILENAME = "trusted_setup.txt"
G1_COMPRESSED_BYTES = 48
G2_COMPRESSED_BYTES = 96
G1_COMPRESSED_HEX = G1_COMPRESSED_BYTES * 2
G2_COMPRESSED_HEX = G2_COMPRESSED_BYTES * 2


@dataclass(frozen=True)
class StructuredReferenceString:
    """Trusted setup SRS: G1 powers ``[g1, τg1, τ²g1, …]`` and G2 elements ``[g2, τg2]``."""

    g1_powers: tuple[G1Point, ...]
    g2: G2Point
    g2_tau: G2Point
    max_degree: int

    @property
    def degree(self) -> int:
        return self.max_degree


def load_srs(
    cache_dir: Path | None = None,
    force_download: bool = False,
) -> StructuredReferenceString:
    """Download (if needed) and parse the Ethereum ceremony SRS."""
    cache = cache_dir or DEFAULT_CACHE_DIR
    cache.mkdir(parents=True, exist_ok=True)
    setup_path = cache / DEFAULT_SETUP_FILENAME

    if force_download or not setup_path.exists():
        _download_trusted_setup(setup_path)

    return parse_trusted_setup_file(setup_path)


def _download_trusted_setup(destination: Path) -> None:
    response = requests.get(TRUSTED_SETUP_URL, timeout=120)
    response.raise_for_status()
    destination.write_text(response.text, encoding="utf-8")


def parse_trusted_setup_file(path: Path) -> StructuredReferenceString:
    """Parse ``trusted_setup.txt`` from ``ethereum/c-kzg-4844``.

    File layout (per c-kzg-4844)::

        num_g1
        num_g2
        num_g1 × G1 Lagrange (48-byte hex each)
        num_g2 × G2 monomial (96-byte hex each)
        num_g1 × G1 monomial (48-byte hex each)
    """
    lines = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(lines) < 2:
        raise ValueError(f"Invalid trusted setup file: {path}")

    num_g1 = int(lines[0])
    num_g2 = int(lines[1])
    cursor = 2

    lagrange_end = cursor + num_g1
    if lagrange_end > len(lines):
        raise ValueError("Unexpected end of file while reading G1 Lagrange points")
    for index in range(cursor, lagrange_end):
        if len(lines[index]) != G1_COMPRESSED_HEX:
            raise ValueError(
                f"Invalid G1 Lagrange encoding at index {index - cursor}: "
                f"expected {G1_COMPRESSED_HEX} hex chars, got {len(lines[index])}"
            )
    cursor = lagrange_end

    g2_end = cursor + num_g2
    if g2_end > len(lines):
        raise ValueError("Unexpected end of file while reading G2 monomial points")

    g2 = _deserialize_g2(bytes.fromhex(lines[cursor]))
    g2_tau = _deserialize_g2(bytes.fromhex(lines[cursor + 1]))
    for index in range(cursor, g2_end):
        if len(lines[index]) != G2_COMPRESSED_HEX:
            raise ValueError(
                f"Invalid G2 monomial encoding at index {index - cursor}: "
                f"expected {G2_COMPRESSED_HEX} hex chars, got {len(lines[index])}"
            )
    cursor = g2_end

    monomial_end = cursor + num_g1
    if monomial_end > len(lines):
        raise ValueError("Unexpected end of file while reading G1 monomial points")

    g1_monomial: list[G1Point] = []
    for index in range(num_g1):
        line = lines[cursor + index]
        if len(line) != G1_COMPRESSED_HEX:
            raise ValueError(
                f"Invalid G1 monomial encoding at index {index}: "
                f"expected {G1_COMPRESSED_HEX} hex chars, got {len(line)}"
            )
        g1_monomial.append(_deserialize_g1(bytes.fromhex(line)))

    return StructuredReferenceString(
        g1_powers=tuple(g1_monomial),
        g2=g2,
        g2_tau=g2_tau,
        max_degree=num_g1 - 1,
    )


def _deserialize_g1(data: bytes) -> G1Point:
    """Deserialize EIP-4844 48-byte G1 into optimized py_ecc coordinates."""
    if len(data) != G1_COMPRESSED_BYTES:
        raise ValueError(f"Expected {G1_COMPRESSED_BYTES}-byte G1 encoding, got {len(data)}")
    compressed_int = int.from_bytes(data, "big")
    if compressed_int == POW_2_383 + POW_2_382:
        return Z1
    return decompress_G1(compressed_int)


def _deserialize_g2(data: bytes) -> G2Point:
    """Deserialize EIP-4844 96-byte G2 into optimized py_ecc coordinates."""
    if len(data) != G2_COMPRESSED_BYTES:
        raise ValueError(f"Expected {G2_COMPRESSED_BYTES}-byte G2 encoding, got {len(data)}")
    if data[0] & 0x40:
        return Z2

    sign_bit = (data[0] & 0x20) >> 5
    x_re_bytes = bytearray(data[0:48])
    x_re_bytes[0] &= 0x1F
    x_im_bytes = bytearray(data[48:96])
    x_im_bytes[0] &= 0x1F
    x_re = int.from_bytes(x_re_bytes, "big")
    x_im = int.from_bytes(x_im_bytes, "big")
    z1 = x_re + sign_bit * POW_2_381 + POW_2_383
    z2 = x_im
    return decompress_G2((z1, z2))


def domain_point_for_index(global_index: int) -> int:
    """Map a flattened coefficient index to a distinct Fr element (non-zero)."""
    return (global_index + 1) % FR_MODULUS
