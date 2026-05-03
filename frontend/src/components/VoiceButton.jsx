import { useCallback, useEffect, useRef, useState } from "react"

function getRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  return SR ? new SR() : null
}

/**
 * Urdu-first voice input (Web Speech API). Browser support varies; Chrome usually works.
 */
export default function VoiceButton({ onTranscript, disabled }) {
  const [supported, setSupported] = useState(true)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  useEffect(() => {
    setSupported(!!getRecognition())
  }, [])

  const stop = useCallback(() => {
    const r = recRef.current
    if (r) {
      try {
        r.stop()
      } catch {
        /* ignore */
      }
    }
    recRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (disabled || !supported) return
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return

    const rec = new Recognition()
    rec.lang = "ur-PK"
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (ev) => {
      const text = ev.results[0]?.[0]?.transcript?.trim() || ""
      if (text) onTranscript(text)
    }
    rec.onerror = () => stop()
    rec.onend = () => setListening(false)
    recRef.current = rec
    setListening(true)
    try {
      rec.start()
    } catch {
      setListening(false)
    }
  }, [disabled, onTranscript, supported, stop])

  useEffect(() => () => stop(), [stop])

  if (!supported) {
    return (
      <span className="voice-hint" title="Try Chrome desktop for microphone input.">
        Voice unavailable
      </span>
    )
  }

  return (
    <button
      type="button"
      className={`voice-btn ${listening ? "voice-btn--on" : ""}`}
      onClick={listening ? stop : start}
      disabled={disabled}
      title="Speak in Urdu (ur-PK)"
    >
      {listening ? "Stop" : "Voice"}
      <style>{`
        .voice-btn {
          min-height: 48px;
          padding: 0.55rem 1.05rem;
          border-radius: var(--radius);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          font-family: inherit;
          font-size: 0.875rem;
        }
        .voice-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .voice-btn--on {
          background: var(--risk-high-bg);
          border-color: var(--risk-high);
          color: var(--risk-high);
        }
        .voice-hint {
          font-size: 0.8rem;
          color: var(--color-muted);
        }
      `}</style>
    </button>
  )
}
