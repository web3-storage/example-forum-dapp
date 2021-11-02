const ethers = require("ethers")
const fs = require('fs/promises')
const path = require('path')
const { Web3Storage, File } = require('web3.storage')

const Deployments = require('../src/contracts/hardhat_contracts.json')


async function main() {
  let deployment
  try {
    deployment = Deployments[31337].localhost.contracts.Forum
  } catch (e) {
    throw new Error('no local deployment found')
  }
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = await provider.getSigner()
  const forum = new ethers.Contract(deployment.address, deployment.abi, signer)

  const token = process.env.WEB3_STORAGE_TOKEN

  if (!token) {
    throw new Error('no web3.storage api token found. set the WEB3_STORAGE_TOKEN environment variable and try again')
  }

  const storage = new Web3Storage({ token })
  await addContent(forum, storage)
}

async function addContent(forum, storage) {
  const dir = path.join(__dirname, 'sample-content')
  const files = await fs.readdir(dir)
  for (const filename of files) {
    if (!filename.endsWith('.json')) {
      continue
    }
    const content = await fs.readFile(path.join(dir, filename))
    const obj = JSON.parse(content)
    const f = new File([JSON.stringify(obj)], 'file.json')
    const cid = await storage.put([f], { wrapWithDirectory: false })
    console.log(`stored ${filename} - cid: ${cid}`)
    if ('parentId' in obj) {
      await forum.addComment(obj.parentId, cid)
    } else {
      await forum.addPost(cid)
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
