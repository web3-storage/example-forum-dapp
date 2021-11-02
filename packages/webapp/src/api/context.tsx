import React, { useEffect, useState } from 'react'
import { Web3Storage } from 'web3.storage'

import { useChainContext } from '../chain/context';
import { useWeb3StorageToken } from '../utils/hooks';
import { ForumAPI } from './forum';

interface ApiContextInterface {
    api: ForumAPI | undefined,
    storageToken: string,
    setStorageToken: (token: string) => void,
}

const ApiContext = React.createContext<ApiContextInterface>({
    api: undefined,
    storageToken: '',
    setStorageToken: () => {},
})

export function useApiContext() {
    return React.useContext(ApiContext)
}

export function ApiContextProvider(props: { children: React.ReactNode }) {
    const { readonlyContract, authorizedContract } = useChainContext()
    const [ storageToken, setStorageToken ] = useWeb3StorageToken()

    const [api, setApi] = useState<ForumAPI | undefined>(undefined)

    useEffect(() => {
        if (!readonlyContract) {
            setApi(undefined)
            return
        }
        const storage = storageToken ? new Web3Storage({ token: storageToken }) : undefined
        const forumAPI = new ForumAPI({ storage, readonlyContract, authorizedContract })
        console.log('setting new forum api instance', forumAPI)
        setApi(forumAPI)
    }, [readonlyContract, authorizedContract, storageToken])


    const context = { api, storageToken, setStorageToken }
    return (
        <ApiContext.Provider value={context}>
            {props.children}
        </ApiContext.Provider>
    )
}