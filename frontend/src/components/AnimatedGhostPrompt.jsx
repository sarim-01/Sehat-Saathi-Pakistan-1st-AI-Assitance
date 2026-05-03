import { useEffect, useState } from "react"
import { GHOST_TYPEWRITER_PROMPTS } from "../animatedGhostTimelines.js"

const CHAR_MS = 35
const HOLD_MS = 2000
const FADE_MS = 400

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function AnimatedGhostPrompt({ show }) {
  const [chunk, setChunk] = useState("")
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (!show) {
      setChunk("")
      setOpacity(0)
      return
    }

    let cancelled = false
    const prompts = GHOST_TYPEWRITER_PROMPTS

    ;(async () => {
      let idx = 0
      while (!cancelled) {
        const full = prompts[idx % prompts.length]
        setOpacity(1)
        for (let n = 1; n <= full.length; n++) {
          if (cancelled) return
          setChunk(full.slice(0, n))
          await delay(CHAR_MS)
        }
        await delay(HOLD_MS)
        if (cancelled) return
        setOpacity(0)
        await delay(FADE_MS)
        if (cancelled) return
        setChunk("")
        setOpacity(1)
        idx += 1
      }
    })()

    return () => {
      cancelled = true
    }
  }, [show])

  if (!show) return null

  const rtl = /[\u0600-\u06FF]/.test(chunk)

  return (
    <div className="gh" aria-hidden="true">
      <div className="gh__inner" style={{ opacity, transition: `opacity ${FADE_MS}ms ease` }}>
        <span className={`gh__txt ${rtl ? "urdu" : ""}`} dir={rtl ? "rtl" : "ltr"}>
          {chunk}
          <span className="gh__caret">|</span>
        </span>
      </div>
      <style>{`
        .gh {
          position: absolute;
          inset: 14px 14px 40px 14px;
          pointer-events: none;
          user-select: none;
          overflow: hidden;
          text-align: start;
        }
        .gh__txt {
          font-family: Inter, system-ui, sans-serif;
          font-size: 14px;
          font-style: italic;
          font-weight: 400;
          color: var(--text-subtle, #9ca3af);
          line-height: 1.55;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .gh__caret {
          font-style: normal;
          animation: gh-caret 0.5s step-end infinite;
        }
        @keyframes gh-caret {
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
