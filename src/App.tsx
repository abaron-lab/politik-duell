import { useState } from 'react'
import { Aufloesung } from './components/Aufloesung'
import { Ende } from './components/Ende'
import { MockHinweis } from './components/MockHinweis'
import { Punktestand } from './components/Punktestand'
import { Runde } from './components/Runde'
import { Setup } from './components/Setup'
import { Start } from './components/Start'
import { RUNDEN_GESAMT, type RundenErgebnis, type Spieler } from './spiel'

type Phase = 'start' | 'setup' | 'runde' | 'aufloesung' | 'ende'

export default function App() {
  const [phase, setPhase] = useState<Phase>('start')
  const [spieler, setSpieler] = useState<[Spieler, Spieler] | null>(null)
  const [runden, setRunden] = useState<RundenErgebnis[]>([])

  const aktuelleNr = runden.length + 1
  const sprecher: 0 | 1 = runden.length % 2 === 0 ? 0 : 1

  function neuesSpiel() {
    setSpieler(null)
    setRunden([])
    setPhase('setup')
  }

  return (
    <div className="app">
      <MockHinweis />
      {phase === 'start' && <Start onStart={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <Setup
          onFertig={(s) => {
            setSpieler(s)
            setPhase('runde')
          }}
        />
      )}
      {spieler && (phase === 'runde' || phase === 'aufloesung') && (
        <Punktestand spieler={spieler} runden={runden} aktuelleRunde={phase === 'aufloesung' ? runden.length : aktuelleNr} />
      )}
      {phase === 'runde' && spieler && (
        <Runde
          key={aktuelleNr}
          nr={aktuelleNr}
          sprecher={sprecher}
          spieler={spieler}
          onErgebnis={(r) => {
            setRunden((alt) => [...alt, r])
            setPhase('aufloesung')
          }}
        />
      )}
      {phase === 'aufloesung' && spieler && runden.length > 0 && (
        <Aufloesung
          runde={runden[runden.length - 1]}
          spieler={spieler}
          letzte={runden.length >= RUNDEN_GESAMT}
          onWeiter={() => setPhase(runden.length >= RUNDEN_GESAMT ? 'ende' : 'runde')}
        />
      )}
      {phase === 'ende' && spieler && <Ende spieler={spieler} runden={runden} onNeu={neuesSpiel} />}
    </div>
  )
}
