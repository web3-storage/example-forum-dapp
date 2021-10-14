import { InjectedConnector } from '@web3-react/injected-connector'
import { NetworkConnector } from '@web3-react/network-connector'
import { SUPPORTED_CHAIN_IDS } from './constants'

export const injected = new InjectedConnector({ supportedChainIds: SUPPORTED_CHAIN_IDS })