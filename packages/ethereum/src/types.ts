import type { BigNumberish } from 'ethers'

export type PostId = BigNumberish
export type CommentId = BigNumberish
export type Address = string
export type CIDString = string

export interface Post {
  id: PostId,
  author: Address,
  content: PostContent,
  contentCID: CIDString,
}

export interface PostContent {
  body: string,
}

export interface Comment {
  id: CommentId,
  author: Address,
  content: CommentContent,
  contentCID: CIDString,
}

export interface CommentContent {
  postId: PostId,
  body: string,
}


export const Upvote = 1
export const Downvote = -1
export const NoVote = 0
export type VoteValue = 1 | 0 | -1
