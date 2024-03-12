const fs = require('fs');
const { ethers } = require('hardhat');
async function main() {
  const [deployer, user1] = await ethers.getSigners();
  // We get the contract factory to deploy
  const MySKCTFactory = await ethers.getContractFactory("MySKCT");
  // Deploy contract
  const MySKCT = await MySKCTFactory.deploy();
  // Save contract address file in project
  const contractsDir = __dirname + "/../src/contractsData";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/MySKCT-address.json`,
    JSON.stringify({ address: MySKCT.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync("MySKCT");

  fs.writeFileSync(
    contractsDir + `/MySKCT.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
  console.log("MySKCT deployed to:", MySKCT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
