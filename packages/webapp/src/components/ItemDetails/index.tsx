import { useQuery } from "react-query";
import { useParams } from "react-router";
import { useApiContext } from "../../api/context";
import { itemQueryKeys, useAddComment } from "../../api/queries";
import Layout from "../Layout";
import ItemSummary from "../ItemSummary";
import styles from './itemdetails.module.css'

import type { Item } from '../../api/forum'
import CommentList from "../CommentList";
import React, { useState } from "react";
import { useChainContext } from "../../chain/context";
import { Link } from "react-router-dom";

export default function ItemDetails() {
  const { itemId } = useParams<{ itemId: string }>()
  const { api } = useApiContext()
  const { loggedIn } = useChainContext()


  const queryOpts = { includeScore: true, includeCommentCount: true }
  const itemQuery = useQuery(
    itemQueryKeys.itemDetail(itemId, queryOpts),
    () => api!.getItem(itemId, queryOpts),
    { 
      enabled: api != null 
    }
  )

  // TODO: refactor comment box into its own component
  const [commentText, setCommentText] = useState('')
  const addCommentMutation = useAddComment()

  const { isIdle, isLoading, isError, data, error } = itemQuery
  const { isLoading: isPostingComment, error: commentError } = addCommentMutation
  

  if (!api) {
    return <div>
      Connecting to smart contract...
    </div>
  }

  const item = data as Item
  const summary = isIdle 
    ? 'Connecting to smart contract..'
    : isLoading
      ? 'Loading item details...'
      : isError
        ? `Error loading item details: ${error}`
        : <ItemSummary item={item} />

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault()
    const commentContent = {
      parentId: itemId,
      body: commentText
    }
    addCommentMutation.mutate({ api, commentContent })
  }

  const commentForm = (        
    <form className={styles.commentForm} onSubmit={submitComment}>
      <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} />
      <button type='submit' disabled={!commentText || isPostingComment}>add comment</button>

      {isPostingComment && `Submitting comment...`}
      {commentError && `Error posting comment: ${commentError}`}
    </form>
  )

  const loggedOutMessage = (
    <div className={styles.loggedOutMessage}>
      <Link to="/login">Log in</Link> to comment.
    </div>
  )

  const noTokenMessage = (
    <div className={styles.loggedOutMessage}>
      <Link to="/account">Add a storage token to your account to comment</Link>
    </div>
  )

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.postHeaderContainer}>
          {summary}
        </div>

        <div className={styles.postBody}>
          {item && item.content && item.content.body}
        </div>

        {loggedIn 
          ? (api.canPost ? commentForm : noTokenMessage)
          : loggedOutMessage
        }

        {item && <CommentList api={api} parentItem={item} />}
      </div>
    </Layout>
  )
}