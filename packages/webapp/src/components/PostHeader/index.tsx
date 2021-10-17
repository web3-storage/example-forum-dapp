import { Link } from "react-router-dom"
import { Post, Upvote } from "../../api/forum"
import styles from './postheader.module.css'
import { accountDisplayName } from "../../utils"
import { useVoteForItem } from "../../api/queries"
import { useApiContext } from "../../api/context"
import UpvoteButton from "../UpvoteButton"

export default function PostHeader(props: {post: Post}) {
  const { post } = props
  const score = post.score || 0
  const numComments = post.childIds.length
  
  const blockno = post.createdAtBlock.toString()
  const author = accountDisplayName(post.author)

  const { api } = useApiContext()
  const voteMutation = useVoteForItem()

  const upvoteClicked = () => {
    if (!api) {
      console.warn('no connection to contract')
      return
    }
    voteMutation.mutate({ api, itemId: post.id, vote: Upvote })
  }

  const { isLoading, isSuccess } = voteMutation
  const showUpvoteButton = !isLoading && !isSuccess

  return (
      <div 
        className={styles.container}
        key={'post-' + post.id.toString()}>
          {showUpvoteButton && <UpvoteButton onClick={upvoteClicked} />}

          <div className={styles.infoRows}>
            <div className={styles.postTitleRow}>
              <Link to={`/posts/${post.id}`}>
                {post.content.title}
              </Link>
            </div>

            <div className={styles.postDetailsRow}>
              {score} points by {author} at block #{blockno} | <Link to={`/posts/${post.id}`}>{numComments} comments</Link>
            </div>
          </div>
      </div>
  )
}