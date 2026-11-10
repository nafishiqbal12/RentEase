import { useEffect, useMemo, useState } from "react"
import {
  Badge,
  Button,
  InputField,
  SelectField,
  TextareaField,
} from "@figma/astraui"
import { supabase } from "./lib/supabase"

type MaintenanceStatus = "pending" | "assigned" | "in_progress" | "completed"
type MaintenanceUrgency = "low" | "medium" | "high" | "emergency"
type StatusFilter = "all" | MaintenanceStatus

type LeaseOption = {
  id: string
  property_id: string
  properties: {
    title: string
    address: string
    city: string
  } | {
    title: string
    address: string
    city: string
  }[] | null
}

type MaintenanceRequest = {
  id: string
  property_id: string
  lease_id: string
  title: string
  description: string
  category: string
  urgency: MaintenanceUrgency
  status: MaintenanceStatus
  created_at: string
  updated_at: string
  owner_note: string | null
  photo_path: string | null
  leases: {
    start_date: string
    end_date: string
    properties: LeaseOption["properties"]
  } | {
    start_date: string
    end_date: string
    properties: LeaseOption["properties"]
  }[] | null
}

const categories = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "other", label: "Other" },
]

const urgencies = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "emergency", label: "Emergency" },
]

const statuses: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
]

function firstRelation<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation
}

function formatStatus(status: string) {
  return (status === "completed" ? "resolved" : status)
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value))
}

function statusVariant(status: MaintenanceStatus) {
  if (status === "completed") return "success" as const
  if (status === "assigned" || status === "in_progress") return "brand" as const
  return "warning" as const
}

function propertyLabel(property: LeaseOption["properties"]) {
  const item = firstRelation(property)
  return item
    ? `${item.title} · ${item.address}, ${item.city}`
    : "Property unavailable"
}

export default function TenantMaintenance() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [leases, setLeases] = useState<LeaseOption[]>([])
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [selectedLeaseId, setSelectedLeaseId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("plumbing")
  const [urgency, setUrgency] = useState<MaintenanceUrgency>("medium")
  const [photo, setPhoto] = useState<File | null>(null)
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setLoading(false)
      setError("Please sign in again to view maintenance requests.")
      return
    }

    setTenantId(userData.user.id)
    const [leaseResult, requestResult] = await Promise.all([
      supabase
        .from("leases")
        .select("id, property_id, properties(title, address, city)")
        .eq("tenant_id", userData.user.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("maintenance_requests")
        .select(
          "id, property_id, lease_id, title, description, category, urgency, status, owner_note, photo_path, created_at, updated_at, leases(start_date, end_date, properties(title, address, city))",
        )
        .eq("tenant_id", userData.user.id)
        .order("created_at", { ascending: false }),
    ])

    if (leaseResult.error) {
      setLoading(false)
      setError(`Unable to load your leases: ${leaseResult.error.message}`)
      return
    }
    if (requestResult.error) {
      setLoading(false)
      setError(
        `Unable to load maintenance requests: ${requestResult.error.message}`,
      )
      return
    }

    const loadedLeases = (leaseResult.data ?? []) as LeaseOption[]
    setLeases(loadedLeases)
    setRequests((requestResult.data ?? []) as MaintenanceRequest[])
    setSelectedLeaseId((current) => current || loadedLeases[0]?.id || "")
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const visibleRequests = useMemo(
    () =>
      statusFilter === "all"
        ? requests
        : requests.filter((request) => request.status === statusFilter),
    [requests, statusFilter],
  )

  const submit = async () => {
    setSuccess(null)
    setError(null)
    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const lease = leases.find((item) => item.id === selectedLeaseId)

    if (!tenantId || !lease) {
      setError("Select one of your leases before submitting a request.")
      return
    }
    if (!cleanTitle || cleanTitle.length > 160) {
      setError("Enter a title between 1 and 160 characters.")
      return
    }
    if (!cleanDescription) {
      setError("Enter a description of the issue.")
      return
    }

    setSubmitting(true)
    let photoPath: string | null = null
    if (photo) {
      const path = `${tenantId}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`
      const { error: uploadError } = await supabase.storage
        .from("maintenance-photos")
        .upload(path, photo, { contentType: photo.type, upsert: false })
      if (uploadError) {
        setError(`Unable to upload photo: ${uploadError.message}`)
        setSubmitting(false)
        return
      }
      photoPath = path
    }

    const { error: insertError } = await supabase
      .from("maintenance_requests")
      .insert({
        property_id: lease.property_id,
        lease_id: lease.id,
        tenant_id: tenantId,
        title: cleanTitle,
        description: cleanDescription,
        category,
        urgency,
        photo_path: photoPath,
        status: "pending",
      })

    if (insertError) {
      setError(`Unable to submit request: ${insertError.message}`)
      setSubmitting(false)
      return
    }

    setTitle("")
    setDescription("")
    setCategory("plumbing")
    setUrgency("medium")
    setPhoto(null)
    setSuccess("Maintenance request submitted successfully.")
    setSubmitting(false)
    await loadData()
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Maintenance</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Report an issue for one of your leased properties and follow its
          progress.
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-corner-md bg-danger-faint p-lg text-label-sm text-danger"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          className="rounded-corner-md bg-success-faint p-lg text-label-sm text-success"
        >
          {success}
        </div>
      ) : null}

      <div className="maintenance-layout">
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">
            New maintenance request
          </div>
          <div className="mt-xl flex flex-col gap-xl">
            {leases.length === 0 ? (
              <div className="rounded-corner-md bg-bg-faint p-lg text-label-sm text-text-secondary">
                You need an accessible lease before you can submit a maintenance
                request.
              </div>
            ) : (
              <SelectField
                label="Property and lease"
                options={leases.map((lease) => ({
                  value: lease.id,
                  label: propertyLabel(lease.properties),
                }))}
                value={selectedLeaseId}
                onChange={setSelectedLeaseId}
              />
            )}
            <label className="flex flex-col gap-xs text-label-sm text-text-primary">
              Photo (optional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                className="text-label-sm text-text-secondary"
              />
            </label>
            <InputField
              label="Title"
              placeholder="e.g. Leaking kitchen tap"
              value={title}
              onChange={setTitle}
            />
            <SelectField
              label="Category"
              options={categories}
              value={category}
              onChange={setCategory}
            />
            <TextareaField
              label="Description"
              placeholder="Describe the issue and where it is located"
              rows={5}
              value={description}
              onChange={setDescription}
            />
            <SelectField
              label="Priority"
              options={urgencies}
              value={urgency}
              onChange={(value) => setUrgency(value as MaintenanceUrgency)}
            />
            <Button
              variant="primary"
              onClick={() => void submit()}
              disabled={submitting || loading || leases.length === 0}
            >
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
          </div>
        </section>

        <section aria-label="Maintenance requests">
          <div className="mb-lg flex flex-wrap items-center justify-between gap-lg">
            <div className="text-heading text-text-primary">Your requests</div>
            <SelectField
              label="Filter"
              options={statuses}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />
          </div>

          {loading ? (
            <div className="rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-text-secondary">
              Loading your maintenance requests...
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-text-secondary">
              {requests.length === 0
                ? "You have not submitted any maintenance requests."
                : "No requests match this status filter."}
            </div>
          ) : (
            <div className="flex flex-col gap-xl">
              {visibleRequests.map((request) => {
                const lease = firstRelation(request.leases)
                return (
                  <article
                    key={request.id}
                    className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-lg">
                      <div>
                        <div className="text-label text-text-primary">
                          {request.title}
                        </div>
                        <div className="mt-xs text-video-title text-text-secondary">
                          {request.category} · {formatStatus(request.urgency)}{" "}
                          priority · {formatDate(request.created_at)}
                        </div>
                        <div className="mt-xs text-label-sm text-text-secondary">
                          {propertyLabel(lease?.properties ?? null)}
                        </div>
                      </div>
                      <Badge
                        label={formatStatus(request.status)}
                        variant={statusVariant(request.status)}
                      />
                    </div>
                    <div className="mt-lg rounded-corner-md bg-bg-faint p-lg text-label-sm text-text-secondary">
                      {request.description}
                    </div>
                    {lease ? (
                      <div className="mt-lg text-label-sm text-text-secondary">
                        Lease: {formatDate(lease.start_date)} –{" "}
                        {formatDate(lease.end_date)}
                      </div>
                    ) : null}
                    <div className="mt-lg text-label-sm text-text-secondary">
                      Last updated: {formatDate(request.updated_at)}
                    </div>
                    {request.owner_note ? (
                      <div className="mt-lg rounded-corner-md bg-success-faint p-lg text-label-sm text-text-secondary">
                        Owner note: {request.owner_note}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
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
                  {formatStatus(selectedRequest.status)} ·{" "}
                  {formatStatus(selectedRequest.urgency)} priority
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
              <div className="mt-xl rounded-corner-md bg-success-faint p-lg text-label-sm text-text-secondary">
                Owner note: {selectedRequest.owner_note}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}
