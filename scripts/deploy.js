const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Starting deployment...");
  
  const recipientAddress = process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS;
  if (!recipientAddress) {
    throw new Error("Recipient address not found in environment variables");
  }
  
  const Donation = await hre.ethers.getContractFactory("Donation");
  const donation = await Donation.deploy(recipientAddress);
  
  await donation.waitForDeployment();
  
  const address = await donation.getAddress();
  console.log("Donation contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 