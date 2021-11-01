import { useMutation, useQueryClient } from 'react-query'

import { ForumAPI, ItemId, PostContent, CommentContent, VoteValue, ItemKind } from './forum'

export const recentPostQueryKeys = {
    recentPosts: ['posts', 'recent'] as const,
    recentPostsWithOptions: (opts: {
        limit?: number, 
        includeScore?: boolean }) => 
        [...recentPostQueryKeys.recentPosts, opts] as const,
}

export const itemQueryKeys = {
  itemDetail: (itemId: ItemId, opts: { includeScore?: boolean } = { }) => 
    ['items', 'details', itemId.toString(), opts] as const,
}

export function useAddPost() {
    const queryClient = useQueryClient()
    const executor = ({api, postContent}: {api: ForumAPI, postContent: Omit<PostContent, 'itemKind'>}) => 
        api.addPost({...postContent, itemKind: 'POST'})

    return useMutation(executor, {
        onSuccess: () => {
            queryClient.invalidateQueries(recentPostQueryKeys.recentPosts)
        }
    })
}

export function useAddComment() {
    const queryClient = useQueryClient()
    const fn = ({api, commentContent}: {api: ForumAPI, commentContent: Omit<CommentContent, 'itemKind'>}) =>
        api.addComment({...commentContent, itemKind: 'COMMENT'})

    return useMutation(fn, {
        onSuccess: (_data, { commentContent }) => {
          // invalidate the parent object
            queryClient.invalidateQueries(
                itemQueryKeys.itemDetail(commentContent.parentId))
        },
        onError: (error) => {
            console.error('error posting comment', error)
        }
    })
}

export type VoteForItemOpts = {
  api: ForumAPI,
  itemId: ItemId,
  vote: VoteValue,
}

export function useVoteForItem() {
    const queryClient = useQueryClient()

    return useMutation(({api, itemId, vote}: VoteForItemOpts) => api.voteForItem(itemId, vote), {
        onSuccess: (_data, { itemId }) => {
            queryClient.invalidateQueries(itemQueryKeys.itemDetail(itemId, { includeScore: true }))
        }
    })
}
