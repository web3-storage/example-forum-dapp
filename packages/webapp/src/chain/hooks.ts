import { useState, useEffect } from 'react'

import { injected, networkReadonly } from './connectors'
import { useChainContext } from './context'
import { requestEthFromLocalFaucet } from './faucet'

/**
 * Connects to the read-only RPC provider.
 */
export function useReadonlyConnection() {
    const { readonly } = useChainContext()
    const { activate } = readonly

    useEffect(() => {
        activate(networkReadonly, undefined, true).then(() => {
            console.log('readonly RPC connection activated')
        })
    }, [])
}

/**
 * Tries to connect to the injected provided (e.g. metamask), in case the
 * user has previously authorized the site.
 * 
 * @returns true if we have attempted to connect and either succeded or failed
 */
export function useEagerConnect() {
    const { authorized } = useChainContext()
    const { activate, active } = authorized
  
    const [tried, setTried] = useState(false)
  
    useEffect(() => {
      injected.isAuthorized().then((isAuthorized: boolean) => {
        if (isAuthorized) {
          activate(injected, undefined, true).catch(() => {
            setTried(true)
          })
        } else {
          setTried(true)
        }
      })
    }, []) // intentionally only running on mount (make sure it's only mounted once :))
  
    // if the connection worked, wait until we get confirmation of that to flip the flag
    useEffect(() => {
      if (!tried && active) {
        setTried(true)
      }
    }, [tried, active])
  
    return tried
  }
  

/**
 * Automatically sends a small amount of eth from the local development chain to
 * the user's connected wallet once they connect their account. Has no effect
 * if not connected to the localhost network.
 */
export function useAutoFaucet() {
    const { authorized } = useChainContext()
    const { active, account } = authorized

    useEffect(() => {
        if (active && account) {
            requestEthFromLocalFaucet(account, "0.1")
        }
    }, [active])
}