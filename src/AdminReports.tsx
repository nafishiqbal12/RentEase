import { useState } from "react"
import { Badge, Button, SelectField } from "@figma/astraui"
import { Download } from "lucide-react"

const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]

export default function AdminReports({
  scope = "Admin",
}: {
  scope?: "Admin" | "Owner"
}) {
  const [range, setRange] = useState("6months")

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="flex flex-col gap-xl sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-title text-text-primary">
            {scope === "Owner" ? "Portfolio Reports" : "Reports"}
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            {scope === "Owner"
              ? "Income, occupancy, and performance across your portfolio."
              : "Platform growth, revenue, rentals, and complaint trends."}
          </div>
        </div>
        <div className="flex flex-col gap-md sm:flex-row sm:items-end">
          <div className="report-filter">
            <SelectField
              label="Date range"
              options={[
                { value: "30days", label: "Last 30 days" },
                { value: "3months", label: "Last 3 months" },
                { value: "6months", label: "Last 6 months" },
                { value: "year", label: "This year" },
              ]}
              value={range}
              onChange={setRange}
            />
          </div>
          <Button variant="primary" iconStart={<Download size={16} />}>
            Export
          </Button>
        </div>
      </div>

      <div className="reports-grid">
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="flex items-start justify-between gap-lg">
            <div>
              <div className="text-heading text-text-primary">
                Monthly Revenue
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Platform fees and services
              </div>
            </div>
            <Badge label="+12.6%" variant="success" />
          </div>
          <div className="report-chart mt-2xl">
            <div className="report-chart-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="report-bars">
              {months.map((month, index) => (
                <div key={month} className="report-column">
                  <div
                    className={`report-bar revenue-bar-${index + 1}`}
                    aria-label={`${month} revenue`}
                  />
                  <div className="mt-md text-video-title text-text-secondary">
                    {month}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="flex items-start justify-between gap-lg">
            <div>
              <div className="text-heading text-text-primary">New Users</div>
              <div className="mt-xs text-video-title text-text-secondary">
                Tenant and owner registrations
              </div>
            </div>
            <Badge label="1,248 total" variant="brand" />
          </div>
          <div className="report-chart mt-2xl">
            <div className="report-chart-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="report-bars">
              {months.map((month, index) => (
                <div key={month} className="report-column">
                  <div
                    className={`report-bar users-bar-${index + 1}`}
                    aria-label={`${month} new users`}
                  />
                  <div className="mt-md text-video-title text-text-secondary">
                    {month}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">Active Rentals</div>
          <div className="mt-xs text-video-title text-text-secondary">
            Occupied versus available listings
          </div>
          <div className="mt-2xl flex flex-col items-center justify-center">
            <div className="rentals-donut flex items-center justify-center rounded-corner-full">
              <div className="rentals-donut-center flex items-center justify-center rounded-corner-full bg-surface-bg">
                <div className="text-center">
                  <div className="text-title text-text-primary">1,326</div>
                  <div className="text-video-title text-text-secondary">
                    active
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2xl flex flex-wrap justify-center gap-xl text-label-sm">
              <span className="text-brand-primary">61% Active</span>
              <span className="text-text-secondary">39% Available</span>
            </div>
          </div>
        </section>

        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">
            Complaints by Status
          </div>
          <div className="mt-xs text-video-title text-text-secondary">
            Current complaint workload
          </div>
          <div className="mt-2xl flex flex-col gap-xl">
            {[
              {
                label: "Submitted",
                count: 8,
                className: "complaint-bar-submitted",
                variant: "warning" as const,
              },
              {
                label: "In Review",
                count: 6,
                className: "complaint-bar-review",
                variant: "brand" as const,
              },
              {
                label: "Resolved",
                count: 21,
                className: "complaint-bar-resolved",
                variant: "success" as const,
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between">
                  <Badge label={item.label} variant={item.variant} />
                  <div className="text-label-sm text-text-primary">
                    {item.count}
                  </div>
                </div>
                <div className="complaint-report-track mt-md">
                  <div className={`complaint-report-bar ${item.className}`} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
