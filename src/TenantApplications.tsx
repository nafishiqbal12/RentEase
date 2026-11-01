import { type DragEvent, type KeyboardEvent, useState } from "react"
import { Badge, Button, InputField, TextareaField } from "@figma/astraui"

type ApplicationStatus = "Pending" | "Approved" | "Rejected" | "Cancelled"

type Application = {
  id: number
  property: string
  location: string
  moveIn: string
  submitted: string
  status: ApplicationStatus
}

const initialApplications: Application[] = [
  {
    id: 1,
    property: "Sunlit Furnished Apartment",
    location: "Dhanmondi, Dhaka",
    moveIn: "01 Nov 2025",
    submitted: "24 Oct 2025",
    status: "Pending",
  },
  {
    id: 2,
    property: "Modern Lakeview Residence",
    location: "Gulshan 2, Dhaka",
    moveIn: "15 Oct 2025",
    submitted: "03 Oct 2025",
    status: "Approved",
  },
  {
    id: 3,
    property: "Quiet Family Home",
    location: "Uttara, Dhaka",
    moveIn: "01 Sep 2025",
    submitted: "18 Aug 2025",
    status: "Rejected",
  },
  {
    id: 4,
    property: "Compact City Apartment",
    location: "Banani, Dhaka",
    moveIn: "10 Aug 2025",
    submitted: "26 Jul 2025",
    status: "Cancelled",
  },
]

function applicationVariant(status: ApplicationStatus) {
  if (status === "Approved") return "success" as const
  if (status === "Rejected") return "danger" as const
  if (status === "Cancelled") return "secondary" as const
  return "warning" as const
}

function ApplyForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void
  onSubmit: (application: Application) => void
}) {
  const [moveIn, setMoveIn] = useState("")
  const [occupants, setOccupants] = useState("1")
  const [occupation, setOccupation] = useState("")
  const [message, setMessage] = useState("")
  const [documentName, setDocumentName] = useState("")

  const useDocument = (files: FileList | File[]) => {
    const file = Array.from(files).find(
      (item) =>
        item.type === "application/pdf" || item.type.startsWith("image/"),
    )
    if (file) setDocumentName(file.name)
  }

  const browseDocument = async () => {
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
      const handles = await picker({
        multiple: false,
        types: [
          {
            description: "Identity document",
            accept: {
              "application/pdf": [".pdf"],
              "image/*": [".jpg", ".jpeg", ".png"],
            },
          },
        ],
      })
      useDocument(await Promise.all(handles.map((handle) => handle.getFile())))
    } catch {
      // Closing the system picker is an expected no-op.
    }
  }

  const dropDocument = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    useDocument(event.dataTransfer.files)
  }

  const handleDropzoneKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      browseDocument()
    }
  }

  const submit = () => {
    onSubmit({
      id: Date.now(),
      property: "Sunlit Furnished Apartment",
      location: "Dhanmondi, Dhaka",
      moveIn: moveIn || "Date not selected",
      submitted: "Today",
      status: "Pending",
    })
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <Button variant="subtle" size="small" onClick={onBack}>
          Back to applications
        </Button>
        <div className="mt-lg text-title text-text-primary">Apply to rent</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Sunlit Furnished Apartment · Dhanmondi, Dhaka
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

          <div>
            <div className="mb-lg text-label text-text-primary">
              ID document
            </div>
            <div
              className="document-dropzone flex cursor-pointer flex-col items-center justify-center rounded-corner-lg border border-border-selected bg-bg-faint p-2xl text-center focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
              role="button"
              tabIndex={0}
              onClick={browseDocument}
              onKeyDown={handleDropzoneKey}
              onDragOver={(event) => event.preventDefault()}
              onDrop={dropDocument}
            >
              <div className="text-label-sm text-text-primary">
                {documentName || "Drop your NID or passport here"}
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                PDF, JPG, or PNG
              </div>
              <Button
                type="button"
                variant="neutral"
                size="small"
                className="mt-lg"
                onClick={(event) => {
                  event.stopPropagation()
                  browseDocument()
                }}
              >
                Choose document
              </Button>
            </div>
          </div>

          <div className="flex justify-end border-t border-border-secondary pt-xl">
            <Button variant="primary" onClick={submit}>
              Submit application
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TenantApplications({
  initialView = "list",
}: {
  initialView?: "list" | "apply"
}) {
  const [view, setView] = useState(initialView)
  const [applications, setApplications] = useState(initialApplications)

  const addApplication = (application: Application) => {
    setApplications((current) => [application, ...current])
    setView("list")
  }

  if (view === "apply") {
    return (
      <ApplyForm onBack={() => setView("list")} onSubmit={addApplication} />
    )
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="flex flex-col gap-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-title text-text-primary">My Applications</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Track your rental applications and owner decisions.
          </div>
        </div>
        <Button variant="primary" onClick={() => setView("apply")}>
          Apply to rent
        </Button>
      </div>

      <div className="flex flex-col gap-xl">
        {applications.map((application) => (
          <article
            key={application.id}
            className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
          >
            <div className="flex flex-col gap-xl sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-md">
                  <div className="text-heading text-text-primary">
                    {application.property}
                  </div>
                  <Badge
                    label={application.status}
                    variant={applicationVariant(application.status)}
                  />
                </div>
                <div className="mt-xs text-label-sm text-text-secondary">
                  {application.location}
                </div>
                <div className="mt-lg flex flex-wrap gap-xl text-video-title text-text-secondary">
                  <span>Move-in: {application.moveIn}</span>
                  <span>Submitted: {application.submitted}</span>
                </div>
              </div>
              {application.status === "Pending" ? (
                <Button
                  variant="neutral"
                  size="small"
                  className="application-cancel-button"
                  onClick={() =>
                    setApplications((current) =>
                      current.map((item) =>
                        item.id === application.id
                          ? { ...item, status: "Cancelled" }
                          : item,
                      ),
                    )
                  }
                >
                  Cancel application
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
