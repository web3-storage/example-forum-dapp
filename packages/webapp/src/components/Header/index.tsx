import { ethers } from 'ethers'
import { useQuery, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { NETWORK_NAME } from '../../chain/constants'
import { useChainContext } from '../../chain/context'
import { requestEthFromLocalFaucet } from '../../chain/faucet'
import { accountDisplayName } from '../../utils'

import styles from './header.module.css'

const Account = () => {
  const { authorized } = useChainContext()
  const { account, library } = authorized

  const queryClient = useQueryClient()

  const balanceKey = ['account', 'balance', account]
  const balanceQuery = useQuery(balanceKey, async () => {
    if (!library || !account) {
      return ""
    }
    const wei = await library.getBalance(account)
    const eth = ethers.utils.formatEther(wei)
    return Number.parseFloat(eth).toPrecision(2) + ' ETH'
  }, {
    enabled: (!!account && !!library),
    staleTime: 0,
  })

  if (account == null) {
    return <Link to="/login">login</Link>
  }

  const { data: balance, error } = balanceQuery
  if (error) {
    console.warn('error fetching account balance:', error)
  }

  const requestFaucet = () => {
    requestEthFromLocalFaucet(account, '0.1').then(() => 
      queryClient.invalidateQueries(balanceKey)
    )
  }

  const showFaucetButton = NETWORK_NAME === 'localhost' && import.meta.env.DEV
  const faucetButton = <a href='#' onClick={requestFaucet}>faucet</a>

  return (
    <>
      <Link to='/account'>
        <span>Account&nbsp;</span>
        <span>{accountDisplayName(account)}</span>
      </Link>
      <span>&nbsp;|&nbsp;</span>
      {balance && <span>Balance: {balance}&nbsp;|&nbsp;</span>}
      {showFaucetButton && <span>{faucetButton}&nbsp;|&nbsp;</span>}
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
