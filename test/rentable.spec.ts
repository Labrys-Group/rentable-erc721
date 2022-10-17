import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Rentable } from "../typechain-types";
import { GameItem } from "../typechain-types/contracts/GameItem";


chai.use(chaiAsPromised);

describe("Rentable", () => {
	let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;
    let token: GameItem;
	let contract: Rentable;
    let expiry: number;
	beforeEach(async () => {
		[deployer, alice, bob] = await ethers.getSigners();
		await deployments.fixture(["_Rentable", "_GameItem"]);
        token = await ethers.getContract("GameItem")
		contract = await ethers.getContract("Rentable");
        await token.awardItem(alice.address, "https://game.example/item-id-8u5h2m.json");
        //Set expiry for midnight, Halloween, 2022
        expiry = 1667138400
	});
	
	it("Should set owner", async () => {
        const owner = await token.ownerOf(0);
        expect(owner).to.be.equal(alice.address);
	});

    it("Should return address 0 if no user assigned", async () => {
        const user = await contract.userOf(0);
        expect(user).to.be.equal(ethers.constants.AddressZero);
	});
    
    it("Should only allow owner to set a user", async () => {
        await expect(contract.connect(deployer).setUser(0, bob.address, expiry)).to.be.revertedWith("Rentable: Only the owner can set a user")
    });
    
    it("Should set a user", async () => {
        await contract.connect(alice).setUser(0, bob.address, expiry);
        const owner = await token.ownerOf(0);
        const user = await contract.userOf(0);
        expect(user).to.be.equal(bob.address);
        expect(owner).to.be.equal(alice.address);
    });

    it("Should set user expiry date", async () => {
        await contract.connect(alice).setUser(0, bob.address, expiry);
        const tokenExpires = await contract.userExpires(0);
        expect(tokenExpires).to.be.equal(expiry);
    })
});