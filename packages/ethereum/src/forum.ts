import { File, Blob } from 'web3.storage'
import type { Web3Storage } from 'web3.storage'
import type { Forum as ForumContract } from '../typechain/Forum'
import type { Event, BigNumber } from 'ethers'

import type { Post, PostContent, PostId, Comment, CommentContent, CommentId, VoteValue, CIDString, Attachment, AttachmentRef } from './types'

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

  /**
   * Adds the given post content object to Web3.Storage, then adds a
   * new post record to the blockchain.
   * @param post content of the post.
   * @returns the unique id of the new post.
   * @throws if content storage fails.
   */
  async addPost(post: PostContent): Promise<PostId> {
    const cid = await this.#storePostContent(post)
    const tx = await this.#contract.addPost(cid)
    const receipt = await tx.wait()
    const id = idFromEvents('NewPost', receipt.events)
    if (!id) {
      throw new Error('unable to determine post id')
    }
    return id
  }

  /**
   * Retrieves a post by its id by fetching the content CID from the blockchain,
   * then fetching content from IPFS using the Web3.Storage client.
   * 
   * @param postId the id of a post to fetch.
   * @returns the post with the given id.
   * @throws if no post exists with the given ID, or if the post content fails to load
   */
  async getPost(postId: PostId): Promise<Post> {
    // Get the post information from the contract
    const postStruct = await this.#contract.getPost(postId)
    const { contentCID, author } = postStruct
    const id = postStruct.id.toString()

    // use the CID to fetch the post content
    const postObject = await this.#getJson(contentCID)
    // TODO: validate postObject
    const content = postObject as PostContent
    return { content, contentCID, id, author }
  }

  /**
   * Adds a comment to an existing post.
   * @param comment content of the comment. `comment.postId` must be a valid id for an existing post
   * @returns the unique id of the new comment
   * @throws if comment.postId is missing, if no post exists with that id, or if the content storage fails
   */
  async addComment(comment: CommentContent): Promise<CommentId> {
    const cid = await this.#storeCommentContent(comment)
    const tx = await this.#contract.addComment(comment.postId, cid)
    const receipt = await tx.wait()
    const id = idFromEvents('NewComment', receipt.events)
    if (!id) {
      throw new Error('unable to determine comment id')
    }
    return id
  }

  /**
   * Retrieves a comment by id.
   * @param commentId the unique id of the comment to fetch
   * @returns the comment with the given id
   * @throws if no comment exists with the given id, or if the content fails to load.
   */
  async getComment(commentId: CommentId): Promise<Comment> {
    // Get comment info from the contract
    const commentStruct = await this.#contract.getComment(commentId)
    const { contentCID, author } = commentStruct
    const id = commentStruct.id.toString()
    
    // use contentCID to fetch comment content
    const content = await this.#getJson(contentCID) as CommentContent // TODO: validate
    return { content, contentCID, author, id }
  }

  /**
   * Retrieves all comments attached to a given post.
   * Note that this method _does not_ validate that the post exists. 
   * Non-existant posts will return an empty array.
   * 
   * @param postId the unique id of a post.
   * @returns an array of Comment objects.
   */
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

  async #storePostContent(p: PostContent): Promise<CIDString> {
    const existingRefs = p.refs || []
    const attachmentRefs = await this.#storeAttachments(p.attachments) || []
    p.refs = [...existingRefs, ...attachmentRefs]
    p.attachments = undefined
    return this.#storeAsJson(p)
  }

  async #storeCommentContent(c: CommentContent): Promise<CIDString> {
    const existingRefs = c.refs || []
    const attachmentRefs = await this.#storeAttachments(c.attachments) || []
    c.refs = [...existingRefs, ...attachmentRefs]
    c.attachments = undefined
    return this.#storeAsJson(c)
  }

  async #storeAttachments(attachments: Attachment[]|undefined): Promise<AttachmentRef[]|undefined> {
    if (!attachments) {
      return
    }
    const files = filesFromAttachments(attachments)
    const cid = await this.#storage.put(files)
    const refs = attachments.map(a => ({
      name: a.name,
      ipfsPath: `${cid}/${a.name}`
    }))

    return refs
  }

  async #storeAsJson(o: any, filename: string = 'file.json', wrapWithDirectory: boolean = false): Promise<CIDString> {
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

function idFromEvents(targetEvent: string, events: Event[] | undefined): PostId | CommentId | undefined {
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

function filesFromAttachments(attachments: Attachment[]): File[] {
  const files = []
  for (const a of attachments) {
    files.push(new File([a.content], a.name))
  }
  return files
}