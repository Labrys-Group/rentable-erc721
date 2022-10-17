import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { GameItem } from "../typechain-types/contracts/GameItem";


chai.use(chaiAsPromised);

describe("NFT", () => {
	let deployer: SignerWithAddress, alice: SignerWithAddress;
	let token: GameItem;
	beforeEach(async () => {
		[deployer, alice] = await ethers.getSigners();
		await deployments.fixture(["_GameItem"]);
		token = await ethers.getContract("GameItem");
	});
	
	it("Should mint an NFT", async () => {
		const tokenUri = "https://game.example/item-id-8u5h2m.json";
		await token.awardItem(alice.address, "https://game.example/item-id-8u5h2m.json");
		const tokenBalance = await token.balanceOf(alice.address);
		const mintedTokenUri = await token.tokenURI(0);
		expect(tokenUri).to.be.equal(mintedTokenUri);
		expect(tokenBalance).to.be.equal(1);
	});
});
