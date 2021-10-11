# Web3.Storage Forum dApp example

This repository contains an example of a decentralized application that uses [Web3.Storage](https://web3.storage) and [Ethereum](https://ethereum.org) to provide a simple online forum.

## App overview

The app consists of a smart contract and supporting TypeScript code for interacting with the blockchain, along with a single-page web app, written in React.

At a high level, the app works like this:

A [`Forum` smart contract][src-forum-sol] is deployed to an Ethereum network

### Posts

Anyone with an Ethereum account can create a new `Post` by calling the `addPost` contract function, passing in the [IPFS Content ID (CID)][ipfs-docs-cid] of the post content, which is stored as a JSON file.

When a post is created, the `NewPost` event is emitted, containing the unique id of the post and the author's address.

Once a post is created, you can call `getPost(postId)`, which returns a `Post` struct containing the post id, author address, and content CID.

### Comments

Anyone can comment on a post by calling the `addComment` contract function, passing in the post ID and the IPFS CID of a comment JSON file.

Comments can be fetched by id using the `getComment(commentId)` function, which returns a `Comment` struct containing the comment id, post id, author address and content CID.

You can fetch all the comments associated with a post by calling `getPostComments(postId)`, which returns an array of `Comment` structs. Note that this will become increasingly expensive as many comments are added.

### Voting

Anyone can vote on a comment or post by calling either `voteForPost(postId, voteValue)` or `voteForComment(commentId, voteValue)`, where `voteValue` is `-1` for a downvote, `+1` for an upvote, or `0` to retract a previous vote.

Each account can only vote once for each post or comment - subequent votes replace the previous vote from that account.

You can retrive the vote total for a post or comment with `getVotes(postOrCommentId)`, which returns the sum of all up and downvotes.

To get the "post karma" or number of votes an author has recieved for their posts, call `getPostKarma(author)`, passing in the author's address.

To get the "comment karma", or number of votes an author has received for their comments, call `getCommentKarma(author)`.

See [`packages/contract`](./packages/contract/README.md) for details about the smart contract and support code.
See [`packages/webapp](./packages/webapp/README.md) for deatails about the user interface.


[src-forum-sol]: ./packages/contract/contracts/Forum.sol

[ipfs-docs-cid]: https://docs.ipfs.io/concepts/content-addressing/
