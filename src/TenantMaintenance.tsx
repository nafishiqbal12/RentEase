import { useState } from "react"
import { Badge, Button, SelectField, TextareaField } from "@figma/astraui"

type MaintenanceStatus = "Pending" | "Assigned" | "In Progress" | "Completed"

type Request = {
  id: number
  title: string
  category: string
  urgency: string
  created: string
  status: MaintenanceStatus
}

const statusOrder: MaintenanceStatus[] = [
  "Pending",
  "Assigned",
  "In Progress",
  "Completed",
]

const initialRequests: Request[] = [
  {
    id: 1,
    title: "Leaking kitchen tap",
    category: "Plumbing",
    urgency: "High",
    created: "21 Oct 2025",
    status: "In Progress",
  },
  {
    id: 2,
    title: "Bedroom AC servicing",
    category: "Electrical",
    urgency: "Medium",
    created: "19 Oct 2025",
    status: "Assigned",
  },
  {
    id: 3,
    title: "Balcony light replacement",
    category: "Electrical",
    urgency: "Low",
    created: "12 Oct 2025",
    status: "Completed",
  },
]

function statusVariant(status: MaintenanceStatus) {
  if (status === "Completed") return "success" as const
  if (status === "Assigned") return "brand" as const
  return "warning" as const
}

function RequestTimeline({ status }: { status: MaintenanceStatus }) {
  const currentIndex = statusOrder.indexOf(status)

  return (
    <div className="request-timeline mt-xl">
      {statusOrder.map((item, index) => (
        <div
          key={item}
          className={`request-timeline-step ${
            index <= currentIndex ? "request-timeline-step-active" : ""
          } ${index < currentIndex ? "request-timeline-step-complete" : ""}`}
        >
          <div className="request-timeline-dot" />
          <div className="mt-md text-video-title">{item}</div>
        </div>
      ))}
    </div>
  )
}

export default function TenantMaintenance() {
  const [requests, setRequests] = useState(initialRequests)
  const [category, setCategory] = useState("plumbing")
  const [description, setDescription] = useState("")
  const [urgency, setUrgency] = useState("medium")
  const [photoName, setPhotoName] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")

  const choosePhoto = async () => {
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
            description: "Maintenance photo",
            accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
          },
        ],
      })
      const file = await handle.getFile()
      setPhotoName(file.name)
      setPhotoUrl(URL.createObjectURL(file))
    } catch {
      // Closing the system picker is an expected no-op.
    }
  }

  const submit = () => {
    setRequests((current) => [
      {
        id: Date.now(),
        title: description.split(".")[0] || "New maintenance request",
        category:
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
        urgency:
          urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase(),
        created: "Today",
        status: "Pending",
      },
      ...current,
    ])
    setDescription("")
    setPhotoName("")
    setPhotoUrl("")
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Maintenance</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Report an issue and follow its progress.
        </div>
      </div>

      <div className="maintenance-layout">
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">
            New maintenance request
          </div>
          <div className="mt-xl flex flex-col gap-xl">
            <SelectField
              label="Category"
              options={[
                { value: "plumbing", label: "Plumbing" },
                { value: "electrical", label: "Electrical" },
                { value: "appliance", label: "Appliance" },
                { value: "structural", label: "Structural" },
                { value: "other", label: "Other" },
              ]}
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
              label="Urgency"
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "emergency", label: "Emergency" },
              ]}
              value={urgency}
              onChange={setUrgency}
            />

            <div>
              <div className="mb-lg text-label text-text-primary">Photo</div>
              <div className="maintenance-upload rounded-corner-lg border border-border-selected bg-bg-faint p-xl">
                {photoUrl ? (
                  <img
                    className="maintenance-preview w-full rounded-corner-md object-cover"
                    src={photoUrl}
                    alt={photoName}
                  />
                ) : (
                  <div className="text-center text-label-sm text-text-secondary">
                    Add a clear photo of the issue
                  </div>
                )}
                <Button
                  variant="neutral"
                  size="small"
                  className="mt-lg w-full"
                  onClick={choosePhoto}
                >
                  {photoName ? "Replace photo" : "Choose photo"}
                </Button>
              </div>
            </div>

            <Button variant="primary" onClick={submit}>
              Submit request
            </Button>
          </div>
        </section>

        <section aria-label="Maintenance requests">
          <div className="mb-lg text-heading text-text-primary">
            Your requests
          </div>
          <div className="flex flex-col gap-xl">
            {requests.map((request) => (
              <article
                key={request.id}
                className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
              >
                <div className="flex items-start justify-between gap-lg">
                  <div>
                    <div className="text-label text-text-primary">
                      {request.title}
                    </div>
                    <div className="mt-xs text-video-title text-text-secondary">
                      {request.category} · {request.urgency} urgency ·{" "}
                      {request.created}
                    </div>
                  </div>
                  <Badge
                    label={request.status}
                    variant={statusVariant(request.status)}
                    className={
                      request.status === "Assigned"
                        ? "status-assigned"
                        : undefined
                    }
                  />
                </div>
                <RequestTimeline status={request.status} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
