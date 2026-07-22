// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SafetyInterceptor
/// @notice On-chain enforcement of TrustMesh agent safety constraints.
/// @dev Public input layout (must match Stage 6.75 Halo2 circuit):
///   publicInputs[0] — pool liquidity (uint256)
///   publicInputs[1] — post-transaction single-asset concentration (basis points, 0–10000)
///   publicInputs[2] — model commitment field (`kzgDigestToField + hash(weights)`)
library SafetyInterceptor {
    /// @dev Rolling velocity bucket per agent.
    struct VelocityBucket {
        uint64 windowStart;
        uint32 txCount;
    }

    /// @dev Safety thresholds configured by the contract owner.
    struct Config {
        uint256 minLiquidity;
        uint256 maxConcentrationBps;
        uint256 maxTransactionsPerWindow;
        uint256 velocityWindowSeconds;
    }

    uint256 public constant MAX_BPS = 10_000;

    error LiquidityBelowMinimum(uint256 actual, uint256 required);
    error TargetNotRegistered(address target);
    error ConcentrationExceeded(uint256 actualBps, uint256 maxBps);
    error VelocityLimitExceeded(uint256 count, uint256 maxAllowed);
    error InvalidPublicInputs();
    error InvalidTransactionPayload();

    /// @notice Enforce liquidity, registry, concentration, and velocity constraints.
    /// @param publicInputs Circuit public inputs (see layout above).
    /// @param transactionPayload ABI-encoded `(address target, uint256 value, bytes data)`.
    /// @param config Safety thresholds.
    /// @param registry Allowed target contracts.
    /// @param velocity Per-agent rolling transaction counter.
    /// @param agent Agent address whose velocity bucket is updated on success.
    function enforceAll(
        uint256[] calldata publicInputs,
        bytes calldata transactionPayload,
        Config memory config,
        mapping(address => bool) storage registry,
        mapping(address => VelocityBucket) storage velocity,
        address agent
    ) internal {
        if (publicInputs.length < 3) {
            revert InvalidPublicInputs();
        }

        checkLiquidity(publicInputs[0], config.minLiquidity);

        (address target,,) = decodeTransactionPayload(transactionPayload);
        checkRegistry(target, registry);

        checkConcentration(publicInputs[1], config.maxConcentrationBps);

        recordVelocity(agent, velocity, config.maxTransactionsPerWindow, config.velocityWindowSeconds);
    }

    /// @notice Revert when pool liquidity is below the configured minimum.
    function checkLiquidity(uint256 poolLiquidity, uint256 minLiquidity) internal pure {
        if (poolLiquidity < minLiquidity) {
            revert LiquidityBelowMinimum(poolLiquidity, minLiquidity);
        }
    }

    /// @notice Revert when the transaction target is not on the allowlist.
    function checkRegistry(address target, mapping(address => bool) storage registry) internal view {
        if (!registry[target]) {
            revert TargetNotRegistered(target);
        }
    }

    /// @notice Revert when post-transaction concentration exceeds the cap.
    function checkConcentration(uint256 concentrationBps, uint256 maxConcentrationBps) internal pure {
        if (concentrationBps > maxConcentrationBps) {
            revert ConcentrationExceeded(concentrationBps, maxConcentrationBps);
        }
    }

    /// @notice Increment per-agent velocity and revert when the rolling limit is exceeded.
    function recordVelocity(
        address agent,
        mapping(address => VelocityBucket) storage velocity,
        uint256 maxTransactionsPerWindow,
        uint256 velocityWindowSeconds
    ) internal {
        if (maxTransactionsPerWindow == 0 || velocityWindowSeconds == 0) {
            revert VelocityLimitExceeded(1, 0);
        }

        VelocityBucket storage bucket = velocity[agent];
        uint64 nowTs = uint64(block.timestamp);

        if (nowTs >= bucket.windowStart + velocityWindowSeconds) {
            bucket.windowStart = nowTs;
            bucket.txCount = 1;
            return;
        }

        uint256 nextCount = uint256(bucket.txCount) + 1;
        if (nextCount > maxTransactionsPerWindow) {
            revert VelocityLimitExceeded(nextCount, maxTransactionsPerWindow);
        }

        bucket.txCount = uint32(nextCount);
    }

    /// @notice Reset an agent's velocity bucket (owner-only caller responsibility).
    function resetVelocityBucket(mapping(address => VelocityBucket) storage velocity, address agent) internal {
        delete velocity[agent];
    }

    /// @notice Decode `(address target, uint256 value, bytes data)` from the payload.
    function decodeTransactionPayload(bytes calldata transactionPayload)
        internal
        pure
        returns (address target, uint256 value, bytes memory data)
    {
        if (transactionPayload.length < 32) {
            revert InvalidTransactionPayload();
        }
        (target, value, data) = abi.decode(transactionPayload, (address, uint256, bytes));
        if (target == address(0)) {
            revert InvalidTransactionPayload();
        }
    }
}
