import { useQuery } from "react-query";
import { useParams } from "react-router";
import { useApiContext } from "../../api/context";
import { itemQueryKeys, useAddComment } from "../../api/queries";
import Layout from "../Layout";
import PostHeader from "../PostHeader";
import styles from './postdetails.module.css'

import type { Post } from '../../api/forum'
import CommentList from "../CommentList";
import React, { useState } from "react";

export default function PostDetails() {
  const { postId } = useParams<{ postId: string }>()
  const { api } = useApiContext()

  const queryOpts = { includeScore: true, includeCommentCount: true }
  const postQuery = useQuery(
    itemQueryKeys.itemDetail(postId, queryOpts),
    () => api!.getItem(postId, queryOpts),
    { 
      enabled: api != null 
    }
  )

  // TODO: refactor comment box into its own component
  const [commentText, setCommentText] = useState('')
  const addCommentMutation = useAddComment()

  const { isIdle, isLoading, isError, data, error } = postQuery
  const { isLoading: isPostingComment, error: commentError } = addCommentMutation
  

  if (!api) {
    return <div>
      Connecting to smart contract...
    </div>
  }

  const post = data as Post
  const postHeader = isIdle 
    ? 'Connecting to smart contract..'
    : isLoading
      ? 'Loading post details...'
      : isError
        ? `Error loading post details: ${error}`
        : <PostHeader post={post} />

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault()
    const commentContent = {
      parentId: postId,
      body: commentText
    }
    addCommentMutation.mutate({ api, commentContent })
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.postHeaderContainer}>
          {postHeader}
        </div>

        <div className={styles.postBody}>
          {post && post.content && post.content.body}
        </div>

        <form className={styles.commentForm} onSubmit={submitComment}>
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} />
          <button type='submit' disabled={!commentText || isPostingComment}>add comment</button>

          {isPostingComment && `Submitting comment...`}
          {commentError && `Error posting comment: ${commentError}`}
        </form>
        {post && <CommentList api={api} parentItem={post} />}
      </div>
    </Layout>
  )
}