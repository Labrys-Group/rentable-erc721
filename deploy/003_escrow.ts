import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { Rentable } from "../typechain-types/contracts/Rentable.sol";
import { GameItem, Token } from "../typechain-types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const rentable = await ethers.getContract("Rentable") as Rentable;
  const gameItem = await ethers.getContract("GameItem") as GameItem;
  const token = await ethers.getContract("Token") as Token;
  
  const contract = await deploy("Escrow", {
    from: deployer,
    args: [rentable.address, gameItem.address, token.address],
    log: true,
  });

  console.log(`Successfully deployed contract to ${contract.address}`);

};
export default func;
func.tags = ["testbed", "_Escrow"];
