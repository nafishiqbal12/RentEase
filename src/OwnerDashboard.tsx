import { useState } from "react"
import { Badge, Button } from "@figma/astraui"

type ApplicationStatus = "Pending" | "Approved" | "Rejected"

type Application = {
  id: number
  name: string
  property: string
  submitted: string
  status: ApplicationStatus
}

type MaintenanceItem = {
  id: number
  title: string
  property: string
  reported: string
  assigned: boolean
}

const income = [
  { month: "May", amount: "৳2.42L", className: "income-bar-may" },
  { month: "Jun", amount: "৳2.68L", className: "income-bar-jun" },
  { month: "Jul", amount: "৳2.71L", className: "income-bar-jul" },
  { month: "Aug", amount: "৳2.96L", className: "income-bar-aug" },
  { month: "Sep", amount: "৳3.08L", className: "income-bar-sep" },
  { month: "Oct", amount: "৳3.24L", className: "income-bar-oct" },
]

const initialApplications: Application[] = [
  {
    id: 1,
    name: "Nabila Islam",
    property: "Lakeview Heights, Dhanmondi",
    submitted: "Today, 10:24 AM",
    status: "Pending",
  },
  {
    id: 2,
    name: "Tanvir Hasan",
    property: "Gulshan Avenue Residence",
    submitted: "Yesterday, 4:15 PM",
    status: "Pending",
  },
  {
    id: 3,
    name: "Mehedi Chowdhury",
    property: "Uttara Garden House",
    submitted: "21 Oct, 2:30 PM",
    status: "Approved",
  },
]

const initialMaintenance: MaintenanceItem[] = [
  {
    id: 1,
    title: "Low water pressure",
    property: "Lakeview Heights, Flat 4B",
    reported: "Reported 2 hours ago",
    assigned: false,
  },
  {
    id: 2,
    title: "Lift inspection required",
    property: "Gulshan Avenue Residence",
    reported: "Reported yesterday",
    assigned: false,
  },
  {
    id: 3,
    title: "Bedroom AC servicing",
    property: "Uttara Garden House",
    reported: "Reported 20 Oct",
    assigned: true,
  },
]

function statusVariant(status: ApplicationStatus) {
  if (status === "Approved") return "success" as const
  if (status === "Rejected") return "danger" as const
  return "warning" as const
}

export default function OwnerDashboard() {
  const [applications, setApplications] =
    useState<Application[]>(initialApplications)
  const [maintenance, setMaintenance] =
    useState<MaintenanceItem[]>(initialMaintenance)

  const updateApplication = (id: number, status: ApplicationStatus) => {
    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, status } : application,
      ),
    )
  }

  const assignTechnician = (id: number) => {
    setMaintenance((current) =>
      current.map((request) =>
        request.id === id ? { ...request, assigned: true } : request,
      ),
    )
  }

  const stats = [
    {
      label: "Total Properties",
      value: "12",
      detail: "2 added this year",
    },
    {
      label: "Occupancy Rate",
      value: "83%",
      detail: "10 of 12 occupied",
    },
    {
      label: "Active Tenants",
      value: "18",
      detail: "Across all properties",
    },
    {
      label: "Rental Income This Month",
      value: "৳3,24,000",
      detail: "8.4% up from last month",
    },
  ]

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Owner Dashboard</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Track your portfolio, applications, and service requests.
        </div>
      </div>

      <section
        className="grid grid-cols-1 gap-xl sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Portfolio summary"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="dashboard-card h-full rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
          >
            <div className="text-label-sm text-text-secondary">
              {stat.label}
            </div>
            <div className="mt-md text-heading text-text-primary">
              {stat.value}
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              {stat.detail}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-xl xl:grid-cols-5">
        <section
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl xl:col-span-3"
          aria-label="Monthly rental income"
        >
          <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-heading text-text-primary">
                Monthly Rental Income
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Collected rent over the last six months
              </div>
            </div>
            <Badge label="+8.4% this month" variant="success" />
          </div>

          <div className="income-chart mt-2xl">
            <div className="income-chart-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="income-bars">
              {income.map((item) => (
                <div key={item.month} className="income-column">
                  <div className="income-value text-video-title text-text-secondary">
                    {item.amount}
                  </div>
                  <div
                    className={`income-bar ${item.className}`}
                    aria-label={`${item.month} rental income ${item.amount}`}
                  />
                  <div className="mt-md text-video-title text-text-secondary">
                    {item.month}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl xl:col-span-2"
          aria-label="Pending maintenance"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-heading text-text-primary">
                Pending Maintenance
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Requests that need attention
              </div>
            </div>
            <Badge
              label={`${maintenance.filter((item) => !item.assigned).length} pending`}
              variant="warning"
            />
          </div>

          <div className="mt-xl flex flex-col">
            {maintenance.map((request) => (
              <div
                key={request.id}
                className="owner-list-row border-b border-border-secondary py-lg"
              >
                <div className="flex items-start justify-between gap-lg">
                  <div className="min-w-0">
                    <div className="text-label-sm text-text-primary">
                      {request.title}
                    </div>
                    <div className="mt-xs text-video-title text-text-secondary">
                      {request.property}
                    </div>
                    <div className="mt-xs text-video-title text-text-secondary">
                      {request.reported}
                    </div>
                  </div>
                  <Badge
                    label={request.assigned ? "Assigned" : "Pending"}
                    variant={request.assigned ? "brand" : "warning"}
                    className={request.assigned ? "status-assigned" : undefined}
                  />
                </div>
                {!request.assigned ? (
                  <Button
                    variant="neutral"
                    size="small"
                    className="mt-lg"
                    onClick={() => assignTechnician(request.id)}
                  >
                    Assign technician
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
        aria-label="Recent rental applications"
      >
        <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-heading text-text-primary">
              Recent Rental Applications
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              Review prospective tenants for your properties
            </div>
          </div>
          <Button variant="subtle" size="small">
            View all applications
          </Button>
        </div>

        <div className="mt-xl flex flex-col">
          {applications.map((application) => (
            <div
              key={application.id}
              className="owner-application-row border-t border-border-secondary py-lg"
            >
              <div className="min-w-0">
                <div className="text-label text-text-primary">
                  {application.name}
                </div>
                <div className="mt-xs text-label-sm text-text-secondary">
                  {application.property}
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  {application.submitted}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-md">
                <Badge
                  label={application.status}
                  variant={statusVariant(application.status)}
                />
                {application.status === "Pending" ? (
                  <>
                    <Button
                      variant="neutral"
                      size="small"
                      className="owner-reject-button"
                      onClick={() =>
                        updateApplication(application.id, "Rejected")
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() =>
                        updateApplication(application.id, "Approved")
                      }
                    >
                      Accept
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
