import { Claimant, xdr } from "@stellar/stellar-sdk";
/**
 * Seconds after creation before the sender can reclaim an unclaimed balance.
 * Keep in sync with `RECLAIM_AFTER_SECONDS` in the Rust service.
 */
export declare const RECLAIM_AFTER_SECONDS: number;
export declare function reclaimPredicate(): xdr.ClaimPredicate;
/** Destination first in intent; stellar-core requires the pair sorted by account id. */
export declare function claimableClaimants(source: string, destination: string): Claimant[];
export declare function samePredicate(got: xdr.ClaimPredicate, want: xdr.ClaimPredicate): boolean;
