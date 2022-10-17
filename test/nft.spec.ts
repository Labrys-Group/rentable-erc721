import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NFT } from "../typechain-types";

chai.use(chaiAsPromised);

describe("NFT", () => {
	let deployer: SignerWithAddress, alice: SignerWithAddress;
	let token: NFT;
	beforeEach(async () => {
		[deployer, alice] = await ethers.getSigners();
		await deployments.fixture(["_NFT"]);
		token = await ethers.getContract("NFT");
	});
	
	  it("Should mint tokens", async () => {
		token.connect(deployer);
		await token.mint(5, alice.address);
		const balance = await token.balanceOf(alice.address);
		expect(balance).to.equal(5);
	
		//Check token ID
		const currentTokenId = await token.getLastTokenId();
		expect(currentTokenId === ethers.utils.parseEther("5"));
	  });
	
	  it("Should set token URI", async () => {
		await token.mint(5, alice.address);
		const currentTokenId = await token.getLastTokenId();
		const currentTokenUri = await token.tokenURI(currentTokenId);
		const baseUri = await token.getBaseURI();
		const fullUri = baseUri + "/" + currentTokenId + ".json";
		expect(currentTokenUri === fullUri);
	
		//Check non-existant token URI returns error
		const unmintedTokenId = currentTokenId.add(1);
		await expect(token.tokenURI(unmintedTokenId)).to.be.revertedWith(
		  "Nonexistent token"
		);
	  });
	
	  it("Should not mint more than max number of tokens", async () => {
		//Max is 100
		await token.mint(100, alice.address);
		await expect(token.mint(1, alice.address)).to.be.revertedWith(
		  "Not enough tokens remaining to mint"
		);
	  });
	
	  it("Should set the base URI", async () => {
		await token.setBaseURI("https://newbaseuri.com");
		const newBaseUri = await token.getBaseURI();
		expect(newBaseUri === "https://newbaseuri.com");
	  });
	
	  it("Should only allow owner to call renounceOwnership and new owner always be the fixed address ", async () => {
		await expect(token.connect(alice).renounceOwnership()).to.be.revertedWith(
		  "Ownable: caller is not the owner"
		);
	
		await token.renounceOwnership();
		const newOwner = await token.owner();
		expect(newOwner).to.equal("0xbabeD3b0088109E60F692f4aC3c0E1c9A6Bd6f95"); //this the fixed new owner address
	
		await expect(
		  token.connect(deployer).renounceOwnership()
		).to.be.revertedWith("Ownable: caller is not the owner");
	  });
});
