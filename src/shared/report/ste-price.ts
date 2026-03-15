import type { ApplicationQueryContractWithContract } from "@/shared/api/autogen/types.gen"

const REPORT_URL = "/api/v1/ste-price-justification/doc"

type StePriceItem = {
  contractId?: string
  contractSigningDate?: string
  buyerInn?: string
  buyerRegion?: string
  count?: number | string
  unit?: string
  steId?: number
  steName?: string
  unitPrice?: number | string
  nds?: string
}

type StePricePosition = {
  positionName: string
  positionPrice?: number
  positionCount?: number
  items: StePriceItem[]
}

export type StePricePayload = {
  contractName: string
  summaryPrice: number
  positions: StePricePosition[]
  currency?: string
  docType?: "docx" | "doc" | "pdf"
}

export type StePricePositionInput = {
  name: string
  contracts: ApplicationQueryContractWithContract[]
  positionPrice?: number
  positionCount?: number
}

const toNds = (vatRate?: number | string | null) => {
  if (vatRate === null || vatRate === undefined) return ""
  if (typeof vatRate === "number") {
    if (!Number.isFinite(vatRate)) return ""
    const normalized = vatRate <= 1 ? vatRate * 100 : vatRate
    return `${normalized}%`
  }
  const s = String(vatRate).trim()
  if (!s) return ""
  if (/без\s*ндс/i.test(s)) return "Без НДС"
  if (s.endsWith("%")) return s
  const parsed = Number(s.replace(",", "."))
  if (Number.isFinite(parsed)) {
    const normalized = parsed <= 1 ? parsed * 100 : parsed
    return `${normalized}%`
  }
  return s
}


export function buildStePricePayload({
  contractName,
  positions,
  currency,
  docType,
}: {
  contractName: string
  positions: StePricePositionInput[]
  currency?: string
  docType?: "docx" | "doc" | "pdf"
}): StePricePayload {
  const normalizedPositions = positions
    .map((p) => {
      const items: StePriceItem[] = (p.contracts ?? []).map((c) => {
        const rawVatRate =
          c.vatRate ??
          (c as { vat_rate?: number | string | null }).vat_rate ??
          (c as { nds?: number | string | null }).nds ??
          (c as { NDS?: number | string | null }).NDS ??
          null

        return {
          contractId: c.contractId != null ? String(c.contractId) : "",
          contractSigningDate: c.contractSigningDate ?? "",
          buyerInn: c.buyerInn ?? "",
          buyerRegion: c.buyerRegion ?? "",
          count: c.quantity ?? "",
          unit: c.unit ?? "",
          steId: c.steId ?? undefined,
          steName: c.steItemName ?? "",
          unitPrice: c.unitPrice ?? "",
          nds: toNds(rawVatRate),
        }
      })

      const computedPositionPrice = (p.contracts ?? []).reduce(
        (sum, c) => sum + (c.unitPrice ?? 0),
        0
      )

      const positionPrice =
        typeof p.positionPrice === "number" && Number.isFinite(p.positionPrice)
          ? p.positionPrice
          : computedPositionPrice

      return {
        positionName: p.name,
        positionPrice,
        positionCount: p.positionCount,
        items,
      }
    })
    .filter((p) => p.items.length > 0 || (p.positionPrice ?? 0) > 0)

  const summaryPrice = normalizedPositions.reduce(
    (sum, p) => sum + (p.positionPrice ?? 0),
    0
  )

  return {
    contractName,
    summaryPrice,
    positions: normalizedPositions,
    currency,
    docType,
  }
}

export async function downloadStePriceReport(
  payload: StePricePayload,
  filename = "ste_price_justification.docx"
) {
  const response = await fetch(REPORT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Ошибка при скачивании: ${response.status}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}


export type PositionMeta = {
  quantity?: number
  manualNmck?: number | null
}

const POSITION_META_PREFIX = "tenderhack:position-meta"

const getPositionMetaKey = (appId: number, queryId: number) =>
  `${POSITION_META_PREFIX}:${appId}:${queryId}`

export function loadPositionMeta(appId: number, queryId: number): PositionMeta | null {
  try {
    const raw = localStorage.getItem(getPositionMetaKey(appId, queryId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PositionMeta
    const quantity =
      typeof parsed.quantity === "number" && Number.isFinite(parsed.quantity)
        ? parsed.quantity
        : undefined
    const manualNmck =
      typeof parsed.manualNmck === "number" && Number.isFinite(parsed.manualNmck)
        ? parsed.manualNmck
        : undefined
    return { ...parsed, quantity, manualNmck }
  } catch {
    return null
  }
}

export function updatePositionMeta(
  appId: number,
  queryId: number,
  patch: PositionMeta
): PositionMeta {
  const current = loadPositionMeta(appId, queryId) ?? {}
  const next = { ...current, ...patch }
  try {
    localStorage.setItem(getPositionMetaKey(appId, queryId), JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
  return next
}
