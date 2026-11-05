const FLAGS = { eighth: 1, sixteenth: 2, 'thirty-second': 3, 'sixty-fourth': 4 }

export function RhythmIcon({ rhythmId }) {
  const whole = rhythmId === 'whole'
  const hollow = whole || rhythmId === 'half'

  return (
    <svg className="rhythm-icon" viewBox="0 0 36 48" aria-hidden="true" focusable="false" fill="currentColor">
      {whole ? (
        <path fillRule="evenodd" d="M6 29a12 7 0 1 0 24 0 12 7 0 1 0-24 0Zm8-4c2-2 6-1 8 2s2 6 0 7-6 0-8-2-2-6 0-7Z" />
      ) : (
        <>
          <ellipse cx="12" cy="37" rx="6" ry="4" transform="rotate(-24 12 37)" fill={hollow ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth={hollow ? 2 : 1} />
          <path d="M17.5 35V6" fill="none" stroke="currentColor" strokeWidth="2" />
          {Array.from({ length: FLAGS[rhythmId] ?? 0 }, (_, flag) => (
            <path key={flag} d={`M18 ${6 + flag * 5}c1 5 13 6 9 17 1-8-8-8-9-11Z`} />
          ))}
        </>
      )}
    </svg>
  )
}
