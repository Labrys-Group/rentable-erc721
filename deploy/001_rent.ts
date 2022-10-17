import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { GameItem } from "../typechain-types/contracts/GameItem";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const token = await ethers.getContract("GameItem") as GameItem;
  
  const contract = await deploy("Rentable", {
    from: deployer,
    args: [token.address],
    log: true,
  });

  console.log(`Successfully deployed contract to ${contract.address}`);

};
export default func;
func.tags = ["testbed", "_Rentable"];
