import { Badge, Button } from "@figma/astraui"
import { Download } from "lucide-react"

export default function AgreementScreen({
  role,
}: {
  role: "Tenant" | "Owner"
}) {
  const details = [
    ["Monthly rent", "৳18,000"],
    ["Security deposit", "৳36,000"],
    ["Duration", "12 months"],
    ["Start date", "01 February 2025"],
    ["End date", "31 January 2026"],
    ["Payment due", "5th of each month"],
  ]

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="flex flex-col gap-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-title text-text-primary">Rental Agreement</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Lakeview Heights, Flat 4B · Dhanmondi, Dhaka
          </div>
        </div>
        <div className="flex flex-wrap gap-md">
          <Button variant="neutral" iconStart={<Download size={16} />}>
            Download PDF
          </Button>
          <Button variant="primary">Renew lease</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-xl lg:grid-cols-3">
        <div className="flex flex-col gap-xl lg:col-span-2">
          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-heading text-text-primary">
                  Agreement Summary
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  Agreement ID RE-2025-0148
                </div>
              </div>
              <div className="flex flex-wrap gap-md">
                <Badge label="Active" variant="success" />
                <Badge label="Expires in 28 days" variant="warning" />
              </div>
            </div>

            <div className="agreement-parties mt-2xl">
              <div className="rounded-corner-md bg-bg-faint p-xl">
                <div className="text-video-title text-text-secondary">
                  Owner
                </div>
                <div className="mt-md text-label text-text-primary">
                  Farhana Ahmed
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  NID and phone verified
                </div>
              </div>
              <div className="rounded-corner-md bg-bg-faint p-xl">
                <div className="text-video-title text-text-secondary">
                  Tenant
                </div>
                <div className="mt-md text-label text-text-primary">
                  Araf Rahman
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  NID and phone verified
                </div>
              </div>
            </div>

            <div className="agreement-details mt-xl">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="border-t border-border-secondary py-lg"
                >
                  <div className="text-video-title text-text-secondary">
                    {label}
                  </div>
                  <div className="mt-xs text-label-sm text-text-primary">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="text-heading text-text-primary">Key Terms</div>
            <div className="mt-xl flex flex-col gap-lg">
              {[
                "Rent must be paid by the 5th day of every month through RentEase.",
                "The tenant must provide 30 days notice before vacating the property.",
                "Routine maintenance is the owner's responsibility; tenant-caused damage is excluded.",
                "Subletting is not permitted without written consent from the owner.",
                "The security deposit is refundable after final inspection and settlement of dues.",
              ].map((term, index) => (
                <div key={term} className="flex gap-lg">
                  <div className="agreement-term-number flex shrink-0 items-center justify-center rounded-corner-full bg-brand-muted text-video-title text-brand-dark">
                    {index + 1}
                  </div>
                  <div className="text-label-sm text-text-secondary">
                    {term}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="agreement-document-card dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-heading text-text-primary">
                Signed Document
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Uploaded 01 Feb 2025
              </div>
            </div>
            <Badge label="Signed" variant="success" />
          </div>

          <div className="agreement-document mt-xl rounded-corner-md border border-border-primary bg-bg-faint p-xl">
            <div className="text-center text-label text-text-primary">
              RENTAL AGREEMENT
            </div>
            <div className="mt-lg text-video-title text-text-secondary">
              This agreement is made between Farhana Ahmed, hereafter called the
              Owner, and Araf Rahman, hereafter called the Tenant.
            </div>
            <div className="document-line mt-xl" />
            <div className="document-line mt-md" />
            <div className="document-line document-line-short mt-md" />
            <div className="document-line mt-xl" />
            <div className="document-line mt-md" />
            <div className="mt-2xl flex justify-between gap-xl">
              <div>
                <div className="document-signature" />
                <div className="mt-xs text-video-title text-text-secondary">
                  Owner signature
                </div>
              </div>
              <div>
                <div className="document-signature" />
                <div className="mt-xs text-video-title text-text-secondary">
                  Tenant signature
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="neutral"
            className="mt-xl w-full"
            iconStart={<Download size={16} />}
          >
            Download PDF
          </Button>
          <div className="mt-lg text-center text-video-title text-text-secondary">
            Viewing as {role}
          </div>
        </aside>
      </div>
    </div>
  )
}
