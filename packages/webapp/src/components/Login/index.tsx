import { injected } from '../../chain/connectors'

import styles from './login.module.css'
import { Redirect } from 'react-router'
import { useChainContext } from '../../chain/context'


const Login = () => {
  const { authorized } = useChainContext()
  const { connector, account, activate, active } = authorized
  const connected = !!connector && active

  if (account) {
    return <Redirect to="/" />
  }

  const loginInjected = () => {
    console.log('activating injected provider (metamask) connector')
    activate(injected)
  }

  return <div className={styles.login}>

    <h3>
      Login by signing in with your Ethereum wallet.
    </h3>

    <button type="button" onClick={loginInjected}>Login with MetaMask</button>

    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        color: 'black',
        margin: '0 0 0 1rem'
      }}
    >
      {connected && (
        <span role="img" aria-label="check">
          ✅
        </span>
      )}
    </div>
  </div>
}


export default Login
