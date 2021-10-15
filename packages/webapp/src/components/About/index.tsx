import Layout from "../Layout"

export default function About() {
    return (
        <Layout>
                <div>
                <h3>About this app</h3>

                <p>
                This app was built to demonstrate how to build a full-stack decentralized application
                with Ethereum, IPFS and Filecoin.
                </p>

                <p>
                Posts and comments are stored in Filecoin and made available via IPFS using the 
                free <a href='https://web3.storage'>Web3.Storage</a> service.
                </p>

                <p>
                Check out the <a href='https://github.com/web3-storage/example-forum-dapp'>source code</a> to see how it works!
                </p>
            </div>
        </Layout>
    )
}