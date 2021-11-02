import React from 'react'
import { Redirect } from 'react-router';
import { useApiContext } from '../../api/context';
import { useChainContext } from '../../chain/context';
import Layout from "../Layout";
import styles from './accountsettings.module.css'

export default function AccountSettings() {
  const { loggedIn } = useChainContext()
  const { storageToken, setStorageToken } = useApiContext()

  if (!loggedIn) {
    return <Redirect to='/login' />
  }

  const noTokenMessage = (
    <span>
      Your account does not have a storage token set. To submit posts or comments, you'll need to
      sign up for a free account at <a href="https://web3.storage">Web3.Storage</a>, then paste your
      API token here:
    </span>
  )

  const tokenMessage = (
    <span>
      Your Web3.Storage token is displayed below. To remove it (and your ability to post), remove the text in the box or press the delete button.
    </span>
  )

  const deleteButton = <button type='button' onClick={() => setStorageToken('')}>Delete token</button>

  const tokenInput = (
    <div className={styles.container} >
      {storageToken ? tokenMessage : noTokenMessage}

      <input value={storageToken} onChange={(e) => setStorageToken(e.target.value)} />

      {storageToken ? deleteButton : undefined}
    </div>
  )

  return (
    <Layout>
      {tokenInput}
    </Layout>
  )
}