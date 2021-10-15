import { UseMutationResult, useQuery } from 'react-query'
import { useApiContext } from '../../api/context'
import { Comment, PostId, Upvote } from '../../api/forum'
import type { ForumAPI } from '../../api/forum'
import { commentQueryKeys, useVoteForComment, VoteForCommentOpts } from '../../api/queries'
import styles from './commentlist.module.css'
import UpvoteButton from '../UpvoteButton'
import { accountDisplayName } from '../../utils'

export default function CommentList(props: { postId: PostId }) {
    const { postId } = props
    const { api } = useApiContext()
    const voteMutation = useVoteForComment()

    const commentsQuery = useQuery(
        commentQueryKeys.commentsForPost(postId),
        () => api!.getCommentsForPost(postId),
        { 
          enabled: api != null 
        }
      )

    const { isIdle, isLoading, isError, data, error } = commentsQuery

    const comments = data ? (data as Comment[]) : []
    const commentViews = comments.map(comment => CommentView({comment, api, voteMutation}))

    return (
        <div>
            {isIdle && 'Connecting to smart contract...'}
            {isLoading && 'Fetching comments...'}
            {isError && `Error fecthing comments: ${error}`}
            {commentViews}
        </div>
    )
}


function CommentView(props: { comment: Comment, api: ForumAPI | undefined, voteMutation: UseMutationResult<void, unknown, VoteForCommentOpts, unknown>}) {
    const { comment, voteMutation, api } = props
    const author = accountDisplayName(comment.author)
    
    const upvoteClicked = () => {
      if (!api) {
        console.warn('no connection to contract')
        return
      }
      voteMutation.mutate({ api, commentId: comment.id, vote: Upvote })
    }

    return (
        <div className={styles.commentWrapper} key={`comment-${comment.id}`}>
            <UpvoteButton onClick={upvoteClicked} />
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