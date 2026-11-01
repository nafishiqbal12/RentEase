import { useState } from "react"
import { Badge, Button, InputField, SelectField } from "@figma/astraui"

type MaintenanceStatus = "Pending" | "Assigned" | "In Progress" | "Completed"

type OwnerRequest = {
  id: number
  issue: string
  property: string
  tenant: string
  urgency: string
  status: MaintenanceStatus
  technician?: string
  phone?: string
}

const initialRequests: OwnerRequest[] = [
  {
    id: 1,
    issue: "Low water pressure",
    property: "Lakeview Heights, Flat 4B",
    tenant: "Araf Rahman",
    urgency: "High",
    status: "Pending",
  },
  {
    id: 2,
    issue: "Lift inspection required",
    property: "Gulshan Avenue Residence",
    tenant: "Samira Hossain",
    urgency: "Medium",
    status: "Assigned",
    technician: "Imran Hossain",
    phone: "+880 1712 345678",
  },
  {
    id: 3,
    issue: "Bedroom AC servicing",
    property: "Uttara Garden House",
    tenant: "Nafis Ahmed",
    urgency: "Medium",
    status: "In Progress",
    technician: "Rafiq Electric",
    phone: "+880 1811 247890",
  },
]

function statusVariant(status: MaintenanceStatus) {
  if (status === "Completed") return "success" as const
  if (status === "Assigned") return "brand" as const
  return "warning" as const
}

function AssignmentDrawer({
  request,
  onClose,
  onSave,
}: {
  request: OwnerRequest
  onClose: () => void
  onSave: (request: OwnerRequest) => void
}) {
  const [technician, setTechnician] = useState(request.technician ?? "")
  const [phone, setPhone] = useState(request.phone ?? "")
  const [status, setStatus] = useState<MaintenanceStatus>(request.status)

  return (
    <div className="admin-drawer-layer fixed inset-0">
      <div className="admin-drawer-scrim absolute inset-0" aria-hidden="true" />
      <aside
        className="application-drawer relative ml-auto flex h-full flex-col bg-surface-bg"
        role="dialog"
        aria-modal="true"
        aria-label={`Manage ${request.issue}`}
      >
        <div className="flex items-start justify-between gap-lg border-b border-border-primary p-xl">
          <div>
            <div className="text-heading text-text-primary">
              Assign Technician
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              {request.property}
            </div>
          </div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-xl">
          <div className="rounded-corner-lg bg-bg-faint p-xl">
            <div className="text-label text-text-primary">{request.issue}</div>
            <div className="mt-xs text-video-title text-text-secondary">
              Tenant: {request.tenant} · {request.urgency} urgency
            </div>
          </div>

          <div className="mt-2xl flex flex-col gap-xl">
            <InputField
              label="Technician name"
              placeholder="Enter technician or company"
              value={technician}
              onChange={setTechnician}
            />
            <InputField
              type="tel"
              label="Phone number"
              placeholder="+880 17XX XXXXXX"
              value={phone}
              onChange={setPhone}
            />
            <SelectField
              label="Request status"
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Assigned", label: "Assigned" },
                { value: "In Progress", label: "In Progress" },
                { value: "Completed", label: "Completed" },
              ]}
              value={status}
              onChange={(value) => setStatus(value as MaintenanceStatus)}
            />
          </div>
        </div>

        <div className="border-t border-border-primary p-xl">
          <Button
            variant="primary"
            className="w-full"
            onClick={() =>
              onSave({
                ...request,
                technician,
                phone,
                status:
                  status === "Pending" && technician ? "Assigned" : status,
              })
            }
          >
            Save assignment
          </Button>
        </div>
      </aside>
    </div>
  )
}

export default function OwnerMaintenance() {
  const [requests, setRequests] = useState(initialRequests)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = requests.find((request) => request.id === selectedId) ?? null

  return (
    <>
      <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
        <div>
          <div className="text-title text-text-primary">
            Maintenance Requests
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Assign technicians and update service progress.
          </div>
        </div>

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
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td data-label="Issue">{request.issue}</td>
                    <td data-label="Property">{request.property}</td>
                    <td data-label="Tenant">{request.tenant}</td>
                    <td data-label="Urgency">{request.urgency}</td>
                    <td data-label="Status">
                      <Badge
                        label={request.status}
                        variant={statusVariant(request.status)}
                        className={
                          request.status === "Assigned"
                            ? "status-assigned"
                            : undefined
                        }
                      />
                    </td>
                    <td data-label="Action">
                      <Button
                        variant="neutral"
                        size="small"
                        onClick={() => setSelectedId(request.id)}
                      >
                        {request.technician ? "Manage" : "Assign technician"}
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
        <AssignmentDrawer
          request={selected}
          onClose={() => setSelectedId(null)}
          onSave={(updated) => {
            setRequests((current) =>
              current.map((request) =>
                request.id === updated.id ? updated : request,
              ),
            )
            setSelectedId(null)
          }}
        />
      ) : null}
    </>
  )
}
