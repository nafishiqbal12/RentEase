import { useEffect, useState } from "react"
import { Badge, Button, SelectField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Request = {
  id: string
  title: string
  description: string
  urgency: "low" | "medium" | "high" | "emergency"
  status: "pending" | "assigned" | "in_progress" | "completed"
  owner_note: string | null
  photo_path: string | null
  created_at: string
  properties: { title: string; address: string; city: string } | null
  profiles: { full_name: string } | null
}

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Resolved" },
]

function label(value: string) {
  return (value === "completed" ? "resolved" : value)
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function variant(status: Request["status"]) {
  return status === "completed"
    ? "success" as const
    : status === "pending"
      ? "warning" as const
      : "brand" as const
}

export default function OwnerMaintenance() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)

  const load = async () => {
    setLoading(true)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError("Please sign in again to manage maintenance requests.")
      setLoading(false)
      return
    }
    const { data, error: queryError } = await supabase
      .from("maintenance_requests")
      .select(
        "id, title, description, urgency, status, owner_note, photo_path, created_at, properties!inner(title, address, city, owner_id), profiles!maintenance_requests_tenant_id_fkey(full_name)",
      )
      .eq("properties.owner_id", userData.user.id)
      .order("created_at", { ascending: false })
    if (queryError)
      setError(`Unable to load maintenance requests: ${queryError.message}`)
    else {
      setError(null)
      setRequests(
        (data ?? []).map((item) => ({
          ...item,
          properties: Array.isArray(item.properties)
            ? item.properties[0]
            : item.properties,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles,
        })) as Request[],
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const updateStatus = async (id: string, status: Request["status"]) => {
    setSavingId(id)
    setError(null)
    setSuccess(null)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setError("Please sign in again before updating a request.")
      setSavingId(null)
      return
    }
    const { error: updateError } = await supabase
      .from("maintenance_requests")
      .update({
        status,
        owner_note: notes[id]?.trim() || null,
        assigned_to: status === "pending" ? null : userData.user.id,
      })
      .eq("id", id)
    setSavingId(null)
    if (updateError)
      setError(`Unable to update request: ${updateError.message}`)
    else {
      setSuccess("Maintenance request updated.")
      await load()
    }
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Maintenance Requests</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Review tenant requests and update service progress.
        </div>
      </div>
      {error ? (
        <div
          className="rounded-corner-md bg-danger-faint p-lg text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="rounded-corner-md bg-success-faint p-lg text-label-sm text-success"
          role="status"
        >
          {success}
        </div>
      ) : null}
      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading maintenance requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          No maintenance requests for your properties.
        </div>
      ) : (
        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="overflow-x-auto">
            <table className="rent-tracking-table w-full">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Owner note</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Issue">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="text-label-sm text-text-primary">
                          {request.title}
                        </div>
                        <div className="text-video-title text-text-secondary">
                          {request.description}
                        </div>
                      </button>
                    </td>
                    <td data-label="Property">
                      {request.properties
                        ? `${request.properties.title}, ${request.properties.city}`
                        : "Unavailable"}
                    </td>
                    <td data-label="Tenant">
                      {request.profiles?.full_name ?? "Tenant"}
                    </td>
                    <td data-label="Urgency">{label(request.urgency)}</td>
                    <td data-label="Status">
                      <Badge
                        label={label(request.status)}
                        variant={variant(request.status)}
                      />
                    </td>
                    <td data-label="Owner note">
                      <input
                        className="w-full rounded-corner-md border border-border-primary bg-surface-bg p-sm text-label-sm"
                        placeholder="Optional note"
                        value={notes[request.id] ?? request.owner_note ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td data-label="Update">
                      <SelectField
                        label="Status"
                        options={statuses}
                        value={request.status}
                        onChange={(value) =>
                          void updateStatus(
                            request.id,
                            value as Request["status"],
                          )
                        }
                        disabled={savingId === request.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {selectedRequest ? (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-xl">
          <section
            className="dashboard-card w-full max-w-xl rounded-corner-lg border border-border-primary bg-surface-bg p-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-lg">
              <div>
                <div className="text-title text-text-primary">
                  {selectedRequest.title}
                </div>
                <div className="mt-xs text-label-sm text-text-secondary">
                  {label(selectedRequest.status)} ·{" "}
                  {label(selectedRequest.urgency)} priority
                </div>
              </div>
              <Button
                variant="subtle"
                size="small"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </div>
            <div className="mt-xl whitespace-pre-wrap text-label-sm text-text-secondary">
              {selectedRequest.description}
            </div>
            {selectedRequest.photo_path ? (
              <img
                className="mt-xl max-h-64 w-full rounded-corner-md object-contain"
                src={
                  supabase.storage
                    .from("maintenance-photos")
                    .getPublicUrl(selectedRequest.photo_path).data.publicUrl
                }
                alt="Maintenance issue"
              />
            ) : null}
            {selectedRequest.owner_note ? (
              <div className="mt-xl rounded-corner-md bg-bg-faint p-lg text-label-sm text-text-secondary">
                Owner note: {selectedRequest.owner_note}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}
