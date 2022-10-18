import { ethers, deployments } from "hardhat";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Escrow, Rentable, Token } from "../typechain-types";
import { GameItem } from "../typechain-types/contracts/GameItem";
import { BigNumber } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";


chai.use(chaiAsPromised);

describe("Rentable", () => {
	let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;
    let gameItem: GameItem;
    let token: Token;
	let contract: Rentable;
    let escrow: Escrow;
    let expiry: number;
    let tokenAmount: BigNumber;

	beforeEach(async () => {
		[deployer, alice, bob] = await ethers.getSigners();
		await deployments.fixture(["_Rentable", "_GameItem", "_Token", "_Escrow"]);

        gameItem = await ethers.getContract("GameItem");
        token = await ethers.getContract("Token");
        escrow = await ethers.getContract("Escrow");
		contract = await ethers.getContract("Rentable");
        
        //Set expiry for midnight, Halloween, 2022
        expiry = 1667138400;

        //10 tokens
        tokenAmount = ethers.utils.parseEther("10");

         //Mint tokens to Bob
         await token.mint(bob.address, tokenAmount);

         //Approve token transfer:
         await token.connect(bob).approve(escrow.address, ethers.constants.MaxUint256);
 
         //Mint NFT to Alice
         await gameItem.awardItem(alice.address, "https://game.example/item-id-8u5h2m.json");
	});

    it("Should allow only owner to set the escrow contract", async () => {
        await expect(contract.connect(alice).setEscrow(escrow.address)).to.be.revertedWith("Ownable: caller is not the owner")
        await contract.setEscrow(escrow.address);
        const address = await contract.escrow();
        expect(address).to.be.equal(escrow.address);
    });
	
	it("Should set owner", async () => {
        const owner = await gameItem.ownerOf(0);
        expect(owner).to.be.equal(alice.address);
	});

    it("Should return address 0 if no user assigned", async () => {
        const user = await contract.userOf(0);
        expect(user).to.be.equal(ethers.constants.AddressZero);
	});
    
    it("Should allow owner to set a user directly", async () => {
        await expect(contract.connect(deployer).setUser(0, bob.address, expiry)).to.be.revertedWith("Rentable: You cannot set the user for this token");
        await contract.connect(alice).setUser(0, bob.address, expiry);
        const user = await contract.userOf(0);
        expect(user).to.be.equal(bob.address);
    });
    
    it("Should set a user without changing owner", async () => {
        await contract.connect(alice).setUser(0, bob.address, expiry);
        const owner = await gameItem.ownerOf(0);
        const user = await contract.userOf(0);
        expect(user).to.be.equal(bob.address);
        expect(owner).to.be.equal(alice.address);
    });

    it("Should set user expiry date", async () => {
        await contract.connect(alice).setUser(0, bob.address, expiry);
        const itemExpires = await contract.userExpires(0);
        expect(itemExpires).to.be.equal(expiry);
    });

    it("Should reset token's user role after expiry has passed", async () => {
        //Increase time to one second after expiry;
        await time.increaseTo(1667138401);
        const user = await contract.userOf(0);
        expect(user).to.be.equal(ethers.constants.AddressZero);
    });
});