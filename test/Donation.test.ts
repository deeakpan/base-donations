import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Donation", function () {
  let donation: Contract;
  let owner: SignerWithAddress;
  let donor: SignerWithAddress;
  const projectDescription = "Blah blah dee is building an innovative decentralized map project and could use your support funding.";

  beforeEach(async function () {
    [owner, donor] = await ethers.getSigners();
    const Donation = await ethers.getContractFactory("Donation");
    donation = await Donation.deploy(projectDescription);
    await donation.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await donation.owner()).to.equal(owner.address);
    });

    it("Should set the correct project description", async function () {
      expect(await donation.projectDescription()).to.equal(projectDescription);
    });
  });

  describe("Donations", function () {
    it("Should accept donations", async function () {
      const donationAmount = ethers.utils.parseEther("1.0");
      
      await expect(donation.connect(donor).donate({ value: donationAmount }))
        .to.emit(donation, "DonationReceived")
        .withArgs(donor.address, donationAmount);
    });

    it("Should not accept zero donations", async function () {
      await expect(donation.connect(donor).donate({ value: 0 }))
        .to.be.revertedWith("Donation amount must be greater than 0");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw", async function () {
      const donationAmount = ethers.utils.parseEther("1.0");
      await donation.connect(donor).donate({ value: donationAmount });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await donation.connect(owner).withdraw();
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(donation.connect(donor).withdraw())
        .to.be.revertedWith("Only owner can withdraw");
    });
  });
}); 