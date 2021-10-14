
import React, { useEffect, useState } from 'react'
import { Web3Provider } from "@ethersproject/providers"
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import type { AbstractConnector } from '@web3-react/abstract-connector'
import { createWeb3ReactRoot, useWeb3React, Web3ReactProvider } from '@web3-react/core'

import type { ForumContract } from '../api/forum'
import { connectToForumContract } from './contract'

interface ChainContextInterface {
    readonly: Web3ReactContextInterface<Web3Provider>,
    authorized: Web3ReactContextInterface<Web3Provider>,

    loggedIn: boolean,
    account: string | null | undefined,

    readonlyContract: ForumContract | undefined,
    authorizedContract: ForumContract | undefined,
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
    loggedIn: false,
    account: undefined,
    readonlyContract: undefined,
    authorizedContract: undefined,
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

    const account = authorized.account
    const loggedIn = authorized.active && !!account
    
    const [readonlyContract, setReadonlyContract] = useState<ForumContract|undefined>(undefined)
    const [authorizedContract, setAuthorizedContract] = useState<ForumContract|undefined>(undefined)

    const connect = async (provider: Web3Provider, setter: (c: ForumContract) => any) => {
        const contract = await connectToForumContract(provider)
        console.log('connected to contract using provider', provider)
        setter(contract)
    }

    useEffect(() => {
        if (readonly.active && !!readonly.library) {
            connect(readonly.library, setReadonlyContract)
        } else {
            setReadonlyContract(undefined)
        }
    }, [readonly.active])

    useEffect(() => {
        if (authorized.active && !!authorized.library) {
            console.log('setting authorized contract', authorized)
            connect(authorized.library, setAuthorizedContract)
        }
    }, [authorized.active])

    const context = { authorized, readonly, loggedIn, account, readonlyContract, authorizedContract }

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