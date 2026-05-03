import { useCallback, useState, useRef, useEffect } from "react"
import AnimatedGhostPrompt from "./AnimatedGhostPrompt.jsx"
import { chatUrl } from "../api.js"
import { mergeApiDisplayResult } from "../utils/clinicalMerge.js"

const MAX_CHARS = 500
const IDLE_MS = 3000

export default function ChatWindow({ onResult, onAnalyzingChange, clearToken = 0, disabled: parentDisabled }) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [micTip, setMicTip] = useState(false)
  const [idleShine, setIdleShine] = useState(false)
  const taRef = useRef(null)
  const lastInteract = useRef(Date.now())

  const disabled = parentDisabled || loading
  const showGhost = !text.trim() && !disabled
  const ctaEnabled = !disabled && !!text.trim()

  const bumpInteract = useCallback(() => {
    lastInteract.current = Date.now()
  }, [])

  useEffect(() => {
    if (clearToken) setText("")
  }, [clearToken])

  useEffect(() => {
    if (!ctaEnabled || loading) return
    const id = window.setInterval(() => {
      if (Date.now() - lastInteract.current < IDLE_MS) return
      setIdleShine(true)
      window.setTimeout(() => setIdleShine(false), 700)
      lastInteract.current = Date.now()
    }, 450)
    return () => window.clearInterval(id)
  }, [ctaEnabled, loading])

  const autosize = useCallback(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.max(140, el.scrollHeight)}px`
  }, [])

  useEffect(() => {
    autosize()
  }, [text, autosize])

  const send = useCallback(async () => {
    const user_input = text.trim()
    if (!user_input) return
    bumpInteract()
    setError(null)
    setLoading(true)
    onAnalyzingChange?.(true)
    onResult?.(null)
    try {
      const url = chatUrl()
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || res.statusText || `HTTP ${res.status}`)
      }
      console.log("API Response:", data)
      onResult?.(mergeApiDisplayResult(data))
    } catch (e) {
      setError(e.message || "Request failed")
      onResult?.(null)
    } finally {
      setLoading(false)
      onAnalyzingChange?.(false)
    }
  }, [text, onResult, onAnalyzingChange, bumpInteract])

  function onMicTap(e) {
    e.preventDefault()
    bumpInteract()
    setMicTip(true)
    window.setTimeout(() => setMicTip(false), 2500)
  }

  function onChangeText(e) {
    bumpInteract()
    const next = e.target.value.slice(0, MAX_CHARS)
    setText(next)
    requestAnimationFrame(autosize)
  }

  return (
    <div className="cw" onPointerDown={bumpInteract}>
      <div className="cw__card">
        <label className="cw__lab-row" htmlFor="lhw-input">
          <span className="cw__lab-accent" aria-hidden />
          <span className="cw__lab">Describe the case</span>
        </label>
        <div className="cw__shell">
          <textarea
            ref={taRef}
            id="lhw-input"
            className="cw__textarea"
            rows={4}
            value={text}
            onChange={onChangeText}
            onFocus={bumpInteract}
            placeholder=""
            aria-label="Case narrative"
            disabled={disabled}
            spellCheck
          />
          <AnimatedGhostPrompt show={showGhost} />
          <div className="cw__bar">
            <span className="cw__count" aria-live="polite">
              {text.length} / {MAX_CHARS}
            </span>
            <div className="cw__mic-wrap">
              {micTip && (
                <div className="cw__tooltip" role="tooltip">
                  Voice input coming soon
                </div>
              )}
              <button type="button" className="cw__mic" onClick={onMicTap} aria-label="Voice input coming soon">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M6 11a6 6 0 012-4.472V17.47A6 6 0 006 17"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                  <path d="M5 13v2a7 7 0 007 7 7 7 0 007-7v-2M12 22v4" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="cw__cta-row">
          <button
            type="button"
            className={`cw__cta cw__cta--shine ${loading ? "cw__cta--loading" : ""} ${idleShine && ctaEnabled && !loading ? "cw__cta--idle-sweep" : ""}`}
            disabled={disabled || !text.trim()}
            onPointerDown={(e) => e.button === 0 && bumpInteract()}
            onClick={send}
          >
            {loading ? (
              <span className="cw__cta-inner">
                <span className="cw__spin" aria-hidden />
                Analysing case...
              </span>
            ) : (
              <span className="cw__cta-inner">
                Assess Case <span className="cw__arr">→</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {error && <p className="cw__err">{error}</p>}

      <style>{`
        .cw {
          width: 100%;
          padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        }
        .cw__card {
          background: var(--surface);
          border-radius: var(--radius-lg, 20px);
          border: 0.5px solid #b8dcd4;
          padding: 20px;
          margin: 0 auto;
          width: 100%;
          max-width: 100%;
          box-shadow: var(--shadow-medium, 0 4px 16px rgba(0, 0, 0, 0.08));
          transition: box-shadow 200ms ease;
        }
        .cw__lab-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        .cw__lab-accent {
          width: 3px;
          height: 14px;
          border-radius: 2px;
          background: #0d5c4a;
          flex-shrink: 0;
        }
        .cw__lab {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--primary);
        }
        .cw__shell {
          position: relative;
        }
        .cw__textarea {
          width: 100%;
          min-height: 140px;
          padding: 14px 14px 40px;
          border-radius: var(--radius-md, 14px);
          border: 1px solid #b8dcd4;
          resize: none;
          overflow-y: auto;
          font-family: Inter, system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.65;
          color: var(--text);
          background: var(--surface-nested, #e8f5f0);
          transition:
            background 200ms ease,
            border-color 200ms ease,
            box-shadow 200ms ease;
        }
        .cw__textarea:hover:not(:disabled) {
          background: var(--surface-nested, #e8f5f0);
        }
        .cw__textarea:focus {
          outline: none;
          background: var(--surface);
          border-color: #0d5c4a;
          box-shadow: 0 0 0 3px rgba(13, 92, 74, 0.12);
        }
        .cw__textarea:disabled {
          opacity: 0.55;
        }
        @media (min-width: 768px) {
          .cw__card {
            padding: 24px 32px;
            box-shadow:
              0 4px 6px rgba(13, 92, 74, 0.06),
              0 12px 32px rgba(13, 92, 74, 0.14),
              0 24px 48px rgba(15, 23, 42, 0.08);
          }
          .cw__textarea {
            min-height: 168px;
            font-size: 16px;
            padding: 16px 16px 44px;
          }
          .cw__cta-row {
            display: flex;
            justify-content: center;
          }
          .cw__cta {
            max-width: 400px;
            width: 100%;
            margin-left: auto;
            margin-right: auto;
          }
        }
        .cw__bar {
          position: absolute;
          left: 12px;
          right: 10px;
          bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          pointer-events: none;
        }
        .cw__count {
          pointer-events: none;
          font-size: 11px;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .cw__mic-wrap {
          pointer-events: auto;
          position: relative;
        }
        .cw__mic {
          min-width: 44px;
          min-height: 44px;
          margin: -8px -6px -8px 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: var(--text-faint);
          cursor: pointer;
          border-radius: var(--radius-sm, 8px);
          transition: color 200ms ease, transform 200ms var(--ease-out-spring, cubic-bezier(0.34, 1.45, 0.42, 1));
        }
        .cw__mic:active {
          transform: scale(0.96);
        }
        .cw__tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          right: -4px;
          background: var(--surface);
          color: var(--text);
          font-size: 12px;
          padding: 8px 11px;
          border-radius: var(--radius-sm, 8px);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-medium, 0 4px 16px rgba(0, 0, 0, 0.08));
          white-space: nowrap;
          z-index: 5;
        }
        .cw__cta-row {
          margin-top: 14px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }
        .cw__cta {
          display: block;
          width: 100%;
          height: 56px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(135deg, #0d5c4a 0%, #0a4a3a 100%);
          color: #ffffff;
          font-family: Inter, system-ui, sans-serif;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transition:
            transform 220ms var(--ease-out-spring, cubic-bezier(0.34, 1.45, 0.42, 1)),
            background 200ms ease,
            filter 200ms ease,
            opacity 200ms ease;
        }
        .cw__cta:hover:not(:disabled) {
          background: #0a4a3a;
        }
        .cw__cta:active:not(:disabled) {
          transform: scale(0.98);
        }
        .cw__cta:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .cw__cta--loading {
          animation: cta-loading-pulse 1.4s ease-in-out infinite;
        }
        .cw__cta--shine::after {
          content: "";
          position: absolute;
          inset: 0;
          left: -110%;
          background: linear-gradient(105deg, transparent 0%, rgba(255, 255, 255, 0.22) 50%, transparent 100%);
          pointer-events: none;
        }
        .cw__cta:active:not(:disabled)::after {
          animation: shine-sweep 0.55s ease-out;
        }
        .cw__cta--idle-sweep::before {
          content: "";
          position: absolute;
          inset: -40%;
          width: 40%;
          background: linear-gradient(
            110deg,
            transparent 10%,
            rgba(255, 255, 255, 0.35) 45%,
            rgba(255, 255, 255, 0.08) 55%,
            transparent 90%
          );
          animation: cta-idle-shine 0.72s ease-out forwards;
          pointer-events: none;
          z-index: 2;
          mix-blend-mode: overlay;
        }
        @keyframes shine-sweep {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(280%);
          }
        }
        .cw__cta-inner {
          position: relative;
          z-index: 3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .cw__spin {
          width: 20px;
          height: 20px;
          border: 2px solid color-mix(in srgb, var(--cta-text) 32%, transparent);
          border-top-color: var(--cta-text);
          border-radius: 50%;
          animation: spin 0.72s linear infinite;
        }
        .cw__arr {
          font-weight: 700;
        }
        .cw__err {
          color: var(--color-high-border);
          font-size: 14px;
          margin-top: 12px;
        }
      `}</style>
    </div>
  )
}
