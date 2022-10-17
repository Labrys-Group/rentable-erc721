import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token } from "../typechain-types";


chai.use(chaiAsPromised);

describe("Token", () => {
	let deployer: SignerWithAddress, alice: SignerWithAddress;
    let token: Token;
	beforeEach(async () => {
		[deployer, alice] = await ethers.getSigners();
		await deployments.fixture(["_Token"]);
		token = await ethers.getContract("Token");

        //Mint
        await token.mint(alice.address, 10);
	});
	
	it("Should only allow owner to mint", async () => {
        const aliceInitBalance = await token.balanceOf(alice.address);
        await expect(token.connect(alice).mint(alice.address, 1000)).to.be.revertedWith("Ownable: caller is not the owner");
        await token.connect(deployer).mint(alice.address, 10);
        const newBalance = await token.balanceOf(alice.address);
        expect(newBalance).to.be.equal(aliceInitBalance.add(10));
	});

    it("Should return total decimals", async () => {
        const decimals = await token.decimals();
        expect(decimals).to.be.equal(18);
	});
});