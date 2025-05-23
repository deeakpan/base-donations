export const DonationContractABI = [
  {
    inputs: [],
    name: "donate",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [],
    name: "projectDescription",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "RECIPIENT",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "donor",
        type: "address"
      },
      {
        indexed: false,
        name: "amount",
        type: "uint256"
      }
    ],
    name: "DonationReceived",
    type: "event"
  }
] as const;

// Get addresses from environment variables
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
export const RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS as `0x${string}`; 