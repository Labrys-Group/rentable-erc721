import { ethers, deployments } from "hardhat";
import chai, { expect, util } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Escrow, Escrow__factory, GameItem, Token } from "../typechain-types";
import { BigNumber } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

chai.use(chaiAsPromised);

describe("Escrow", () => {
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
		
		//Mint tokens to users
		await token.mint(bob.address, tokenAmount.mul(2));
		
		//Mint NFT to Alice
		await gameItem.mint(alice.address);
		
		//Approvals
		await token
		.connect(bob)
		.approve(escrow.address, ethers.constants.MaxUint256);
		await gameItem.connect(alice).approve(escrow.address, 0);
	});

    it("Should not deploy escrow contract with zero addresses", async () => {
        const escrowFactory: Escrow__factory = await ethers.getContractFactory("Escrow");
        await expect(escrowFactory.deploy(ethers.constants.AddressZero, token.address)).to.be.revertedWith("Cannot set contract to zero address");
        await expect(escrowFactory.deploy(gameItem.address, ethers.constants.AddressZero)).to.be.revertedWith("Cannot set contract to zero address");
    })

	it("Should make a proposal", async () => {
		await escrow.connect(bob).makeProposal(0);
		const proposal = await escrow.getProposal(0);
		expect(proposal.active).to.be.equal(true);
		expect(proposal.owner).to.be.equal(alice.address);
		expect(proposal.tokenId).to.be.equal(0);
		expect(proposal.proposalId).to.be.equal(0);
		expect(proposal.user).to.be.equal(bob.address);
	});

	it("Should allow user to withdraw a proposal", async () => {
		await escrow.connect(bob).makeProposal(0);
		await expect(escrow.connect(alice).withdrawProposal(0)).to.be.revertedWith(
			"Escrow: You did not make this proposal"
		);
		await escrow.connect(bob).withdrawProposal(0);
		const proposal = await escrow.getProposal(0);
		expect(proposal.active).to.be.equal(false);
		await expect(
			escrow.connect(alice).acceptProposal(0, tokenAmount, expiry)
		).to.be.revertedWith("Escrow: This proposal is not active");
	});

	it("Should allow token owner to accept a proposal, setting the renting information correctly", async () => {
		await escrow.connect(bob).makeProposal(0);
		await expect(
			escrow.connect(bob).acceptProposal(0, tokenAmount, expiry)
		).to.be.revertedWith("Escrow: You do not own this token");
		const aliceInitTokenBalance = await token.balanceOf(alice.address);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
		const aliceNewTokenBalance = await token.balanceOf(alice.address);
		expect(aliceNewTokenBalance).to.be.equal(
			aliceInitTokenBalance.add(tokenAmount)
		);
		const user = await gameItem.userOf(0);
		const rentExpiry = await gameItem.userExpires(0);
		expect(user).to.be.equal(bob.address);
		expect(rentExpiry).to.be.equal(expiry);
	});

	it("Should not allow owner to accept a proposal if user doesn't have enough tokens", async () => {
		//Bob makes proposal with more tokens than he has minted in the beforeEach hook
		await escrow.connect(bob).makeProposal(0);
		await expect(
			escrow.connect(alice).acceptProposal(0, tokenAmount.mul(3), expiry)
		).to.be.revertedWith(
			"Escrow: The user does not have enough tokens to complete this transaction."
		);
	});

	it("Should not allow NFT to be rented to two people at once", async () => {
		await escrow.connect(bob).makeProposal(0);
        await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);

        //Make another proposal and check if it exists
        await escrow.connect(deployer).makeProposal(0);
        const proposal = await escrow.getProposal(1);
        expect(proposal.active).to.be.equal(true);

        await expect(escrow.connect(alice).acceptProposal(1, tokenAmount, expiry)).to.be.revertedWith("Escrow: This item has already been rented");
	});

	it("Should allow only user to call NFT functions, if one has been set", async () => {
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
		await expect(gameItem.connect(alice).shoot(0)).to.be.revertedWith(
			"You cannot use this item"
		);
		const tx = await gameItem.connect(bob).shoot(0);
		expect(tx).to.be.equal("Shots fired");
	});

	it("Should reset user after expiry", async () => {
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);

		//Expire user rental agreement
		await time.increaseTo(expiry + 1);

		const user = await gameItem.userOf(0);
		expect(user).to.be.equal(ethers.constants.AddressZero);
	});

	it("Should allow owner to call functions after expiry", async () => {
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);

		//Expire user rental agreement
		await time.increaseTo(expiry + 1);

		const tx = await gameItem.connect(alice).shoot(0);
		expect(tx).to.be.equal("Shots fired");
	});

	it("Should allow owner to rent item again", async () => {
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);

		await time.increaseTo(expiry + 1);

		await escrow.connect(bob).makeProposal(0);
		//New expiry: midnight Christmas, 2022
		await escrow.connect(alice).acceptProposal(0, tokenAmount, 1671890400);

		const user = await gameItem.userOf(0);
		const rentExpiry = await gameItem.userExpires(0);
		expect(user).to.be.equal(bob.address);
		expect(rentExpiry).to.be.equal(1671890400);
	});

    it("Should not allow rented item to be transferred by user", async () => {
        await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
        await expect(gameItem.connect(bob).transferFrom(alice.address, bob.address, 0)).to.be.revertedWith("ERC721: caller is not token owner nor approved");
        await expect(gameItem.connect(bob).transferFrom(alice.address, deployer.address, 0)).to.be.revertedWith("ERC721: caller is not token owner nor approved");
		await gameItem.connect(alice).approve(bob.address, 0);
    });

    it("Should not allow user to set a user", async () => {
        await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
        await expect(gameItem.connect(bob).setUser(0, deployer.address, expiry)).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
    });


    it("Should allow user, but not owner, to store a token in escrow", async () => {
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
		await expect(escrow.connect(alice).storeItemInEscrow(0)).to.be.revertedWith("You cannot start a gaming session with this token");
        await escrow.connect(bob).storeItemInEscrow(0);
		const escrowBalance = await gameItem.balanceOf(escrow.address);
		expect(Number(escrowBalance)).to.be.equal(1);
    });

	it("Should allow lost item to transfer to winner while item is rented out", async () => {
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
        await escrow.connect(bob).storeItemInEscrow(0);
		const escrowBalance = await gameItem.balanceOf(escrow.address);
		expect(Number(escrowBalance)).to.be.equal(1);
		await escrow.loseItem(0, alice.address);
		const newEscrowBalance = await gameItem.balanceOf(escrow.address);
		expect(Number(newEscrowBalance)).to.be.equal(0);
		const winnerBalance = await gameItem.balanceOf(alice.address);
		expect(Number(winnerBalance)).to.be.equal(1);
    });

	it("Should end a rental agreement when item is lost", async () => {
		await escrow.connect(bob).makeProposal(0);
		await escrow.connect(alice).acceptProposal(0, tokenAmount, expiry);
        await escrow.connect(bob).storeItemInEscrow(0);
		const escrowBalance = await gameItem.balanceOf(escrow.address);
		expect(Number(escrowBalance)).to.be.equal(1);
		await escrow.loseItem(0, deployer.address);
		const newOwner = await gameItem.ownerOf(0)
		expect(newOwner).to.be.equal(deployer.address);
		const newUser = await gameItem.userOf(0);
		expect(newUser).to.be.equal(ethers.constants.AddressZero);
	});

	it("Should not allow item to be lost if it is not in escrow", async () => {
		await expect(escrow.loseItem(0, bob.address)).to.be.revertedWith("Cannot lose item that is not in escrow")
	});

    it("Should check if supports all potential ERC-721 interface ids", async () => {
       //ERC-4907
        const supported = await gameItem.supportsInterface("0xad092b5c");
        //IERC-165
        const supported2 = await gameItem.supportsInterface("0x01ffc9a7");
        //ERC-721
        const supported3 = await gameItem.supportsInterface("0x80ac58cd");
        //ERC-1155
        const notSupported = await gameItem.supportsInterface("0x4e2312e0");

        expect(supported).to.be.equal(true);
        expect(supported2).to.be.equal(true);
        expect(supported3).to.be.equal(true);
        expect(notSupported).to.be.equal(false);
    });
});
