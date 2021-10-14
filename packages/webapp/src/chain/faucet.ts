import { JsonRpcProvider } from '@ethersproject/providers'
import * as ethers from 'ethers'

import { NETWORK_NAME, READONLY_RPC_URL } from './constants'

export async function requestEthFromLocalFaucet(to: string, amount: string) {
    if (NETWORK_NAME !== 'localhost') {
        console.warn('faucet not available for network ' + NETWORK_NAME)
        return
    }

    const provider = new JsonRpcProvider(READONLY_RPC_URL)
    const value = ethers.utils.parseEther(amount)

    const signer = provider.getSigner()
    if (!signer) {
        throw new Error(`can't send from faucet: no signer`)
    }
    const tx = await signer.sendTransaction({ to, value })
    await tx.wait()
}
