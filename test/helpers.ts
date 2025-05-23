import { ethers } from "hardhat";
import { Donation } from "../typechain-types";

export async function deployContract() {
  const [owner, donor] = await ethers.getSigners();
  const projectDescription = "Blah blah dee is building an innovative decentralized map project and could use your support funding.";
  
  const Donation = await ethers.getContractFactory("Donation");
  const donation = await Donation.deploy(projectDescription);
  
  return { donation, owner, donor };
} 