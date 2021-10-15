import { useQuery } from "react-query";
import { useParams } from "react-router";
import { useApiContext } from "../../api/context";
import { postQueryKeys } from "../../api/queries";
import Layout from "../Layout";
import PostHeader from "../PostHeader";
import styles from './postdetails.module.css'

import type { Post } from '../../api/forum'
import CommentList from "../CommentList";

export default function PostDetails() {
  const { postId } = useParams<{ postId: string }>()
  const { api } = useApiContext()
  const postQuery = useQuery(
    postQueryKeys.postDetail(postId),
    () => api!.getPost(postId),
    { 
      enabled: api != null 
    }
  )

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

  const addCommentClicked = () => {
    console.log('TODO: add comment mutation')
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.postHeaderContainer}>
          {postHeader}
        </div>

        <form className={styles.commentForm} onSubmit={() => addCommentClicked()}>
          <textarea />
          <button type='submit'>add comment</button>
        </form>
        <CommentList postId={postId} />
      </div>
    </Layout>
  )
}