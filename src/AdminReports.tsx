import { useEffect, useMemo, useState } from "react"
import { Badge, Button, SelectField } from "@figma/astraui"
import { Download } from "lucide-react"
import { supabase } from "./lib/supabase"

type ReportRow = { created_at: string }
type Payment = { amount: number; paid_at: string | null; status: string }
type Property = { id: string; status: string }
type Lease = { property_id: string; status: string }
type Complaint = { status: string }

const rangeDays: Record<string, number> = {
  "30days": 30,
  "3months": 90,
  "6months": 180,
  year: 365,
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" })
}

function formatCurrency(value: number) {
  return `৳${Math.round(value).toLocaleString("en-BD")}`
}

export default function AdminReports({
  scope = "Admin",
  ownerId,
}: {
  scope?: "Admin" | "Owner"
  ownerId?: string
}) {
  const [range, setRange] = useState("6months")
  const [payments, setPayments] = useState<Payment[]>([])
  const [users, setUsers] = useState<ReportRow[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [applications, setApplications] = useState<ReportRow[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - rangeDays[range])
      const date = cutoff.toISOString()
      const paymentQuery = supabase
        .from("payments")
        .select("amount, paid_at, status")
        .gte("paid_at", date)
      const propertyQuery = supabase
        .from("properties")
        .select("id, status")
      const leaseQuery = supabase
        .from("leases")
        .select("property_id, status")

      const results = scope === "Owner" && ownerId
        ? await Promise.all([
            paymentQuery.eq("owner_id", ownerId),
            propertyQuery.eq("owner_id", ownerId),
            leaseQuery.eq("owner_id", ownerId),
            supabase
              .from("applications")
              .select("created_at, properties!inner(owner_id)")
              .eq("properties.owner_id", ownerId)
              .gte("created_at", date),
            supabase
              .from("complaints")
              .select("status, properties!inner(owner_id)")
              .eq("properties.owner_id", ownerId),
          ])
        : await Promise.all([
            paymentQuery,
            propertyQuery,
            leaseQuery,
            supabase.from("applications").select("created_at").gte("created_at", date),
            supabase.from("complaints").select("status"),
          ])

      const [paymentResult, propertyResult, leaseResult, applicationResult, complaintResult] = results
      let userResult: { data: ReportRow[] | null; error: { message: string } | null } = {
        data: [],
        error: null,
      }
      if (scope === "Admin") {
        const result = await supabase.from("profiles").select("created_at").gte("created_at", date)
        userResult = result
      }
      const firstError = [
        paymentResult.error,
        propertyResult.error,
        leaseResult.error,
        applicationResult.error,
        complaintResult.error,
        userResult.error,
      ].find(Boolean)
      if (firstError) {
        if (active) {
          setError(`Unable to load reports: ${firstError.message}`)
          setLoading(false)
        }
        return
      }
      if (!active) return
      setPayments((paymentResult.data ?? []).map((item) => ({ ...item, amount: Number(item.amount) })))
      setProperties(propertyResult.data ?? [])
      setLeases(leaseResult.data ?? [])
      setApplications(applicationResult.data ?? [])
      setComplaints(complaintResult.data ?? [])
      setUsers(userResult.data ?? [])
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [ownerId, range, scope])

  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
      const revenue = payments
        .filter((payment) => {
          if (payment.status !== "paid" || !payment.paid_at) return false
          const paidAt = new Date(payment.paid_at)
          return paidAt.getFullYear() === date.getFullYear() && paidAt.getMonth() === date.getMonth()
        })
        .reduce((sum, payment) => sum + payment.amount, 0)
      const newUsers = users.filter((user) => {
        const created = new Date(user.created_at)
        return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth()
      }).length
      return { label: monthLabel(date), revenue, newUsers }
    })
  }, [payments, users])

  const maxRevenue = Math.max(...months.map((item) => item.revenue), 1)
  const maxUsers = Math.max(...months.map((item) => item.newUsers), 1)
  const activeLeases = leases.filter((lease) => lease.status === "active")
  const occupiedPropertyIds = new Set(activeLeases.map((lease) => lease.property_id))
  const availableCount = properties.filter((property) => property.status === "approved" && !occupiedPropertyIds.has(property.id)).length
  const currentRevenue = months[months.length - 1]?.revenue ?? 0
  const previousRevenue = months[months.length - 2]?.revenue ?? 0
  const revenueChange = previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
  const complaintCounts = [
    { label: "Submitted", value: complaints.filter((item) => item.status === "submitted").length, className: "complaint-bar-submitted", variant: "warning" as const },
    { label: "In Review", value: complaints.filter((item) => item.status === "in_review").length, className: "complaint-bar-review", variant: "brand" as const },
    { label: "Resolved", value: complaints.filter((item) => item.status === "resolved").length, className: "complaint-bar-resolved", variant: "success" as const },
  ]
  const totalComplaints = Math.max(complaints.length, 1)

  const exportReport = () => {
    const rows = [
      ["Month", "Paid revenue", "New users"],
      ...months.map((item) => [item.label, String(item.revenue), String(item.newUsers)]),
    ]
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "rentease-report.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="flex flex-col gap-xl sm:flex-row sm:items-end sm:justify-between">
        <div><div className="text-title text-text-primary">{scope === "Owner" ? "Portfolio Reports" : "Reports"}</div><div className="mt-xs text-label-sm text-text-secondary">{scope === "Owner" ? "Income, occupancy, and performance across your portfolio." : "Platform growth, revenue, rentals, and complaint trends."}</div></div>
        <div className="flex flex-col gap-md sm:flex-row sm:items-end"><div className="report-filter"><SelectField label="Date range" options={[{ value: "30days", label: "Last 30 days" }, { value: "3months", label: "Last 3 months" }, { value: "6months", label: "Last 6 months" }, { value: "year", label: "This year" }]} value={range} onChange={setRange} /></div><Button variant="primary" iconStart={<Download size={16} />} onClick={exportReport}>Export</Button></div>
      </div>
      {loading ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">Loading reports...</div> : null}
      {error ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-danger" role="alert">{error}</div> : null}
      {!loading && !error && !payments.length && !properties.length && !applications.length && !complaints.length ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">No report data is available for this period.</div> : null}
      {!loading && !error ? <div className="reports-grid">
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="flex items-start justify-between gap-lg"><div><div className="text-heading text-text-primary">Monthly Revenue</div><div className="mt-xs text-video-title text-text-secondary">Collected rent over the selected period</div></div><Badge label={`${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}%`} variant={revenueChange >= 0 ? "success" : "danger"} /></div><div className="report-chart mt-2xl"><div className="report-chart-grid" aria-hidden="true"><span /><span /><span /><span /></div><div className="report-bars">{months.map((item) => <div key={item.label} className="report-column"><div className="report-value text-video-title text-text-secondary">{formatCurrency(item.revenue)}</div><div className="report-bar" style={{ height: `${Math.max(24, (item.revenue / maxRevenue) * 150)}px` }} aria-label={`${item.label} revenue ${formatCurrency(item.revenue)}`} /><div className="mt-md text-video-title text-text-secondary">{item.label}</div></div>)}</div></div></section>
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="flex items-start justify-between gap-lg"><div><div className="text-heading text-text-primary">New Users</div><div className="mt-xs text-video-title text-text-secondary">Tenant and owner registrations</div></div><Badge label={`${users.length} total`} variant="brand" /></div><div className="report-chart mt-2xl"><div className="report-chart-grid" aria-hidden="true"><span /><span /><span /><span /></div><div className="report-bars">{months.map((item) => <div key={item.label} className="report-column"><div className="report-value text-video-title text-text-secondary">{item.newUsers}</div><div className="report-bar" style={{ height: `${Math.max(24, (item.newUsers / maxUsers) * 150)}px`, background: "var(--primary-dark)" }} aria-label={`${item.label} new users ${item.newUsers}`} /><div className="mt-md text-video-title text-text-secondary">{item.label}</div></div>)}</div></div></section>
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="text-heading text-text-primary">Active Rentals</div><div className="mt-xs text-video-title text-text-secondary">Occupied versus available listings</div><div className="mt-2xl flex flex-col items-center justify-center"><div className="rentals-donut flex items-center justify-center rounded-corner-full"><div className="rentals-donut-center flex items-center justify-center rounded-corner-full bg-surface-bg"><div className="text-center"><div className="text-title text-text-primary">{activeLeases.length}</div><div className="text-video-title text-text-secondary">active</div></div></div></div><div className="mt-2xl flex flex-wrap justify-center gap-xl text-label-sm"><span className="text-brand-primary">{activeLeases.length} Active</span><span className="text-text-secondary">{availableCount} Available</span></div></div></section>
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="text-heading text-text-primary">Complaints by Status</div><div className="mt-xs text-video-title text-text-secondary">Current complaint workload</div><div className="mt-2xl flex flex-col gap-xl">{complaintCounts.map((item) => <div key={item.label}><div className="flex items-center justify-between"><Badge label={item.label} variant={item.variant} /><div className="text-label-sm text-text-primary">{item.value}</div></div><div className="complaint-report-track mt-md"><div className={`complaint-report-bar ${item.className}`} style={{ width: `${(item.value / totalComplaints) * 100}%` }} /></div></div>)}</div></section>
      </div> : null}
    </div>
  )
}
