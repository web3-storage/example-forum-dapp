const concurrently = require('concurrently')
const path = require('path')

const rootDir = path.join(__dirname, '..')

concurrently([
  {
    command: 'npm run --workspace packages/contract dev',
    name: 'contract',
    cwd: rootDir,
    prefixColor: 'blue',
  },
  {
    command: 'node ./scripts/wait-for-contract.js && npm run --workspace packages/webapp dev',
    name: 'webapp',
    cwd: rootDir,
    prefixColor: 'green',
  }
])
