import { useMemo, useState } from "react"
import {
  Badge,
  Button,
  InputField,
  SelectField,
  TextareaField,
} from "@figma/astraui"

type ComplaintStatus = "Submitted" | "In Review" | "Resolved"

type Complaint = {
  id: number
  subject: string
  tenant: string
  property: string
  submitted: string
  description: string
  attachment?: string
  status: ComplaintStatus
  history: Array<{ date: string event: string }>
}

const initialComplaints: Complaint[] = [
  {
    id: 1,
    subject: "Repeated noise after quiet hours",
    tenant: "Araf Rahman",
    property: "Lakeview Heights, Flat 4B",
    submitted: "24 Oct 2025",
    description:
      "There has been loud construction noise from the adjacent unit after 10 PM for several nights.",
    attachment: "noise-log-october.pdf",
    status: "Submitted",
    history: [
      { date: "24 Oct, 9:42 AM", event: "Complaint submitted by tenant" },
    ],
  },
  {
    id: 2,
    subject: "Security access issue",
    tenant: "Samira Hossain",
    property: "Gulshan Avenue Residence",
    submitted: "22 Oct 2025",
    description:
      "The visitor log is not being maintained consistently at the building entrance.",
    status: "In Review",
    history: [
      { date: "22 Oct, 2:15 PM", event: "Complaint submitted by tenant" },
      { date: "23 Oct, 10:20 AM", event: "Marked in review by admin" },
      { date: "23 Oct, 3:30 PM", event: "Owner contacted for clarification" },
    ],
  },
  {
    id: 3,
    subject: "Incorrect utility charge",
    tenant: "Nafis Ahmed",
    property: "Uttara Garden House",
    submitted: "18 Oct 2025",
    description: "The October statement includes a duplicate water charge.",
    attachment: "october-statement.jpg",
    status: "Resolved",
    history: [
      { date: "18 Oct, 11:05 AM", event: "Complaint submitted by tenant" },
      { date: "19 Oct, 9:30 AM", event: "Marked in review by admin" },
      { date: "20 Oct, 4:18 PM", event: "Duplicate charge removed" },
      { date: "20 Oct, 4:20 PM", event: "Complaint resolved" },
    ],
  },
]

function complaintVariant(status: ComplaintStatus) {
  if (status === "Resolved") return "success" as const
  if (status === "In Review") return "brand" as const
  return "warning" as const
}

function ComplaintDrawer({
  complaint,
  onClose,
  onUpdate,
}: {
  complaint: Complaint
  onClose: () => void
  onUpdate: (status: ComplaintStatus) => void
}) {
  return (
    <div className="admin-drawer-layer fixed inset-0">
      <div className="admin-drawer-scrim absolute inset-0" aria-hidden="true" />
      <aside
        className="application-drawer relative ml-auto flex h-full flex-col bg-surface-bg"
        role="dialog"
        aria-modal="true"
        aria-label={`Complaint ${complaint.id}`}
      >
        <div className="flex items-start justify-between gap-lg border-b border-border-primary p-xl">
          <div>
            <div className="text-heading text-text-primary">
              Complaint Details
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              CMP-{complaint.id.toString().padStart(4, "0")}
            </div>
          </div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-xl">
          <Badge
            label={complaint.status}
            variant={complaintVariant(complaint.status)}
            className={
              complaint.status === "In Review" ? "status-assigned" : undefined
            }
          />
          <div className="mt-lg text-heading text-text-primary">
            {complaint.subject}
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            {complaint.tenant} · {complaint.property}
          </div>

          <div className="mt-2xl rounded-corner-md bg-bg-faint p-xl text-label-sm text-text-secondary">
            {complaint.description}
          </div>

          {complaint.attachment ? (
            <div className="mt-xl rounded-corner-md border border-border-primary p-xl">
              <div className="text-video-title text-text-secondary">
                Attachment
              </div>
              <div className="mt-xs text-label-sm text-text-primary">
                {complaint.attachment}
              </div>
            </div>
          ) : null}

          <div className="mt-2xl">
            <div className="text-label text-text-primary">History log</div>
            <div className="complaint-history mt-xl">
              {complaint.history.map((item) => (
                <div
                  key={`${item.date}-${item.event}`}
                  className="history-item"
                >
                  <div className="history-dot" />
                  <div>
                    <div className="text-label-sm text-text-primary">
                      {item.event}
                    </div>
                    <div className="mt-xs text-video-title text-text-secondary">
                      {item.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border-primary p-xl">
          {complaint.status === "Resolved" ? (
            <Button variant="neutral" className="w-full" onClick={onClose}>
              Done
            </Button>
          ) : (
            <div className="flex gap-md">
              <Button
                variant="neutral"
                className="flex-1"
                disabled={complaint.status === "In Review"}
                onClick={() => onUpdate("In Review")}
              >
                Mark in review
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => onUpdate("Resolved")}
              >
                Resolve
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

function TenantComplaints() {
  const [complaints, setComplaints] = useState(initialComplaints.slice(0, 2))
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [attachment, setAttachment] = useState("")

  const chooseAttachment = async () => {
    const picker = (window as Window & {
      showOpenFilePicker?: (options: {
        multiple: boolean
        types: Array<{
          description: string
          accept: Record<string, string[]>
        }>
      }) => Promise<Array<{ getFile: () => Promise<File> }>>
    }).showOpenFilePicker
    if (!picker) return

    try {
      const [handle] = await picker({
        multiple: false,
        types: [
          {
            description: "Complaint attachment",
            accept: {
              "application/pdf": [".pdf"],
              "image/*": [".jpg", ".jpeg", ".png"],
            },
          },
        ],
      })
      setAttachment((await handle.getFile()).name)
    } catch {
      // Closing the system picker is an expected no-op.
    }
  }

  const submit = () => {
    setComplaints((current) => [
      {
        id: Date.now(),
        subject: subject || "New complaint",
        tenant: "Araf Rahman",
        property: "Lakeview Heights, Flat 4B",
        submitted: "Today",
        description,
        attachment,
        status: "Submitted",
        history: [{ date: "Today", event: "Complaint submitted by tenant" }],
      },
      ...current,
    ])
    setSubject("")
    setDescription("")
    setAttachment("")
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Complaints</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Raise a formal concern and track its resolution.
        </div>
      </div>

      <div className="complaints-layout">
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">
            Submit a complaint
          </div>
          <div className="mt-xl flex flex-col gap-xl">
            <InputField
              label="Subject"
              placeholder="Brief complaint subject"
              value={subject}
              onChange={setSubject}
            />
            <TextareaField
              label="Description"
              placeholder="Describe what happened and the outcome you expect"
              rows={6}
              value={description}
              onChange={setDescription}
            />
            <div>
              <div className="mb-lg text-label text-text-primary">
                Attachment
              </div>
              <div className="rounded-corner-md bg-bg-faint p-xl">
                <div className="text-label-sm text-text-primary">
                  {attachment || "No attachment selected"}
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  PDF, JPG, or PNG
                </div>
                <Button
                  variant="neutral"
                  size="small"
                  className="mt-lg"
                  onClick={chooseAttachment}
                >
                  Choose attachment
                </Button>
              </div>
            </div>
            <Button variant="primary" onClick={submit}>
              Submit complaint
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-lg text-heading text-text-primary">
            Your complaints
          </div>
          <div className="flex flex-col gap-xl">
            {complaints.map((complaint) => (
              <article
                key={complaint.id}
                className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
              >
                <div className="flex items-start justify-between gap-lg">
                  <div>
                    <div className="text-label text-text-primary">
                      {complaint.subject}
                    </div>
                    <div className="mt-xs text-video-title text-text-secondary">
                      Submitted {complaint.submitted}
                    </div>
                  </div>
                  <Badge
                    label={complaint.status}
                    variant={complaintVariant(complaint.status)}
                    className={
                      complaint.status === "In Review"
                        ? "status-assigned"
                        : undefined
                    }
                  />
                </div>
                <div className="mt-lg text-label-sm text-text-secondary">
                  {complaint.description}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function AdminComplaints() {
  const [complaints, setComplaints] = useState(initialComplaints)
  const [filter, setFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected =
    complaints.find((complaint) => complaint.id === selectedId) ?? null
  const filtered = useMemo(
    () =>
      complaints.filter(
        (complaint) =>
          filter === "all" ||
          complaint.status.toLowerCase().replace(" ", "-") === filter,
      ),
    [complaints, filter],
  )

  const update = (status: ComplaintStatus) => {
    setComplaints((current) =>
      current.map((complaint) =>
        complaint.id === selectedId
          ? {
              ...complaint,
              status,
              history: [
                ...complaint.history,
                {
                  date: "Today",
                  event:
                    status === "Resolved"
                      ? "Complaint resolved by admin"
                      : "Marked in review by admin",
                },
              ],
            }
          : complaint,
      ),
    )
    setSelectedId(null)
  }

  return (
    <>
      <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
        <div className="flex flex-col gap-xl sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-title text-text-primary">Complaints</div>
            <div className="mt-xs text-label-sm text-text-secondary">
              Review tenant concerns and maintain a resolution history.
            </div>
          </div>
          <div className="complaint-filter">
            <SelectField
              label="Status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "submitted", label: "Submitted" },
                { value: "in-review", label: "In Review" },
                { value: "resolved", label: "Resolved" },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="overflow-x-auto">
            <table className="rent-tracking-table w-full">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((complaint) => (
                  <tr key={complaint.id}>
                    <td data-label="Subject">{complaint.subject}</td>
                    <td data-label="Tenant">{complaint.tenant}</td>
                    <td data-label="Property">{complaint.property}</td>
                    <td data-label="Submitted">{complaint.submitted}</td>
                    <td data-label="Status">
                      <Badge
                        label={complaint.status}
                        variant={complaintVariant(complaint.status)}
                        className={
                          complaint.status === "In Review"
                            ? "status-assigned"
                            : undefined
                        }
                      />
                    </td>
                    <td data-label="Action">
                      <Button
                        variant="neutral"
                        size="small"
                        onClick={() => setSelectedId(complaint.id)}
                      >
                        View details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected ? (
        <ComplaintDrawer
          complaint={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={update}
        />
      ) : null}
    </>
  )
}

export default function ComplaintsScreen({
  role,
}: {
  role: "Tenant" | "Admin"
}) {
  return role === "Tenant" ? <TenantComplaints /> : <AdminComplaints />
}
