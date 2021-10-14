import React, { useEffect, useState } from 'react'
import { useChainContext } from '../chain/context';
import { getStorageClient } from '../storage';
import { ForumAPI } from './forum';

interface ApiContextInterface {
    api: ForumAPI | undefined
}

const ApiContext = React.createContext<ApiContextInterface>({
    api: undefined,
})

export function useApiContext() {
    return React.useContext(ApiContext)
}

export function ApiContextProvider(props: { children: React.ReactNode }) {
    const { readonlyContract, authorizedContract } = useChainContext()
    const storage = getStorageClient()

    const [api, setApi] = useState<ForumAPI | undefined>(undefined)

    useEffect(() => {
        if (!readonlyContract) {
            setApi(undefined)
            return
        }
        const forumAPI = new ForumAPI({ storage, readonlyContract, authorizedContract })
        console.log('setting new forum api instance', forumAPI)
        setApi(forumAPI)
    }, [readonlyContract, authorizedContract])


    const context = { api }
    return (
        <ApiContext.Provider value={context}>
            {props.children}
        </ApiContext.Provider>
    )
}