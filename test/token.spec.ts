import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token} from "../typechain-types";


chai.use(chaiAsPromised);

describe("Token", () => {
	let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;
    let token: Token;
	beforeEach(async () => {
		[deployer, alice, bob] = await ethers.getSigners();
		await deployments.fixture(["_Token"]);
		token = await ethers.getContract("Token");

        //Mint tokens to Bob
        await token.mint(bob.address, 10);
	});
	
	it("Should only allow owner to mint tokens", async () => {
        const bobInitBalance = await token.balanceOf(bob.address);
        await expect(token.connect(bob).mint(bob.address, 1000)).to.be.revertedWith("Ownable: caller is not the owner");
        await token.connect(deployer).mint(bob.address, 10);
        const newBalance = await token.balanceOf(bob.address);
        expect(newBalance).to.be.equal(bobInitBalance.add(10));
	});

    it("Should not mint to a zero address", async () => {
        await expect(token.connect(deployer).mint(ethers.constants.AddressZero, 10)).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should return total decimals for native token", async () => {
        const decimals = await token.decimals();
        expect(decimals).to.be.equal(18);
	});
});