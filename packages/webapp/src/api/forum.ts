import type { BigNumberish } from 'ethers'

import { File } from 'web3.storage'
import type { Web3Storage } from 'web3.storage'
import type { Event, BigNumber } from 'ethers'
import type { Forum as ForumContract } from '../../../contract/typechain'
export type { Forum as ForumContract } from '../../../contract/typechain'


/**
 * Provides a high-level API for interacting with the forum smart contract and Web3.Storage.
 */
export class ForumAPI {
  #contract: ForumContract
  #storage: Web3Storage

  constructor(opts: ForumAPIOptions) {
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
   * @param postId - the unique id of a post
   * @returns - an array of Comment objects
   */
  async getCommentsForPost(postId: PostId): Promise<Comment[]> {
    const commentStructs = await this.#contract.getPostComments(postId)
    const promises = []
    for (const c of commentStructs) {
      promises.push(this.getComment(c.id.toString()))
    }
    return Promise.all(promises)
  }

  /**
   * Applies the given vote to a post.
   * 
   * @param postId - the unique id of a post
   * @param vote - an upvote, downvote, or retraction
   */
  async voteForPost(postId: PostId, vote: VoteValue): Promise<void> {
    const tx = await this.#contract.voteForPost(postId, vote)
    await tx.wait()
  }

  /**
   * Applies the given vote to a comment.
   * 
   * @param commentId - the unique id of a comment
   * @param vote - an upvote, downvote, or retraction
   */
  async voteForComment(commentId: CommentId, vote: VoteValue): Promise<void> {
    const tx = await this.#contract.voteForComment(commentId, vote)
    await tx.wait()
  }

  /**
   * Get the total number of votes for a post or comment. May be negative.
   * @param postOrCommentId - unique id of post or comment
   * @returns - the total number of votes for the given post or comment, as an ethers BigNumber
   */
  async getVotes(postOrCommentId: PostId | CommentId): Promise<BigNumber> {
    return this.#contract.getVotes(postOrCommentId)
  }

  /**
   * Stores a PostContent object as JSON with web3.storage.
   * 
   * If the PostContent has any Attachments, these will be stored first
   * and replaced with AttachmentRefs in the stored PostContent JSON.
   * 
   * @param p - a PostContent object
   * @returns - a promise that resoves to the CID of the content, encoded as a string
   */
  async #storePostContent(p: PostContent): Promise<CIDString> {
    const existingRefs = p.refs || []
    const attachmentRefs = await this.#storeAttachments(p.attachments) || []
    p.refs = [...existingRefs, ...attachmentRefs]
    p.attachments = undefined
    return this.#storeAsJson(p)
  }

  /**
   * Stores a CommentContent object as JSON with web3.storage.
   * 
   * If the CommentContent has any Attachments, these will be stored first
   * and replaced with AttachmentRefs in the stored CommentContent JSON.
   * 
   * @param p - a CommentContent object
   * @returns - a promise that resoves to the CID of the content, encoded as a string
   */
  async #storeCommentContent(c: CommentContent): Promise<CIDString> {
    const existingRefs = c.refs || []
    const attachmentRefs = await this.#storeAttachments(c.attachments) || []
    c.refs = [...existingRefs, ...attachmentRefs]
    c.attachments = undefined
    return this.#storeAsJson(c)
  }

  /**
   * Stores Attachment objects with Web3.Storage and returns AttachmentRefs that link to them
   * by IPFS path.
   * 
   * @param attachments - an array of Attachment objects
   * @returns - a promise that resolves to an array of AttachmentRef objects, or undefined if the input was undefined
   */
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

  /**
   * Stores the given value as a JSON file with web3.storage.
   * 
   * @param o - any JS value that can be converted to JSON
   * @param filename - optional filename. Ignored if wrapWithDirectory == false.
   * @param wrapWithDirectory - if true, wraps content with an IPFS directory listing. Defaults to false.
   * @returns - a promise that resoves to the CID of the JSON file, encoded as a string. 
   * If wrapWithDirectory == true, the CID will be of the directory root, and the file is accessible at `${cid}/${filename}`
   */
  async #storeAsJson(o: any, filename: string = 'file.json', wrapWithDirectory: boolean = false): Promise<CIDString> {
    const str = JSON.stringify(o)
    const file = new File([str], filename, { type: 'application/json' })
    return this.#storage.put([file], { wrapWithDirectory })
  }

  /**
   * Fetches a JSON file from web3.storage and parses it.
   * 
   * @param cid - CID of JSON file object to fetch
   * @returns - a promise that resolves to the parsed JSON object
   */
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


//#region helpers

/**
 * Tries to extract the post or comment from an event containing an `id` arg.
 * 
 * @param targetEvent - the name of the event containing the id. Should be one of 'NewPost` or 'NewComment'.
 * @param events - an array of ethers `Event`s to search.
 * @returns the value of `id` from the first event with the given name, or undefined if no matching event was found
 */
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

/**
 * Helper to convert attachments to File objects.
 * @param attachments an array of Attachment objects
 * @returns an Array of File objects
 */
function filesFromAttachments(attachments: Attachment[]): File[] {
  const files = []
  for (const a of attachments) {
    files.push(new File([a.content], a.name))
  }
  return files
}


//#endregion helpers

//#region types

export interface ForumAPIOptions {
  contract: ForumContract,
  storage: Web3Storage,
}

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

//#endregion types
