import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Escrow, GameItem, Token, Rentable } from "../typechain-types";
import { BigNumber } from "ethers";


chai.use(chaiAsPromised);

describe("Escrow", () => {
	let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;
    let token: Token;
    let gameItem: GameItem;
    let rentable: Rentable;
    let escrow: Escrow;
    let expiry: number;
    let tokenAmount: BigNumber;
	beforeEach(async () => {
		[deployer, alice, bob] = await ethers.getSigners();
		await deployments.fixture(["_Token", "_Escrow", "_GameItem", "_Rentable"]);
		token = await ethers.getContract("Token");

        gameItem = await ethers.getContract("GameItem");
        rentable = await ethers.getContract("Rentable");
        escrow = await ethers.getContract("Escrow");

        //Date: Midnight Halloween
        expiry = 1667138400;

        //10 tokens
        tokenAmount = ethers.utils.parseEther("10");

        //Rentable: set escrow account
        await rentable.setEscrow(escrow.address);

        //Mint tokens to Bob
        await token.mint(bob.address, tokenAmount);

        //Approve token transfer:
        await token.connect(bob).approve(escrow.address, ethers.constants.MaxUint256);

        //Mint NFT to Alice
        await gameItem.awardItem(alice.address, "https://game.example/item-id-8u5h2m.json");
	});

    it("Should make a proposal", async () => {
        await escrow.connect(bob).makeProposal(0, tokenAmount);
        const proposal = await escrow.getProposal(0);
        expect(proposal.active).to.be.equal(true);
        expect(proposal.owner).to.be.equal(alice.address);
        expect(proposal.tokenId).to.be.equal(0);
        expect(proposal.proposalId).to.be.equal(0);
        expect(proposal.user).to.be.equal(bob.address);
        expect(proposal.amount).to.be.equal(tokenAmount);
    });

    it("Should allow user to withdraw a proposal", async () => {
        await escrow.connect(bob).makeProposal(0, tokenAmount);
        await expect(escrow.connect(alice).withdrawProposal(0)).to.be.revertedWith("Escrow: You did not make this proposal");
        await escrow.connect(bob).withdrawProposal(0);
        const proposal = await escrow.getProposal(0);
        expect(proposal.active).to.be.equal(false);
        await expect(escrow.connect(alice).acceptProposal(0, expiry)).to.be.revertedWith("Escrow: This proposal is not active");
    });

    it("Should allow token owner to accept a proposal, setting the renting information correctly", async () => {
        await escrow.connect(bob).makeProposal(0, tokenAmount);
        await expect(escrow.connect(bob).acceptProposal(0, expiry)).to.be.revertedWith("Escrow: You do not own this token");
        const aliceInitTokenBalance = await token.balanceOf(alice.address);
        await escrow.connect(alice).acceptProposal(0, expiry);
        const aliceNewTokenBalance = await token.balanceOf(alice.address);
        expect(aliceNewTokenBalance).to.be.equal(aliceInitTokenBalance.add(tokenAmount));
        const user = await rentable.userOf(0);
        const rentExpiry = await rentable.userExpires(0);
        expect(user).to.be.equal(bob.address);
        expect(rentExpiry).to.be.equal(expiry);
    });

    it("Should not allow owner to accept a proposal if user doesn't have enough tokens", async () => {
        //Bob makes proposal with more tokens than he has minted in the beforeEach hook
        await escrow.connect(bob).makeProposal(0, tokenAmount.add(ethers.utils.parseEther("1")));
        await expect(escrow.connect(alice).acceptProposal(0, expiry)).to.be.revertedWith("Escrow: The user does not have enough tokens to complete this transaction.");
    });
});