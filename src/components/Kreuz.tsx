/**
 * Kreis mit handgezogenem Kreuz – wie auf dem Stimmzettel. Das Kreuz erscheint,
 * sobald ein Elternelement `.gewaehlt` ist bzw. ein vorangehendes Kontrollkästchen
 * angehakt ist (Styling in index.css), und wird dabei „gezeichnet“.
 */
export function Kreuzfeld() {
  return (
    <svg className="kreuzfeld" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="15" />
      <Kreuzstriche />
    </svg>
  )
}

/** Nur das Kreuz, etwa als Stempel auf der Gewinnerkarte. */
export function Kreuz({ className = 'kreuz-stempel' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <Kreuzstriche />
    </svg>
  )
}

function Kreuzstriche() {
  return (
    <g className="kreuz">
      <path pathLength={1} d="M8.6 10.4c5.2 4.4 12.6 12.8 23 21.2" />
      <path pathLength={1} d="M31.8 7.8c-5.8 6.4-13.6 15.4-21.4 24.6" />
    </g>
  )
}
