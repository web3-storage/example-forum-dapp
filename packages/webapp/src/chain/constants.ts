export const MAINNET = 1
export const ROPSTEN = 3
export const RINKEBY = 4
export const GOERLI = 5
export const GANACHE = 1337
export const HARDHAT = 31337

export const SUPPORTED_CHAIN_IDS = [MAINNET, ROPSTEN, RINKEBY, GOERLI, GANACHE, HARDHAT]

export const CHAIN_ID = import.meta.env.VITE_CHAIN_ID 
  ? Number.parseInt(import.meta.env.VITE_CHAIN_ID as string) 
  : HARDHAT

export const READONLY_RPC_URL = import.meta.env.VITE_READONLY_RPC_URL as string || 'http://localhost:8545'
export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME as string || 'localhost'