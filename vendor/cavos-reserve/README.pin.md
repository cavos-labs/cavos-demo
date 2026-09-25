# @cavos/reserve (git pin)

Temporary pin of https://github.com/cavos-labs/reserve `sdk/ts` until npm publishes a release that includes `destinationReady` (and claimable-for-unready `pay`).

- Commit: see `.git-commit` (currently `9fb7066` / main after PR #2 *send-unready-destinations*)
- Built with `npm run build` in `sdk/ts`; only `package.json`, `dist/`, and `README.md` are vendored

Refresh:

```bash
./scripts/pin-reserve-from-git.sh
npm install
```

Remove this pin and bump to the published version once Cavos cuts a new `@cavos/reserve` on npm.
