import { jsPDF } from "jspdf"
import {
  mergeClinical,
  formatClinicalValue,
  splitToBullets,
  displayTitleCase,
  formatAgentDisplayName,
  asStringArray,
  splitEmergencyNumbers,
} from "./clinicalMerge.js"

/** ASCII hyphen bullets only (avoids PDF font encoding issues with U+2022 / U+25CF). */
const BULLET = "- "

function bulletsToItems(txt) {
  const raw = (txt || "").trim()
  if (!raw) return []
  const parts = splitToBullets(raw)
  const multiline = raw.includes("\n")
  if (parts.length > 1 || multiline) {
    const lines = multiline ? raw.split(/\n/).map((s) => s.trim()).filter(Boolean) : parts
    return lines.map((l) => l.replace(/^[-·•]+\s*/, "").trim()).filter(Boolean)
  }
  return [raw]
}

function joinDashBulletLines(items) {
  if (!items.length) return "—"
  const t = items.map((x) => displayTitleCase(x)).filter(Boolean)
  if (!t.length) return "—"
  return `${BULLET}${t.join(`\n${BULLET}`)}`
}

function riskBadgeColors(riskUpper) {
  const r = (riskUpper || "").toUpperCase()
  if (r === "HIGH")
    return { bg: [255, 245, 245], stroke: [220, 38, 38], text: [220, 38, 38] }
  if (r === "MEDIUM")
    return { bg: [255, 251, 235], stroke: [217, 119, 6], text: [217, 119, 6] }
  if (r === "LOW") return { bg: [240, 253, 244], stroke: [22, 163, 74], text: [22, 163, 74] }
  return { bg: [249, 250, 251], stroke: [156, 163, 175], text: [55, 65, 81] }
}

const RGB = {
  label: [107, 114, 128],
  value: [17, 24, 39],
  danger: [220, 38, 38],
  amber: [217, 119, 6],
  teal: [13, 92, 74],
  grey: [107, 114, 128],
  zebraAlt: [232, 245, 240],
  divider: [216, 237, 232],
}

/**
 * A4 case report — clinical layout with ASCII bullets and title-cased values.
 */
export function downloadCaseReport(result) {
  const merged = mergeClinical(result?.triage, result?.specialist)
  const apiRisk = (result?.risk || merged.risk || "—").toString()
  const apiRiskUpper = apiRisk.toUpperCase()

  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const m = 15
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const maxW = pageW - 2 * m
  const labCol = 52
  const valX = m + labCol
  const valW = pageW - m - valX
  let y = m

  const ROW_GAP_MM = 2.8
  const LABEL_FS = 10
  const VALUE_FS = 11
  const BULLET_FS = 10
  const LH_LABEL = 3.5
  const LH_VALUE = 4.4
  const LH_BULLET = 4.0

  const now = new Date()
  const stamp = now.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(13, 92, 74)
  doc.text("SEHAT SAATHI", m, y + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(RGB.label[0], RGB.label[1], RGB.label[2])
  const stampW = doc.getTextWidth(stamp)
  doc.text(stamp, pageW - m - stampW, y + 5)

  y += 9
  doc.setFontSize(13)
  doc.text("AI-Generated Case Assessment Report", m, y + 4)
  y += 10

  doc.setDrawColor(13, 92, 74)
  doc.setLineWidth(0.55)
  doc.line(m, y, pageW - m, y)
  y += 6 + ROW_GAP_MM

  const gestRaw = formatClinicalValue(merged.gestational_age).trim()
  const ageRaw = formatClinicalValue(merged.patient_age || merged.age || merged.age_years).trim()
  const gestOrAge =
    gestRaw && gestRaw !== "—"
      ? displayTitleCase(gestRaw)
      : ageRaw && ageRaw !== "—"
        ? displayTitleCase(ageRaw)
        : ""

  const dangerItems = bulletsToItems(
    `${formatClinicalValue(merged.danger_signs_present)} ${formatClinicalValue(merged.danger_signs_to_watch)}`.trim()
  )
  const dangerBlock = dangerItems.length ? joinDashBulletLines(dangerItems) : joinDashBulletLines(["None noted"])

  const referralDecision =
    formatClinicalValue(merged.referral_decision).trim() ||
    formatClinicalValue(merged.referral_urgency).trim() ||
    "—"

  const referralUrgency = formatClinicalValue(merged.referral_urgency).trim() || "—"
  const referralFacility = formatClinicalValue(merged.referral_facility).trim() || "—"

  const preRefItems = asStringArray(merged.pre_referral_actions)
  const preRefBlock = preRefItems.length ? joinDashBulletLines(preRefItems) : ""

  const lhwKit = formatClinicalValue(merged.lhw_kit_medicines).trim()
  const lhwKitItems = lhwKit ? bulletsToItems(lhwKit) : []
  const lhwKitBlock = lhwKitItems.length ? joinDashBulletLines(lhwKitItems) : lhwKit ? `${BULLET}${displayTitleCase(lhwKit)}` : ""

  const familyRaw = [merged.family_education, merged.family_counseling].filter(Boolean).map(formatClinicalValue).join("\n")
  const familyItems = bulletsToItems(familyRaw)
  const familyPlain = formatClinicalValue(merged.family_education || merged.family_counseling).trim()
  const familyBlock =
    familyItems.length > 0 ? joinDashBulletLines(familyItems) : familyPlain ? `${BULLET}${displayTitleCase(familyPlain)}` : "—"

  const followUp = formatClinicalValue(merged.follow_up).trim() || "—"
  const watchItems = bulletsToItems(formatClinicalValue(merged.watch_for))
  const watchBlock = watchItems.length ? joinDashBulletLines(watchItems) : formatClinicalValue(merged.watch_for).trim() || "—"

  const lhwDoItems = bulletsToItems(formatClinicalValue(merged.lhw_can_do))
  const lhwDoBlock = lhwDoItems.length ? joinDashBulletLines(lhwDoItems) : formatClinicalValue(merged.lhw_can_do).trim() || "—"

  const emergencyLines = splitEmergencyNumbers(merged.emergency_numbers)
  const emergencyBlock =
    emergencyLines.length > 0
      ? joinDashBulletLines(emergencyLines)
      : formatClinicalValue(merged.emergency_numbers).trim()
        ? `${BULLET}${displayTitleCase(formatClinicalValue(merged.emergency_numbers))}`
        : ""

  /** @type {Array<{ label: string; value: string; kind?: "risk" | "danger" | "amber" | "teal" | "grey" }>} */
  const rows = []
  rows.push({ label: "Patient Type", value: displayTitleCase(formatClinicalValue(merged.patient_type) || "—") })
  rows.push({ label: "Risk Level", value: apiRiskUpper, kind: "risk" })
  if (gestOrAge) {
    rows.push({ label: "Gestational Age / Patient Age", value: gestOrAge })
  }
  rows.push({ label: "Main Concern", value: displayTitleCase(formatClinicalValue(merged.primary_concern) || "—") })
  rows.push({ label: "Clinical Notes", value: displayTitleCase(formatClinicalValue(merged.reasoning) || "—") })
  rows.push({ label: "Danger Signs", value: dangerBlock, kind: "danger" })
  rows.push({ label: "Referral Decision", value: displayTitleCase(referralDecision) })
  rows.push({ label: "Referral Urgency", value: displayTitleCase(referralUrgency), kind: "urgency" })
  rows.push({ label: "Referral Facility", value: displayTitleCase(referralFacility) })
  if (preRefBlock) rows.push({ label: "Pre-Referral Actions", value: preRefBlock, kind: "amber" })
  if (lhwKitBlock) rows.push({ label: "LHW Kit Medicines", value: lhwKitBlock, kind: "teal" })
  rows.push({ label: "What to Tell the Family", value: familyBlock, kind: familyBlock === "—" ? undefined : "teal" })
  rows.push({ label: "Follow-up Instructions", value: displayTitleCase(followUp) })
  rows.push({ label: "Watch For", value: watchBlock, kind: "grey" })
  rows.push({ label: "What the LHW Can Do", value: lhwDoBlock, kind: "teal" })
  if (emergencyBlock) rows.push({ label: "Emergency Numbers", value: emergencyBlock, kind: "danger" })

  function ensureBottom(mmNeeded) {
    if (y + mmNeeded > pageH - 22) {
      doc.addPage()
      y = m
    }
  }

  function drawRiskBadge(x, baselineY, text) {
    const c = riskBadgeColors(text)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(VALUE_FS)
    const tw = doc.getTextWidth(text)
    const padX = 2.2
    const h = 5.8
    const bx = x
    const by = baselineY - h + 1.2
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2])
    doc.setDrawColor(c.stroke[0], c.stroke[1], c.stroke[2])
    doc.setLineWidth(0.2)
    doc.roundedRect(bx, by, tw + padX * 2, h, 0.8, 0.8, "FD")
    doc.setTextColor(c.text[0], c.text[1], c.text[2])
    doc.text(text, bx + padX, baselineY)
    doc.setTextColor(RGB.value[0], RGB.value[1], RGB.value[2])
    return tw + padX * 2 + 1
  }

  function valueColorForRow(kind) {
    if (kind === "danger") return RGB.danger
    if (kind === "amber") return RGB.amber
    if (kind === "teal") return RGB.teal
    if (kind === "grey") return RGB.grey
    if (kind === "urgency") {
      const r = apiRiskUpper
      if (r === "HIGH") return RGB.danger
      if (r === "MEDIUM") return RGB.amber
      if (r === "LOW") return [22, 163, 74]
      return RGB.value
    }
    return RGB.value
  }

  function measureRowHeight(row, labelLineCount) {
    if (row.kind === "risk") return Math.max(labelLineCount * LH_LABEL + 2, 12)
    const bulletish = row.kind && ["danger", "amber", "teal", "grey", "urgency"].includes(row.kind)
    const fs = bulletish && row.kind !== "urgency" ? BULLET_FS : VALUE_FS
    const lh = bulletish && row.kind !== "urgency" ? LH_BULLET : LH_VALUE
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fs)
    const valLines = doc.splitTextToSize(row.value, valW).length
    const valueH = valLines * lh + 4
    const labelH = labelLineCount * LH_LABEL + 2
    return Math.max(labelH, valueH) + 4
  }

  rows.forEach((row, rowIdx) => {
    const labelUpper = (row.label + "").toUpperCase()
    doc.setFont("helvetica", "normal")
    doc.setFontSize(LABEL_FS)
    doc.setTextColor(RGB.label[0], RGB.label[1], RGB.label[2])
    const labelLines = doc.splitTextToSize(labelUpper, labCol - 2)

    const rowH = measureRowHeight(row, labelLines.length)
    ensureBottom(rowH + ROW_GAP_MM + 14)

    const rowTop = y
    const fillRgb = rowIdx % 2 === 1 ? RGB.zebraAlt : [255, 255, 255]
    doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2])
    doc.rect(m, rowTop - 0.5, maxW, rowH + 1.2, "F")

    const ly = rowTop + 4
    labelLines.forEach((ln, i) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(LABEL_FS)
      doc.setTextColor(RGB.label[0], RGB.label[1], RGB.label[2])
      doc.text(ln, m + 1, ly + i * LH_LABEL)
    })

    const vColor = valueColorForRow(row.kind)
    if (row.kind === "risk") {
      drawRiskBadge(valX, ly + 3.2, apiRiskUpper)
    } else {
      const bulletish = row.kind && ["danger", "amber", "teal", "grey"].includes(row.kind)
      const fs = bulletish ? BULLET_FS : row.kind === "urgency" ? VALUE_FS : VALUE_FS
      const lh = bulletish ? LH_BULLET : LH_VALUE
      doc.setFont("helvetica", "normal")
      doc.setFontSize(fs)
      doc.setTextColor(vColor[0], vColor[1], vColor[2])
      const valLines = doc.splitTextToSize(row.value, valW)
      valLines.forEach((ln, i) => {
        doc.text(ln, valX, ly + i * lh)
      })
      doc.setTextColor(RGB.value[0], RGB.value[1], RGB.value[2])
    }

    const rowBottom = rowTop + rowH
    doc.setDrawColor(RGB.divider[0], RGB.divider[1], RGB.divider[2])
    doc.setLineWidth(0.1)
    doc.line(m, rowBottom, pageW - m, rowBottom)
    y = rowBottom + ROW_GAP_MM
  })

  y += 4
  ensureBottom(40)

  const discBody =
    "This report is generated by Sehat Saathi, an AI-powered decision support tool. Outputs are produced by a generative AI model for field guidance purposes only. This report does not constitute a medical diagnosis, clinical prescription, or professional health advice. All patient care decisions must be made by a qualified health professional or facility."

  const discPad = 3.5
  doc.setFont("helvetica", "italic")
  doc.setFontSize(10)
  const bodyLines = doc.splitTextToSize(discBody, maxW - 2 * discPad)
  const lineH = 3.55
  const boxH = 4 + lineH + bodyLines.length * lineH + discPad * 2
  ensureBottom(boxH + 18)

  doc.setFillColor(249, 250, 251)
  doc.setDrawColor(RGB.divider[0], RGB.divider[1], RGB.divider[2])
  doc.setLineWidth(0.12)
  doc.roundedRect(m, y, maxW, boxH, 0.6, 0.6, "FD")

  let dyy = y + discPad + 3.5
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(RGB.label[0], RGB.label[1], RGB.label[2])
  doc.text("DISCLAIMER:", m + discPad, dyy)
  dyy += lineH + 1
  doc.setFont("helvetica", "italic")
  doc.setTextColor(RGB.label[0], RGB.label[1], RGB.label[2])
  bodyLines.forEach((ln) => {
    doc.text(ln, m + discPad, dyy)
    dyy += lineH
  })
  y = y + boxH + 6

  const footerTxt =
    "© 2026 Sehat Saathi · Pakistan's 1st AI Decision Support for Lady Health Workers · Concept & IP of Sarim Rasheed · All rights reserved."

  ensureBottom(22)
  doc.setDrawColor(RGB.divider[0], RGB.divider[1], RGB.divider[2])
  doc.setLineWidth(0.12)
  doc.line(m, y, pageW - m, y)
  y += 5

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  const footLines = doc.splitTextToSize(footerTxt, maxW)
  const footStartY = y
  footLines.forEach((ln, i) => {
    const w = doc.getTextWidth(ln)
    doc.text(ln, (pageW - w) / 2, footStartY + i * 4.1)
  })

  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(156, 163, 175)
    const pn = `Page ${i} of ${total}`
    doc.text(pn, pageW - m - doc.getTextWidth(pn), pageH - 7.5)
  }

  const fn = `SehatSaathi_Report_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.pdf`
  doc.save(fn)
}
