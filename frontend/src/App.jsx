import { useState, useRef, useEffect } from "react"
import ChatWindow from "./components/ChatWindow.jsx"
import RiskBanner from "./components/RiskBanner.jsx"
import ClinicalSections from "./components/ClinicalSections.jsx"
import ClinicalRecordTable from "./components/ClinicalRecordTable.jsx"
import ResultsSkeleton from "./components/ResultsSkeleton.jsx"
import DownloadReportButton from "./components/DownloadReportButton.jsx"

function EmptyState() {
  return (
    <section className="empty" aria-label="Getting started">
      <div className="empty__ic" aria-hidden>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 5v22M5 16h22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="empty__t">Describe a case above to get started</p>
      <p className="empty__s">Available in English and Urdu</p>
      <style>{`
        .empty {
          text-align: center;
          padding: 20px 16px 8px;
          max-width: 20rem;
          margin: 0 auto;
        }
        .empty__ic {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
          color: var(--primary);
        }
        .empty__t {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-muted);
          line-height: 1.55;
        }
        .empty__s {
          margin: 0;
          font-size: 13px;
          font-weight: 400;
          color: var(--text-subtle);
        }
        @media (min-width: 768px) {
          .empty {
            padding: 28px 16px 12px;
            max-width: 24rem;
          }
          .empty__t {
            font-size: 16px;
          }
          .empty__s {
            font-size: 14px;
          }
        }
      `}</style>
    </section>
  )
}

export default function App() {
  const [result, setResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [navRaised, setNavRaised] = useState(false)
  const [clearTick, setClearTick] = useState(0)
  const riskRef = useRef(null)

  useEffect(() => {
    const h = () => setNavRaised(window.scrollY > 4)
    h()
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  const showResults = result && (result.triage || result.specialist)
  const showSkeleton = analyzing && !showResults

  useEffect(() => {
    if (!showResults) return
    const id = requestAnimationFrame(() => riskRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    return () => cancelAnimationFrame(id)
  }, [showResults])

  function newCase() {
    setResult(null)
    setClearTick((x) => x + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const showEmpty = !result && !analyzing && !showSkeleton

  return (
    <div className="app">
      <header className={`app__nav ${navRaised ? "app__nav--sh" : ""}`}>
        <div className="app__nav-in">
          <h1 className="app__brand">Sehat Saathi</h1>
          <div className="app__nav-tail">
            <span className="app__demo-pill">Demo</span>
          </div>
        </div>
      </header>

      <section className="app__hero" aria-label="About">
        <div className="app__dots" aria-hidden />
        <div className="app__hero-in">
          <div className="app__hero-head">
            <p className="app__htitle">Sehat Saathi</p>
            <span className="app__hero-pill">Demo version</span>
          </div>
          <p className="app__sub">
            Pakistan&apos;s 1st AI Decision Support for Lady Health Workers
          </p>
          <p className="app__desc">
            Sehat Saathi helps Pakistan&apos;s Lady Health Workers think through a home visit case, spot danger signs,
            decide if a patient needs urgent hospital care, and know what to tell the family. It is not a doctor and does
            not replace hospital care. It is an AI companion built for the field.
          </p>
        </div>
        <div className="app__wave" aria-hidden>
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="app__wave-svg">
            <path fill="var(--bg)" d="M0,22 C288,10 576,34 864,22 C1152,10 1344,30 1440,18 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </section>

      <main className="app__main">
        <ChatWindow onResult={setResult} onAnalyzingChange={setAnalyzing} clearToken={clearTick} />

        {showEmpty && <EmptyState />}

        {result?.error && <div className="app__banner app__banner--err">System: {result.error}</div>}

        {showSkeleton && (
          <section className="app__busy" aria-busy="true" aria-label="Loading">
            <ResultsSkeleton />
          </section>
        )}

        {showResults && (
          <section className="app__out app__out--results" aria-label="Results">
            <div ref={riskRef} className="risk-scroll app__sheet">
              <RiskBanner result={result} />
              <ClinicalSections result={result} />
              <ClinicalRecordTable result={result} sheet />
            </div>
            {result.specialist_error && <div className="app__banner app__banner--warn">Specialist: {result.specialist_error}</div>}
            <DownloadReportButton result={result} />
            <button type="button" className="app__reset" onClick={newCase}>
              New case — clear and start over
            </button>
          </section>
        )}
      </main>

      <footer className="app__footer">
        <div className="app__footer-in">
          <p>AI-generated guidance. Results may vary.</p>
          <p className="app__foot-muted">Does not diagnose, prescribe, or replace a licensed health professional.</p>
          <hr className="app__foot-rule" />
          <p className="app__foot-min">
            © 2026 Sehat Saathi · All rights reserved · IP of Sarim Rasheed · Unauthorized use strictly prohibited.
          </p>
        </div>
      </footer>

      <style>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding-top: 56px;
          scroll-padding-top: 72px;
        }
        .app__nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: 56px;
          display: flex;
          align-items: center;
          background: var(--nav-bg);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #d8ede8;
          transition: box-shadow var(--t-fast, 200ms ease);
        }
        .app__nav--sh {
          box-shadow: var(--shadow-nav);
        }
        .app__nav-in {
          box-sizing: border-box;
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .app__brand {
          margin: 0;
          font-family: Inter, system-ui, sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0d5c4a;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .app__nav-tail {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .app__demo-pill {
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ffffff;
          background: #0d5c4a;
          border-radius: var(--radius-pill, 99px);
          padding: 6px 12px;
          line-height: 1;
        }
        .app__hero {
          position: relative;
          background: linear-gradient(135deg, #0d5c4a, #0a4a3a);
          color: #fff;
          overflow: hidden;
        }
        .app__dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0);
          background-size: 12px 12px;
        }
        .app__hero-in {
          position: relative;
          z-index: 1;
          box-sizing: border-box;
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 20px 16px 16px;
          text-align: left;
        }
        .app__hero-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .app__htitle {
          margin: 0;
          font-size: clamp(1.75rem, 2.2vw + 1.1rem, 2.25rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .app__hero-pill {
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: var(--radius-pill, 99px);
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.35);
          line-height: 1;
        }
        .app__sub {
          margin: 8px 0 0;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.55;
          opacity: 0.85;
          max-width: 340px;
        }
        .app__desc {
          margin: 10px 0 0;
          font-size: 12px;
          font-weight: 400;
          line-height: 1.7;
          opacity: 0.7;
          max-width: 100%;
        }
        .app__wave {
          line-height: 0;
          margin-top: -1px;
          position: relative;
        }
        .app__wave-svg {
          display: block;
          width: 100%;
          height: 22px;
        }
        .app__main {
          flex: 1;
          box-sizing: border-box;
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 16px;
          padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px));
        }
        .risk-scroll {
          scroll-margin-top: 68px;
        }
        .app__busy {
          margin-top: 16px;
        }
        .app__out {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 4px;
        }
        .app__out--results {
          gap: 16px;
        }
        .app__sheet {
          border: 1px solid #d8ede8;
          background: #ffffff;
          overflow: hidden;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        }
        .app__banner {
          padding: 12px;
          border-radius: 14px;
          font-size: 14px;
        }
        .app__banner--err {
          background: var(--color-high-bg);
          color: #991b1b;
          border: 1px solid var(--color-high-border);
        }
        .app__banner--warn {
          background: var(--color-medium-bg);
          color: var(--color-medium-text);
        }
        .app__reset {
          width: 100%;
          margin-top: 0;
          height: 48px;
          min-height: 48px;
          border-radius: 12px;
          border: none;
          background: #f4f8f6;
          color: #6b7280;
          font-family: Inter, system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 180ms ease, transform 200ms ease;
        }
        .app__reset:hover {
          background: #e8f5f0;
        }
        .app__reset:active {
          transform: scale(0.99);
        }
        .app__footer {
          margin-top: auto;
          width: 100%;
          background: #072e24;
          padding: 28px 0 calc(28px + env(safe-area-inset-bottom, 0px));
          color: rgba(255, 255, 255, 0.85);
          text-align: center;
        }
        .app__footer-in {
          box-sizing: border-box;
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 0 16px;
        }
        .app__footer p {
          margin: 0 auto 12px;
          max-width: 40rem;
          font-size: 13px;
          line-height: 1.55;
          color: #fff;
        }
        .app__foot-muted {
          opacity: 0.8;
        }
        .app__foot-rule {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          margin: 16px auto 12px;
          max-width: 320px;
        }
        .app__footer p:last-child {
          margin-bottom: 0;
        }
        .app__foot-min {
          font-size: 11px !important;
          opacity: 0.5;
          margin-top: 0 !important;
        }
        @media (min-width: 768px) {
          .app__nav-in,
          .app__hero-in,
          .app__main,
          .app__footer-in {
            padding-left: 32px;
            padding-right: 32px;
          }
          .app__brand {
            font-size: 20px;
          }
          .app__hero-in {
            padding-top: 48px;
            padding-bottom: 48px;
          }
          .app__htitle {
            font-size: 2.375rem;
          }
          .app__hero-pill {
            font-size: 11px;
            padding: 6px 12px;
          }
          .app__sub {
            font-size: 16px;
            max-width: 100%;
            line-height: 1.6;
          }
          .app__desc {
            font-size: 15px;
            line-height: 1.65;
            opacity: 0.82;
          }
          .app__main {
            padding-top: 24px;
            padding-bottom: calc(40px + env(safe-area-inset-bottom, 0px));
          }
          .app__out--results {
            gap: 20px;
          }
          .app__sheet {
            box-shadow: 0 4px 24px rgba(13, 92, 74, 0.1), 0 12px 40px rgba(15, 23, 42, 0.06);
          }
          .app__footer p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
