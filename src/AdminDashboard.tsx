import { useState } from "react"
import { Badge, Button, TextareaField } from "@figma/astraui"

type VerificationStatus = "Pending" | "Approved" | "Rejected"

type Listing = {
  id: number
  title: string
  owner: string
  submitted: string
  status: VerificationStatus
  location: string
  rent: string
  deposit: string
  type: string
  bedrooms: number
  bathrooms: number
  size: string
  description: string
  images: string[]
  rejectionReason?: string
}

const exteriorOne =
  "https://images.unsplash.com/photo-1624204386084-dd8c05e32226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGV4dGVyaW9yJTIwcmVzaWRlbnRpYWwlMjBidWlsZGluZ3xlbnwxfHx8fDE3OTE4ODYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080"
const exteriorTwo =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGV4dGVyaW9yJTIwcmVzaWRlbnRpYWwlMjBidWlsZGluZ3xlbnwxfHx8fDE3OTE4ODYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080"
const exteriorThree =
  "https://images.unsplash.com/photo-1722421492323-eaf9c401befe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGV4dGVyaW9yJTIwcmVzaWRlbnRpYWwlMjBidWlsZGluZ3xlbnwxfHx8fDE3OTE4ODYwNjV8MA&ixlib=rb-4.1.0&q=80&w=1080"
const interiorOne =
  "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMERoYWthJTIwaG9tZSUyMHdhcm0lMjBkYXlsaWdodHxlbnwxfHx8fDE3OTE4ODUyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
const interiorTwo =
  "https://images.unsplash.com/photo-1737045466261-92204d753268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tJTIwQmFuZ2xhZGVzaCUyMHJlbnRhbCUyMGJyaWdodCUyMGZ1cm5pc2hlZHxlbnwxfHx8fDE3OTE4ODUzNTR8MA&ixlib=rb-4.1.0&q=80&w=1080"

const initialListings: Listing[] = [
  {
    id: 1,
    title: "Gulshan Lakeview Residence",
    owner: "Farhana Ahmed",
    submitted: "24 Oct 2025",
    status: "Pending",
    location: "Road 54, Gulshan 2, Dhaka",
    rent: "৳72,000 / month",
    deposit: "৳1,44,000",
    type: "Apartment",
    bedrooms: 4,
    bathrooms: 4,
    size: "2,450 sq ft",
    description:
      "A spacious lake-facing apartment with premium fittings, natural light, covered parking, and full generator backup.",
    images: [exteriorOne, interiorOne, interiorTwo],
  },
  {
    id: 2,
    title: "Dhanmondi Family Apartment",
    owner: "Mahmud Karim",
    submitted: "23 Oct 2025",
    status: "Pending",
    location: "Road 8A, Dhanmondi, Dhaka",
    rent: "৳38,000 / month",
    deposit: "৳76,000",
    type: "Apartment",
    bedrooms: 3,
    bathrooms: 3,
    size: "1,720 sq ft",
    description:
      "A furnished family apartment close to schools, hospitals, and daily essentials, with lift and security service.",
    images: [exteriorTwo, interiorTwo, interiorOne],
  },
  {
    id: 3,
    title: "Uttara Garden House",
    owner: "Nusrat Chowdhury",
    submitted: "22 Oct 2025",
    status: "Pending",
    location: "Sector 11, Uttara, Dhaka",
    rent: "৳52,000 / month",
    deposit: "৳1,04,000",
    type: "House",
    bedrooms: 4,
    bathrooms: 3,
    size: "2,600 sq ft",
    description:
      "A quiet two-level family home with a private garden, secure garage, and convenient airport access.",
    images: [exteriorThree, interiorOne, interiorTwo],
  },
  {
    id: 4,
    title: "Banani Executive Studio",
    owner: "Rashedul Haque",
    submitted: "21 Oct 2025",
    status: "Approved",
    location: "Banani 11, Dhaka",
    rent: "৳28,000 / month",
    deposit: "৳56,000",
    type: "Apartment",
    bedrooms: 1,
    bathrooms: 1,
    size: "720 sq ft",
    description:
      "A compact furnished studio designed for working professionals in central Banani.",
    images: [exteriorTwo, interiorOne, interiorTwo],
  },
  {
    id: 5,
    title: "Bashundhara Corner Flat",
    owner: "Sadia Rahman",
    submitted: "20 Oct 2025",
    status: "Rejected",
    location: "Block C, Bashundhara R/A, Dhaka",
    rent: "৳34,000 / month",
    deposit: "৳68,000",
    type: "Apartment",
    bedrooms: 3,
    bathrooms: 2,
    size: "1,580 sq ft",
    description:
      "A bright corner apartment with balcony access and nearby shopping facilities.",
    images: [exteriorOne, interiorTwo, interiorOne],
  },
]

function verificationVariant(status: VerificationStatus) {
  if (status === "Approved") return "success" as const
  if (status === "Rejected") return "danger" as const
  return "warning" as const
}

function VerificationDrawer({
  listing,
  onClose,
  onApprove,
  onReject,
}: {
  listing: Listing
  onClose: () => void
  onApprove: () => void
  onReject: (reason: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState("")
  const [reasonError, setReasonError] = useState("")

  const confirmRejection = () => {
    if (!reason.trim()) {
      setReasonError("Add a reason before rejecting this listing.")
      return
    }
    onReject(reason)
  }

  return (
    <div className="admin-drawer-layer fixed inset-0">
      <div className="admin-drawer-scrim absolute inset-0" aria-hidden="true" />
      <aside
        className="admin-drawer relative ml-auto flex h-full flex-col bg-surface-bg"
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${listing.title}`}
      >
        <div className="flex items-start justify-between gap-lg border-b border-border-primary p-xl">
          <div>
            <div className="text-heading text-text-primary">Review Listing</div>
            <div className="mt-xs text-video-title text-text-secondary">
              Submission #{listing.id.toString().padStart(4, "0")}
            </div>
          </div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-xl">
          <div className="admin-photo-grid">
            {listing.images.map((image, index) => (
              <img
                key={image}
                className={`admin-photo admin-photo-${index + 1} h-full w-full object-cover`}
                src={image}
                alt={`${listing.title} photo ${index + 1}`}
              />
            ))}
          </div>

          <div className="mt-xl flex flex-wrap items-center gap-md">
            <Badge
              label={listing.status}
              variant={verificationVariant(listing.status)}
            />
            <Badge label={listing.type} variant="secondary" />
          </div>

          <div className="mt-lg text-title text-text-primary">
            {listing.title}
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            {listing.location}
          </div>

          <div className="admin-info-grid mt-xl">
            {[
              ["Monthly rent", listing.rent],
              ["Security deposit", listing.deposit],
              ["Bedrooms", listing.bedrooms.toString()],
              ["Bathrooms", listing.bathrooms.toString()],
              ["Property size", listing.size],
              ["Furnishing", "Fully furnished"],
              ["Available from", "01 November 2025"],
              ["Minimum lease", "12 months"],
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
            <div className="text-label text-text-primary">Description</div>
            <div className="mt-md text-label-sm text-text-secondary">
              {listing.description}
            </div>
          </div>

          <div className="mt-2xl">
            <div className="text-label text-text-primary">Amenities</div>
            <div className="mt-md flex flex-wrap gap-md">
              {[
                "Parking",
                "Lift",
                "Generator",
                "24/7 Security",
                "Balcony",
                "Gas connection",
              ].map((amenity) => (
                <Badge key={amenity} label={amenity} variant="secondary" />
              ))}
            </div>
          </div>

          <div className="mt-2xl rounded-corner-lg border border-border-primary p-xl">
            <div className="text-label text-text-primary">
              Owner information
            </div>
            <div className="mt-lg flex items-center gap-lg">
              <div className="owner-avatar flex items-center justify-center rounded-corner-full bg-brand-muted text-label text-brand-dark">
                {listing.owner
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="text-label-sm text-text-primary">
                  {listing.owner}
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  Identity verified · Phone verified
                </div>
              </div>
            </div>
            <div className="mt-lg flex flex-wrap gap-md">
              <Badge label="NID verified" variant="success" />
              <Badge label="Ownership document attached" variant="success" />
              <Badge label="Utility bill attached" variant="success" />
            </div>
          </div>

          {rejecting ? (
            <div className="mt-2xl rounded-corner-lg border border-border-primary bg-bg-faint p-xl">
              <TextareaField
                label="Reason for rejection"
                description="The owner will receive this feedback."
                placeholder="Explain what needs to be corrected"
                rows={4}
                value={reason}
                aria-invalid={Boolean(reasonError)}
                onChange={(value) => {
                  setReason(value)
                  setReasonError("")
                }}
              />
              {reasonError ? (
                <div className="mt-xs text-video-title text-danger">
                  {reasonError}
                </div>
              ) : null}
            </div>
          ) : null}

          {listing.status === "Rejected" && listing.rejectionReason ? (
            <div className="mt-2xl rounded-corner-lg border border-danger bg-bg-faint p-xl">
              <div className="text-label text-danger">Rejection reason</div>
              <div className="mt-md text-label-sm text-text-secondary">
                {listing.rejectionReason}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border-primary bg-surface-bg p-xl">
          {listing.status === "Pending" ? (
            rejecting ? (
              <div className="flex gap-md">
                <Button
                  variant="neutral"
                  className="flex-1"
                  onClick={() => {
                    setRejecting(false)
                    setReasonError("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="neutral"
                  className="admin-reject-button flex-1"
                  onClick={confirmRejection}
                >
                  Confirm rejection
                </Button>
              </div>
            ) : (
              <div className="flex gap-md">
                <Button
                  variant="neutral"
                  className="admin-reject-button flex-1"
                  onClick={() => setRejecting(true)}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={onApprove}
                >
                  Approve
                </Button>
              </div>
            )
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

function VerificationQueue({
  listings,
  onReview,
}: {
  listings: Listing[]
  onReview: (listing: Listing) => void
}) {
  return (
    <section
      className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"
      aria-label="Property verification queue"
    >
      <div className="flex flex-col gap-lg p-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-heading text-text-primary">
            Property Verification Queue
          </div>
          <div className="mt-xs text-video-title text-text-secondary">
            Review new and recently updated property listings.
          </div>
        </div>
        <Badge
          label={`${listings.filter((item) => item.status === "Pending").length} pending`}
          variant="warning"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>Property</th>
              <th>Owner</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id}>
                <td data-label="Property">
                  <div className="flex items-center gap-lg">
                    <img
                      className="admin-thumbnail shrink-0 rounded-corner-md object-cover"
                      src={listing.images[0]}
                      alt=""
                    />
                    <div>
                      <div className="text-label-sm text-text-primary">
                        {listing.title}
                      </div>
                      <div className="mt-xs text-video-title text-text-secondary">
                        {listing.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td data-label="Owner">{listing.owner}</td>
                <td data-label="Submitted">{listing.submitted}</td>
                <td data-label="Status">
                  <Badge
                    label={listing.status}
                    variant={verificationVariant(listing.status)}
                  />
                </td>
                <td data-label="Action">
                  <Button
                    variant="subtle"
                    size="small"
                    onClick={() => onReview(listing)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function AdminDashboard({
  queueOnly = false,
}: {
  queueOnly?: boolean
}) {
  const [listings, setListings] = useState(initialListings)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedListing =
    listings.find((listing) => listing.id === selectedId) ?? null

  const updateStatus = (status: VerificationStatus, reason?: string) => {
    setListings((current) =>
      current.map((listing) =>
        listing.id === selectedId
          ? { ...listing, status, rejectionReason: reason }
          : listing,
      ),
    )
    setSelectedId(null)
  }

  const stats = [
    { label: "Total Users", value: "8,642", detail: "+124 this month" },
    { label: "Properties", value: "2,184", detail: "1,946 verified" },
    { label: "Active Rentals", value: "1,326", detail: "61% of listings" },
    { label: "Pending Approvals", value: "24", detail: "8 submitted today" },
    { label: "Transactions", value: "৳4.8Cr", detail: "Processed this month" },
    { label: "Open Complaints", value: "17", detail: "5 marked urgent" },
  ]

  return (
    <>
      <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
        <div>
          <div className="text-title text-text-primary">
            {queueOnly ? "Property Verification" : "Admin Dashboard"}
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            {queueOnly
              ? "Review listing information before it goes live."
              : "Monitor platform activity, approvals, and operations."}
          </div>
        </div>

        {!queueOnly ? (
          <section
            className="grid grid-cols-1 gap-xl sm:grid-cols-2 xl:grid-cols-3"
            aria-label="Platform summary"
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
        ) : null}

        <VerificationQueue
          listings={listings}
          onReview={(listing) => setSelectedId(listing.id)}
        />
      </div>

      {selectedListing ? (
        <VerificationDrawer
          listing={selectedListing}
          onClose={() => setSelectedId(null)}
          onApprove={() => updateStatus("Approved")}
          onReject={(reason) => updateStatus("Rejected", reason)}
        />
      ) : null}
    </>
  )
}
