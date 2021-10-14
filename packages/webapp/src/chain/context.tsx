
import * as React from 'react'
import { Web3Provider } from "@ethersproject/providers"
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import type { AbstractConnector } from '@web3-react/abstract-connector'
import { createWeb3ReactRoot, useWeb3React, Web3ReactProvider } from '@web3-react/core'


interface ChainContextInterface {
    readonly: Web3ReactContextInterface<Web3Provider>,
    authorized: Web3ReactContextInterface<Web3Provider>,
}

const inactiveContext: Web3ReactContextInterface<Web3Provider> = {
    active: false,
    async activate(connector: AbstractConnector, onError?: (error: Error) => void, throwErrors?: boolean) {
    },
    setError (error: Error) {
    },
    deactivate() {
    },
}

export const ChainContext = React.createContext<ChainContextInterface>({
    readonly: inactiveContext,
    authorized: inactiveContext,
})

function getLibrary(provider: any) {
    const lib = new Web3Provider(provider)
    lib.pollingInterval = 12000
    return lib
}

const Web3ReactProviderReadonly = createWeb3ReactRoot('readonly')

function ContextWrapper(props: { children: React.ReactNode }) {
    return (
        <Web3ReactProvider getLibrary={getLibrary}>
            <Web3ReactProviderReadonly getLibrary={getLibrary}>
                {props.children}
            </Web3ReactProviderReadonly>
        </Web3ReactProvider>
    )
}

function Provider(props: { children: React.ReactNode }) {
    const authorized = useWeb3React()
    const readonly = useWeb3React('readonly')
    const context = { authorized, readonly }

    return (
        <ChainContext.Provider value={context} >
            {props.children}
        </ChainContext.Provider>
    )
}

export function useChainContext() {
    return React.useContext(ChainContext)
}

export function ChainContextProvider(props: { children: React.ReactNode }) {
    return (
        <ContextWrapper>
            <Provider>
                {props.children}
            </Provider>
        </ContextWrapper>
    )
}