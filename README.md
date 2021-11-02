# Web3.Storage Forum dApp example

This repository contains an example of a decentralized application that uses [Web3.Storage](https://web3.storage) and [Ethereum](https://ethereum.org) to provide a simple online forum. 

All post and comment content is stored on Filecoin and IPFS, while all ids and votes are stored in an Ethereum smart contract.

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

### Items

Posts and comments are represented internally as `Item` structs:

```solidity
  /**
    * @notice Represents a single forum post or comment. 
    */
  struct Item {
    /// @notice what kind of item (post or comment)
    ItemKind kind;

    /// @notice Unique item id, assigned at creation time.
    uint256 id;

    /// @notice Id of parent item. Posts have parentId == 0.
    uint256 parentId;

    /// @notice address of author.
    address author;

    /// @notice block number when item was submitted
    uint256 createdAtBlock;

    /// @notice ids of all child items, with oldest items at front.
    uint256[] childIds;

    /// @notice IPFS CID of item content.
    string contentCID;
  }
```

Each `Item` has a `kind` field that can be either `ItemKind.POST` or `ItemKind.COMMENT`. Comments link to their parent post (or comment) using the `parentId` field, and parents keep a list of their children in the `childIds` field. When a new child commment is added, the parent's `childIds` is updated to include the new child.

The content of the post or comment is stored as a JSON file in IPFS and Filecoin using [Web3.Storage](https://web3.storage), and the file's CID is stored in the `contentCID` field.

You can retrieve a comment or post with the `getItem` contract function, passing in the item's id. You then need to fetch the content from IPFS and parse the JSON in order to render the complete item.

### Voting

Anyone can vote on a comment or post by calling either `voteForItem(itemId, voteValue)`  where `voteValue` is `-1` for a downvote, `+1` for an upvote, or `0` to retract a previous vote.

Each account can only vote once for each post or comment - subequent votes replace the previous vote from that account.

You can retrive the vote total for a post or comment with `getItemScore(itemId)`, which returns the sum of all up and downvotes.

To get the "karma" or number of votes an author has recieved for their posts and comments, call `getAuthorKarma(author)`, passing in the author's address.


See [`packages/contract`](./packages/contract/README.md) for details about the smart contract.
See [`packages/webapp`](./packages/webapp/README.md) for details about the user interface.


[src-forum-sol]: ./packages/contract/contracts/Forum.sol

[ipfs-docs-cid]: https://docs.ipfs.io/concepts/content-addressing/
