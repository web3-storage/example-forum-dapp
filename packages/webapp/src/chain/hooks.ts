import { useState, useEffect } from 'react'

import { injected, networkReadonly } from './connectors'
import { useChainContext } from './context'

export function useReadonlyConnection() {
    const { readonly } = useChainContext()
    const { activate } = readonly

    useEffect(() => {
        activate(networkReadonly, undefined, true).then(() => {
            console.log('network connection activated')
        })
    }, [])
}

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
  