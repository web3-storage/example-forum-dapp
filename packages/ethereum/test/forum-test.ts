import { ethers, waffle } from 'hardhat'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'

import { Web3Storage, File } from 'web3.storage'
import type { Web3Response } from 'web3.storage'

const { deployContract, loadFixture } = waffle
const { expect } = chai
chai.use(chaiAsPromised)


import Forum from '../src/forum'
import type { Forum as ForumContract } from '../typechain/Forum'
import ForumArtifact from '../artifacts/contracts/Forum.sol/Forum.json'

import { Upvote, Downvote, NoVote, VoteValue, Address } from '../src/types'

describe("Forum", function () {
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
    const signers = await ethers.getSigners()
    const contract = (await deployContract(signers[0], ForumArtifact)) as ForumContract
    mainAccount = signers[0].address
    otherAccount = signers[1].address
    return {contract, signers};
  }

  beforeEach(async function () {
    const { contract, signers } = await loadFixture(fixture)
    storage = new Web3Storage({ token: 'token', endpoint: new URL('https://api.example.com') }) 
    forum = new Forum({ contract, storage })

    const otherUserContract = contract.connect(signers[1])
    otherUserForum = new Forum({ contract: otherUserContract, storage })
  });

  describe("Posts", async () => {
    it("Should store and retrieve posts", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      stubGetFile(JSON.stringify(postObj))

      const post = await forum.getPost(postId)
      expect(post.id).to.equal(postId)
      expect(post.author).to.equal(mainAccount)
      expect(post.content).to.deep.equal(postObj)
    })
  })

  describe("Comments", async () => {
    it("Should add comments for a post", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      const commentObj = { body: "This is a great comment!", postId }
      const commentId = await forum.addComment(commentObj)
      expect(commentId).to.not.be.empty

      stubGetFile(JSON.stringify(commentObj))
      const c = await forum.getComment(commentId)
      expect(c.id).to.equal(commentId)
      expect(c.author).to.equal(mainAccount)
      expect(c.content).to.deep.equal(commentObj)
    })

    it("Should not add comments for a post that doesn't exist", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      stubStoragePut(cid)
      expect(forum.addComment({ postId: '123', body: 'foo' })).to.be.revertedWith('Post does not exist')
    })

    it("Should retrieve all comments for a post", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      const commentObj = { body: "This is a great comment!", postId }
      const commentId = await forum.addComment(commentObj)
      expect(commentId).to.not.be.empty

      const newCommentId = await forum.addComment(commentObj)

      stubGetFile(JSON.stringify(commentObj))

      const comments = await forum.getCommentsForPost(postId)
      expect(comments.length).to.equal(2)
      expect(comments[0].id).to.equal(commentId)
      expect(comments[1].id).to.equal(newCommentId)
    })
  })

  describe("Voting", async () => {

    it("Should allow voting on a post", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForPost(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)
    })

    it("Should allow voting on a comment", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      const commentObj = { body: "This is a great comment!", postId }
      const commentId = await forum.addComment(commentObj)
      expect(commentId).to.not.be.empty

      expect(forum.getVotes(commentId)).to.eventually.equal(0)
      await forum.voteForComment(commentId, Upvote)
      expect(forum.getVotes(commentId)).to.eventually.equal(1)
    })

    it("Should fail to vote if post does not exist", async () => {
      expect(forum.voteForPost('123', Upvote)).to.be.revertedWith('Post does not exist')
    })

    it("Should fail to vote if comment does not exist", async () => {
      expect(forum.voteForComment('123', Upvote)).to.be.revertedWith('Comment does not exist')
    })

    it("Should only count upvotes from the same voter once", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForPost(postId, Upvote)
      await forum.voteForPost(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)
    })

    it("Should only count downvotes from the same voter once", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForPost(postId, Downvote)
      await forum.voteForPost(postId, Downvote)
      expect(forum.getVotes(postId)).to.eventually.equal(-1)
    })

    it("Should allow a voter to remove their vote", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)
      await forum.voteForPost(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)
      await forum.voteForPost(postId, NoVote)
      expect(forum.getVotes(postId)).to.eventually.equal(0)
    })

    it("Should combine votes from multiple voters", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(postId).to.not.be.empty

      expect(forum.getVotes(postId)).to.eventually.equal(0)

      await forum.voteForPost(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(1)

      await otherUserForum.voteForPost(postId, Upvote)
      expect(forum.getVotes(postId)).to.eventually.equal(2)
    })


    it("Should fail to vote if vote value is invalid", async () => {
      const cid = 'bafybeifjdits7w4teaulpobkbsnufd34glbg5x2fqdwcwuj2vfxwcqyvpa'
      const postObj = { body: "This is an amazing post!" }
      stubStoragePut(cid)

      const postId = await forum.addPost(postObj)
      expect(forum.voteForPost(postId, 123 as VoteValue)).to.be.revertedWith('Invalid vote value')
    })
  })
})
