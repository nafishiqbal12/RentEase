import { useState } from "react"
import { Badge, Button } from "@figma/astraui"

type ApplicantStatus = "Pending" | "Approved" | "Rejected"

type Applicant = {
  id: number
  name: string
  property: string
  occupation: string
  occupants: number
  moveIn: string
  submitted: string
  message: string
  status: ApplicantStatus
}

const initialApplicants: Applicant[] = [
  {
    id: 1,
    name: "Nabila Islam",
    property: "Dhanmondi Family Apartment",
    occupation: "Product Designer at Pathao",
    occupants: 2,
    moveIn: "01 Nov 2025",
    submitted: "Today, 10:24 AM",
    message:
      "My husband and I are looking for a quiet long-term home close to our workplaces. We can provide employment references.",
    status: "Pending",
  },
  {
    id: 2,
    name: "Tanvir Hasan",
    property: "Gulshan Lakeview Residence",
    occupation: "Senior Finance Manager",
    occupants: 4,
    moveIn: "15 Nov 2025",
    submitted: "Yesterday, 4:15 PM",
    message:
      "We are a family of four relocating to Dhaka and are interested in a two-year lease.",
    status: "Pending",
  },
  {
    id: 3,
    name: "Mehedi Chowdhury",
    property: "Uttara Garden House",
    occupation: "Software Engineer",
    occupants: 3,
    moveIn: "01 Dec 2025",
    submitted: "21 Oct, 2:30 PM",
    message:
      "We are looking for a family home near Uttara schools and would value the private garden.",
    status: "Approved",
  },
]

function statusVariant(status: ApplicantStatus) {
  if (status === "Approved") return "success" as const
  if (status === "Rejected") return "danger" as const
  return "warning" as const
}

function ApplicantDrawer({
  applicant,
  onClose,
  onDecision,
}: {
  applicant: Applicant
  onClose: () => void
  onDecision: (status: ApplicantStatus) => void
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
          <div className="flex items-center gap-lg">
            <div className="applicant-avatar flex items-center justify-center rounded-corner-full bg-brand-muted text-label text-brand-dark">
              {applicant.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="text-heading text-text-primary">
                {applicant.name}
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Identity verified
              </div>
            </div>
          </div>

          <div className="admin-info-grid mt-2xl">
            {[
              ["Occupation", applicant.occupation],
              ["Occupants", applicant.occupants.toString()],
              ["Preferred move-in", applicant.moveIn],
              ["Submitted", applicant.submitted],
              ["Monthly income", "৳1,20,000"],
              ["Lease preference", "12 months"],
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
              {applicant.message}
            </div>
          </div>

          <div className="mt-2xl">
            <div className="text-label text-text-primary">ID document</div>
            <div className="document-viewer-mini mt-md flex items-center justify-between rounded-corner-md border border-border-primary bg-bg-faint p-xl">
              <div>
                <div className="text-label-sm text-text-primary">
                  National ID Card
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  Verified document · PDF
                </div>
              </div>
              <Badge label="Verified" variant="success" />
            </div>
          </div>
        </div>

        <div className="border-t border-border-primary bg-surface-bg p-xl">
          {applicant.status === "Pending" ? (
            <div className="flex gap-md">
              <Button
                variant="neutral"
                className="admin-reject-button flex-1"
                onClick={() => onDecision("Rejected")}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => onDecision("Approved")}
              >
                Accept
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

export default function OwnerApplications() {
  const [applicants, setApplicants] = useState(initialApplicants)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected =
    applicants.find((applicant) => applicant.id === selectedId) ?? null

  const decide = (status: ApplicantStatus) => {
    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === selectedId ? { ...applicant, status } : applicant,
      ),
    )
    setSelectedId(null)
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
                  label={applicant.status}
                  variant={statusVariant(applicant.status)}
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
                    Occupants
                  </div>
                  <div className="mt-xs text-label-sm text-text-primary">
                    {applicant.occupants}
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
          onDecision={decide}
        />
      ) : null}
    </>
  )
}
