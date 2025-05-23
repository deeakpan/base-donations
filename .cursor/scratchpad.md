# Donation Smart Contract Project

## Background and Motivation
- Create a simple donation smart contract on Base Sepolia testnet
- Allow users to connect their wallet and send donations
- Store recipient wallet address in environment variables
- Test basic Web3 functionality with Coinbase Onchain Kit

## Key Challenges and Analysis
1. Smart Contract Development
   - Need to write a simple Solidity contract for accepting donations
   - Must handle ETH transfers safely
   - Should include basic events for tracking donations

2. Environment Setup
   - Need to set up Hardhat for contract development and testing
   - Configure Base Sepolia network settings
   - Set up environment variables for wallet addresses

3. Frontend Integration
   - Integrate with existing Coinbase Onchain Kit setup
   - Add donation UI components
   - Handle wallet connection and transaction flow

## High-level Task Breakdown
1. [ ] Set up Hardhat development environment
   - Success Criteria: Hardhat project initialized with Base Sepolia network config

2. [ ] Create Donation Smart Contract
   - Success Criteria: Contract compiles and includes basic donation functionality

3. [ ] Write Contract Tests
   - Success Criteria: Tests pass for basic donation functionality

4. [ ] Deploy Contract to Base Sepolia
   - Success Criteria: Contract deployed and verified on Base Sepolia

5. [ ] Create .env file
   - Success Criteria: Environment variables set up for contract address and recipient wallet

6. [ ] Integrate Contract with Frontend
   - Success Criteria: Users can connect wallet and send donations

## Project Status Board
- [x] Initialize Hardhat project
- [x] Write smart contract
- [x] Write tests
- [ ] Deploy to Base Sepolia
- [ ] Set up environment variables
- [ ] Integrate with frontend

## Executor's Feedback or Assistance Requests
To proceed with deployment, we need:
1. A private key for the deploying wallet (this will be used to deploy the contract and receive donations)
2. BaseScan API key for contract verification (optional but recommended)

The contract and tests are now ready. Please provide the above values to proceed with deployment.

## Lessons
- When initializing Hardhat in an existing TypeScript project, we need to handle existing tsconfig.json conflicts
- Base Sepolia network configuration requires specific RPC URL and API keys
- When using Hardhat with ethers, we need to be careful about version compatibility between hardhat-ethers and ethers packages
- Using ethers.utils.parseEther() instead of ethers.parseEther() for compatibility with ethers v5 