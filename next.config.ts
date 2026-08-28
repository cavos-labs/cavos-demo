import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next refuses dev requests whose Host is not localhost, so a tunnelled
  // origin is rejected until it is named here. Only affects `next dev`;
  // production serves whatever host it is deployed under.
  //
  // Quick Cloudflare tunnels mint a new subdomain per run, so this is a
  // wildcard rather than one hostname that goes stale on the next restart.
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
