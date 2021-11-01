import { BigNumber } from 'ethers'

import { File } from 'web3.storage'
import type { Web3Storage } from 'web3.storage'
import type { Event, BigNumberish } from 'ethers'
import type { Forum as ForumContract } from '../../../contract/typechain'
export type { Forum as ForumContract } from '../../../contract/typechain'

export interface ForumAPIOptions {
  readonlyContract: ForumContract,
  authorizedContract?: ForumContract,
  storage: Web3Storage,
}

export class NoAuthorizedAccountError extends Error {
  constructor() {
    super(`This operation is only allowed when logged in. Log in with your wallet and try again.`)
  }
}

/**
 * Provides a high-level API for interacting with the forum smart contract and Web3.Storage.
 */
export class ForumAPI {
  #readonlyContract: ForumContract
  #authorizedContract: ForumContract | undefined
  #storage: Web3Storage
  #itemContentCache: Map<CIDString, ItemContent> = new Map()

  constructor(opts: ForumAPIOptions) {
    this.#readonlyContract = opts.readonlyContract
    this.#authorizedContract = opts.authorizedContract
    this.#storage = opts.storage
  }

  #getAuthorizedContract() {
    if (!this.#authorizedContract) {
      throw new NoAuthorizedAccountError()
    }
    return this.#authorizedContract
  }

  /**
   * Adds the given post content object to Web3.Storage, then adds a
   * new post record to the blockchain.
   * @param post content of the post.
   * @returns the unique id of the new post.
   * @throws if content storage fails.
   */
  async addPost(post: PostContent): Promise<ItemId> {
    const cid = await this.#storePostContent(post)
    const tx = await this.#getAuthorizedContract().addPost(cid)
    const receipt = await tx.wait()
    const id = idFromEvents(receipt.events)
    if (!id) {
      throw new Error('unable to determine post id')
    }
    return id
  }

  /**
   * Retrieves an item by its id by fetching the content CID from the blockchain,
   * then fetching content from IPFS using the Web3.Storage client.
   * 
   * @param itemId the id of a post or comment to fetch.
   * @returns the item with the given id.
   * @throws if no item exists with the given ID, or if the item content fails to load
   */
  async getItem(itemId: ItemId, opts?: { includeScore?: boolean }): Promise<Item> {
    const itemStruct = await this.#readonlyContract.getItem(itemId)
    const item = await this.#hydrateItem(itemStruct)

    const { includeScore } = opts || {}
    if (includeScore) {
      const score = await this.#readonlyContract.getItemScore(itemId)
      item.score = score.toNumber()
    }

    return item
  }


  async getRecentPosts(opts: {limit?: number, includeScore?: boolean} = {}): Promise<Item[]> {
    const limit = opts.limit || 20
    const { includeScore } = opts


    const currentBlock = await this.#readonlyContract.provider.getBlockNumber()
    const blocksPerPage = 20

    let fromBlock = Math.max(0, currentBlock - blocksPerPage)
    let toBlock = currentBlock
    let ids: ItemId[] = []
    while (ids.length < limit && toBlock > 0) {
      const someIds = await this.#getPostIdsFromEvents(fromBlock, toBlock)
      ids = ids.concat(...someIds)
      toBlock = fromBlock
      fromBlock = Math.max(0, fromBlock - blocksPerPage)
    }

    const promises = ids.map(id => this.getItem(id, { includeScore }))
    return Promise.all(promises)
  }


  async #getPostIdsFromEvents(fromBlock: string | number, toBlock: string | number): Promise<ItemId[]> {
    // filter NewItem events - we want posts, which have parent id == 0
    const filter = this.#readonlyContract.filters.NewItem(null, BigNumber.from(0), null)
    
    const events = await this.#readonlyContract.queryFilter(filter, fromBlock, toBlock)
    return allIdsFromEvents(events)
  }


  /**
   * Adds a comment to an existing post.
   * @param comment content of the comment. `comment.postId` must be a valid id for an existing post
   * @returns the unique id of the new comment
   * @throws if comment.postId is missing, if no post exists with that id, or if the content storage fails
   */
  async addComment(comment: CommentContent): Promise<ItemId> {
    const cid = await this.#storeCommentContent(comment)
    const tx = await this.#getAuthorizedContract().addComment(comment.parentId, cid)
    const receipt = await tx.wait()
    const id = idFromEvents(receipt.events)
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
  async getComment(commentId: ItemId): Promise<Item> {
    // Get comment info from the contract
    const itemStruct = await this.#readonlyContract.getItem(commentId)
    return this.#hydrateItem(itemStruct)
  }



  async #hydrateItem(itemStruct: ItemStruct): Promise<Item> {
    const { contentCID } = itemStruct
    if (this.#itemContentCache.has(contentCID)) {
      const content = this.#itemContentCache.get(contentCID)!
      return { ...itemStruct, content }
    }
    
    // use contentCID to fetch item content
    console.log(`fectching content for item ${itemStruct.id}. CID: ${contentCID}`)
    const content = await this.#getJson(contentCID) as ItemContent // TODO: validate!
    this.#itemContentCache.set(contentCID, content)
    return { ...itemStruct, content }
  }


  /**
   * Applies the given vote to an item.
   * 
   * @param itemId - the unique id of a post or comment
   * @param vote - an upvote, downvote, or retraction
   */
  async voteForItem(itemId: ItemId, vote: VoteValue): Promise<void> {
    const tx = await this.#getAuthorizedContract().voteForItem(itemId, vote)
    await tx.wait()
  }

  /**
   * Get the total number of votes for a post or comment. May be negative.
   * @param itemId - unique id of post or comment
   * @returns - the total number of votes for the given post or comment, as an ethers BigNumber
   */
  async getVotes(itemId: ItemId): Promise<BigNumber> {
    return this.#readonlyContract.getItemScore(itemId)
  }

  /**
   * Stores a PostContent object as JSON with web3.storage.
   * 
   * @param p - a PostContent object
   * @returns - a promise that resoves to the CID of the content, encoded as a string
   */
  async #storePostContent(p: PostContent): Promise<CIDString> {
    return this.#storeAsJson(p)
  }

  /**
   * Stores a CommentContent object as JSON with web3.storage.
   * 
   * @param p - a CommentContent object
   * @returns - a promise that resoves to the CID of the content, encoded as a string
   */
  async #storeCommentContent(c: CommentContent): Promise<CIDString> {
    return this.#storeAsJson(c)
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
    const cid = await this.#storage.put([file], { wrapWithDirectory })
    console.log('stored json object. cid: ', cid, o)
    return cid
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
 * Tries to extract the post or comment from a `NewItem` event containing an `id` arg.
 * 
 * @param events - an array of ethers `Event`s to search.
 * @returns the value of `id` from the first `NewItem` event, or undefined if no event was found
 */
function idFromEvents(events: Event[] | undefined): ItemId | undefined {
  if (!events) {
    console.warn('cant get id from events: no events')
    return
  }

  let id: string | undefined
  for (const event of events) {
    if (event.event !== 'NewItem' || !event.args) {
      console.log('ignoring unexpected event', event.event)
      continue
    }
    if (!('id' in event.args)) {
      continue
    }
    id = event.args.id.toString()
  }
  return id
}


function allIdsFromEvents(events: Event[]): ItemId[] {
  return events.filter(e => e.event === 'NewItem' && e.args && e.args.id != null)
    .map(e => e.args!['id'])
}

//#endregion helpers

//#region types

export type ItemId = BigNumberish
export type Address = string
export type CIDString = string
export type IPFSPath = string

export enum ItemKind {
  POST = 0,
  COMMENT,
}

export interface Item {
  kind: ItemKind,
  id: ItemId,
  parentId: ItemId,
  author: Address,
  childIds: ItemId[],
  contentCID: CIDString,
  createdAtBlock: BigNumber,
  content: ItemContent,

  score?: number,
}

export interface Post extends Item {
  kind: ItemKind.POST
  content: PostContent
}

export interface Comment extends Item {
  kind: ItemKind.COMMENT
  content: CommentContent
}

export type ItemContent = PostContent | CommentContent

export interface PostContent {
  itemKind: 'POST',
  title: string,
  body: string,
}


export interface CommentContent {
  itemKind: 'COMMENT'
  parentId: ItemId,
  body: string,
}

export const Upvote = 1
export const Downvote = -1
export const NoVote = 0
export type VoteValue = 1 | 0 | -1


/// the types below are for struct types defined in the contract

type ItemStruct = {
  kind: number
  id: BigNumber
  parentId: BigNumber
  author: string
  createdAtBlock: BigNumber
  childIds: ItemId[]
  contentCID: string
}

//#endregion types
