import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const contract = await deploy("GameItem", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`Successfully deployed contract to ${contract.address}`);

};
export default func;
func.tags = ["testbed", "_GameItem"];
