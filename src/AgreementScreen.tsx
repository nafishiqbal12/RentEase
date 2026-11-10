import { useEffect, useState } from "react"
import { Badge, Button } from "@figma/astraui"
import { Download, Printer } from "lucide-react"
import { supabase } from "./lib/supabase"

type LeaseStatus = "draft" | "active" | "expired" | "terminated"
type Lease = {
  id: string
  property_id: string
  monthly_rent: number
  security_deposit: number
  duration_months: number
  start_date: string
  end_date: string
  payment_due_day: number
  terms: string[]
  document_path: string | null
  signed_at: string | null
  status: LeaseStatus
  property: { title: string, address: string, city: string } | null
  owner: { full_name: string } | null
  tenant: { full_name: string } | null
}
type LeaseRpcRow = {
  id: string
  property_id: string
  monthly_rent: number | string
  security_deposit: number | string
  duration_months: number
  start_date: string
  end_date: string
  payment_due_day: number
  terms: string[] | null
  document_path: string | null
  signed_at: string | null
  status: string
  property_title: string | null
  property_address: string | null
  property_city: string | null
  owner_name: string | null
  tenant_name: string | null
}

const statusLabels: Record<LeaseStatus, string> = {
  draft: "Draft",
  active: "Active",
  expired: "Expired",
  terminated: "Terminated",
}

function statusVariant(status: LeaseStatus) {
  if (status === "active") return "success" as const
  if (status === "terminated") return "danger" as const
  if (status === "expired") return "secondary" as const
  return "warning" as const
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

function formatRent(value: number) {
  return `৳${Number(value).toLocaleString("en-BD")}`
}

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : (relation ?? null)
}

function AgreementCard({ lease }: { lease: Lease }) {
  const canPrint = Boolean(
    lease.property &&
      lease.owner &&
      lease.tenant &&
      lease.start_date &&
      lease.end_date &&
      lease.monthly_rent,
  )

  const printAgreement = () => {
    if (canPrint) window.print()
  }

  return (
    <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
      <div className="flex flex-col gap-lg sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-md">
            <div className="text-heading text-text-primary">
              {lease.property?.title ?? "Property details unavailable"}
            </div>
            <Badge
              label={statusLabels[lease.status]}
              variant={statusVariant(lease.status)}
            />
          </div>
          <div className="mt-xs text-video-title text-text-secondary">
            {lease.property
              ? `${lease.property.address}, ${lease.property.city}`
              : "Property details are unavailable under current access rules."}
          </div>
          <div className="mt-md text-label-sm text-text-secondary">
            {lease.status === "draft"
              ? "Draft agreement: it is not active until an administrator activates it."
              : lease.status === "active"
                ? "Active agreement"
                : `${statusLabels[lease.status]} agreement`}
          </div>
        </div>
        <div className="flex shrink-0 gap-md">
          <Button
            type="button"
            variant="neutral"
            size="small"
            disabled={!canPrint}
            onClick={printAgreement}
            title={
              canPrint
                ? "Print or save this agreement as PDF"
                : "Complete agreement data is not available"
            }
          >
            <Printer size={16} />
            Print / Save PDF
          </Button>
          {lease.document_path ? (
            <Button
              type="button"
              variant="subtle"
              size="small"
              disabled
              title="Document download requires a configured private lease-document bucket"
            >
              <Download size={16} />
              Document
            </Button>
          ) : null}
        </div>
      </div>

      <div className="agreement-details mt-xl">
        {[
          ["Owner", lease.owner?.full_name ?? "Unavailable"],
          ["Tenant", lease.tenant?.full_name ?? "Unavailable"],
          ["Monthly rent", formatRent(lease.monthly_rent)],
          ["Security deposit", formatRent(lease.security_deposit)],
          ["Term", `${lease.duration_months} months`],
          ["Lease starts", formatDate(lease.start_date)],
          ["Lease ends", formatDate(lease.end_date)],
          ["Payment due", `Day ${lease.payment_due_day} of each month`],
          [
            "Signed",
            lease.signed_at
              ? formatDate(lease.signed_at.slice(0, 10))
              : "Not signed",
          ],
        ].map(([label, value]) => (
          <div key={label} className="border-t border-border-secondary py-lg">
            <div className="text-video-title text-text-secondary">{label}</div>
            <div className="mt-xs text-label-sm text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      {lease.terms.length > 0 ? (
        <div className="mt-xl border-t border-border-secondary pt-xl">
          <div className="text-label text-text-primary">Agreement terms</div>
          <ul className="mt-md list-disc space-y-sm pl-xl text-label-sm text-text-secondary">
            {lease.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

export default function AgreementScreen({
  role,
  userId,
}: {
  role: "Tenant" | "Owner"
  userId: string
}) {
  const [leases, setLeases] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadLeases = async () => {
      setLoading(true)
      setError(null)
      const { data, error: queryError } = await supabase.rpc("get_my_leases")

      if (!active) return
      if (queryError) {
        setError(`Unable to load leases: ${queryError.message}`)
      } else {
        setLeases(
          ((data ?? []) as LeaseRpcRow[]).map((item) => ({
            id: item.id,
            property_id: item.property_id,
            monthly_rent: Number(item.monthly_rent),
            security_deposit: Number(item.security_deposit),
            duration_months: item.duration_months,
            start_date: item.start_date,
            end_date: item.end_date,
            payment_due_day: item.payment_due_day,
            terms: item.terms ?? [],
            document_path: item.document_path,
            signed_at: item.signed_at,
            status: item.status as LeaseStatus,
            property: item.property_title
              ? {
                  title: item.property_title,
                  address: item.property_address ?? "Address unavailable",
                  city: item.property_city ?? "City unavailable",
                }
              : null,
            owner: item.owner_name ? { full_name: item.owner_name } : null,
            tenant: item.tenant_name ? { full_name: item.tenant_name } : null,
          })),
        )
      }
      setLoading(false)
    }

    void loadLeases()
    return () => {
      active = false
    }
  }, [role, userId])

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Rental Agreement</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Your persisted lease details and current agreement status.
        </div>
      </div>
      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading leases...
        </div>
      ) : null}
      {error ? (
        <div
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {!loading && !error && leases.length === 0 ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          No lease has been created yet.
        </div>
      ) : null}
      <div className="flex flex-col gap-xl">
        {leases.map((lease) => (
          <AgreementCard key={lease.id} lease={lease} />
        ))}
      </div>
    </div>
  )
}
