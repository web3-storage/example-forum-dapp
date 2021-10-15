import { useWeb3React } from '@web3-react/core'
import { Link } from 'react-router-dom'
import { useChainContext } from '../../chain/context'

import styles from './header.module.css'

const Account = () => {
  const { authorized } = useChainContext()
  const { account } = authorized

  if (account == null) {
    return <Link to="/login">login</Link>
  }

  return (
    <>
      <span>Account</span>
      <span role='img' aria-label='robot'>
        🤖
      </span>
      <span>
        {account
          ? `${account.substring(0, 6)}...${account.substring(
              account.length - 4
            )}`
          : ''}
      </span>
      <span> | </span>
      <Link to='/logout'>logout</Link>
    </>
  )
}

const Logo = () => {
  return <div className={styles.logo}>
    W³
  </div>
}

const Header = () => {
  const links = <div className={styles.links}>
    <Link to="/newest">new</Link> 
    {' | '} 
    <Link to="/about">about</Link>
    {' | '}
    <Link to="/submit">submit</Link>
  </div>

  return (
    <header className={styles.header}>
      <Link to='/'>
        <Logo />
      </Link>
      <Link to='/'>
        <span className={styles.siteName}>Web3 News</span>
      </Link>
      {links}
      <div className={styles.spacer} />
      <Account />
    </header>
  )
}

export default Header
