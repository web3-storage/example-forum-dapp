
export function accountDisplayName(account: string|undefined) {
    if (!account) {
        return
    }
    return account.substring(0, 6) + '...' + account.substring(account.length - 4)
}