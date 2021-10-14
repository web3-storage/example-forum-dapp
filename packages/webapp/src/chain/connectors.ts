import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import { SUPPORTED_CHAIN_IDS, CHAIN_ID, READONLY_RPC_URL } from './constants'

export const injected = new InjectedConnector({ supportedChainIds: SUPPORTED_CHAIN_IDS })

export const networkReadonly = new NetworkConnector({
    urls: {
        [CHAIN_ID]: READONLY_RPC_URL
    },
    defaultChainId: CHAIN_ID
})
