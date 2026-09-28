/** Eigenes Logo: Paket mit Häkchen – „geliefert“. */
export function Logo({ groesse = 64 }: { groesse?: number }) {
  return (
    <svg width={groesse} height={groesse} viewBox="0 0 64 64" aria-hidden="true" className="logo">
      <rect x="6" y="14" width="52" height="42" rx="10" fill="var(--akzent)" />
      <path d="M6 26h52" stroke="var(--text)" strokeWidth="3" opacity="0.35" />
      <rect x="26" y="8" width="12" height="18" rx="3" fill="var(--akzent-2)" />
      <path d="M20 40l8 8 16-17" fill="none" stroke="var(--text)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
