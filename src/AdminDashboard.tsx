import { useEffect, useState } from "react"
import { Badge, Button } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Property = {
  id: string
  title: string
  address: string
  city: string
  monthly_rent: number
  status: string
  owner: { full_name: string } | null
}

type Application = { id: string; status: string; property: string; tenant: string }
type Lease = { id: string; status: string; property: string; tenant: string }

function statusVariant(status: string) {
  if (["approved", "active", "paid"].includes(status)) return "success" as const
  if (["rejected", "terminated", "overdue"].includes(status)) return "danger" as const
  return "warning" as const
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter: string) => letter.toUpperCase())
}

export default function AdminDashboard({
  adminId,
  queueOnly = false,
}: {
  adminId: string
  queueOnly?: boolean
}) {
  const [properties, setProperties] = useState<Property[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [leases, setLeases] = useState<Lease[]>([])
  const [counts, setCounts] = useState({ users: 0, owners: 0, tenants: 0, properties: 0, payments: 0 })
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const [profilesResult, propertyResult, applicationResult, leaseResult, paymentResult] = await Promise.all([
      supabase.from("profiles").select("id, role"),
      supabase.from("properties").select("id, title, address, city, monthly_rent, status, profiles!properties_owner_id_fkey(full_name)").order("created_at", { ascending: false }),
      supabase.from("applications").select("id, status, properties(title), profiles!applications_tenant_id_fkey(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("leases").select("id, status, properties(title), profiles!leases_tenant_id_fkey(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("payments").select("id", { count: "exact", head: true }),
    ])
    const firstError = [profilesResult.error, propertyResult.error, applicationResult.error, leaseResult.error, paymentResult.error].find(Boolean)
    if (firstError) {
      setError(`Unable to load admin data: ${firstError.message}`)
      setLoading(false)
      return
    }
    const profiles = profilesResult.data ?? []
    setCounts({
      users: profiles.length,
      owners: profiles.filter((profile) => profile.role === "owner").length,
      tenants: profiles.filter((profile) => profile.role === "tenant").length,
      properties: propertyResult.data?.length ?? 0,
      payments: paymentResult.count ?? 0,
    })
    setProperties((propertyResult.data ?? []).map((item) => ({
      ...item,
      owner: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
    })))
    setApplications((applicationResult.data ?? []).map((item) => {
      const property = Array.isArray(item.properties) ? item.properties[0] : item.properties
      const tenant = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      return { id: item.id, status: item.status, property: property?.title ?? "Property", tenant: tenant?.full_name ?? "Tenant" }
    }))
    setLeases((leaseResult.data ?? []).map((item) => {
      const property = Array.isArray(item.properties) ? item.properties[0] : item.properties
      const tenant = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      return { id: item.id, status: item.status, property: property?.title ?? "Property", tenant: tenant?.full_name ?? "Tenant" }
    }))
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const reviewProperty = async (property: Property, status: "approved" | "rejected") => {
    setSavingId(property.id)
    setError(null)
    setSuccess(null)
    const { error: updateError } = await supabase.from("properties").update({
      status,
      verified_by: status === "approved" ? adminId : null,
      verified_at: status === "approved" ? new Date().toISOString() : null,
    }).eq("id", property.id)
    setSavingId(null)
    if (updateError) setError(`Unable to review property: ${updateError.message}`)
    else {
      setSuccess(`Property ${status}.`)
      await load()
    }
  }

  const activateLease = async (lease: Lease) => {
    setSavingId(lease.id)
    setError(null)
    setSuccess(null)
    const { error: updateError } = await supabase.from("leases").update({
      status: "active",
      signed_at: new Date().toISOString(),
    }).eq("id", lease.id).eq("status", "draft")
    setSavingId(null)
    if (updateError) setError(`Unable to activate lease: ${updateError.message}`)
    else {
      setSuccess("Lease activated.")
      await load()
    }
  }

  const pendingProperties = properties.filter((property) => property.status === "pending_verification")

  if (loading) {
    return <div className="rent-page-content p-xl md:p-2xl"><div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">Loading admin dashboard...</div></div>
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div><div className="text-title text-text-primary">{queueOnly ? "Property Verification" : "Admin Dashboard"}</div><div className="mt-xs text-label-sm text-text-secondary">Review platform activity and manage RentEase operations.</div></div>
      {error ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-danger" role="alert">{error}</div> : null}
      {success ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-brand-dark" role="status">{success}</div> : null}
      {!queueOnly ? <section className="grid grid-cols-1 gap-xl sm:grid-cols-2 xl:grid-cols-5" aria-label="Platform summary">
        {[["Total Users", counts.users], ["Owners", counts.owners], ["Tenants", counts.tenants], ["Properties", counts.properties], ["Payments", counts.payments]].map(([name, value]) => <div key={name} className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="text-label-sm text-text-secondary">{name}</div><div className="mt-md text-heading text-text-primary">{value}</div><div className="mt-xs text-video-title text-text-secondary">Live Supabase records</div></div>)}
      </section> : null}
      <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
        <div className="flex items-center justify-between gap-lg p-xl"><div><div className="text-heading text-text-primary">Pending Property Approvals</div><div className="mt-xs text-video-title text-text-secondary">Verify owner listings before publication.</div></div><Badge label={`${pendingProperties.length} pending`} variant="warning" /></div>
        {pendingProperties.length === 0 ? <div className="p-xl text-label-sm text-text-secondary">No pending property approvals.</div> : <div className="overflow-x-auto"><table className="admin-table w-full"><thead><tr><th>Property</th><th>Owner</th><th>Rent</th><th>Action</th></tr></thead><tbody>{pendingProperties.map((property) => <tr key={property.id}><td data-label="Property">{property.title}<div className="text-video-title text-text-secondary">{property.address}, {property.city}</div></td><td data-label="Owner">{property.owner?.full_name ?? "Owner"}</td><td data-label="Rent">৳{Number(property.monthly_rent).toLocaleString("en-BD")}</td><td data-label="Action"><div className="flex gap-md"><Button variant="primary" size="small" disabled={savingId === property.id} onClick={() => void reviewProperty(property, "approved")}>Approve</Button><Button variant="neutral" size="small" className="admin-reject-button" disabled={savingId === property.id} onClick={() => void reviewProperty(property, "rejected")}>Reject</Button></div></td></tr>)}</tbody></table></div>}
      </section>
      {!queueOnly ? <div className="grid grid-cols-1 gap-xl xl:grid-cols-2">
        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"><div className="p-xl"><div className="text-heading text-text-primary">Applications</div><div className="mt-xs text-video-title text-text-secondary">Recent tenant applications.</div></div>{applications.length === 0 ? <div className="p-xl text-label-sm text-text-secondary">No applications found.</div> : <div className="overflow-x-auto"><table className="admin-table w-full"><thead><tr><th>Tenant</th><th>Property</th><th>Status</th></tr></thead><tbody>{applications.map((item) => <tr key={item.id}><td data-label="Tenant">{item.tenant}</td><td data-label="Property">{item.property}</td><td data-label="Status"><Badge label={label(item.status)} variant={statusVariant(item.status)} /></td></tr>)}</tbody></table></div>}</section>
        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"><div className="p-xl"><div className="text-heading text-text-primary">Lease Statuses</div><div className="mt-xs text-video-title text-text-secondary">Activate draft leases after verification.</div></div>{leases.length === 0 ? <div className="p-xl text-label-sm text-text-secondary">No leases found.</div> : <div className="overflow-x-auto"><table className="admin-table w-full"><thead><tr><th>Tenant</th><th>Property</th><th>Status</th><th>Action</th></tr></thead><tbody>{leases.map((lease) => <tr key={lease.id}><td data-label="Tenant">{lease.tenant}</td><td data-label="Property">{lease.property}</td><td data-label="Status"><Badge label={label(lease.status)} variant={statusVariant(lease.status)} /></td><td data-label="Action">{lease.status === "draft" ? <Button variant="primary" size="small" disabled={savingId === lease.id} onClick={() => void activateLease(lease)}>Activate</Button> : <span className="text-video-title text-text-secondary">No action</span>}</td></tr>)}</tbody></table></div>}</section>
      </div> : null}
      {!queueOnly ? <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"><div className="text-heading text-text-primary">Platform Activity</div><div className="mt-xs text-video-title text-text-secondary">Payment records tracked: {counts.payments}. Use Transactions for detailed payment activity and Users for account management.</div></section> : null}
    </div>
  )
}
