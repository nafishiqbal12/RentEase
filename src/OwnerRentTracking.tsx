import { useEffect, useMemo, useState } from "react"
import { Badge, Button, InputField, SelectField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Lease = {
  id: string
  tenant_id: string
  property: string
  tenant: string
  monthly_rent: number
}
type Payment = {
  id: string
  lease_id: string
  amount: number
  due_date: string
  paid_at: string | null
  status: string
}

type AdminLease = {
  id: string
  monthly_rent: number
  start_date: string
  end_date: string
  status: string
  tenant: string
  owner: string
  property: string
}

type AdminPayment = Payment & {
  tenant: string
  owner: string
  property: string
}

function paymentVariant(status: string) {
  if (status === "paid") return "success" as const
  if (status === "overdue") return "danger" as const
  return "warning" as const
}

export default function OwnerRentTracking({
  ownerId,
  scope = "Owner",
}: {
  ownerId?: string
  scope?: "Owner" | "Admin"
}) {
  const [leases, setLeases] = useState<Lease[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(scope === "Owner")
  const [error, setError] = useState<string | null>(null)
  const [selectedLeaseId, setSelectedLeaseId] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [status, setStatus] = useState("pending")
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = async () => {
    if (!ownerId || scope !== "Owner") return
    const { data: leaseData, error: leaseError } = await supabase
      .from("leases")
      .select("id, tenant_id, monthly_rent, properties(title), profiles!leases_tenant_id_fkey(full_name)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
    if (leaseError) {
      setError(`Unable to load leases: ${leaseError.message}`)
      setLoading(false)
      return
    }
    const nextLeases = (leaseData ?? []).map((lease) => {
      const property = Array.isArray(lease.properties) ? lease.properties[0] : lease.properties
      const tenant = Array.isArray(lease.profiles) ? lease.profiles[0] : lease.profiles
      return { id: lease.id, tenant_id: lease.tenant_id, monthly_rent: lease.monthly_rent, property: property?.title ?? "Property", tenant: tenant?.full_name ?? "Tenant" }
    })
    setLeases(nextLeases)
    if (!selectedLeaseId && nextLeases[0]) setSelectedLeaseId(nextLeases[0].id)
    if (nextLeases.length) {
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("id, lease_id, amount, due_date, paid_at, status")
        .in("lease_id", nextLeases.map((lease) => lease.id))
        .order("due_date", { ascending: false })
      if (paymentError) setError(`Unable to load payments: ${paymentError.message}`)
      else setPayments(paymentData ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [ownerId, scope])

  const recordPayment = async () => {
    const lease = leases.find((item) => item.id === selectedLeaseId)
    if (!lease || !amount || Number(amount) <= 0 || !dueDate) {
      setError("Choose a lease, enter a positive amount, and choose a due date.")
      return
    }
    if (status === "paid" && !paymentDate) {
      setError("A payment date is required for paid payments.")
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    const { error: insertError } = await supabase.from("payments").insert({
      lease_id: lease.id,
      tenant_id: lease.tenant_id,
      owner_id: ownerId,
      amount: Number(amount),
      due_date: dueDate,
      paid_at: status === "paid" ? new Date(`${paymentDate}T00:00:00`).toISOString() : null,
      status,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.code === "23505" ? "A payment already exists for this lease and due date." : `Unable to record payment: ${insertError.message}`)
      return
    }
    setAmount("")
    setDueDate("")
    setPaymentDate("")
    setSuccess("Payment recorded successfully.")
    await loadData()
  }

  if (scope === "Admin") {
    return <AdminRentals />
  }

  function AdminRentals() {
    const [leases, setLeases] = useState<AdminLease[]>([])
    const [payments, setPayments] = useState<AdminPayment[]>([])
    const [statusFilter, setStatusFilter] = useState("all")
    const [paymentFilter, setPaymentFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      let active = true
      const load = async () => {
        setLoading(true)
        setError(null)
        const { data: leaseData, error: leaseError } = await supabase
          .from("leases")
          .select("id, monthly_rent, start_date, end_date, status, properties(title), tenant:profiles!leases_tenant_id_fkey(full_name), owner:profiles!leases_owner_id_fkey(full_name)")
          .order("created_at", { ascending: false })
        if (leaseError) {
          if (active) {
            setError(`Unable to load rentals: ${leaseError.message}`)
            setLoading(false)
          }
          return
        }

        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("id, lease_id, amount, due_date, paid_at, status, leases(properties(title), tenant:profiles!leases_tenant_id_fkey(full_name), owner:profiles!leases_owner_id_fkey(full_name))")
          .order("due_date", { ascending: false })
        if (paymentError) {
          if (active) {
            setError(`Unable to load payment records: ${paymentError.message}`)
            setLoading(false)
          }
          return
        }
        if (!active) return

        setLeases((leaseData ?? []).map((item) => {
          const property = Array.isArray(item.properties) ? item.properties[0] : item.properties
          const tenant = Array.isArray(item.tenant) ? item.tenant[0] : item.tenant
          const owner = Array.isArray(item.owner) ? item.owner[0] : item.owner
          return {
            id: item.id,
            monthly_rent: Number(item.monthly_rent),
            start_date: item.start_date,
            end_date: item.end_date,
            status: item.status,
            tenant: tenant?.full_name ?? "Tenant",
            owner: owner?.full_name ?? "Owner",
            property: property?.title ?? "Property",
          }
        }))
        setPayments((paymentData ?? []).map((item) => {
          const lease = Array.isArray(item.leases) ? item.leases[0] : item.leases
          const property = lease?.properties && (Array.isArray(lease.properties) ? lease.properties[0] : lease.properties)
          const tenant = lease?.tenant && (Array.isArray(lease.tenant) ? lease.tenant[0] : lease.tenant)
          const owner = lease?.owner && (Array.isArray(lease.owner) ? lease.owner[0] : lease.owner)
          return {
            id: item.id,
            lease_id: item.lease_id,
            amount: Number(item.amount),
            due_date: item.due_date,
            paid_at: item.paid_at,
            status: item.status,
            tenant: tenant?.full_name ?? "Tenant",
            owner: owner?.full_name ?? "Owner",
            property: property?.title ?? "Property",
          }
        }))
        setLoading(false)
      }
      void load()
      return () => {
        active = false
      }
    }, [])

    const filteredLeases = useMemo(() => leases.filter((lease) => {
      const matchesStatus = statusFilter === "all" || lease.status === statusFilter
      const value = `${lease.tenant} ${lease.owner} ${lease.property}`.toLowerCase()
      return matchesStatus && value.includes(search.toLowerCase().trim())
    }), [leases, search, statusFilter])

    const filteredPayments = useMemo(() => payments.filter((payment) => {
      const matchesStatus = paymentFilter === "all" || payment.status === paymentFilter
      const value = `${payment.tenant} ${payment.owner} ${payment.property}`.toLowerCase()
      return matchesStatus && value.includes(search.toLowerCase().trim())
    }), [payments, paymentFilter, search])

    const activateLease = async (leaseId: string) => {
      setError(null)
      const { error: activationError } = await supabase.rpc("activate_rental_lease", { lease_uuid: leaseId })
      if (activationError) {
        setError(`Unable to activate lease: ${activationError.message}`)
        return
      }
      window.location.reload()
    }

    const paidTotal = filteredPayments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0)
    const outstandingTotal = filteredPayments.filter((payment) => payment.status !== "paid").reduce((sum, payment) => sum + payment.amount, 0)

    if (loading) {
      return <div className="rent-page-content p-xl md:p-2xl"><div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">Loading rentals...</div></div>
    }

    return (
      <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
        <div>
          <div className="text-title text-text-primary">Active Rentals</div>
          <div className="mt-xs text-label-sm text-text-secondary">Review leases and payment activity across the platform.</div>
        </div>
        {error ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-danger" role="alert">{error}</div> : null}
        {!error ? <>
          <section className="grid grid-cols-1 gap-xl sm:grid-cols-3">
            {[["Leases", filteredLeases.length, "brand"], ["Collected", `৳${paidTotal.toLocaleString("en-BD")}`, "success"], ["Outstanding", `৳${outstandingTotal.toLocaleString("en-BD")}`, "warning"]].map(([label, value, variant]) => <div key={label} className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="flex items-center justify-between"><div className="text-label-sm text-text-secondary">{label}</div><Badge label={`${label}`} variant={variant === "success" ? "success" : variant === "warning" ? "warning" : "brand"} /></div><div className="mt-md text-heading text-text-primary">{value}</div></div>)}
          </section>
          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
            <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
              <InputField label="Search" placeholder="Tenant, owner, or property" value={search} onChange={setSearch} />
              <SelectField label="Lease status" options={[{ value: "all", label: "All statuses" }, { value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "expired", label: "Expired" }, { value: "terminated", label: "Terminated" }]} value={statusFilter} onChange={setStatusFilter} />
              <SelectField label="Payment status" options={[{ value: "all", label: "All payments" }, { value: "pending", label: "Pending" }, { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" }]} value={paymentFilter} onChange={setPaymentFilter} />
            </div>
          </section>
          {!leases.length ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">No lease records found.</div> : null}
          {leases.length && !filteredLeases.length ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-center text-label-sm text-text-secondary">No leases match the selected filters.</div> : null}
          {filteredLeases.length ? <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"><div className="p-xl"><div className="text-heading text-text-primary">Lease Records</div></div><div className="overflow-x-auto"><table className="rent-tracking-table w-full"><thead><tr><th>Tenant</th><th>Owner</th><th>Property</th><th>Rent</th><th>Lease dates</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredLeases.map((lease) => <tr key={lease.id}><td data-label="Tenant">{lease.tenant}</td><td data-label="Owner">{lease.owner}</td><td data-label="Property">{lease.property}</td><td data-label="Rent">৳{lease.monthly_rent.toLocaleString("en-BD")}</td><td data-label="Lease dates">{lease.start_date} – {lease.end_date}</td><td data-label="Status"><Badge label={lease.status.charAt(0).toUpperCase() + lease.status.slice(1)} variant={paymentVariant(lease.status)} /></td><td data-label="Action">{lease.status === "draft" ? <Button size="small" variant="primary" onClick={() => void activateLease(lease.id)}>Activate</Button> : "—"}</td></tr>)}</tbody></table></div></section> : null}
          {!payments.length ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-center text-label-sm text-text-secondary">No payment records found.</div> : null}
          {payments.length && !filteredPayments.length ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-center text-label-sm text-text-secondary">No payments match the selected filters.</div> : null}
          {filteredPayments.length ? <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"><div className="p-xl"><div className="text-heading text-text-primary">Payment Records</div></div><div className="overflow-x-auto"><table className="rent-tracking-table w-full"><thead><tr><th>Tenant</th><th>Owner</th><th>Property</th><th>Amount</th><th>Due date</th><th>Payment date</th><th>Status</th></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.id}><td data-label="Tenant">{payment.tenant}</td><td data-label="Owner">{payment.owner}</td><td data-label="Property">{payment.property}</td><td data-label="Amount">৳{payment.amount.toLocaleString("en-BD")}</td><td data-label="Due date">{payment.due_date}</td><td data-label="Payment date">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "Not paid"}</td><td data-label="Status"><Badge label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} variant={paymentVariant(payment.status)} /></td></tr>)}</tbody></table></div></section> : null}
        </> : null}
      </div>
    )
  }

  const paidTotal = payments.filter((payment) => payment.status === "paid").reduce((total, payment) => total + Number(payment.amount), 0)
  const outstandingTotal = payments.filter((payment) => payment.status !== "paid").reduce((total, payment) => total + Number(payment.amount), 0)

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div><div className="text-title text-text-primary">Rent Tracking</div><div className="mt-xs text-label-sm text-text-secondary">Record and monitor payments across your active leases.</div></div>
      {loading ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">Loading rent records...</div> : null}
      {error ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-danger" role="alert">{error}</div> : null}
      {success ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-brand-dark" role="status">{success}</div> : null}
      {!loading && !error && leases.length === 0 ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">No leases are available for payment tracking yet.</div> : null}
      {leases.length > 0 ? <>
        <section className="grid grid-cols-1 gap-xl sm:grid-cols-2">
          {[["Collected", paidTotal, "success"], ["Outstanding", outstandingTotal, "warning"]].map(([label, total, badge]) => <div key={label} className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="flex items-center justify-between"><div className="text-label-sm text-text-secondary">{label}</div><Badge label={String(label)} variant={badge === "success" ? "success" : "warning"} /></div><div className="mt-md text-heading text-text-primary">৳{Number(total).toLocaleString("en-BD")}</div></div>)}
        </section>
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">Record payment</div>
          <div className="mt-xs text-video-title text-text-secondary">Payment records are protected by owner RLS and the lease/date uniqueness constraint.</div>
          <div className="mt-xl grid grid-cols-1 gap-lg md:grid-cols-2">
            <SelectField label="Lease" options={leases.map((lease) => ({ value: lease.id, label: `${lease.tenant} · ${lease.property}` }))} value={selectedLeaseId} onChange={setSelectedLeaseId} />
            <InputField type="number" label="Amount" placeholder="18000" value={amount} onChange={setAmount} />
            <InputField type="date" label="Due date" value={dueDate} onChange={setDueDate} />
            <InputField type="date" label="Payment date" value={paymentDate} onChange={setPaymentDate} />
            <SelectField label="Status" options={[{ value: "pending", label: "Pending" }, { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" }]} value={status} onChange={setStatus} />
          </div>
          <Button variant="primary" className="mt-xl" disabled={saving} onClick={() => void recordPayment()}>{saving ? "Saving..." : "Record payment"}</Button>
        </section>
        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="p-xl"><div className="text-heading text-text-primary">Payment history</div></div>
          <div className="overflow-x-auto"><table className="rent-tracking-table w-full"><thead><tr><th>Tenant</th><th>Property</th><th>Amount</th><th>Due date</th><th>Payment date</th><th>Status</th></tr></thead><tbody>
            {payments.map((payment) => { const lease = leases.find((item) => item.id === payment.lease_id); return <tr key={payment.id}><td data-label="Tenant">{lease?.tenant ?? "Tenant"}</td><td data-label="Property">{lease?.property ?? "Property"}</td><td data-label="Amount">৳{Number(payment.amount).toLocaleString("en-BD")}</td><td data-label="Due date">{payment.due_date}</td><td data-label="Payment date">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "Not paid"}</td><td data-label="Status"><Badge label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} variant={paymentVariant(payment.status)} /></td></tr> })}
          </tbody></table></div>
        </section>
      </> : null}
    </div>
  )
}
