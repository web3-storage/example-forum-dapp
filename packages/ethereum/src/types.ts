import type { BigNumberish } from 'ethers'
import type { Blob, File } from 'web3.storage'

export type PostId = BigNumberish
export type CommentId = BigNumberish
export type Address = string
export type CIDString = string
export type IPFSPath = string

export interface Post {
  id: PostId,
  author: Address,
  content: PostContent,
  contentCID: CIDString,
}

export interface PostContent {
  body: string,
  attachments?: Attachment[],
  refs?: AttachmentRef[],
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
  attachments?: Attachment[],
  refs?: AttachmentRef[],
}

export interface Attachment {
  name: string,
  content: AttachmentContent,
}

export interface AttachmentRef {
  name: string,
  ipfsPath: IPFSPath,
}

export type AttachmentContent = Blob | File | Uint8Array | string

export const Upvote = 1
export const Downvote = -1
export const NoVote = 0
export type VoteValue = 1 | 0 | -1
