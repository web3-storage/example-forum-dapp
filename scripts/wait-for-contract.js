const path = require('path')
const fs = require('fs/promises')
const { F_OK } = require('fs')

async function exists(filename) {
  try {
    await fs.access(filename, F_OK)
    return true
  } catch (err) {
    return false
  }
}


async function waitForContract() {
  const outputFile = path.join(__dirname, '..', 'packages', 'webapp', 'src', 'contracts', 'hardhat_contracts.json')
  const maxWait = 300
  for (let i = 0; i < maxWait; i++) {
    if (await exists(outputFile)) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw new Error(`Contract output did not appear after ${maxWait} seconds`)
}

waitForContract().catch(err => {
  console.error(err)
  process.exit(1)
})
