import { useEffect, useMemo, useState } from "react"
import { Badge, Button } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type ApplicationStatus = "Pending" | "Approved" | "Rejected"
type Application = {
  id: string
  name: string
  property: string
  submitted: string
  status: ApplicationStatus
}
type MaintenanceItem = {
  id: string
  title: string
  property: string
  reported: string
  assigned: boolean
}
type Property = { id: string; title: string }
type Lease = { id: string; tenant_id: string; status: string }
type Payment = {
  id: string
  amount: number
  paid_at: string | null
  status: string
}

function statusVariant(status: ApplicationStatus) {
  if (status === "Approved") return "success" as const
  if (status === "Rejected") return "danger" as const
  return "warning" as const
}

function formatCurrency(value: number) {
  return `৳${Math.round(value).toLocaleString("en-BD")}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" })
}

export default function OwnerDashboard({ ownerId }: { ownerId: string }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([])
  const [pendingApplications, setPendingApplications] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadDashboard = async () => {
      setLoading(true)
      setError(null)
      const [
        propertyResult,
        applicationResult,
        leaseResult,
        paymentResult,
        maintenanceResult,
      ] = await Promise.all([
        supabase
          .from("properties")
          .select("id, title")
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("applications")
          .select(
            "id, status, created_at, properties!inner(title, owner_id), profiles!applications_tenant_id_fkey(full_name)",
          )
          .eq("properties.owner_id", ownerId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("leases")
          .select("id, tenant_id, status")
          .eq("owner_id", ownerId),
        supabase
          .from("payments")
          .select("id, amount, paid_at, status")
          .eq("owner_id", ownerId)
          .eq("status", "paid")
          .order("paid_at", { ascending: false }),
        supabase
          .from("maintenance_requests")
          .select(
            "id, title, status, assigned_to, created_at, properties!inner(title, owner_id)",
          )
          .eq("properties.owner_id", ownerId)
          .neq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(10),
      ])

      const failure = [
        propertyResult.error,
        applicationResult.error,
        leaseResult.error,
        paymentResult.error,
        maintenanceResult.error,
      ].find(Boolean)
      if (failure) {
        if (active) {
          setError(`Unable to load owner dashboard: ${failure.message}`)
          setLoading(false)
        }
        return
      }

      if (!active) return
      setProperties(propertyResult.data ?? [])
      setApplications(
        (applicationResult.data ?? []).map((item) => {
          const property = Array.isArray(item.properties)
            ? item.properties[0]
            : item.properties
          const tenant = Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles
          const status =
            item.status === "approved"
              ? "Approved"
              : item.status === "rejected"
                ? "Rejected"
                : "Pending"
          return {
            id: item.id,
            name: tenant?.full_name ?? "Tenant",
            property: property?.title ?? "Property",
            submitted: formatDate(item.created_at),
            status,
          }
        }),
      )
      setPendingApplications(
        (applicationResult.data ?? []).filter(
          (item) => item.status === "pending",
        ).length,
      )
      setLeases(leaseResult.data ?? [])
      setPayments(
        (paymentResult.data ?? []).map((item) => ({
          ...item,
          amount: Number(item.amount),
        })),
      )
      setMaintenance(
        (maintenanceResult.data ?? []).map((item) => {
          const property = Array.isArray(item.properties)
            ? item.properties[0]
            : item.properties
          return {
            id: item.id,
            title: item.title,
            property: property?.title ?? "Property",
            reported: `Reported ${formatDate(item.created_at)}`,
            assigned: Boolean(item.assigned_to),
          }
        }),
      )
      setLoading(false)
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [ownerId])

  const income = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      const total = payments
        .filter((payment) => {
          if (!payment.paid_at) return false
          const paidAt = new Date(payment.paid_at)
          return (
            paidAt.getFullYear() === date.getFullYear() &&
            paidAt.getMonth() === date.getMonth()
          )
        })
        .reduce((sum, payment) => sum + payment.amount, 0)
      return { month: monthLabel(date), total }
    })
    const maximum = Math.max(...months.map((item) => item.total), 1)
    return months.map((item, index) => ({
      ...item,
      height: `${Math.max(24, (item.total / maximum) * 150)}px`,
      current: index === months.length - 1,
    }))
  }, [payments])

  const currentMonthIncome = income[income.length - 1]?.total ?? 0
  const previousMonthIncome = income[income.length - 2]?.total ?? 0
  const incomeChange = previousMonthIncome
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
    : 0
  const activeLeases = leases.filter((lease) => lease.status === "active")
  const tenantCount = new Set(activeLeases.map((lease) => lease.tenant_id)).size
  const occupancy = properties.length
    ? Math.round((activeLeases.length / properties.length) * 100)
    : 0
  const pendingMaintenance = maintenance.filter((item) => !item.assigned).length

  const stats = [
    {
      label: "Total Properties",
      value: String(properties.length),
      detail: `${
        properties.length ? "Live portfolio" : "No properties listed yet"
      }`,
    },
    {
      label: "Occupancy Rate",
      value: `${occupancy}%`,
      detail: `${activeLeases.length} of ${properties.length} occupied`,
    },
    {
      label: "Pending Applications",
      value: String(pendingApplications),
      detail: "Awaiting your decision",
    },
    {
      label: "Rental Income This Month",
      value: formatCurrency(currentMonthIncome),
      detail: `${
        incomeChange >= 0 ? "+" : ""
      }${incomeChange.toFixed(1)}% from last month`,
    },
  ]

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Owner Dashboard</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Track your portfolio, applications, and service requests.
        </div>
      </div>
      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-text-secondary">
          Loading your owner dashboard...
        </div>
      ) : null}
      {error ? (
        <div
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {!loading && !error ? (
        <>
          <section
            className="grid grid-cols-1 gap-xl sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Portfolio summary"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="dashboard-card h-full rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
              >
                <div className="text-label-sm text-text-secondary">
                  {stat.label}
                </div>
                <div className="mt-md text-heading text-text-primary">
                  {stat.value}
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  {stat.detail}
                </div>
              </div>
            ))}
          </section>
          <div className="grid grid-cols-1 gap-xl xl:grid-cols-5">
            <section
              className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl xl:col-span-3"
              aria-label="Monthly rental income"
            >
              <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-heading text-text-primary">
                    Monthly Rental Income
                  </div>
                  <div className="mt-xs text-video-title text-text-secondary">
                    Collected rent over the last six months
                  </div>
                </div>
                <Badge
                  label={`${
                    incomeChange >= 0 ? "+" : ""
                  }${incomeChange.toFixed(1)}% this month`}
                  variant={incomeChange >= 0 ? "success" : "danger"}
                />
              </div>
              <div className="income-chart mt-2xl">
                <div className="income-chart-grid" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="income-bars">
                  {income.map((item) => (
                    <div key={item.month} className="income-column">
                      <div className="income-value text-video-title text-text-secondary">
                        {formatCurrency(item.total)}
                      </div>
                      <div
                        className="income-bar"
                        style={{
                          height: item.height,
                          background: item.current
                            ? "var(--primary-dark)"
                            : undefined,
                        }}
                        aria-label={`${item.month} rental income ${formatCurrency(item.total)}`}
                      />
                      <div className="mt-md text-video-title text-text-secondary">
                        {item.month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section
              className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl xl:col-span-2"
              aria-label="Pending maintenance"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-heading text-text-primary">
                    Pending Maintenance
                  </div>
                  <div className="mt-xs text-video-title text-text-secondary">
                    Requests that need attention
                  </div>
                </div>
                <Badge
                  label={`${pendingMaintenance} pending`}
                  variant="warning"
                />
              </div>
              <div className="mt-xl flex flex-col">
                {maintenance.length ? (
                  maintenance.map((request) => (
                    <div
                      key={request.id}
                      className="owner-list-row border-b border-border-secondary py-lg"
                    >
                      <div className="flex items-start justify-between gap-lg">
                        <div className="min-w-0">
                          <div className="text-label-sm text-text-primary">
                            {request.title}
                          </div>
                          <div className="mt-xs text-video-title text-text-secondary">
                            {request.property}
                          </div>
                          <div className="mt-xs text-video-title text-text-secondary">
                            {request.reported}
                          </div>
                        </div>
                        <Badge
                          label={request.assigned ? "Assigned" : "Pending"}
                          variant={request.assigned ? "brand" : "warning"}
                          className={
                            request.assigned ? "status-assigned" : undefined
                          }
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-lg text-label-sm text-text-secondary">
                    No open maintenance requests.
                  </div>
                )}
              </div>
            </section>
          </div>
          <section
            className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
            aria-label="Recent rental applications"
          >
            <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-heading text-text-primary">
                  Recent Rental Applications
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  Review prospective tenants for your properties
                </div>
              </div>
              <div className="text-label-sm text-text-secondary">
                {
                  applications.filter((item) => item.status === "Pending")
                    .length
                }{" "}
                pending · {applications.length} total
              </div>
            </div>
            <div className="mt-xl flex flex-col">
              {applications.length ? (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className="owner-application-row border-t border-border-secondary py-lg"
                  >
                    <div className="min-w-0">
                      <div className="text-label text-text-primary">
                        {application.name}
                      </div>
                      <div className="mt-xs text-label-sm text-text-secondary">
                        {application.property}
                      </div>
                      <div className="mt-xs text-video-title text-text-secondary">
                        {application.submitted}
                      </div>
                    </div>
                    <Badge
                      label={application.status}
                      variant={statusVariant(application.status)}
                    />
                  </div>
                ))
              ) : (
                <div className="py-lg text-label-sm text-text-secondary">
                  No applications received yet.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
