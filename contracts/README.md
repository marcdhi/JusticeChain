# JusticeChain Contracts

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

# Contracts Overview

1. **JudicialCore.sol** - (Priority - High)

- Purpose: Core logic for judicial operations
- Manages case flow and interactions between contracts
- Implements dispute resolution mechanisms
- Handles appeals and corrections

2. **StakingManager.sol** - (Priority - High)

- Purpose: Handles all staking operations and reward distributions
- Manages stake locking/unlocking
- Distributes rewards based on case outcomes
- Handles slashing for misbehavior

3. **EvidenceManager.col** - with ZK Proofs - (Priority - High)

- Purpose: Manages evidence submission with privacy features
- Handles encrypted evidence storage
- Implements zero-knowledge proof verification
- Controls access rights to sensitive evidence

4. **SessionManager.sol** - with private channels - (Priority - Med)

- Purpose: Manages courtroom sessions and participant access
- Implements state channels for private communications
- Controls session lifecycle
- Handles participant authentication

5. **JusticeDAO.sol** - (TBD) - (Priority - Low)

- Purpose: Handles protocol governance and upgrades
- Manages voting on protocol changes
- Controls protocol parameters
- Handles proposal lifecycle

