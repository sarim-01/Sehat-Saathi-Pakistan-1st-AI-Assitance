import { useState } from "react"
import { SvgDownload } from "./SvgClinical.jsx"
import { downloadCaseReport } from "../utils/pdfReport.js"

function haptic() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(14)
    }
  } catch {
    /* ignore */
  }
}

export default function DownloadReportButton({ result }) {
  const [bounce, setBounce] = useState(false)

  function onDownload() {
    if (!result) return
    haptic()
    setBounce(true)
    window.setTimeout(() => setBounce(false), 500)
    try {
      downloadCaseReport(result)
    } catch (e) {
      console.error(e)
      window.alert("Could not generate PDF. Try again.")
    }
  }

  return (
    <button type="button" className="dl-btn" onClick={onDownload}>
      <span className={`dl-btn__ic ${bounce ? "dl-btn__ic--bounce" : ""}`} aria-hidden>
        <SvgDownload />
      </span>
      <span className="dl-btn__txt">Download PDF</span>
      <style>{`
        .dl-btn {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          height: 52px;
          min-height: 52px;
          padding: 0 18px;
          border-radius: 12px;
          border: 1.5px solid #0d5c4a;
          background: #ffffff;
          color: #0d5c4a;
          font-family: Inter, system-ui, sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 180ms ease, transform 200ms cubic-bezier(0.34, 1.45, 0.42, 1);
        }
        .dl-btn:hover {
          background: #f0faf6;
        }
        .dl-btn:active {
          transform: scale(0.99);
        }
        .dl-btn__ic {
          display: inline-flex;
          color: #0d5c4a;
          flex-shrink: 0;
          transition: transform 200ms ease;
        }
        .dl-btn__ic--bounce {
          animation: icon-bounce-once 0.42s cubic-bezier(0.34, 1.55, 0.42, 1);
        }
        .dl-btn__txt {
          line-height: 1.2;
        }
      `}</style>
    </button>
  )
}
