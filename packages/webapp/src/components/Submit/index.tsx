import React, { useState } from "react";
import { Redirect } from "react-router";
import { useChainContext } from "../../chain/context";
import Layout from "../Layout";
import styles from './submit.module.css'

export default function Submit() {
  const { loggedIn } = useChainContext()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  if (!loggedIn) {
      return <Redirect to='/login' />
  }

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(`title: ${title} -- text: ${text}`)
  }

  return (
    <Layout>
        <form className={styles.submitForm} onSubmit={e => submitForm(e)}>
            <div className={styles.inputGroup}>
                <label htmlFor='title-input'>title</label>
                <input id='title-input' onChange={e => { setTitle(e.target.value) }} />
            </div>
            <div className={styles.inputGroup}>
                <label htmlFor='text-input'>text</label>
                <textarea id='text-input' onChange={e => { setText(e.target.value) }} />
            </div>
            <button type='submit'>submit</button>
        </form>
    </Layout>
  )
}