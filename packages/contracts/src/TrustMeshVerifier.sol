// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {CommitmentBinding} from "./CommitmentBinding.sol";
import {IPlonkVerifier} from "./interfaces/IPlonkVerifier.sol";
import {SafetyInterceptor} from "./SafetyInterceptor.sol";

/// @title TrustMeshVerifier
/// @notice Verifies PLONK proofs and enforces agent safety constraints before execution.
/// @dev Production deployments wire in a Halo2-generated PLONK verifier via `IPlonkVerifier`.
contract TrustMeshVerifier is Ownable {
    IPlonkVerifier public immutable plonkVerifier;

    SafetyInterceptor.Config public safetyConfig;
    mapping(address => bytes32) public agentCommitments;
    mapping(address => uint256) public agentCommitmentFields;
    mapping(address => bool) public contractRegistry;
    mapping(address => SafetyInterceptor.VelocityBucket) public agentVelocity;

    event AgentRegistered(
        address indexed agent, bytes32 modelCommitment, uint256 commitmentField
    );
    event ContractRegistered(address indexed target);
    event ContractRemoved(address indexed target);
    event SafetyConfigUpdated(
        uint256 minLiquidity,
        uint256 maxConcentrationBps,
        uint256 maxTransactionsPerWindow,
        uint256 velocityWindowSeconds
    );
    event VelocityReset(address indexed agent);
    event VerifiedDecision(
        address indexed agent, bytes32 modelCommitment, uint256[] publicInputs, uint256 timestamp
    );

    error AgentNotRegistered(address agent);
    error InvalidProof();
    error InvalidPublicInputs();

    constructor(address plonkVerifier_, address initialOwner) Ownable(initialOwner) {
        require(plonkVerifier_ != address(0), "Zero verifier");
        plonkVerifier = IPlonkVerifier(plonkVerifier_);

        safetyConfig = SafetyInterceptor.Config({
            minLiquidity: 1_000 ether,
            maxConcentrationBps: 5_000,
            maxTransactionsPerWindow: 10,
            velocityWindowSeconds: 3600
        });
    }

    /// @notice Register the calling agent with a model commitment hash and Halo2 public field.
    /// @param modelCommitment Stage 1 KZG digest of quantized model weights.
    /// @param commitmentField Halo2 public input [2] for this model (`kzgField + hash(weights)`).
    function registerAgent(bytes32 modelCommitment, uint256 commitmentField) external {
        require(modelCommitment != bytes32(0), "Zero commitment");
        CommitmentBinding.validateRegisteredField(modelCommitment, commitmentField);
        agentCommitments[msg.sender] = modelCommitment;
        agentCommitmentFields[msg.sender] = commitmentField;
        emit AgentRegistered(msg.sender, modelCommitment, commitmentField);
    }

    /// @notice Verify a PLONK proof, enforce safety constraints, and emit a verified decision.
    /// @param agent Registered agent address.
    /// @param proof PLONK proof bytes from the prover.
    /// @param publicInputs Circuit public inputs (liquidity, concentration bps, …).
    /// @param transactionPayload ABI-encoded `(address target, uint256 value, bytes data)`.
    function verifyAndExecute(
        address agent,
        bytes calldata proof,
        uint256[] calldata publicInputs,
        bytes calldata transactionPayload
    ) external returns (bool) {
        bytes32 modelCommitment = agentCommitments[agent];
        if (modelCommitment == bytes32(0)) {
            revert AgentNotRegistered(agent);
        }

        if (publicInputs.length < 3) {
            revert InvalidPublicInputs();
        }

        if (!plonkVerifier.verifyProof(publicInputs, proof)) {
            revert InvalidProof();
        }

        CommitmentBinding.verifyExactBinding(
            modelCommitment, agentCommitmentFields[agent], publicInputs[2]
        );

        SafetyInterceptor.enforceAll(
            publicInputs,
            transactionPayload,
            safetyConfig,
            contractRegistry,
            agentVelocity,
            agent
        );

        emit VerifiedDecision(agent, modelCommitment, publicInputs, block.timestamp);
        return true;
    }

    /// @notice Update safety thresholds (owner only).
    function setSafetyConfig(
        uint256 minLiquidity,
        uint256 maxConcentrationBps,
        uint256 maxTransactionsPerWindow,
        uint256 velocityWindowSeconds
    ) external onlyOwner {
        require(maxConcentrationBps <= SafetyInterceptor.MAX_BPS, "Invalid bps");
        require(maxTransactionsPerWindow > 0, "Zero velocity limit");
        require(velocityWindowSeconds > 0, "Zero velocity window");

        safetyConfig = SafetyInterceptor.Config({
            minLiquidity: minLiquidity,
            maxConcentrationBps: maxConcentrationBps,
            maxTransactionsPerWindow: maxTransactionsPerWindow,
            velocityWindowSeconds: velocityWindowSeconds
        });

        emit SafetyConfigUpdated(
            minLiquidity, maxConcentrationBps, maxTransactionsPerWindow, velocityWindowSeconds
        );
    }

    /// @notice Add a target contract to the allowlist (owner only).
    function addToRegistry(address target) external onlyOwner {
        require(target != address(0), "Zero target");
        contractRegistry[target] = true;
        emit ContractRegistered(target);
    }

    /// @notice Remove a target contract from the allowlist (owner only).
    function removeFromRegistry(address target) external onlyOwner {
        contractRegistry[target] = false;
        emit ContractRemoved(target);
    }

    /// @notice Reset an agent's velocity bucket (owner only).
    function resetVelocity(address agent) external onlyOwner {
        SafetyInterceptor.resetVelocityBucket(agentVelocity, agent);
        emit VelocityReset(agent);
    }
}
