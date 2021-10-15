import { useQuery } from 'react-query'
import { useApiContext } from '../../api/context'
import type { PostId } from '../../api/forum'
import { commentQueryKeys } from '../../api/queries'

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
    
    return (
        <div>
            Comment list goes here...
        </div>
    )
}