import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, GameItem, Escrow, Rentable } from "../typechain-types";
import { BigNumber } from "ethers";


chai.use(chaiAsPromised);

describe("NFT", () => {
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
        await token.connect(bob).a
	});
	
	it("Should mint an NFT", async () => {
		const tokenUri = "https://game.example/item-id-8u5h2m.json";
		await gameItem.awardItem(alice.address, "https://game.example/item-id-8u5h2m.json");
		const itemBalance = await gameItem.balanceOf(alice.address);
		const mintedTokenUri = await gameItem.tokenURI(0);
		expect(tokenUri).to.be.equal(mintedTokenUri);
		expect(itemBalance).to.be.equal(1);
	});

	it("Should set rentable contract", async () => {
		await expect(gameItem.connect(alice).setRentable(rentable.address)).to.be.revertedWith("Ownable: caller is not the owner")
	})
});
