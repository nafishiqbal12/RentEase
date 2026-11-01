import { type DragEvent, type KeyboardEvent, useEffect, useState } from "react"
import {
  Badge,
  Button,
  Checkbox,
  InputField,
  SelectField,
  TextareaField,
} from "@figma/astraui"
import { supabase } from "./lib/supabase"

type ListingStatus = "Pending Verification" | "Approved" | "Rejected" | "Rented"

type OwnerListing = {
  id: string
  title: string
  location: string
  rent: string
  status: ListingStatus
  image: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  sizeSqFt?: number | null
  monthlyRent?: number
  securityDeposit?: number | null
  availabilityDate?: string | null
  description?: string | null
  amenities?: string[]
  imageUrls?: string[]
}

type PropertyDraft = {
  propertyType: string
  title: string
  location: string
  bedrooms: string
  bathrooms: string
  size: string
  rent: string
  deposit: string
  availability: string
  description: string
  amenities: string[]
  imageFiles: File[]
}

type Preview = {
  name: string
  url: string
  type: "image" | "video"
  file?: File
}

const propertyPhotos = [
  "https://images.unsplash.com/photo-1768578927019-8be9eb339fb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1761783066826-689af9f13267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1768413292179-d958b344f1d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1768413292140-0442cb61a989?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGhvdXNlJTIwZnVybmlzaGVkJTIwcmVudGFsJTIwcHJvcGVydHl8ZW58MXx8fHwxNzkxODg2MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080",
]
const propertyImageBucket = "property-images"

const initialListings: OwnerListing[] = [
  {
    id: "demo-1",
    title: "Gulshan Lakeview Residence",
    location: "Road 54, Gulshan 2, Dhaka",
    rent: "৳72,000 / month",
    status: "Rented",
    image: propertyPhotos[0],
  },
  {
    id: "demo-2",
    title: "Dhanmondi Family Apartment",
    location: "Road 8A, Dhanmondi, Dhaka",
    rent: "৳38,000 / month",
    status: "Approved",
    image: propertyPhotos[1],
  },
  {
    id: "demo-3",
    title: "Uttara Garden House",
    location: "Sector 11, Uttara, Dhaka",
    rent: "৳52,000 / month",
    status: "Pending Verification",
    image: propertyPhotos[2],
  },
  {
    id: "demo-4",
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

function toOwnerListing(property: {
  id: string
  title: string
  address: string
  city: string
  property_type: string
  bedrooms: number
  bathrooms: number
  size_sq_ft: number | null
  monthly_rent: number
  security_deposit: number | null
  availability_date: string | null
  description: string | null
  amenities: string[]
  image_urls: string[]
  status: string
}): OwnerListing {
  return {
    id: property.id,
    title: property.title,
    location: `${property.address}, ${property.city}`,
    rent: `৳${Number(property.monthly_rent).toLocaleString("en-BD")} / month`,
    status:
      property.status === "pending_verification"
        ? "Pending Verification"
        : property.status === "approved"
          ? "Approved"
          : property.status === "rejected"
            ? "Rejected"
            : "Rented",
    image: property.image_urls[0] ?? propertyPhotos[0],
    propertyType: property.property_type,
    bedrooms: property.bedrooms,
    bathrooms: Number(property.bathrooms),
    sizeSqFt: property.size_sq_ft,
    monthlyRent: Number(property.monthly_rent),
    securityDeposit: property.security_deposit,
    availabilityDate: property.availability_date,
    description: property.description,
    amenities: property.amenities,
    imageUrls: property.image_urls,
  }
}

function MyProperties({
  listings,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
}: {
  listings: OwnerListing[]
  loading: boolean
  error: string | null
  onAdd: () => void
  onEdit: (listing: OwnerListing) => void
  onDelete: (id: string) => void
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

      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading your properties...
        </div>
      ) : error ? (
        <div
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : listings.length === 0 ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          You have not added any properties yet.
        </div>
      ) : (
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
                      listing.status === "Rented"
                        ? "status-assigned"
                        : undefined
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
      )}
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
  onSubmit,
  onCancel,
}: {
  editing: OwnerListing | null
  onCancel: () => void
  onSubmit: (draft: PropertyDraft) => Promise<void>
}) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [propertyType, setPropertyType] = useState(
    editing?.propertyType ?? "apartment",
  )
  const [title, setTitle] = useState(editing?.title ?? "")
  const [location, setLocation] = useState(editing?.location ?? "")
  const [beds, setBeds] = useState(String(editing?.bedrooms ?? 0))
  const [baths, setBaths] = useState(String(editing?.bathrooms ?? 0))
  const [size, setSize] = useState(
    editing?.sizeSqFt ? String(editing.sizeSqFt) : "",
  )
  const [rent, setRent] = useState(
    editing?.monthlyRent ? String(editing.monthlyRent) : "",
  )
  const [deposit, setDeposit] = useState(
    editing?.securityDeposit ? String(editing.securityDeposit) : "",
  )
  const [availability, setAvailability] = useState(
    editing?.availabilityDate ?? "",
  )
  const [description, setDescription] = useState(editing?.description ?? "")
  const [amenities, setAmenities] = useState<string[]>([
    ...(editing?.amenities ?? ["Lift", "24/7 Security"]),
  ])
  const [previews, setPreviews] = useState<Preview[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const toggleAmenity = (amenity: string, selected: boolean) => {
    setAmenities((current) =>
      selected
        ? [...new Set([...current, amenity])]
        : current.filter((item) => item !== amenity),
    )
  }

  const addFiles = (files: FileList | File[]) => {
    const selectedFiles = Array.from(files)
    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024,
    )
    if (invalidFile) {
      setSubmitError(
        `${invalidFile.name} is not a supported image or exceeds the 10 MB limit.`,
      )
    }
    const nextPreviews = selectedFiles
      .filter(
        (file) =>
          file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
      )
      .map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: "image" as const,
        file,
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
            description: "Property photos",
            accept: {
              "image/*": [".jpg", ".jpeg", ".png", ".webp"],
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

  const submitListing = async () => {
    const numericFields = [
      ["bedrooms", beds, 0],
      ["bathrooms", baths, 0],
      ["size", size, 1],
      ["monthly rent", rent, 1],
      ["security deposit", deposit, 0],
    ] as const
    const invalidNumber = numericFields.find(
      ([, value, minimum]) =>
        value !== "" &&
        (!Number.isFinite(Number(value)) || Number(value) < minimum),
    )
    if (!title.trim() || !location.trim()) {
      setSubmitError("Listing title and location are required.")
      return
    }
    if (title.trim().length > 160) {
      setSubmitError("Listing title must be 160 characters or fewer.")
      return
    }
    if (invalidNumber) {
      setSubmitError(`${invalidNumber[0]} must be a valid number.`)
      return
    }
    if (!rent || Number(rent) <= 0) {
      setSubmitError("Monthly rent must be greater than zero.")
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        propertyType,
        title: title.trim(),
        location: location.trim(),
        bedrooms: beds,
        bathrooms: baths,
        size,
        rent,
        deposit,
        availability,
        description: description.trim(),
        amenities,
        imageFiles: previews.flatMap((preview) =>
          preview.file ? [preview.file] : [],
        ),
      })
      setSubmitted(true)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save property.",
      )
    } finally {
      setSubmitting(false)
    }
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
            {editing
              ? "Your property changes were saved."
              : "Your listing will be visible after admin approval."}
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
                  Drag and drop property photos here
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
              <Button
                variant="primary"
                onClick={() => void submitListing()}
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Submit for verification"}
              </Button>
            )}
          </div>
          {submitError ? (
            <div className="mt-lg text-label-sm text-danger" role="alert">
              {submitError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function OwnerProperties({ ownerId }: { ownerId: string }) {
  const [listings, setListings] = useState<OwnerListing[]>([])
  const [editing, setEditing] = useState<OwnerListing | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadListings = async () => {
      const { data, error: queryError } = await supabase
        .from("properties")
        .select(
          "id, title, address, city, property_type, bedrooms, bathrooms, size_sq_ft, monthly_rent, security_deposit, availability_date, description, amenities, image_urls, status",
        )
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

      if (!active) return
      if (queryError) {
        setError(`Unable to load your properties: ${queryError.message}`)
      } else {
        setListings((data ?? []).map(toOwnerListing))
      }
      setLoading(false)
    }

    void loadListings()
    return () => {
      active = false
    }
  }, [ownerId])

  const saveListing = async (draft: PropertyDraft) => {
    const locationParts = draft.location.split(",")
    const city = locationParts.pop()?.trim() || "Dhaka"
    const address = locationParts.join(",").trim() || city
    const basePayload = {
      title: draft.title,
      address,
      city,
      property_type: draft.propertyType,
      bedrooms: Number(draft.bedrooms),
      bathrooms: Number(draft.bathrooms),
      size_sq_ft: draft.size ? Number(draft.size) : null,
      monthly_rent: Number(draft.rent),
      security_deposit: draft.deposit ? Number(draft.deposit) : null,
      availability_date: draft.availability || null,
      description: draft.description || null,
      amenities: draft.amenities,
    }

    const result = editing
      ? await supabase
          .from("properties")
          .update(basePayload)
          .eq("id", editing.id)
          .eq("owner_id", ownerId)
          .select(
            "id, title, address, city, property_type, bedrooms, bathrooms, size_sq_ft, monthly_rent, security_deposit, availability_date, description, amenities, image_urls, status",
          )
          .single()
      : await supabase
          .from("properties")
          .insert({ ...basePayload, owner_id: ownerId })
          .select(
            "id, title, address, city, property_type, bedrooms, bathrooms, size_sq_ft, monthly_rent, security_deposit, availability_date, description, amenities, image_urls, status",
          )
          .single()

    if (result.error) {
      throw new Error(`Unable to save property: ${result.error.message}`)
    }
    let savedProperty = result.data
    const uploadedUrls: string[] = []

    for (const file of draft.imageFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
      const path = `${ownerId}/${savedProperty.id}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from(propertyImageBucket)
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Unable to upload ${file.name}: ${uploadError.message}`)
      }

      const { data: publicUrl } = supabase.storage
        .from(propertyImageBucket)
        .getPublicUrl(path)
      uploadedUrls.push(publicUrl.publicUrl)
    }

    if (uploadedUrls.length > 0) {
      const { data: propertyWithImages, error: imageUpdateError } =
        await supabase
          .from("properties")
          .update({
            image_urls: [...(savedProperty.image_urls ?? []), ...uploadedUrls],
          })
          .eq("id", savedProperty.id)
          .eq("owner_id", ownerId)
          .select(
            "id, title, address, city, property_type, bedrooms, bathrooms, size_sq_ft, monthly_rent, security_deposit, availability_date, description, amenities, image_urls, status",
          )
          .single()

      if (imageUpdateError) {
        throw new Error(
          `Images uploaded, but property image links could not be saved: ${imageUpdateError.message}`,
        )
      }
      savedProperty = propertyWithImages
    }

    const savedListing = toOwnerListing(savedProperty)
    setListings((current) =>
      editing
        ? current.map((item) =>
            item.id === savedListing.id ? savedListing : item,
          )
        : [savedListing, ...current],
    )
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
      loading={loading}
      error={error}
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
