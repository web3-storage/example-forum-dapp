import { useMutation, useQuery, useQueryClient } from 'react-query'

import type { ForumAPI, PostId, PostContent, CommentContent } from './forum'

export const postQueryKeys = {
    recentPosts: ['posts', 'recent'] as const,
    recentPostsWithOptions: (opts: {
        limit?: number, 
        includeScore?: boolean, 
        includeCommentCount?: boolean }) => 
        [...postQueryKeys.recentPosts, opts] as const,

    postDetail: (
        postId: PostId, 
        opts: { includeScore?: boolean, includeCommentCount?: boolean } = { }
        ) => ['posts', 'details', postId.toString(), opts] as const,

}

export const commentQueryKeys = {
    commentsForPost: (postId: PostId) => ['comments', 'for-post', postId.toString()] as const,
}

export function useAddPost() {
    const queryClient = useQueryClient()
    const executor = (opts: {api: ForumAPI, postContent: PostContent}) => 
        opts.api.addPost(opts.postContent)

    return useMutation(executor, {
        onSuccess: () => {
            queryClient.invalidateQueries(postQueryKeys.recentPosts)
        }
    })
}

export function useAddComment() {
    const queryClient = useQueryClient()
    const executor = (opts: {api: ForumAPI, commentContent: CommentContent}) =>
        opts.api.addComment(opts.commentContent)

    return useMutation(executor, {
        onSuccess: (_data, { commentContent }) => {
            console.log('posted comment successfully')
            queryClient.invalidateQueries(
                commentQueryKeys.commentsForPost(commentContent.postId))
        },
        onError: (error) => {
            console.error('error posting comment', error)
        }
    })
}