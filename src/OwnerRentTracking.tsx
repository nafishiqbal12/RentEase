import { useState } from "react"
import { Badge, Button } from "@figma/astraui"

type RentStatus = "Paid" | "Pending" | "Late"

type TenantRent = {
  id: number
  tenant: string
  property: string
  rent: string
  dueDate: string
  status: RentStatus
}

const rentRows: TenantRent[] = [
  {
    id: 1,
    tenant: "Araf Rahman",
    property: "Lakeview Heights, Flat 4B",
    rent: "৳18,000",
    dueDate: "05 Nov 2025",
    status: "Pending",
  },
  {
    id: 2,
    tenant: "Samira Hossain",
    property: "Gulshan Avenue Residence",
    rent: "৳42,000",
    dueDate: "05 Nov 2025",
    status: "Paid",
  },
  {
    id: 3,
    tenant: "Nafis Ahmed",
    property: "Uttara Garden House",
    rent: "৳32,000",
    dueDate: "03 Nov 2025",
    status: "Late",
  },
  {
    id: 4,
    tenant: "Raisa Karim",
    property: "Banani Executive Studio",
    rent: "৳28,000",
    dueDate: "05 Nov 2025",
    status: "Pending",
  },
  {
    id: 5,
    tenant: "Mahin Chowdhury",
    property: "Bashundhara Corner Flat",
    rent: "৳35,000",
    dueDate: "01 Nov 2025",
    status: "Paid",
  },
]

function rentVariant(status: RentStatus) {
  if (status === "Paid") return "success" as const
  if (status === "Late") return "danger" as const
  return "warning" as const
}

export default function OwnerRentTracking({
  scope = "Owner",
}: {
  scope?: "Owner" | "Admin"
}) {
  const [remindedIds, setRemindedIds] = useState<number[]>([])

  const summaries = [
    {
      label: "Collected",
      amount: "৳3,24,000",
      detail: "18 payments received",
      variant: "success" as const,
    },
    {
      label: "Pending",
      amount: "৳78,000",
      detail: "4 payments expected",
      variant: "warning" as const,
    },
    {
      label: "Late",
      amount: "৳32,000",
      detail: "1 overdue payment",
      variant: "danger" as const,
    },
  ]

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">
          {scope === "Admin" ? "Active Rentals" : "Rent Tracking"}
        </div>
        <div className="mt-xs text-label-sm text-text-secondary">
          {scope === "Admin"
            ? "Monitor active tenancies and rent collection across RentEase."
            : "Monitor monthly rent collection across your portfolio."}
        </div>
      </div>

      <section
        className="grid grid-cols-1 gap-xl sm:grid-cols-3"
        aria-label="Rent collection summary"
      >
        {summaries.map((summary) => (
          <div
            key={summary.label}
            className="dashboard-card h-full rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
          >
            <div className="flex items-center justify-between gap-lg">
              <div className="text-label-sm text-text-secondary">
                {summary.label}
              </div>
              <Badge label={summary.label} variant={summary.variant} />
            </div>
            <div className="mt-md text-heading text-text-primary">
              {summary.amount}
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              {summary.detail}
            </div>
          </div>
        ))}
      </section>

      <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
        <div className="p-xl">
          <div className="text-heading text-text-primary">Tenant Payments</div>
          <div className="mt-xs text-video-title text-text-secondary">
            November 2025 rent cycle
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="rent-tracking-table w-full">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Property</th>
                <th>Rent</th>
                <th>Due date</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rentRows.map((row) => {
                const reminded = remindedIds.includes(row.id)
                return (
                  <tr key={row.id}>
                    <td data-label="Tenant">{row.tenant}</td>
                    <td data-label="Property">{row.property}</td>
                    <td data-label="Rent">{row.rent}</td>
                    <td data-label="Due date">{row.dueDate}</td>
                    <td data-label="Status">
                      <Badge
                        label={row.status}
                        variant={rentVariant(row.status)}
                      />
                    </td>
                    <td data-label="Action">
                      {row.status === "Paid" ? (
                        <span className="text-video-title text-text-secondary">
                          No action needed
                        </span>
                      ) : (
                        <Button
                          variant="neutral"
                          size="small"
                          disabled={reminded}
                          onClick={() =>
                            setRemindedIds((current) => [...current, row.id])
                          }
                        >
                          {reminded ? "Reminder sent" : "Send reminder"}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
