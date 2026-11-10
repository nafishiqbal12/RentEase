import { useEffect, useState } from "react"
import { Badge, Button, InputField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Status = "pending" | "approved" | "rejected"
type Applicant = {
  id: string
  tenantId: string
  propertyId: string
  name: string
  property: string
  moveIn: string
  submitted: string
  occupants: number
  occupation: string
  message: string
  monthlyRent: number
  securityDeposit: number
  status: Status
}

function variant(status: Status) {
  if (status === "approved") return "success" as const
  if (status === "rejected") return "danger" as const
  return "warning" as const
}

function ApplicantDrawer({
  applicant,
  onClose,
  onDecision,
  onCreateLease,
  saving,
}: {
  applicant: Applicant
  onClose: () => void
  onDecision: (status: "approved" | "rejected") => void
  onCreateLease: () => void
  saving: boolean
}) {
  return (
    <div className="admin-drawer-layer fixed inset-0">
      <div className="admin-drawer-scrim absolute inset-0" aria-hidden="true" />
      <aside
        className="application-drawer relative ml-auto flex h-full flex-col bg-surface-bg"
        role="dialog"
        aria-modal="true"
        aria-label={`Application from ${applicant.name}`}
      >
        <div className="flex items-start justify-between gap-lg border-b border-border-primary p-xl">
          <div>
            <div className="text-heading text-text-primary">
              Applicant Details
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              {applicant.property}
            </div>
          </div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-xl">
          <div className="text-heading text-text-primary">{applicant.name}</div>
          <div className="admin-info-grid mt-2xl">
            {[
              ["Occupants", String(applicant.occupants)],
              ["Preferred move-in", applicant.moveIn],
              ["Occupation", applicant.occupation || "Not provided"],
              [
                "Monthly rent",
                `৳${applicant.monthlyRent.toLocaleString("en-BD")}`,
              ],
              [
                "Security deposit",
                `৳${applicant.securityDeposit.toLocaleString("en-BD")}`,
              ],
              ["Submitted", applicant.submitted],
            ].map(([label, value]) => (
              <div key={label} className="rounded-corner-md bg-bg-faint p-lg">
                <div className="text-video-title text-text-secondary">
                  {label}
                </div>
                <div className="mt-xs text-label-sm text-text-primary">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2xl">
            <div className="text-label text-text-primary">
              Message from applicant
            </div>
            <div className="mt-md rounded-corner-md bg-bg-faint p-xl text-label-sm text-text-secondary">
              {applicant.message || "No message provided."}
            </div>
          </div>
        </div>
        <div className="border-t border-border-primary bg-surface-bg p-xl">
          {applicant.status === "pending" ? (
            <div className="flex gap-md">
              <Button
                variant="neutral"
                className="admin-reject-button flex-1"
                disabled={saving}
                onClick={() => onDecision("rejected")}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={saving}
                onClick={() => onDecision("approved")}
              >
                {saving ? "Saving..." : "Approve and create agreement"}
              </Button>
            </div>
          ) : (
            <Button variant="neutral" className="w-full" onClick={onClose}>
              Done
            </Button>
          )}
        </div>
      </aside>
    </div>
  )
}

function LeaseForm({
  applicant,
  ownerId,
  onClose,
  onSuccess,
}: {
  applicant: Applicant
  ownerId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [startDate, setStartDate] = useState(applicant.moveIn)
  const [endDate, setEndDate] = useState("")
  const [duration, setDuration] = useState("12")
  const [rent, setRent] = useState(String(applicant.monthlyRent))
  const [deposit, setDeposit] = useState(String(applicant.securityDeposit))
  const [dueDay, setDueDay] = useState("5")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const createLease = async () => {
    if (
      !startDate ||
      !endDate ||
      Number(duration) < 1 ||
      Number(rent) <= 0 ||
      Number(deposit) < 0 ||
      Number(dueDay) < 1 ||
      Number(dueDay) > 28
    ) {
      setError(
        "Enter valid lease dates, term, rent, deposit, and a payment day from 1 to 28.",
      )
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from("leases").insert({
      application_id: applicant.id,
      property_id: applicant.propertyId,
      owner_id: ownerId,
      tenant_id: applicant.tenantId,
      monthly_rent: Number(rent),
      security_deposit: Number(deposit),
      duration_months: Number(duration),
      start_date: startDate,
      end_date: endDate,
      payment_due_day: Number(dueDay),
      status: "draft",
    })
    setSaving(false)
    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "A lease already exists for this approved application."
          : `Unable to create lease: ${insertError.message}`,
      )
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/20 p-xl">
        <div className="dashboard-card w-full max-w-lg rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center">
          <Badge label="Saved" variant="success" />
          <div className="mt-xl text-title text-text-primary">
            Lease created
          </div>
          <div className="mt-md text-label-sm text-text-secondary">
            The lease was saved as a draft for admin completion.
          </div>
          <Button variant="primary" className="mt-xl" onClick={onSuccess}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/20 p-xl">
      <div className="dashboard-card w-full max-w-2xl rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
        <div className="flex items-center justify-between">
          <div className="text-heading text-text-primary">Create lease</div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-xs text-label-sm text-text-secondary">
          {applicant.property} · {applicant.name}
        </div>
        <div className="mt-xl grid grid-cols-1 gap-lg sm:grid-cols-2">
          <InputField
            type="date"
            label="Start date"
            value={startDate}
            onChange={setStartDate}
          />
          <InputField
            type="date"
            label="End date"
            value={endDate}
            onChange={setEndDate}
          />
          <InputField
            type="number"
            label="Duration (months)"
            value={duration}
            onChange={setDuration}
          />
          <InputField
            type="number"
            label="Monthly rent"
            value={rent}
            onChange={setRent}
          />
          <InputField
            type="number"
            label="Security deposit"
            value={deposit}
            onChange={setDeposit}
          />
          <InputField
            type="number"
            label="Payment due day (1-28)"
            value={dueDay}
            onChange={setDueDay}
          />
        </div>
        {error ? (
          <div className="mt-lg text-label-sm text-danger" role="alert">
            {error}
          </div>
        ) : null}
        <Button
          variant="primary"
          className="mt-xl"
          disabled={saving}
          onClick={() => void createLease()}
        >
          {saving ? "Saving..." : "Save draft lease"}
        </Button>
      </div>
    </div>
  )
}

export default function OwnerApplications({ ownerId }: { ownerId: string }) {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [leaseApplicant, setLeaseApplicant] = useState<Applicant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selected = applicants.find((item) => item.id === selectedId) ?? null

  const loadApplications = async () => {
    const { data, error: queryError } = await supabase
      .from("applications")
      .select(
        "id, tenant_id, property_id, move_in_date, created_at, occupants, occupation, message, status, properties!inner(title, owner_id, monthly_rent, security_deposit), profiles!applications_tenant_id_fkey(full_name)",
      )
      .eq("properties.owner_id", ownerId)
      .order("created_at", { ascending: false })
    if (queryError)
      setError(`Unable to load applications: ${queryError.message}`)
    else
      setApplicants(
        (data ?? []).map((item) => {
          const property = Array.isArray(item.properties)
            ? item.properties[0]
            : item.properties
          const profile = Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles
          return {
            id: item.id,
            tenantId: item.tenant_id,
            propertyId: item.property_id,
            name: profile?.full_name ?? "Tenant",
            property: property?.title ?? "Property",
            moveIn: item.move_in_date,
            submitted: new Date(item.created_at).toLocaleDateString(),
            occupants: item.occupants,
            occupation: item.occupation ?? "",
            message: item.message ?? "",
            monthlyRent: Number(property?.monthly_rent ?? 0),
            securityDeposit: Number(property?.security_deposit ?? 0),
            status: item.status,
          }
        }),
      )
    setLoading(false)
  }

  useEffect(() => {
    void loadApplications()
  }, [ownerId])

  const decide = async (status: "approved" | "rejected") => {
    if (!selected) return
    setSaving(true)
    setError(null)
    const result =
      status === "approved"
        ? await supabase.rpc("approve_rental_application", {
            application_uuid: selected.id,
          })
        : await supabase
            .from("applications")
            .update({
              status,
              reviewed_by: ownerId,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", selected.id)
            .eq("status", "pending")
    setSaving(false)
    if (result.error) {
      setError(
        `Unable to ${
          status === "approved" ? "approve" : "reject"
        } application: ${result.error.message}`,
      )
      return
    }
    setSelectedId(null)
    await loadApplications()
  }

  return (
    <>
      <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
        <div>
          <div className="text-title text-text-primary">
            Rental Applications
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Review prospective tenants and make a decision.
          </div>
        </div>
        {loading ? (
          <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
            Loading applications...
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
        {!loading && !error && applicants.length === 0 ? (
          <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
            No applications received yet.
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-xl xl:grid-cols-2">
          {applicants.map((applicant) => (
            <article
              key={applicant.id}
              className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
            >
              <div className="flex items-start justify-between gap-lg">
                <div>
                  <div className="text-heading text-text-primary">
                    {applicant.name}
                  </div>
                  <div className="mt-xs text-label-sm text-text-secondary">
                    {applicant.property}
                  </div>
                </div>
                <Badge
                  label={
                    applicant.status.charAt(0).toUpperCase() +
                    applicant.status.slice(1)
                  }
                  variant={variant(applicant.status)}
                />
              </div>
              <div className="mt-xl grid grid-cols-2 gap-md">
                <div className="rounded-corner-md bg-bg-faint p-lg">
                  <div className="text-video-title text-text-secondary">
                    Move-in
                  </div>
                  <div className="mt-xs text-label-sm text-text-primary">
                    {applicant.moveIn}
                  </div>
                </div>
                <div className="rounded-corner-md bg-bg-faint p-lg">
                  <div className="text-video-title text-text-secondary">
                    Rent
                  </div>
                  <div className="mt-xs text-label-sm text-text-primary">
                    ৳{applicant.monthlyRent.toLocaleString("en-BD")}
                  </div>
                </div>
              </div>
              <div className="mt-xl flex justify-end border-t border-border-secondary pt-lg">
                <Button
                  variant="neutral"
                  size="small"
                  onClick={() => setSelectedId(applicant.id)}
                >
                  View details
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
      {selected ? (
        <ApplicantDrawer
          applicant={selected}
          onClose={() => setSelectedId(null)}
          onDecision={(status) => void decide(status)}
          onCreateLease={() => {
            setSelectedId(null)
            setLeaseApplicant(selected)
          }}
          saving={saving}
        />
      ) : null}
      {leaseApplicant ? (
        <LeaseForm
          applicant={leaseApplicant}
          ownerId={ownerId}
          onClose={() => setLeaseApplicant(null)}
          onSuccess={() => {
            setLeaseApplicant(null)
            setError(null)
          }}
        />
      ) : null}
    </>
  )
}
