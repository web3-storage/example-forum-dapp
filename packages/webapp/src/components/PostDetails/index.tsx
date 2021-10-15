import { useQuery } from "react-query";
import { useParams } from "react-router";
import { useApiContext } from "../../api/context";
import { postQueryKeys, useAddComment } from "../../api/queries";
import Layout from "../Layout";
import PostHeader from "../PostHeader";
import styles from './postdetails.module.css'

import type { Post } from '../../api/forum'
import CommentList from "../CommentList";
import React, { useState } from "react";

export default function PostDetails() {
  const { postId } = useParams<{ postId: string }>()
  const { api } = useApiContext()

  const postQueryOpts = { includeScore: true, includeCommentCount: true }
  const postQuery = useQuery(
    postQueryKeys.postDetail(postId, postQueryOpts),
    () => api!.getPost(postId, postQueryOpts),
    { 
      enabled: api != null 
    }
  )

  const [commentText, setCommentText] = useState('')
  const addCommentMutation = useAddComment()

  if (!api) {
    return <div>
      Connecting to smart contract...
    </div>
  }

  const { isIdle, isLoading, isError, data, error } = postQuery

  const postHeader = isIdle 
    ? 'Connecting to smart contract..'
    : isLoading
      ? 'Loading post details...'
      : isError
        ? `Error loading post details: ${error}`
        : <PostHeader post={data as Post} />

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault()
    const commentContent = {
      postId,
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

        <form className={styles.commentForm} onSubmit={submitComment}>
          <textarea onChange={(e) => setCommentText(e.target.value)} />
          <button type='submit' disabled={!commentText}>add comment</button>
        </form>
        <CommentList postId={postId} />
      </div>
    </Layout>
  )
}