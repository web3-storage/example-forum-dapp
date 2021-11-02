# Forum dApp user interface

This directory contains a single-page React app that displays a decentralized Forum, pulling forum state from a blockchain smart contract and post and comment content from IPFS and Filecoin.

## Usage

See the [main repository readme](../../README.md) for instructions on running in local development mode from the repo root. This will also start the local development blockchain, deploy the contract, and write the deployment information into `./src/contracts/hardhat_contracts.json` in this package.

If you have a reason to run this package independently, you can install the dependencies with `npm install` and run `npm run dev` in this directory. 

**Important**: the app will fail to launch unless the file `./src/contracts/hardhat_contracts.json` exists. This is created by the `npm run deploy` action in the [contract package](../contract), which will run automatically when running `npm run dev` from the repo root. If you've customized the deployment setup, you may need to provide this file yourself.

## Code Overview

Broadly speaking, the code is organized into three main areas of responsibility.

- [`./src/chain`](./src/chain) contains code related to connecting to the deployed smart contract using
an Ethereum provider. See [Ethereum interactions](#ethereum-interactions) below for details.
- [`./src/api`](./src/api) contains a [high-level forum API](#forum-api) for interacting with the Forum. This wraps the "raw" smart contract API to hide some of the Ethereum-specific details, and it also integrates off-chain storage of post and comment content using the [Web3.Storage client][web3-storage-client].
- [`./src/components`](./src/components) contains the [user interface](#user-interface) components, routing logic, and other "front end" things.

### Ethereum interactions

The app uses the [ethers.js][ethers-docs] library for connecting to and interacting with the [smart contract][forum-contract-source].

To integrate with the React lifecycle, the [web3-react][web3-react] library provides a [Context][react-context-docs]-based API that can integrate with browser wallets like [MetaMask](https://metamask.io), as well as JSON-RPC based nodes. 

To provide a better experience for logged out users, the app uses two Ethereum providers. The "read-only" provider uses a JSON-RPC connection to a remote node (or local development node). This provider is used for all read-only contract calls, since they don't require payment or any user interaction.

To log in to the app, the user connects their MetaMask wallet, which enables web3-react's "injected" provider. The `ForumAPI` uses this "authorized" provider to connect to the contract in read/write mode.

These two providers are managed in [`./src/chain/context.tsx`](./src/chain/context.tsx), which defines a custom context called `ChainContext`:

```typescript
interface ChainContextInterface {
    readonly: Web3ReactContextInterface<Web3Provider>,
    authorized: Web3ReactContextInterface<Web3Provider>,

    loggedIn: boolean,
    account: string | null | undefined,

    readonlyContract: ForumContract | undefined,
    authorizedContract: ForumContract | undefined,
}
```

This can be used from any React component with the `useChainContext` hook. Most components will likely only need the `loggedIn` and `account` context fields. The `readonlyContract` and `authorizedContract` fields are consumed by another custom Context provider, described below in the [Forum API section below](#forum-api).


### Forum API

The `ForumAPI` class defined in [`./src/api/forum.ts`](./src/api/forum.ts) provides a high-level interface to the [smart contract][forum-contract-source] and off-chain decentralized storage.

The `ForumAPI` uses the `readonlyContract` and `authorizedContract` defined in the `ChainContext` [described above](#ethereum-interactions). The read only contract is required in order to construct a `ForumAPI` instance, but you can omit the `authorizedContract` if the user hasn't logged in yet. If there's no `authorizedContract`, attempting to vote or submit posts or comments will result in an error.

Submitting a post or comment will store the content of the item using Web3.Storage, making it available on [IPFS](https://ipfs.io) with long-term backing by [Filecoin](https://filecoin.io). Once the content has been stored, the Content Identifier (CID) is stored on-chain using the `addPost` or `addComment` smart contract functions.

In practice, you probably won't need to create a `ForumAPI` instance yourself. Instead, use the `useApiContext` hook defined in [`./src/api/context.tsx`](./src/api/context.tsx):

```typescript
function MyComponent() {
  const { api } = useApiContext()

  if (!api) {
    // api will be undefined until the read-only connection to the contract is established
    return <LoadingSpinner />
  }

  if (api.canPost) {
    // show post ui...
  }
}
```

The `useApiContext` hook will update when the `ChainContext` changes. Before the read-only connection is made, `api` will be undefined, so make sure to check before using it! You should also check the `canVote` and `canPost` properties before invoking the vote or post methods. These will be updated when the user connects their wallet.


#### Managing Web3.Storage API tokens

To avoid hard-coding an API token into the front end, the dApp requires each user to provide their own Web3.Storage API token before they can submit posts or comments. Attempting to post without a token will redirect to the `/account` page defined by the [`AccountSettings` component](./src/components/AccountSettings/index.tsx). Adding a token in the settings page will persist it to the browser's `localStorage`. 

If an API token is avaliable in `localStorage`, the `ForumAPI` instance returned by the `useApiContext` hook will support posting, and `api.canPost` will be `true`.

Note that requiring the user to supply their own key will not be necessary once the Web3.Storage service supports public key authentication, as described in [this issue](https://github.com/web3-storage/web3.storage/issues/577). This example will be updated to support public key authentication once that functionality has been implemented. 

### User Interface

The UI code lives in [`./src/components`](./src/components). The [`App` component](./src/components/App/index.tsx) is the main "entry point". It defines the routes using [React Router](https://reactrouter.com) and wires up the various context providers.

The main feed UI component is the [`PostList`](./src/components/PostList/index.tsx), which renders an [`ItemSummary`](./src/components/ItemSummary/index.tsx) that links to an [`ItemDetails` page](./src/components/ItemDetails/index.tsx) for each post.

The [`Header` component](./src/components/Header/index.tsx) shows some details about the logged-in account, or a login link if no wallet is connected.

Interactions with the API are managed using [react-query][react-query], which provides a unified querying layer with built-in caching for any asynchronous data source. Query keys and hooks for "mutations" are defined in [`./src/api/queries.ts`](./src/api/queries.ts). 

See the [React Query docs](https://react-query.tanstack.com/overview) if you're new to React Query. The [Practical React Query blog](https://tkdodo.eu/blog/practical-react-query) is another good resource, particularly [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys), which informed the design of the query keys in this app.

[forum-contract-source]: ../contract/contracts/Forum.sol
[web3-storage-client]: https://docs.web3.storage/reference/client-library/

[ethers-docs]: https://docs.ethers.io/v5/
[ethers-contract-docs]: https://docs.ethers.io/v5/api/contract/
[web3-react]: https://github.com/NoahZinsmeister/web3-react
[react-context-docs]: https://reactjs.org/docs/context.html
[react-query]: https://react-query.tanstack.com
