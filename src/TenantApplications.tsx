import { useCallback, useEffect, useState } from "react"
import { Badge, Button, InputField, TextareaField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled"
type Application = {
  id: string
  property_id: string
  property: string
  location: string
  move_in_date: string
  occupants: number
  occupation: string | null
  message: string | null
  created_at: string
  status: ApplicationStatus
}

function statusLabel(status: ApplicationStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusVariant(status: ApplicationStatus) {
  if (status === "approved") return "success" as const
  if (status === "rejected") return "danger" as const
  if (status === "cancelled") return "secondary" as const
  return "warning" as const
}

function formatApplicationDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function ApplyForm({
  tenantId,
  propertyId,
  onBack,
  onSubmitted,
}: {
  tenantId: string
  propertyId: string
  onBack: () => void
  onSubmitted: () => Promise<void>
}) {
  const [property, setProperty] = useState<{
    title: string
    address: string
    city: string
  } | null>(null)
  const [moveIn, setMoveIn] = useState("")
  const [occupants, setOccupants] = useState("1")
  const [occupation, setOccupation] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let active = true
    void supabase
      .from("properties")
      .select("title, address, city")
      .eq("id", propertyId)
      .eq("status", "approved")
      .single()
      .then(({ data, error: queryError }) => {
        if (!active) return
        if (queryError)
          setError(`Unable to load this property: ${queryError.message}`)
        else setProperty(data)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [propertyId])

  const submit = async () => {
    const parsedOccupants = Number(occupants)
    if (!moveIn) {
      setError("Choose a preferred move-in date.")
      return
    }
    if (!Number.isInteger(parsedOccupants) || parsedOccupants < 1) {
      setError("Choose a move-in date and enter at least one occupant.")
      return
    }
    if (moveIn < new Date().toISOString().slice(0, 10)) {
      setError("Choose a move-in date that is today or later.")
      return
    }
    if (!message.trim()) {
      setError("Write a message to the owner before submitting.")
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase.from("applications").insert({
      tenant_id: tenantId,
      property_id: propertyId,
      move_in_date: moveIn,
      occupants: parsedOccupants,
      occupation: occupation.trim() || null,
      message: message.trim() || null,
      status: "pending",
    })
    setSubmitting(false)
    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "You have already applied for this property."
          : `Unable to submit application: ${insertError.message}`,
      )
      return
    }
    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="p-2xl text-label-sm text-text-secondary">
        Loading property...
      </div>
    )
  }
  if (success) {
    return (
      <div className="flex min-h-full items-center justify-center p-xl md:p-2xl">
        <div className="dashboard-card w-full rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center">
          <Badge label="Submitted" variant="success" />
          <div className="mt-xl text-title text-text-primary">
            Application submitted
          </div>
          <div className="mt-md text-label-sm text-text-secondary">
            The owner will review your application.
          </div>
          <Button
            variant="primary"
            className="mt-2xl"
            onClick={() => void onSubmitted()}
          >
            View my applications
          </Button>
        </div>
      </div>
    )
  }
  if (!property) {
    return (
      <div className="p-2xl text-label-sm text-danger" role="alert">
        {error}
      </div>
    )
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <Button variant="subtle" size="small" onClick={onBack}>
          Back to applications
        </Button>
        <div className="mt-lg text-title text-text-primary">Apply to rent</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          {property.title} · {property.address}, {property.city}
        </div>
      </div>
      <div className="application-form dashboard-card w-full rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
        <div className="flex flex-col gap-xl">
          <InputField
            type="date"
            label="Preferred move-in date"
            value={moveIn}
            onChange={setMoveIn}
          />
          <InputField
            type="number"
            label="Number of occupants"
            value={occupants}
            onChange={setOccupants}
          />
          <InputField
            label="Occupation"
            placeholder="e.g. Product Designer"
            value={occupation}
            onChange={setOccupation}
          />
          <TextareaField
            label="Message to the owner"
            description="Briefly introduce yourself and explain why this home is a good fit."
            placeholder="Write a short message"
            rows={5}
            value={message}
            onChange={setMessage}
          />
          <div className="flex justify-end border-t border-border-secondary pt-xl">
            <Button
              variant="primary"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Submitting..." : "Submit application"}
            </Button>
          </div>
          {error ? (
            <div className="text-label-sm text-danger" role="alert">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function TenantApplications({
  tenantId,
  initialPropertyId,
  initialView = "list",
}: {
  tenantId: string
  initialPropertyId?: string | null
  initialView?: "list" | "apply"
}) {
  const [view, setView] = useState(initialView)
  const [propertyId, setPropertyId] = useState(initialPropertyId ?? null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPropertyId(initialPropertyId ?? null)
    if (initialPropertyId) setView("apply")
  }, [initialPropertyId])

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from("applications")
      .select(
        "id, property_id, move_in_date, occupants, occupation, message, created_at, status, properties(title, address, city)",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
    if (queryError) {
      setError(`Unable to load applications: ${queryError.message}`)
    } else {
      setApplications(
        (data ?? []).map((item) => {
          const property = Array.isArray(item.properties)
            ? item.properties[0]
            : item.properties
          return {
            id: item.id,
            property_id: item.property_id,
            property: property?.title ?? "Property",
            location: property
              ? `${property.address}, ${property.city}`
              : "Location unavailable",
            move_in_date: item.move_in_date,
            occupants: item.occupants,
            occupation: item.occupation,
            message: item.message,
            created_at: item.created_at,
            status: item.status,
          }
        }),
      )
    }
    setLoading(false)
  }, [tenantId])

  const cancelApplication = async (applicationId: string) => {
    setError(null)
    const { data: cancelledApplication, error: cancelError } = await supabase
      .from("applications")
      .update({ status: "cancelled" })
      .eq("id", applicationId)
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle()

    if (cancelError) {
      setError(`Unable to cancel application: ${cancelError.message}`)
      return
    }
    if (!cancelledApplication) {
      setError("Only pending applications can be cancelled.")
      return
    }

    await loadApplications()
  }

  useEffect(() => {
    let active = true
    void loadApplications().finally(() => {
      if (!active) return
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [loadApplications])

  if (view === "apply" && propertyId) {
    return (
      <ApplyForm
        tenantId={tenantId}
        propertyId={propertyId}
        onBack={() => setView("list")}
        onSubmitted={async () => {
          await loadApplications()
          setView("list")
          setPropertyId(null)
        }}
      />
    )
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">My Applications</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Track your rental applications and owner decisions.
        </div>
      </div>
      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading applications...
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
      {!loading && !error && applications.length === 0 ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          You have not submitted any applications yet. Apply from Search
          Properties.
        </div>
      ) : null}
      <div className="flex flex-col gap-xl">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onCancel={() => void cancelApplication(application.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ApplicationCard({
  application,
  onCancel,
}: {
  application: Application
  onCancel: () => void
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <article className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
      <div className="flex flex-col gap-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-md">
            <div className="text-heading text-text-primary">
              {application.property}
            </div>
            <Badge
              label={statusLabel(application.status)}
              variant={statusVariant(application.status)}
            />
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            {application.location}
          </div>
          <div className="mt-lg flex flex-wrap gap-xl text-video-title text-text-secondary">
            <span>
              Move-in: {formatApplicationDate(application.move_in_date)}
            </span>
            <span>
              Submitted: {formatApplicationDate(application.created_at)}
            </span>
            <span>Occupants: {application.occupants}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-md">
          <Button
            type="button"
            variant="subtle"
            size="small"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {detailsOpen ? "Hide details" : "View details"}
          </Button>
          {application.status === "pending" ? (
            <Button
              type="button"
              variant="neutral"
              size="small"
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
      {detailsOpen ? (
        <div className="mt-xl grid gap-lg border-t border-border-secondary pt-xl text-label-sm text-text-secondary sm:grid-cols-2">
          <div>
            <div className="text-label text-text-primary">Application ID</div>
            <div className="mt-xs break-all">{application.id}</div>
          </div>
          <div>
            <div className="text-label text-text-primary">Occupation</div>
            <div className="mt-xs">
              {application.occupation || "Not provided"}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-label text-text-primary">Message</div>
            <div className="mt-xs whitespace-pre-wrap">
              {application.message || "No message provided"}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}
