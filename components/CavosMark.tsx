export function CavosMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size * (82 / 66)} viewBox="0 0 66 82" fill="currentColor" aria-label="Cavos" role="img">
      <g transform="translate(0,82) scale(0.1,-0.1)">
        <path d="M148 630 l-148 -185 68 -3 c193 -9 236 39 230 264 l-3 108 -147 -184z M360 705 c1 -225 37 -269 217 -263 l83 3 -136 170 c-74 94 -142 177 -150 185 -12 12 -14 0 -14 -95z M125 223 c69 -87 136 -171 150 -188 l26 -30 -4 135 c-6 212 -29 240 -201 240 l-96 0 125 -157z M433 364 c-53 -26 -67 -70 -71 -224 -3 -118 -2 -133 11 -120 8 8 76 93 151 188 l136 172 -97 0 c-68 0 -108 -5 -130 -16z" />
      </g>
    </svg>
  );
}
