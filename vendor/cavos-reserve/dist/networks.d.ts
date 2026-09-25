/** Well-known Stellar passphrases. Kept here so the happy path does not import the SDK. */
export declare const TESTNET = "Test SDF Network ; September 2015";
export declare const PUBLIC = "Public Global Stellar Network ; September 2015";
export type NetworkName = "testnet" | "mainnet";
export declare const HOSTED: {
    readonly testnet: {
        readonly url: "https://reserve.cavos.xyz/testnet";
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly horizonUrl: "https://horizon-testnet.stellar.org";
    };
    readonly mainnet: {
        readonly url: "https://reserve.cavos.xyz/mainnet";
        readonly networkPassphrase: "Public Global Stellar Network ; September 2015";
        readonly horizonUrl: "https://horizon.stellar.org";
    };
};
export declare function passphraseOf(network: NetworkName): string;
export declare function networkOfPassphrase(passphrase: string): NetworkName | undefined;
export declare function networkFromUrl(url: string): NetworkName | undefined;
export declare function horizonUrlOf(network: NetworkName): string;
