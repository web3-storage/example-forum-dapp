import { File } from 'web3.storage'
import type { Web3Storage } from 'web3.storage'
import type { Forum as ForumContract } from '../typechain/Forum'
import type { Event, BigNumber } from 'ethers'

import type { Post, PostContent, PostId, Comment, CommentContent, CommentId, VoteValue } from './types'

interface ForumOptions {
  contract: ForumContract,
  storage: Web3Storage,
}

/**
 * Provides a high-level API for interacting with the forum smart contract and Web3.Storage.
 */
export default class Forum {
  #contract: ForumContract
  #storage: Web3Storage

  constructor(opts: ForumOptions) {
    this.#contract = opts.contract
    this.#storage = opts.storage
  }

  async addPost(post: PostContent): Promise<PostId> {
    const cid = await this.#storeAsJson(post)
    const tx = await this.#contract.addPost(cid)
    const receipt = await tx.wait()
    const id = idFromEvents('NewPost', receipt.events)
    if (!id) {
      throw new Error('unable to determine post id')
    }
    return id
  }

  async getPost(postId: PostId): Promise<Post> {
    // Get the post information from the contract
    const postStruct = await this.#contract.getPost(postId)
    const { contentCID } = postStruct

    // use the CID to fetch the post content
    const postObject = await this.#getJson(contentCID)
    // TODO: validate postObject
    const content = postObject as PostContent
    return { content, id: postStruct.id.toString() }
  }

  async addComment(comment: CommentContent): Promise<CommentId> {
    const cid = await this.#storeAsJson(comment)
    const tx = await this.#contract.addComment(comment.postId, cid)
    const receipt = await tx.wait()
    const id = idFromEvents('NewComment', receipt.events)
    if (!id) {
      throw new Error('unable to determine comment id')
    }
    return id
  }

  async getComment(commentId: CommentId): Promise<Comment> {
    const commentStruct = await this.#contract.getComment(commentId)
    const { contentCID } = commentStruct
    const content = await this.#getJson(contentCID) as CommentContent // TODO: validate
    return { content, id: commentStruct.id.toString() }
  }

  async getCommentsForPost(postId: PostId): Promise<Comment[]> {
    const commentStructs = await this.#contract.getPostComments(postId)
    const promises = []
    for (const c of commentStructs) {
      promises.push(this.getComment(c.id.toString()))
    }
    return Promise.all(promises)
  }

  async voteForPost(postId: PostId, vote: VoteValue): Promise<void> {
    const tx = await this.#contract.voteForPost(postId, vote)
    await tx.wait()
  }

  async voteForComment(commentId: CommentId, vote: VoteValue): Promise<void> {
    const tx = await this.#contract.voteForComment(commentId, vote)
    await tx.wait()
  }

  async getVotes(postOrCommentId: PostId | CommentId): Promise<BigNumber> {
    return this.#contract.getVotes(postOrCommentId)
  }

  async #storeAsJson(o: any, filename: string = 'file.json', wrapWithDirectory: boolean = false): Promise<string> {
    const str = JSON.stringify(o)
    const file = new File([str], filename, { type: 'application/json' })
    return this.#storage.put([file], { wrapWithDirectory })
  }

  async #getJson(cid: string): Promise<any> {
    const res = await this.#storage.get(cid)
    if (!res || !res.ok) {
      throw new Error(`Error getting cid ${cid}: [${res?.status}] ${res?.statusText}`)
    }
    const files = await res.files()
    if (files.length < 1) {
      throw new Error(`No files in response`)
    }
    const content = await files[0].text()
    return JSON.parse(content)
  }
}

function idFromEvents(targetEvent: string, events: Event[] | undefined): string | undefined {
  if (!events) {
    return
  }

  let id: string | undefined
  for (const event of events) {
    if (event.event !== targetEvent || !event.args) {
      continue
    }
    if (!('id' in event.args)) {
      continue
    }
    id = event.args.id.toString()
  }
  return id
}