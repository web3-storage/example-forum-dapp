import { Web3Storage } from 'web3.storage'

export function getStorageClient() {
    // FIXME: vite bakes env variables into the bundle - don't do that!
    // we should have each user paste in a token when logging in

    const token = import.meta.env.VITE_WEB3STORAGE_TOKEN as string | undefined
    if (!token) {
        throw new Error('No access token found for web3.storage')
    }
    return new Web3Storage({ token })
}
