# Web3.Storage Forum dApp example

This repository contains an example of a decentralized application that uses [Web3.Storage](https://web3.storage) and [Ethereum](https://ethereum.org) to provide a simple online forum. 

All post and comment content is stored on Filecoin and IPFS, while all ids and votes are stored on the Ethereum blockchain.

![An animation showing a user posting a comment and a new post on the decentralized forum app.](./img/w3news.gif)

## Install / Run

There's no long-lived deployment of the app yet, so you'll need to run in local development mode.

You'll need a recent version of Node.js and npm version 7 or greater.

1. Clone this repo:

   ```bash
   git clone https://github.com/web3-storage/example-forum-dapp
   ```

2. Install dependencies:

  ```bash
  npm install
  ```

3. Run local blockchain and webapp server:

  ```
  npm run dev
  ```

Leave the last command running and open your browser to [http://localhost:3000](http://localhost:3000).

### Setting up MetaMask

To interact with the app, you'll need an Ethereum wallet like [MetaMask](https://metamask.io) installed.
You'll also need to configure MetaMask to use the local HardHat development network. 

To do that, open the MetaMask extension and go to `Settings -> Network -> Localhost 8545` and change the Chain ID input to `31337`.

**Important**: if you've made any write transactions, the next time you restart the local blockchain you'll get an error about an incorrect nonce if you try to make a transaction on the new chain. This is because MetaMask still remembers the state of the old blockchain instance. To fix this, open MetaMask and go to `Settings -> Advanced -> Reset Account` and press the `Reset Account` button. This will not mess with your balances or any important state - it just clears out the stale history.

### Getting play money

When running in local development mode, there will be a `faucet` link in the header of the app. Click the link to have a small amount of devnet ETH deposited into your MetaMask wallet. You'll need to do this before performing any write operations (e.g. posting, commenting, voting, etc).

## App overview

The app consists of a smart contract and supporting TypeScript code for interacting with the blockchain, along with a single-page web app, written in React.

At a high level, the app works like this:

A [`Forum` smart contract][src-forum-sol] is deployed to an Ethereum network, which allows creating posts, commenting on them, and voting on posts and comments.

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

See [`packages/contract`](./packages/contract/README.md) for details about the smart contract.
See [`packages/webapp](./packages/webapp/README.md) for deatails about the user interface.


[src-forum-sol]: ./packages/contract/contracts/Forum.sol

[ipfs-docs-cid]: https://docs.ipfs.io/concepts/content-addressing/
