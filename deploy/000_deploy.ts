import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const contract = await deploy("NFT", {
    from: deployer,
    // string memory name_,
    // string memory symbol_,
    // uint16 _maxTokens,
    // address _fixedOwnerAddress,
    // string memory _baseURI
    args: ["SampleNft", "SNFT", 100, "0xbabeD3b0088109E60F692f4aC3c0E1c9A6Bd6f95", "https://nfts.com"],
    log: true,
  });

  console.log(`Successfully deployed contract to ${contract.address}`);

};
export default func;
func.tags = ["testbed", "_NFT"];
