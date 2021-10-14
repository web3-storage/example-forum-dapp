import { Contract } from 'ethers'

import type { ForumContract } from "../api/forum"
import { CHAIN_ID, NETWORK_NAME } from './constants'

// @ts-ignore - this file may not exist until the contract has been deployed
import _contractInfoRaw from '../contracts/hardhat_contracts.json'
import { Web3Provider } from '@ethersproject/providers'

interface DeployedContractInfo {
    address: string,
    abi: object[],
  }
  
  interface DeployInfo {
    name: string,
    chainId: string,
    contracts: Record<string, DeployedContractInfo>,
  }
  
  type AllDeploys = Record<string, Record<string, DeployInfo>>
  const DEPLOYMENTS = _contractInfoRaw as AllDeploys

export async function connectToForumContract(provider: Web3Provider): Promise<ForumContract> {
    // connect as the signer if one is available, to enable write operations
    const signer = await provider.getSigner()
    const who = signer ? signer : provider

    // TODO: better error message if deploy info doesn't exist
    const info = DEPLOYMENTS[CHAIN_ID][NETWORK_NAME].contracts['Forum']
    const contract = new Contract(info.address, info.abi, who)
    return contract as ForumContract
}