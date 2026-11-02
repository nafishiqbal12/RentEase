import { useEffect, useState } from "react"
import { Badge, Button } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type User = { id: string; full_name: string; email: string; phone: string | null; role: string; status: string; created_at: string }

function roleVariant(role: string) {
  return role === "owner" ? "brand" as const : role === "admin" ? "danger" as const : "secondary" as const
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async () => {
    const { data, error: queryError } = await supabase.from("profiles").select("id, full_name, email, phone, role, status, created_at").order("created_at", { ascending: false })
    if (queryError) setError(`Unable to load users: ${queryError.message}`)
    else setUsers(data ?? [])
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const updateStatus = async (user: User) => {
    setSavingId(user.id)
    setError(null)
    setSuccess(null)
    const nextStatus = user.status === "active" ? "suspended" : "active"
    const { error: updateError } = await supabase.from("profiles").update({ status: nextStatus }).eq("id", user.id)
    setSavingId(null)
    if (updateError) setError(`Unable to update account: ${updateError.message}`)
    else {
      setSuccess(`${user.full_name} is now ${nextStatus}.`)
      await load()
    }
  }

  return <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl"><div><div className="text-title text-text-primary">Users</div><div className="mt-xs text-label-sm text-text-secondary">Manage tenant, owner, and administrator accounts.</div></div>{loading ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">Loading users...</div> : null}{error ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-danger" role="alert">{error}</div> : null}{success ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-brand-dark" role="status">{success}</div> : null}{!loading && !error && users.length === 0 ? <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">No user accounts found.</div> : null}{users.length > 0 ? <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"><div className="overflow-x-auto"><table className="admin-users-table w-full"><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td data-label="Name">{user.full_name}</td><td data-label="Role"><Badge label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} variant={roleVariant(user.role)} /></td><td data-label="Email">{user.email}</td><td data-label="Status"><Badge label={user.status.charAt(0).toUpperCase() + user.status.slice(1)} variant={user.status === "active" ? "success" : "danger"} /></td><td data-label="Joined">{new Date(user.created_at).toLocaleDateString()}</td><td data-label="Action"><Button variant="neutral" size="small" disabled={savingId === user.id || user.role === "admin"} className={user.status === "active" ? "admin-reject-button" : ""} onClick={() => void updateStatus(user)}>{user.status === "active" ? "Suspend" : "Activate"}</Button></td></tr>)}</tbody></table></div></section> : null}</div>
}
