import { type NetworkName } from "./networks.js";
import type { KnownToken, ReserveOp, Quote, QuotePayload, Signer, SubmitResult } from "./types.js";
export type { NetworkName } from "./networks.js";
export interface ReserveOptions {
    /** `testnet` or `mainnet`. Sets the hosted URL and pins the passphrase. */
    network?: NetworkName;
    /** Base URL of the service. Defaults to the hosted URL for `network`. */
    url?: string;
    /** Passed straight through to `fetch`; override for auth headers or proxies. */
    fetch?: typeof globalThis.fetch;
    headers?: Record<string, string>;
    /**
     * The network this client is for. When set, a quote for any other network is
     * refused. Worth setting: the passphrase is not carried inside a transaction
     * envelope, so the service picking a different one is otherwise silent.
     */
    networkPassphrase?: string;
    /**
     * The account expected to collect fees. When set, a quote paying anyone else
     * is refused. `Reserve.connect` pins this from `/health`.
     */
    sponsor?: string;
    /**
     * Horizon used by `pay` to see whether the destination can receive a Payment.
     * Defaults from `network` / the passphrase.
     */
    horizonUrl?: string;
}
export type QuoteArgs = {
    source: string;
    ops: ReserveOp[];
    feeToken?: string;
    /** Ceiling in the fee token's stroops. */
    maxSendStroops?: number | string;
    /** Ceiling as a decimal token amount (`"0.05"`). Ignored if `maxSendStroops` is set. */
    maxSend?: string;
};
export declare class ReserveError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(message: string, code: string, status: number);
}
/** Decode the quote payload the service sealed. */
export declare function readQuote(token: string): QuotePayload;
export declare class Reserve {
    private readonly url;
    private readonly doFetch;
    private readonly headers;
    private readonly expected;
    private readonly horizonUrl?;
    constructor(options: NetworkName | ReserveOptions);
    /**
     * Hosted client with the passphrase pinned and the sponsor taken from
     * `/health`. Stronger than `new Reserve("testnet")` alone: a quote that
     * pays anyone else is refused.
     */
    static connect(network?: NetworkName | ReserveOptions): Promise<Reserve>;
    private post;
    /**
     * Price a set of classic operations.
     *
     * `maxSend` / `maxSendStroops` is the most the caller is willing to let leave
     * the user's balance, in the fee token. It is required because nothing else
     * bounds the price: the fee payment is not one of `ops`, so a quote is
     * rejected here or not at all.
     */
    quote(request: QuoteArgs): Promise<Quote>;
    /**
     * Fetch the transaction for a quote **and verify it locally**.
     *
     * Never skip this by calling the endpoint directly: it is the only thing
     * standing between a wallet and blindly signing bytes a server chose.
     */
    build(quote: Quote): Promise<{
        xdr: string;
        networkPassphrase: string;
    }>;
    submit(quote: Quote, signedXdr: string): Promise<SubmitResult>;
    /** build → verify → sign → submit. Pass a quote, or the request to quote first. */
    send(quoteOrRequest: Quote | QuoteArgs, sign: Signer): Promise<SubmitResult>;
    /** One payment, fee taken in the same token. Leaves a claimable if the dest cannot receive yet. */
    pay(input: {
        source: string;
        destination: string;
        amount: string;
        token: string;
        maxSendStroops?: number | string;
        maxSend?: string;
    }, sign: Signer): Promise<SubmitResult>;
    /**
     * Whether `destination` can take a Payment of `asset` right now: the account
     * exists, and for a credit asset it has a live trustline.
     */
    destinationReady(destination: string, asset: string): Promise<boolean>;
    /**
     * Create the account, open the trustline, and claim in one transaction.
     * Someone else must have left a claimable balance first.
     */
    activate(input: {
        address: string;
        token: string;
        balanceId: string;
        maxSendStroops?: number | string;
        maxSend?: string;
    }, sign: Signer): Promise<SubmitResult>;
    /**
     * The assets this deployment accepts as payment, with what is known about
     * each issuer. An asset code is not an identity on Stellar — always show the
     * issuer or its domain to the user, never the code alone.
     */
    tokens(): Promise<{
        tokens: string[];
        known: KnownToken[];
    }>;
}
