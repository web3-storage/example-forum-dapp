import React, { useState } from "react";
import { Redirect } from "react-router";
import { useApiContext } from "../../api/context";
import { useAddPost } from "../../api/queries";
import { useChainContext } from "../../chain/context";
import Layout from "../Layout";
import styles from './submit.module.css'

export default function Submit() {
  const { loggedIn } = useChainContext()
  const { api } = useApiContext()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const addPostMutation = useAddPost()

  if (!loggedIn) {
      return <Redirect to='/login' />
  }

  if (!api) {
      return <div>
          No contract connection available...
      </div>
  }
  
  if (!api.canPost) {
    return <Redirect to='/account' />
  }

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault()
    const postContent = {
        title,
        body: text,
    }
    addPostMutation.mutate({ api, postContent })
  }

  const { isLoading: isSubmitting, error: submissionError, isSuccess, data: postId } = addPostMutation
  const submitEnabled = title && text && !isSubmitting

  if (isSuccess && postId) {
    return <Redirect to={`/items/${postId.toString()}`} />
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
            <button disabled={!submitEnabled} className={styles.submitButton} type='submit'>submit</button>
            { isSubmitting && 'Submitting post...' }
            { submissionError && 'Error adding post: ' + submissionError}
        </form>
    </Layout>
  )
}