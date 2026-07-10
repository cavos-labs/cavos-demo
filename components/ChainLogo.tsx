import type { Chain } from '@/lib/chains';

// Official chain logos, sourced from cryptologos.cc (public, brand-correct SVGs):
//  - Solana:   https://cryptologos.cc/logos/solana-sol-logo.svg
//  - Stellar:  https://cryptologos.cc/logos/stellar-xlm-logo.svg
//  - Starknet: https://cryptologos.cc/logos/starknet-token-strk-logo.svg
//
// Inlined (not hotlinked) so the demo never depends on an external host, and
// the brand gradients/colors render exactly. Rendered via dangerouslySetInnerHTML
// to preserve the SVG markup (gradients, fill-rule) verbatim.

const LOGOS: Record<Chain, { viewBox: string; body: string }> = {
  solana: {
    viewBox: '0 0 397.7 311.7',
    body: `<defs>
      <linearGradient id="sol-g1" gradientUnits="userSpaceOnUse" x1="360.8791" y1="351.4553" x2="141.213" y2="-69.2936" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/>
      </linearGradient>
      <linearGradient id="sol-g2" gradientUnits="userSpaceOnUse" x1="264.8291" y1="401.6014" x2="45.163" y2="-19.1475" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/>
      </linearGradient>
      <linearGradient id="sol-g3" gradientUnits="userSpaceOnUse" x1="312.5484" y1="376.688" x2="92.8822" y2="-44.061" gradientTransform="matrix(1 0 0 -1 0 314)">
        <stop offset="0" stop-color="#00FFA3"/><stop offset="1" stop-color="#DC1FFF"/>
      </linearGradient>
    </defs>
    <path fill="url(#sol-g1)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
    <path fill="url(#sol-g2)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
    <path fill="url(#sol-g3)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>`,
  },
  stellar: {
    viewBox: '0 0 236.36 200',
    body: `<path fill="#08B5E5" d="M203,26.16l-28.46,14.5-137.43,70a82.49,82.49,0,0,1-.7-10.69A81.87,81.87,0,0,1,158.2,28.6l16.29-8.3,2.43-1.24A100,100,0,0,0,18.18,100q0,3.82.29,7.61a18.19,18.19,0,0,1-9.88,17.58L0,129.57V150l25.29-12.89,0,0,8.19-4.18,8.07-4.11v0L186.43,55l16.28-8.29,33.65-17.15V9.14Z"/>
    <path fill="#08B5E5" d="M236.36,50,49.78,145,33.5,153.31,0,170.38v20.41l33.27-16.95,28.46-14.5L199.3,89.24A83.45,83.45,0,0,1,200,100,81.87,81.87,0,0,1,78.09,171.36l-1,.53-17.66,9A100,100,0,0,0,218.18,100c0-2.57-.1-5.14-.29-7.68a18.2,18.2,0,0,1,9.87-17.58l8.6-4.38Z"/>`,
  },
  starknet: {
    viewBox: '0 0 158 158',
    body: `<path fill-rule="evenodd" clip-rule="evenodd" fill="#0C0C4F" d="M0,79c0,43.6,35.4,79,79,79c43.6,0,79-35.4,79-79c0-43.6-35.4-79-79-79C35.4,0,0,35.4,0,79z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" fill="#FAFAFA" d="M44.2,60.4l2-6c0.4-1.2,1.4-2.2,2.6-2.6l6.1-1.9c0.8-0.3,0.8-1.4,0-1.7l-6-2c-1.2-0.4-2.2-1.4-2.6-2.6l-1.9-6.1c-0.3-0.8-1.4-0.8-1.7,0l-2,6c-0.4,1.2-1.4,2.2-2.6,2.6L32,48.1c-0.8,0.3-0.8,1.4,0,1.7l6,2c1.2,0.4,2.2,1.4,2.6,2.6l1.9,6.1C42.7,61.2,43.9,61.2,44.2,60.4z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" fill="#EC796B" d="M139.8,56.9c-2.5-2.8-6.4-4.4-10.2-5c-3.8-0.6-7.8-0.6-11.6,0.1c-7.6,1.3-14.6,4.4-20.6,8.3c-3.1,1.9-5.8,4.1-8.6,6.4c-1.3,1.1-2.6,2.4-3.8,3.5l-3.5,3.4c-3.8,3.9-7.5,7.5-11.1,10.5c-3.6,3-7,5.2-10.3,6.8c-3.3,1.6-6.9,2.5-11.5,2.7c-4.6,0.2-10-0.7-15.8-2c-5.8-1.4-12-3.3-18.8-5c2.4,6.6,6,12.5,10.6,17.9c4.7,5.3,10.5,10.1,18,13.2c7.4,3.2,16.7,4.4,25.4,2.6c8.7-1.7,16.4-5.7,22.5-10.4c6.2-4.7,11.2-10.1,15.4-15.7c1.2-1.5,1.8-2.4,2.6-3.6l2.3-3.5c1.6-2.1,3.1-4.6,4.7-6.7c3.1-4.4,6.2-8.9,9.9-12.9c1.8-2.1,3.7-4.1,6-6c1.1-0.9,2.3-1.8,3.7-2.7C136.6,58.1,138.1,57.4,139.8,56.9z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" fill="#FAFAFA" d="M139.8,56.9c-2.7-6.8-7.7-12.5-14.4-16.7c-6.6-4.2-15.9-6.3-25-4.5c-4.5,0.9-8.9,2.6-12.7,4.8c-3.8,2.2-7.3,4.9-10.2,7.8c-1.5,1.4-2.8,3-4.2,4.5l-3.5,4.4l-5.3,7.1c-6.8,9.1-14.2,19.9-26.2,23c-11.8,3.1-17,0.4-24.2-0.8c1.3,3.4,3,6.7,5.2,9.6c2.2,3,4.7,5.8,7.9,8.2c1.6,1.1,3.3,2.3,5.2,3.2c1.9,0.9,3.9,1.7,6.1,2.4c4.3,1.2,9.2,1.6,13.9,1c4.7-0.6,9.2-2.1,13.1-4.1c4-2,7.4-4.4,10.5-6.9c6.1-5.1,10.9-10.7,14.9-16.4c2-2.8,3.9-5.7,5.6-8.6l2-3.4c0.6-1,1.2-2,1.9-3c2.5-3.8,5-6.8,8-9.1c3-2.3,7.1-4.1,12.6-4.5C126.5,54.6,132.9,55.3,139.8,56.9z"/>
    <path fill-rule="evenodd" clip-rule="evenodd" fill="#EC796B" d="M110.1,113.1c0,5,4,9,9,9c5,0,9-4,9-9c0-5-4-9-9-9C114.1,104.1,110.1,108.1,110.1,113.1z"/>`,
  },
};

export function ChainLogo({ chain, size = 18, className }: { chain: Chain; size?: number; className?: string }) {
  const logo = LOGOS[chain];
  return (
    <svg
      width={size}
      height={size}
      viewBox={logo.viewBox}
      className={className}
      role="img"
      aria-label={chain}
      dangerouslySetInnerHTML={{ __html: logo.body }}
    />
  );
}
