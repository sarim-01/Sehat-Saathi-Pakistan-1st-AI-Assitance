export function mergeClinical(triage, specialist) {
  const t = triage && typeof triage === "object" ? triage : {}
  const s = specialist && typeof specialist === "object" ? specialist : {}
  return { ...t, ...s }
}

/**
 * Shallow merge of API payload so top-level display fields prefer specialist over triage
 * when both exist (same rules as mergeClinical for risk / patient_type).
 */
export function mergeApiDisplayResult(result) {
  if (!result || typeof result !== "object") return result
  const merged = mergeClinical(result.triage, result.specialist)
  const risk =
    typeof merged.risk === "string" && merged.risk.trim() !== ""
      ? merged.risk
      : (result.risk ?? "UNKNOWN")
  const patient_type =
    typeof merged.patient_type === "string" && merged.patient_type.trim() !== ""
      ? merged.patient_type
      : (result.patient_type ?? "unknown")
  return { ...result, risk, patient_type }
}

export function formatClinicalValue(v) {
  if (v == null || v === "") return ""
  if (Array.isArray(v)) return v.filter(Boolean).join(" · ")
  if (typeof v === "object") return JSON.stringify(v, null, 2)
  return String(v)
}

export function splitToBullets(text) {
  const t = (text || "").trim()
  if (!t) return []
  const chunks = t
    .split(/\s*[·•]\s*|\n+|(?:\s*;\s*)|(?:\s*\/\s+)/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (chunks.length > 1) return chunks
  if (t.length > 200) return [t]
  return [t]
}

export function riskLevelFromApi(risk) {
  const r = (risk || "").toString().toUpperCase()
  if (r === "HIGH") return "high"
  if (r === "MEDIUM") return "medium"
  if (r === "LOW") return "low"
  return "unknown"
}

const FACILITY_RE = /\b(THQ|DHQ|RHC|BHU|tertiary|district|tehsil|hospital)\b/gi

export function extractFacilityHint(merged) {
  const pool = [
    formatClinicalValue(merged.referral_urgency),
    formatClinicalValue(merged.immediate_action),
    formatClinicalValue(merged.assessment),
  ]
    .filter(Boolean)
    .join(" ")
  const m = pool.match(FACILITY_RE)
  if (m && m.length) return [...new Set(m.map((x) => x.toUpperCase()))].slice(0, 4).join(" · ")
  return "Per local referral pathway"
}

const URGENT_RE = /\burgent|immediate|emergency|foran|fauri|now|بدتر|سنگین/i

/** Heuristic triage for referral row. */
export function inferReferralUrgencyLevel(merged, apiRisk) {
  const r = (apiRisk || "").toString().toUpperCase()
  const ref = formatClinicalValue(merged.referral_urgency)
  const act = formatClinicalValue(merged.immediate_action)
  if (r === "HIGH" || URGENT_RE.test(ref) || URGENT_RE.test(act)) return "URGENT"
  return "ROUTINE"
}

/** Display line for industrial referral section. */
export function inferReferralRouteLine(merged, apiRisk) {
  return inferReferralUrgencyLevel(merged, apiRisk) === "URGENT" ? "URGENT (same day)" : "ROUTINE (1 week)"
}

/** Split immediate_action into numbered steps (API uses "Step 1", "Step 2", …). */
export function parseImmediateActionSteps(raw) {
  const s = formatClinicalValue(raw).trim()
  if (!s) return []
  if (!/\bstep\s*\d/i.test(s)) {
    return [{ n: null, text: s }]
  }
  const segments = s
    .split(/(?=\bStep\s*\d)/i)
    .map((x) => x.trim())
    .filter(Boolean)
  return segments
    .map((seg) => {
      const m = seg.match(/^\bStep\s*(\d+)\s*[:.\-]?\s*(.*)$/is)
      if (m) return { n: m[1], text: m[2].trim() }
      return { n: null, text: seg }
    })
    .filter((x) => x.text || x.n)
}

/** Normalize pre_referral_actions to a string array. */
export function asStringArray(v) {
  if (v == null) return []
  if (Array.isArray(v)) return v.map((x) => formatClinicalValue(x).trim()).filter(Boolean)
  const one = formatClinicalValue(v).trim()
  return one ? [one] : []
}

/** Split emergency_numbers into lines for display with phone icons. */
export function splitEmergencyNumbers(raw) {
  const s = formatClinicalValue(raw).trim()
  if (!s) return []
  return s
    .split(/\n+|(?:\s*[,;|]\s*)|(?:\s+·\s+)|(?:\s+\/\s+)/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/** Human-readable agent route label (raw tokens). */
export function formatAgentUsed(agentUsed) {
  const u = (agentUsed || "").toString().trim()
  if (!u || u === "NONE") return "—"
  return u.replace(/^AGENT_\d+_/, "").replace(/_/g, " ")
}

const AGENT_DISPLAY = {
  MATERNAL: "Maternal Health Specialist",
  PEDIATRIC: "Paediatric & Newborn Specialist",
  TREATMENT: "Treatment Protocols Specialist",
  NUTRITION: "Nutrition Specialist",
  ADULT: "Adult & Chronic Disease Specialist",
}

/** Title Case display for agent (UI / PDF). */
export function formatAgentDisplayName(agentUsed) {
  const u = (agentUsed || "").toString().trim().toUpperCase()
  if (!u || u === "NONE") return "—"
  const key = u.replace(/^AGENT_\d+_/, "")
  if (AGENT_DISPLAY[key]) return AGENT_DISPLAY[key]
  return displayTitleCase(key.replace(/_/g, " "))
}

/** Title Case for clinical values (keeps HIGH/MEDIUM/LOW; preserves short facility acronyms). */
export function displayTitleCase(s) {
  if (s == null) return ""
  const str = String(s).trim().replace(/\s+/g, " ")
  if (!str) return ""
  if (str === "—" || str === "-") return "—"
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(str)) return str
  const u = str.toUpperCase()
  if (["HIGH", "MEDIUM", "LOW", "UNKNOWN"].includes(u)) return u
  const acronyms = new Set(["DHQ", "THQ", "RHC", "BHU", "ORS", "LHW", "ANC", "TT", "IMNCI"])
  return str.replace(/[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)?/g, (w) => {
    const up = w.toUpperCase()
    if (acronyms.has(up)) return up
    const lo = w.toLowerCase()
    return lo.charAt(0).toUpperCase() + lo.slice(1)
  })
}
