/** Well-known Stellar passphrases. Kept here so the happy path does not import the SDK. */
export const TESTNET = "Test SDF Network ; September 2015";
export const PUBLIC = "Public Global Stellar Network ; September 2015";
export const HOSTED = {
    testnet: {
        url: "https://reserve.cavos.xyz/testnet",
        networkPassphrase: TESTNET,
        horizonUrl: "https://horizon-testnet.stellar.org",
    },
    mainnet: {
        url: "https://reserve.cavos.xyz/mainnet",
        networkPassphrase: PUBLIC,
        horizonUrl: "https://horizon.stellar.org",
    },
};
export function passphraseOf(network) {
    return HOSTED[network].networkPassphrase;
}
export function networkOfPassphrase(passphrase) {
    if (passphrase === TESTNET)
        return "testnet";
    if (passphrase === PUBLIC)
        return "mainnet";
    return undefined;
}
export function networkFromUrl(url) {
    try {
        const path = new URL(url).pathname.replace(/\/+$/, "");
        if (path.endsWith("/mainnet"))
            return "mainnet";
        if (path.endsWith("/testnet"))
            return "testnet";
    }
    catch {
        // Not a URL. Ignore.
    }
    return undefined;
}
export function horizonUrlOf(network) {
    return HOSTED[network].horizonUrl;
}
