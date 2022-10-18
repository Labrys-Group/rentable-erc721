import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, GameItem, Escrow } from "../typechain-types";
import { BigNumber } from "ethers";

chai.use(chaiAsPromised);

describe("NFT", () => {
	let deployer: SignerWithAddress,
		alice: SignerWithAddress,
		bob: SignerWithAddress;
	let token: Token;
	let gameItem: GameItem;
	let escrow: Escrow;
	let expiry: number;
	let tokenAmount: BigNumber;
	beforeEach(async () => {
		[deployer, alice, bob] = await ethers.getSigners();
		await deployments.fixture(["_Token", "_Escrow", "_GameItem"]);
		token = await ethers.getContract("Token");

		gameItem = await ethers.getContract("GameItem");
		escrow = await ethers.getContract("Escrow");

		//Date: Midnight Halloween
		expiry = 1667138400;

		//10 tokens
		tokenAmount = ethers.utils.parseEther("10");

		//Mint tokens to Bob
		await token.mint(bob.address, tokenAmount);
	});

	it("Should mint an NFT", async () => {
		await gameItem.mint(alice.address);
		const itemBalance = await gameItem.balanceOf(alice.address);
		expect(itemBalance).to.be.equal(1);
	});

	it("Should return user as address zero if no user has been set", async () => {
		const user = await gameItem.userOf(0);
		expect(user).to.be.equal(ethers.constants.AddressZero);
	});

	it("Should allow owner to shoot", async () => {
		await gameItem.mint(alice.address);
		await expect(gameItem.connect(bob).shoot(0)).to.be.revertedWith(
			"Only owner"
		);
		const tx = await gameItem.connect(alice).shoot(0);
		expect(tx).to.be.equal("Shots fired");
	});

	it("Should not allow owner to transfer while token is rented", async () => {
		await gameItem.mint(alice.address);
		//Approvals
		await token
			.connect(bob)
			.approve(escrow.address, ethers.constants.MaxUint256);
		await gameItem.connect(alice).approve(escrow.address, 0);
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
		await expect(
			gameItem.connect(alice).transferFrom(alice.address, bob.address, 0)
		).to.be.revertedWith("Cannot transfer while token is rented");
	});

    it("Should allow owner to send token to escrow if no user has been set", async () => {
        await gameItem.mint(alice.address);
		//Approvals
		await token
			.connect(bob)
			.approve(escrow.address, ethers.constants.MaxUint256);
		await gameItem.connect(alice).approve(escrow.address, 0);

        await expect(escrow.connect(bob).storeItemInEscrow(0)).to.be.revertedWith("You cannot start a gaming session with this token");
        await escrow.connect(alice).storeItemInEscrow(0);
        const escrowBalance = await gameItem.balanceOf(escrow.address);
		expect(Number(escrowBalance)).to.be.equal(1);
    });
});
