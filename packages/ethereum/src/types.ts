
export type PostId = string
export type CommentId = string

export interface Post {
  content: PostContent,
  id: PostId,
}

export interface PostContent {
  body: string,
}

export interface Comment {
  content: CommentContent,
  id: CommentId,
}

export interface CommentContent {
  postId: PostId,
  body: string,
}


export const Upvote = 1
export const Downvote = -1
export const NoVote = 0
export type VoteValue = 1 | 0 | -1
