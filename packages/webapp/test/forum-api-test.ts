import { describe, it, beforeEach } from 'mocha'
import { MockProvider, deployContract, loadFixture, solidity } from 'ethereum-waffle'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'

import { Web3Storage, File } from 'web3.storage'
import type { Web3Response } from 'web3.storage'

chai.use(solidity)
chai.use(chaiAsPromised)


import { ForumAPI as Forum, Upvote, Downvote, NoVote, VoteValue, Address } from '../src/api/forum'
import type { ForumContract } from '../src/api/forum'
import ForumArtifact from '../../contract/artifacts/contracts/Forum.sol/Forum.json'
import { BigNumber } from '@ethersproject/bignumber'


describe("ForumAPI", function () {
  let mainAccount: Address
  let otherAccount: Address
  let forum: Forum
  let otherUserForum: Forum
  let storage: Web3Storage
  let putStub: sinon.SinonStub
  let getStub: sinon.SinonStub

  const stubStoragePut = (cidToReturn: string) => {
    putStub = sinon.stub(storage, "put")
    putStub.returns(Promise.resolve(cidToReturn))
  }

  const stubStorageGet = (res: Partial<Web3Response>) => {
    getStub = sinon.stub(storage, "get")
    getStub.returns(Promise.resolve(res))
  }

  const stubGetFile = (fileContent: string, filename: string = 'file') => {
    const file = Object.assign(new File([fileContent], filename), { cid: 'fake-cid' })
    stubStorageGet({
      ok: true, 
      files: async () => ([file])
    })
  }

  async function fixture() {
    const provider = new MockProvider()
    const signers = provider.getWallets()
    const contract = (await deployContract(signers[0], ForumArtifact)) as ForumContract
    mainAccount = signers[0].address
    otherAccount = signers[1].address
    return {contract, signers};
  }

  beforeEach(async function () {
    const { contract, signers } = await loadFixture(fixture)
    storage = new Web3Storage({ token: 'token', endpoint: new URL('https://api.example.com') }) 
    forum = new Forum({ readonlyContract: contract, authorizedContract: contract, storage })

    const otherUserContract = contract.connect(signers[1])
    otherUserForum = new Forum({ readonlyContract: otherUserContract, authorizedContract: otherUserContract, storage })
  });

  describe("Posts", async () => {
    it("Should store and retrieve posts", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      stubGetFile(JSON.stringify(postObj))

      const post = await forum.getItem(postId)
      expect(post.id).to.equal(postId)
      expect(post.author).to.equal(mainAccount)
      expect(post.content.body).to.equal(postObj.body)
    })

    it("Should return recent posts in reverse chronological order", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const 
      stubStoragePut(cid)
      stubGetFile(JSON.stringify(postObj))


      const total = 10
      const limit = 5
      let lastId

      for (let i = 0; i < total; i++) {
        lastId = await forum.addPost(postObj)
      }

      const recent = await forum.getRecentPosts({ limit })
      expect(recent.length).to.equal(limit)
      expect(recent[0].id).to.equal(lastId)
    })

    it("Should fail to retrieve an item that does not exist", async () => {
      expect(forum.getItem(123)).to.be.rejectedWith('No item found')
    })
  })

  describe("Comments", async () => {
    it("Should add comments for a post", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const parentId = await forum.addPost(postObj)
      expect(parentId).to.not.be.empty

      const commentObj = { itemKind: 'COMMENT', body: "This is a great comment!", parentId } as const
      const commentId = await forum.addComment(commentObj)
      expect(commentId).to.not.be.empty

      stubGetFile(JSON.stringify(commentObj))
      const c = await forum.getComment(commentId)
      expect(c.id).to.equal(commentId)
      expect(c.author).to.equal(mainAccount)
      expect(c.content.body).to.equal(commentObj.body)
    })

    it("Should fail to retrieve a comment that does not exist", async () => {
      expect(forum.getComment(123)).to.be.rejectedWith('No item found')
    })

    it("Should not add comments for a post that doesn't exist", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      stubStoragePut(cid)
      expect(forum.addComment({ itemKind: 'COMMENT', parentId: '123', body: 'foo' })).to.be.revertedWith('Parent item does not exist')
    })

    it("Should include comment in child ids of parent post", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const parentId = await forum.addPost(postObj)
      expect(parentId).to.not.be.empty

      const commentObj = { itemKind: 'COMMENT', body: "This is a great comment!",  parentId } as const
      const commentId = await forum.addComment(commentObj)
      expect(commentId).to.not.be.empty

      stubGetFile(JSON.stringify(commentObj))

      const post = await forum.getItem(parentId)
      expect(post.childIds.length).to.equal(1)
      expect(post.childIds[0].toString()).to.equal(commentId.toString())
    })
  })

  describe("Voting", async () => {

    it("Should allow voting on a post", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForItem(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)
    })

    it("Should allow voting on a comment", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const parentId = await forum.addPost(postObj)
      expect(parentId).to.not.be.empty

      const commentObj = { itemKind: 'COMMENT', body: "This is a great comment!", parentId } as const
      const commentId = await forum.addComment(commentObj)
      expect(commentId).to.not.be.empty

      expect(forum.getVotes(commentId)).to.eventually.equal(0)
      await forum.voteForItem(commentId, Upvote)
      expect(forum.getVotes(commentId)).to.eventually.equal(1)
    })

    it("Should fail to vote if item does not exist", async () => {
      expect(forum.voteForItem('123', Upvote)).to.be.revertedWith('Item does not exist')
    })

    it("Should only count upvotes from the same voter once", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForItem(postId, Upvote)
      await forum.voteForItem(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)
    })

    it("Should only count downvotes from the same voter once", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForItem(postId, Downvote)
      await forum.voteForItem(postId, Downvote)
      expect(forum.getVotes(postId)).to.eventually.equal(-1)
    })

    it("Should allow a voter to remove their vote", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)
      await forum.voteForItem(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)
      await forum.voteForItem(postId, NoVote)
      expect(forum.getVotes(postId)).to.eventually.equal(0)
    })

    it("Should combine votes from multiple voters", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForItem(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)

      await otherUserForum.voteForItem(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(2)
    })


    it("Should fail to vote if vote value is invalid", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { itemKind: 'POST', body: "This is an amazing post!", title: 'A great post' } as const
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(forum.voteForItem(postId, 123 as VoteValue)).to.be.rejectedWith('Invalid vote value')
    })
  })
})
