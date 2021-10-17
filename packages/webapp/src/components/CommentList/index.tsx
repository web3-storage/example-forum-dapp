import { UseMutationResult, useQueries, useQuery, UseQueryResult } from 'react-query'
import { useApiContext } from '../../api/context'
import { Comment, Item, ItemId, Upvote } from '../../api/forum'
import type { ForumAPI } from '../../api/forum'
import { itemQueryKeys, useVoteForItem, VoteForItemOpts } from '../../api/queries'
import styles from './commentlist.module.css'
import UpvoteButton from '../UpvoteButton'
import { accountDisplayName } from '../../utils'

export default function CommentList(props: { parentItem: Item, api: ForumAPI }) {
    const { parentItem, api } = props
    const voteMutation = useVoteForItem()

    console.log('comment list parentItem', parentItem)

    const commentsQueries: UseQueryResult<Comment, Error>[] = useQueries(
        parentItem.childIds.map(id => ({
            queryKey: itemQueryKeys.itemDetail(id, { includeScore: true }),
            queryFn: () => api.getItem(id, { includeScore: true }),
        })),
    ) as UseQueryResult<Comment, Error>[]

    const views = []
    for (let i = 0; i < parentItem.childIds.length; i++) {
        const commentId = parentItem.childIds[i]
        const commentQuery = commentsQueries[i]
        views.push(CommentView({ commentQuery, commentId, api, voteMutation }))
    }
    const commentViews = commentsQueries.map(commentQuery => CommentView({commentQuery, api, voteMutation}))

    return (
        <div>
            {commentViews}
        </div>
    )
}


function CommentView(props: { commentQuery: UseQueryResult<Comment, Error>, commentId: ItemId, api: ForumAPI | undefined, voteMutation: UseMutationResult<void, unknown, VoteForCommentOpts, unknown>}) {
    const { commentQuery, commentId, voteMutation, api } = props

    const { isIdle, isLoading, error, data } = commentQuery

    console.log('comment view query', commentQuery)
    if (isIdle) {
        return <span key={`comment-status-${commentId}`}>
            Connecting...
        </span>
    }

    if (isLoading) {
        return <span key={`comment-status-${commentId}`}>
            Loading comment...
        </span>
    }

    if (error) {
        return <span key={`comment-status-${commentId}`}>
            Error loading comment: {error.message}
        </span>
    }

    const comment = data as Comment
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