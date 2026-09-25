import { Transaction } from "@stellar/stellar-sdk";
import type { ReserveExpectations, ReserveRequest, QuotePayload } from "./types.js";
/**
 * Raised when the transaction the service built is not the one that was quoted
 * and approved.
 */
export declare class ReserveVerificationError extends Error {
    constructor(message: string);
}
/** Decimal token amount as a whole number of stroops. */
export declare function amountToStroops(amount: string): string;
/** Stroops as the decimal string Stellar operations carry. */
export declare function stroopsToAmount(stroops: number | string): string;
/**
 * Check that the quote answers the request that was actually made.
 *
 * Everything else in this module compares the built transaction against the
 * payload — that is, the service against itself, which a compromised service
 * satisfies trivially. This is the check that anchors the payload to something
 * the service did not choose.
 */
export declare function verifyQuote(payload: QuotePayload, request: ReserveRequest, expected?: ReserveExpectations): void;
/**
 * Check that a built transaction does exactly what was asked and charges no
 * more than the caller allowed.
 *
 * This is the check that makes a compromised service unable to move a user's
 * money: the wallet never signs bytes it has not re-derived itself. It only
 * holds if `request` carries the caller's own inputs. Passing it values read
 * back out of `payload` turns every comparison below into a tautology.
 */
export declare function verifyTransaction(xdrBase64: string, payload: QuotePayload, request: ReserveRequest, expected?: ReserveExpectations): Transaction;
