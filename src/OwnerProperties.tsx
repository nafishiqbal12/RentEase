import { type DragEvent, type KeyboardEvent, useState } from "react"
import {
  Badge,
  Button,
  Checkbox,
  InputField,
  SelectField,
  TextareaField,
} from "@figma/astraui"

type ListingStatus = "Pending Verification" | "Approved" | "Rejected" | "Rented"

type OwnerListing = {
  id: number
  title: string
  location: string
  rent: string
  status: ListingStatus
  image: string
}

type Preview = {
  name: string
  url: string
  type: "image" | "video"
}

const propertyPhotos = [
  "https://images.unsplash.com/photo-1768578927019-8be9eb339fb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1761783066826-689af9f13267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1768413292179-d958b344f1d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1768413292140-0442cb61a989?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
]

const initialListings: OwnerListing[] = [
  {
    id: 1,
    title: "Gulshan Lakeview Residence",
    location: "Road 54, Gulshan 2, Dhaka",
    rent: "৳72,000 / month",
    status: "Rented",
    image: propertyPhotos[0],
  },
  {
    id: 2,
    title: "Dhanmondi Family Apartment",
    location: "Road 8A, Dhanmondi, Dhaka",
    rent: "৳38,000 / month",
    status: "Approved",
    image: propertyPhotos[1],
  },
  {
    id: 3,
    title: "Uttara Garden House",
    location: "Sector 11, Uttara, Dhaka",
    rent: "৳52,000 / month",
    status: "Pending Verification",
    image: propertyPhotos[2],
  },
  {
    id: 4,
    title: "Banani Executive Studio",
    location: "Banani 11, Dhaka",
    rent: "৳28,000 / month",
    status: "Rejected",
    image: propertyPhotos[3],
  },
]

function listingVariant(status: ListingStatus) {
  if (status === "Approved") return "success" as const
  if (status === "Rejected") return "danger" as const
  if (status === "Pending Verification") return "warning" as const
  return "brand" as const
}

function MyProperties({
  listings,
  onAdd,
  onEdit,
  onDelete,
}: {
  listings: OwnerListing[]
  onAdd: () => void
  onEdit: (listing: OwnerListing) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="flex flex-col gap-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-title text-text-primary">My Properties</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Manage listings, rental status, and property details.
          </div>
        </div>
        <Button variant="primary" onClick={onAdd}>
          Add Property
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-xl lg:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"
          >
            <img
              className="owner-property-image w-full object-cover"
              src={listing.image}
              alt={listing.title}
            />
            <div className="p-xl">
              <div className="flex items-start justify-between gap-lg">
                <div className="min-w-0">
                  <div className="text-label text-text-primary">
                    {listing.title}
                  </div>
                  <div className="mt-xs text-video-title text-text-secondary">
                    {listing.location}
                  </div>
                </div>
                <Badge
                  label={listing.status}
                  variant={listingVariant(listing.status)}
                  className={
                    listing.status === "Rented" ? "status-assigned" : undefined
                  }
                />
              </div>

              <div className="mt-lg text-heading text-brand-dark">
                {listing.rent}
              </div>

              <div className="mt-xl flex gap-md border-t border-border-secondary pt-lg">
                <Button
                  variant="neutral"
                  size="small"
                  className="flex-1"
                  onClick={() => onEdit(listing)}
                >
                  Edit
                </Button>
                <Button
                  variant="neutral"
                  size="small"
                  className="owner-delete-button flex-1"
                  onClick={() => onDelete(listing.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const labels = ["Basic Info", "Pricing", "Amenities", "Media"]

  return (
    <div className="listing-stepper" aria-label={`Step ${step} of 4`}>
      {labels.map((label, index) => {
        const stepNumber = index + 1
        const active = stepNumber === step
        const complete = stepNumber < step

        return (
          <div
            key={label}
            className={`listing-step ${active ? "listing-step-active" : ""} ${
              complete ? "listing-step-complete" : ""
            }`}
            aria-current={active ? "step" : undefined}
          >
            <div className="listing-step-number">{stepNumber}</div>
            <div className="mt-md text-video-title">{label}</div>
          </div>
        )
      })}
    </div>
  )
}

function AddProperty({
  editing,
  onCancel,
  onSubmit,
}: {
  editing: OwnerListing | null
  onCancel: () => void
  onSubmit: (listing: OwnerListing) => void
}) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [propertyType, setPropertyType] = useState("apartment")
  const [title, setTitle] = useState(editing?.title ?? "")
  const [location, setLocation] = useState(editing?.location ?? "")
  const [beds, setBeds] = useState("3")
  const [baths, setBaths] = useState("2")
  const [size, setSize] = useState("")
  const [rent, setRent] = useState("")
  const [deposit, setDeposit] = useState("")
  const [availability, setAvailability] = useState("")
  const [description, setDescription] = useState("")
  const [amenities, setAmenities] = useState<string[]>([
    "Lift",
    "24/7 Security",
  ])
  const [previews, setPreviews] = useState<Preview[]>([])

  const toggleAmenity = (amenity: string, selected: boolean) => {
    setAmenities((current) =>
      selected
        ? [...new Set([...current, amenity])]
        : current.filter((item) => item !== amenity),
    )
  }

  const addFiles = (files: FileList | File[]) => {
    const nextPreviews = Array.from(files)
      .filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/"),
      )
      .map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/")
          ? "video" as const
          : "image" as const,
      }))
    setPreviews((current) => [...current, ...nextPreviews])
  }

  const browseFiles = async () => {
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
        multiple: true,
        types: [
          {
            description: "Property photos and video",
            accept: {
              "image/*": [".jpg", ".jpeg", ".png", ".webp"],
              "video/*": [".mp4", ".webm"],
            },
          },
        ],
      })
      addFiles(await Promise.all(handles.map((handle) => handle.getFile())))
    } catch {
      // Closing the system picker is an expected no-op.
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    addFiles(event.dataTransfer.files)
  }

  const handleDropzoneKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      browseFiles()
    }
  }

  const submitListing = () => {
    onSubmit({
      id: editing?.id ?? Date.now(),
      title: title || "New Property Listing",
      location: location || "Dhaka",
      rent: rent ? `৳${rent} / month` : "Rent not set",
      status: "Pending Verification",
      image: previews[0]?.url ?? editing?.image ?? propertyPhotos[0],
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-full items-center justify-center p-xl md:p-2xl">
        <div className="listing-confirmation dashboard-card w-full rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center">
          <div className="mx-auto flex items-center justify-center">
            <Badge label="Submitted" variant="success" />
          </div>
          <div className="mt-xl text-title text-text-primary">
            Property submitted successfully
          </div>
          <div className="mt-md text-label-sm text-text-secondary">
            Your listing will be visible after admin approval.
          </div>
          <Button variant="primary" className="mt-2xl" onClick={onCancel}>
            View My Properties
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <Button variant="subtle" size="small" onClick={onCancel}>
          Back to My Properties
        </Button>
        <div className="mt-lg text-title text-text-primary">
          {editing ? "Edit Property" : "Add Property"}
        </div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Complete all four steps before submitting your listing.
        </div>
      </div>

      <div className="listing-form-shell mx-auto w-full">
        <Stepper step={step} />

        <div className="dashboard-card mt-2xl rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
          {step === 1 ? (
            <div>
              <div className="text-heading text-text-primary">
                Basic Information
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Tell tenants about the property.
              </div>
              <div className="mt-xl grid grid-cols-1 gap-xl sm:grid-cols-2">
                <SelectField
                  label="Property type"
                  options={[
                    { value: "apartment", label: "Apartment" },
                    { value: "house", label: "House" },
                    { value: "room", label: "Room" },
                    { value: "office", label: "Office" },
                  ]}
                  value={propertyType}
                  onChange={setPropertyType}
                />
                <InputField
                  label="Listing title"
                  placeholder="e.g. Dhanmondi Family Apartment"
                  value={title}
                  onChange={setTitle}
                />
                <div className="sm:col-span-2">
                  <InputField
                    label="Location"
                    placeholder="Area, road, and city"
                    value={location}
                    onChange={setLocation}
                  />
                </div>
                <InputField
                  type="number"
                  label="Bedrooms"
                  value={beds}
                  onChange={setBeds}
                />
                <InputField
                  type="number"
                  label="Bathrooms"
                  value={baths}
                  onChange={setBaths}
                />
                <div className="sm:col-span-2">
                  <InputField
                    type="number"
                    label="Property size"
                    placeholder="Size in square feet"
                    suffix="sq ft"
                    value={size}
                    onChange={setSize}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <div className="text-heading text-text-primary">
                Pricing and Availability
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Set clear rental terms for applicants.
              </div>
              <div className="mt-xl flex flex-col gap-xl">
                <InputField
                  type="number"
                  label="Monthly rent"
                  prefix="৳"
                  placeholder="Enter monthly rent"
                  value={rent}
                  onChange={setRent}
                />
                <InputField
                  type="number"
                  label="Security deposit"
                  prefix="৳"
                  placeholder="Enter security deposit"
                  value={deposit}
                  onChange={setDeposit}
                />
                <InputField
                  type="date"
                  label="Available from"
                  value={availability}
                  onChange={setAvailability}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <div className="text-heading text-text-primary">
                Amenities and Description
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Highlight what makes this property stand out.
              </div>
              <div className="mt-xl">
                <div className="mb-lg text-label text-text-primary">
                  Amenities
                </div>
                <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                  {[
                    "Parking",
                    "Lift",
                    "Generator",
                    "24/7 Security",
                    "Balcony",
                    "Gas Connection",
                    "Air Conditioning",
                    "Rooftop Access",
                  ].map((amenity) => (
                    <div
                      key={amenity}
                      className={`amenity-chip rounded-corner-md border p-lg ${
                        amenities.includes(amenity)
                          ? "border-border-selected bg-brand-muted"
                          : "border-border-primary bg-surface-bg"
                      }`}
                    >
                      <Checkbox
                        label={amenity}
                        defaultChecked={amenities.includes(amenity)}
                        onChange={(selected) =>
                          toggleAmenity(amenity, selected)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-xl">
                <TextareaField
                  label="Property description"
                  placeholder="Describe the property, neighbourhood, and ideal tenant"
                  rows={6}
                  value={description}
                  onChange={setDescription}
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <div className="text-heading text-text-primary">
                Photos and Video
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Add clear, recent media. The first photo becomes the cover.
              </div>

              <div
                className="listing-dropzone mt-xl flex cursor-pointer flex-col items-center justify-center rounded-corner-lg border border-border-selected bg-bg-faint p-2xl text-center focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
                role="button"
                tabIndex={0}
                onClick={browseFiles}
                onKeyDown={handleDropzoneKey}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="text-label text-text-primary">
                  Drag and drop photos or video here
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  JPG, PNG, WEBP, or MP4
                </div>
                <Button
                  type="button"
                  variant="neutral"
                  size="small"
                  className="mt-lg"
                  onClick={(event) => {
                    event.stopPropagation()
                    browseFiles()
                  }}
                >
                  Choose files
                </Button>
              </div>

              {previews.length ? (
                <div className="mt-xl grid grid-cols-2 gap-md sm:grid-cols-4">
                  {previews.map((preview) => (
                    <div
                      key={`${preview.name}-${preview.url}`}
                      className="listing-preview overflow-hidden rounded-corner-md border border-border-primary bg-bg-faint"
                    >
                      {preview.type === "image" ? (
                        <img
                          className="h-full w-full object-cover"
                          src={preview.url}
                          alt={preview.name}
                        />
                      ) : (
                        <video
                          className="h-full w-full object-cover"
                          src={preview.url}
                          muted
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2xl flex items-center justify-between border-t border-border-secondary pt-xl">
            <Button
              variant="neutral"
              disabled={step === 1}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
            >
              Back
            </Button>
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={() => setStep((current) => Math.min(4, current + 1))}
              >
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={submitListing}>
                Submit for verification
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OwnerProperties() {
  const [listings, setListings] = useState(initialListings)
  const [editing, setEditing] = useState<OwnerListing | null>(null)
  const [showForm, setShowForm] = useState(false)

  const saveListing = (listing: OwnerListing) => {
    setListings((current) => {
      const exists = current.some((item) => item.id === listing.id)
      return exists
        ? current.map((item) => (item.id === listing.id ? listing : item))
        : [listing, ...current]
    })
  }

  if (showForm) {
    return (
      <AddProperty
        editing={editing}
        onCancel={() => {
          setShowForm(false)
          setEditing(null)
        }}
        onSubmit={saveListing}
      />
    )
  }

  return (
    <MyProperties
      listings={listings}
      onAdd={() => {
        setEditing(null)
        setShowForm(true)
      }}
      onEdit={(listing) => {
        setEditing(listing)
        setShowForm(true)
      }}
      onDelete={(id) =>
        setListings((current) => current.filter((item) => item.id !== id))
      }
    />
  )
}
