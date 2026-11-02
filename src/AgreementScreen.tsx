import { useEffect, useState } from "react"
import { Badge } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Lease = {
  id: string
  property_id: string
  monthly_rent: number
  security_deposit: number
  duration_months: number
  start_date: string
  end_date: string
  payment_due_day: number
  status: string
  property: { title: string; address: string; city: string } | null
  owner: { full_name: string } | null
  tenant: { full_name: string } | null
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
    const column = role === "Tenant" ? "tenant_id" : "owner_id"
    void supabase
      .from("leases")
      .select(
        "id, property_id, monthly_rent, security_deposit, duration_months, start_date, end_date, payment_due_day, status, properties(title, address, city), owner:profiles!leases_owner_id_fkey(full_name), tenant:profiles!leases_tenant_id_fkey(full_name)",
      )
      .eq(column, userId)
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError) setError(`Unable to load leases: ${queryError.message}`)
        else {
          setLeases(
            (data ?? []).map((item) => ({
              ...item,
              property: Array.isArray(item.properties)
                ? item.properties[0]
                : item.properties,
              owner: Array.isArray(item.owner) ? item.owner[0] : item.owner,
              tenant: Array.isArray(item.tenant) ? item.tenant[0] : item.tenant,
            })),
          )
        }
        setLoading(false)
      })
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
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-danger" role="alert">
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
          <section
            key={lease.id}
            className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl"
          >
            <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-heading text-text-primary">
                  {lease.property?.title ?? "Property"}
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  {lease.property
                    ? `${lease.property.address}, ${lease.property.city}`
                    : "Property details unavailable"}
                </div>
              </div>
              <Badge
                label={lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                variant={lease.status === "active" ? "success" : "warning"}
              />
            </div>
            <div className="agreement-details mt-xl">
              {[
                ["Owner", lease.owner?.full_name ?? "Unavailable"],
                ["Tenant", lease.tenant?.full_name ?? "Unavailable"],
                ["Monthly rent", `৳${Number(lease.monthly_rent).toLocaleString("en-BD")}`],
                ["Security deposit", `৳${Number(lease.security_deposit).toLocaleString("en-BD")}`],
                ["Term", `${lease.duration_months} months`],
                ["Dates", `${lease.start_date} to ${lease.end_date}`],
                ["Payment due", `Day ${lease.payment_due_day} of each month`],
              ].map(([label, value]) => (
                <div key={label} className="border-t border-border-secondary py-lg">
                  <div className="text-video-title text-text-secondary">{label}</div>
                  <div className="mt-xs text-label-sm text-text-primary">{value}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
