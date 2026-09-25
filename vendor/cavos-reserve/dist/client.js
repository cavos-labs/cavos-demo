import { amountToStroops, verifyQuote, verifyTransaction, ReserveVerificationError } from "./verify.js";
import { HOSTED, horizonUrlOf, networkFromUrl, passphraseOf, TESTNET, PUBLIC } from "./networks.js";
export class ReserveError extends Error {
    code;
    status;
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = "ReserveError";
    }
}
/** Decode the quote payload the service sealed. */
export function readQuote(token) {
    const [payload] = token.split(".");
    if (!payload)
        throw new ReserveVerificationError("the quote is malformed");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
}
function resolve(input) {
    if (input === "testnet" || input === "mainnet") {
        return { ...HOSTED[input], network: input };
    }
    const network = input.network ?? networkFromUrl(input.url ?? "") ?? undefined;
    const url = input.url?.replace(/\/$/, "") ?? (network ? HOSTED[network].url : undefined);
    if (!url) {
        throw new ReserveError("pass a network (\"testnet\" or \"mainnet\") or a url", "invalid_request", 0);
    }
    const networkPassphrase = input.networkPassphrase ?? (network ? passphraseOf(network) : undefined);
    const horizonUrl = input.horizonUrl?.replace(/\/$/, "") ??
        (network
            ? horizonUrlOf(network)
            : networkPassphrase === TESTNET
                ? horizonUrlOf("testnet")
                : networkPassphrase === PUBLIC
                    ? horizonUrlOf("mainnet")
                    : undefined);
    return { ...input, url, network, networkPassphrase, horizonUrl };
}
function ceiling(request) {
    if (request.maxSendStroops !== undefined)
        return request.maxSendStroops;
    if (request.maxSend !== undefined)
        return amountToStroops(request.maxSend);
    throw new ReserveError("maxSend (token amount) or maxSendStroops is required", "invalid_request", 0);
}
function isQuote(value) {
    return typeof value.token === "string" && value.request !== undefined;
}
export class Reserve {
    url;
    doFetch;
    headers;
    expected;
    horizonUrl;
    constructor(options) {
        const resolved = resolve(options);
        this.url = resolved.url;
        this.doFetch = resolved.fetch ?? globalThis.fetch.bind(globalThis);
        this.headers = resolved.headers ?? {};
        this.horizonUrl = resolved.horizonUrl;
        this.expected = {
            ...(resolved.networkPassphrase !== undefined
                ? { networkPassphrase: resolved.networkPassphrase }
                : {}),
            ...(resolved.sponsor !== undefined ? { sponsor: resolved.sponsor } : {}),
        };
    }
    /**
     * Hosted client with the passphrase pinned and the sponsor taken from
     * `/health`. Stronger than `new Reserve("testnet")` alone: a quote that
     * pays anyone else is refused.
     */
    static async connect(network = "testnet") {
        const resolved = resolve(network);
        const doFetch = resolved.fetch ?? globalThis.fetch.bind(globalThis);
        const res = await doFetch(`${resolved.url}/health`, {
            headers: resolved.headers,
        });
        const health = (await res.json());
        return new Reserve({
            ...resolved,
            sponsor: resolved.sponsor ?? health.sponsor,
            networkPassphrase: resolved.networkPassphrase ?? health.network,
        });
    }
    async post(path, body) {
        const res = await this.doFetch(`${this.url}${path}`, {
            method: "POST",
            headers: { "content-type": "application/json", ...this.headers },
            body: JSON.stringify(body),
        });
        const text = await res.text();
        if (!res.ok) {
            let code = "http_error";
            let message = text;
            try {
                const parsed = JSON.parse(text);
                code = parsed.error ?? code;
                message = parsed.message ?? message;
            }
            catch {
                // Not JSON; the raw body is the best error we have.
            }
            throw new ReserveError(message, code, res.status);
        }
        return JSON.parse(text);
    }
    /**
     * Price a set of classic operations.
     *
     * `maxSend` / `maxSendStroops` is the most the caller is willing to let leave
     * the user's balance, in the fee token. It is required because nothing else
     * bounds the price: the fee payment is not one of `ops`, so a quote is
     * rejected here or not at all.
     */
    async quote(request) {
        const feeToken = request.feeToken ?? "native";
        const maxSendStroops = ceiling(request);
        const asked = {
            source: request.source,
            feeToken,
            maxSendStroops,
            ops: request.ops,
        };
        const res = await this.post("/v1/quote", {
            source: request.source,
            fee_token: feeToken,
            ops: request.ops,
        });
        const payload = readQuote(res.quote);
        // Fail here rather than at signing time: the caller can show a price only
        // once it is known to be a price for what they asked.
        verifyQuote(payload, asked, this.expected);
        return {
            token: res.quote,
            payload,
            request: asked,
            mode: res.mode,
            chargeStroops: res.charge_stroops,
            sendMaxStroops: res.send_max_stroops,
            reserveStroops: res.reserve_stroops,
            slippageBps: res.slippage_bps,
            createsAccount: res.creates_account,
            expiresAtLedger: res.expires_at_ledger,
        };
    }
    /**
     * Fetch the transaction for a quote **and verify it locally**.
     *
     * Never skip this by calling the endpoint directly: it is the only thing
     * standing between a wallet and blindly signing bytes a server chose.
     */
    async build(quote) {
        const res = await this.post("/v1/build", { quote: quote.token });
        // Against `quote.request` — the caller's own words. Reading these out of
        // `quote.payload` instead would compare the service against itself.
        verifyTransaction(res.xdr, quote.payload, quote.request, this.expected);
        // The wallet signs with this passphrase, and it is not covered by the XDR.
        if (res.network_passphrase !== quote.payload.network) {
            throw new ReserveVerificationError(`asked to sign for "${res.network_passphrase}" but the quote is for "${quote.payload.network}"`);
        }
        return { xdr: res.xdr, networkPassphrase: res.network_passphrase };
    }
    async submit(quote, signedXdr) {
        const res = await this.post("/v1/submit", {
            quote: quote.token,
            signed_xdr: signedXdr,
        });
        return { hash: res.hash, ledger: res.ledger };
    }
    /** build → verify → sign → submit. Pass a quote, or the request to quote first. */
    async send(quoteOrRequest, sign) {
        const quote = isQuote(quoteOrRequest) ? quoteOrRequest : await this.quote(quoteOrRequest);
        const { xdr, networkPassphrase } = await this.build(quote);
        const signed = await sign(xdr, { networkPassphrase });
        return this.submit(quote, signed);
    }
    /** One payment, fee taken in the same token. Leaves a claimable if the dest cannot receive yet. */
    async pay(input, sign) {
        if (input.source === input.destination) {
            throw new ReserveError("cannot leave a claimable balance for yourself", "invalid_request", 0);
        }
        const ready = await this.destinationReady(input.destination, input.token);
        return this.send({
            source: input.source,
            feeToken: input.token,
            maxSendStroops: input.maxSendStroops,
            maxSend: input.maxSend,
            ops: ready
                ? [
                    {
                        type: "payment",
                        destination: input.destination,
                        asset: input.token,
                        amount: input.amount,
                    },
                ]
                : [
                    {
                        type: "create_claimable_balance",
                        destination: input.destination,
                        asset: input.token,
                        amount: input.amount,
                    },
                ],
        }, sign);
    }
    /**
     * Whether `destination` can take a Payment of `asset` right now: the account
     * exists, and for a credit asset it has a live trustline.
     */
    async destinationReady(destination, asset) {
        if (!this.horizonUrl) {
            throw new ReserveError("pass a network so pay() can see whether the destination is ready", "invalid_request", 0);
        }
        const res = await this.doFetch(`${this.horizonUrl}/accounts/${destination}`, {
            headers: this.headers,
        });
        if (res.status === 404)
            return false;
        if (!res.ok) {
            throw new ReserveError(`horizon could not load ${destination} (${res.status})`, "horizon_error", res.status);
        }
        if (asset === "native")
            return true;
        const [code, issuer] = asset.split(":");
        const account = (await res.json());
        return account.balances.some((line) => {
            if (line.asset_code !== code || line.asset_issuer !== issuer)
                return false;
            if (line.is_authorized === false)
                return false;
            if (line.limit === "0" || line.limit === "0.0000000")
                return false;
            return true;
        });
    }
    /**
     * Create the account, open the trustline, and claim in one transaction.
     * Someone else must have left a claimable balance first.
     */
    async activate(input, sign) {
        return this.send({
            source: input.address,
            feeToken: input.token,
            maxSendStroops: input.maxSendStroops,
            maxSend: input.maxSend,
            ops: [
                { type: "create_account", destination: input.address },
                { type: "change_trust", asset: input.token },
                { type: "claim_balance", balance_id: input.balanceId },
            ],
        }, sign);
    }
    /**
     * The assets this deployment accepts as payment, with what is known about
     * each issuer. An asset code is not an identity on Stellar — always show the
     * issuer or its domain to the user, never the code alone.
     */
    async tokens() {
        const res = await this.doFetch(`${this.url}/v1/tokens`, { headers: this.headers });
        return (await res.json());
    }
}
