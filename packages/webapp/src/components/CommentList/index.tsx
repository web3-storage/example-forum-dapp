import { useQuery } from 'react-query'
import { useApiContext } from '../../api/context'
import type { Comment, PostId } from '../../api/forum'
import { commentQueryKeys } from '../../api/queries'
import styles from './commentlist.module.css'
import grayArrow from '../../images/grayarrow.gif'

export default function CommentList(props: { postId: PostId }) {
    const { postId } = props
    const { api } = useApiContext()

    const commentsQuery = useQuery(
        commentQueryKeys.commentsForPost(postId),
        () => api!.getCommentsForPost(postId),
        { 
          enabled: api != null 
        }
      )

    const { isIdle, isLoading, isError, data, error } = commentsQuery

    const comments = data ? (data as Comment[]) : []
    const commentViews = comments.map(comment => CommentView({comment}))

    return (
        <div>
            {isIdle && 'Connecting to smart contract...'}
            {isLoading && 'Fetching comments...'}
            {isError && `Error fecthing comments: ${error}`}
            {commentViews}
        </div>
    )
}


function CommentView(props: { comment: Comment }) {
    const { comment } = props
    const author = comment.author.substring(0, 8) + '...' // TODO: refactor into helper'

    // TODO: working vote button
    const upvoteButton = <img src={grayArrow} />

    return (
        <div className={styles.commentWrapper} key={`comment-${comment.id}`}>
            {upvoteButton}
            <div className={styles.commentContainer}>
                <div className={styles.commentHeader}>
                    {author} at block #{comment.createdAtBlock.toString()}
                </div>
                <div className={styles.commentBody}>
                    {comment.content.body}
                </div>
            </div>
        </div>
    )
}