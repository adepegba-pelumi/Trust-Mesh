const WEI = 10n ** 18n;
const ETH_USD_ESTIMATE = 3500;

export function truncateHash(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 2) return value;
  return `${value.slice(0, head + 2)}…${value.slice(-tail)}`;
}

export function formatModelCommitment(value: string): string {
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  return truncateHash(normalized, 8, 6);
}

export function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export function formatPublicInputs(publicInputs: readonly bigint[]): string {
  if (publicInputs.length < 2) {
    return publicInputs.map((value) => value.toString()).join(", ");
  }

  const liquidityWei = publicInputs[0];
  const concentrationBps = Number(publicInputs[1]);
  const eth = Number(liquidityWei) / Number(WEI);
  const usd = eth * ETH_USD_ESTIMATE;
  const concentrationPct = concentrationBps / 100;

  const liquidityLabel =
    usd >= 1_000_000
      ? `$${(usd / 1_000_000).toFixed(2)}M`
      : usd >= 1_000
        ? `$${(usd / 1_000).toFixed(1)}K`
        : `$${usd.toFixed(0)}`;

  return `liquidity: ${liquidityLabel} (${eth.toFixed(2)} ETH), concentration: ${concentrationPct.toFixed(1)}%`;
}

export function normalizeCommitment(value: string): string {
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  return `0x${hex.padStart(64, "0").slice(-64)}`.toLowerCase();
}
