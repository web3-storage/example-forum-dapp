import { useMutation, useQuery, useQueryClient } from 'react-query'

import type { ForumAPI, PostId, PostContent, CommentContent, VoteValue, CommentId } from './forum'

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
    const fn = ({api, commentContent}: {api: ForumAPI, commentContent: CommentContent}) =>
        api.addComment(commentContent)

    return useMutation(fn, {
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

export type VoteForPostOpts = {
  api: ForumAPI,
  postId: PostId,
  vote: VoteValue,
}

export function useVoteForPost() {
    const queryClient = useQueryClient()

    return useMutation(({api, postId, vote}: VoteForPostOpts) => api.voteForPost(postId, vote), {
        onSuccess: (_data, { postId }) => {
            queryClient.invalidateQueries(postQueryKeys.postDetail(postId, { includeCommentCount: true }))
        }
    })
}


export type VoteForCommentOpts = {
  api: ForumAPI,
  commentId: CommentId,
  vote: VoteValue,
}

export function useVoteForComment() {
  // TODO: invalidate comment list for parent post?
  return useMutation(({api, commentId, vote}: VoteForCommentOpts) =>
    api.voteForComment(commentId, vote))
}