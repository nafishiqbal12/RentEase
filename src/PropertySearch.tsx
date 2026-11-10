import { type KeyboardEvent, useEffect, useMemo, useState } from "react"
import {
  Badge,
  Button,
  IconButton,
  InputField,
  SelectField,
} from "@figma/astraui"
import { ChevronLeft, Heart, MapPin, Star } from "lucide-react"
import { supabase } from "./lib/supabase"

type Property = {
  id: string
  title: string
  address: string
  city: string
  description: string | null
  monthlyRent: number
  securityDeposit: number | null
  bedrooms: number
  bathrooms: number
  sizeSqFt: number | null
  imageUrls: string[]
  amenities: string[]
  availabilityDate: string | null
  propertyType: string
  createdAt: string
  ownerName: string
  averageRating: number | null
}

type Review = {
  property_rating: number
  owner_rating: number
  body: string
  created_at: string
}

type Filters = {
  area: string
  keyword: string
  minimumRent: string
  maximumRent: string
  propertyType: string
  bedrooms: string
  bathrooms: string
  amenities: string[]
}

const areas = [
  "Dhanmondi",
  "Kalabagan",
  "Shahbag",
  "Ramna",
  "Segunbagicha",
  "Motijheel",
  "Paltan",
  "Gulistan",
  "Wari",
  "Sutrapur",
  "Lalbagh",
  "Chawkbazar",
  "Kotwali (Old Dhaka)",
  "Hazaribagh",
  "Kamrangirchar",
  "Malibagh",
  "Shantinagar",
  "Khilgaon",
  "Basabo",
  "Mugda",
  "Jatrabari",
  "Demra",
]
const propertyTypes = ["Apartment", "House", "Room", "Office"]
const bedrooms = ["Any", "1", "2", "3", "4+"]
const bathrooms = ["Any", "1", "2", "3+"]
const amenityOptions = [
  "lift",
  "generator",
  "gas",
  "parking",
  "security",
  "balcony",
]
const emptyFilters: Filters = {
  area: "Any",
  keyword: "",
  minimumRent: "",
  maximumRent: "",
  propertyType: "Any",
  bedrooms: "Any",
  bathrooms: "Any",
  amenities: [],
}
const pageSize = 9

const formatRent = (value: number) => `৳${value.toLocaleString("en-BD")}`
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-BD", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(`${value}T00:00:00`))
    : "Available now"

function mapProperty(row: {
  id: string
  title: string
  address: string
  city: string
  description: string | null
  monthly_rent: number | string
  security_deposit: number | string | null
  bedrooms: number
  bathrooms: number | string
  size_sq_ft: number | null
  image_urls: string[] | null
  amenities: string[] | null
  availability_date: string | null
  property_type: string
  created_at: string
}): Property {
  return {
    id: row.id,
    title: row.title,
    address: row.address,
    city: row.city,
    description: row.description,
    monthlyRent: Number(row.monthly_rent),
    securityDeposit:
      row.security_deposit === null ? null : Number(row.security_deposit),
    bedrooms: row.bedrooms,
    bathrooms: Number(row.bathrooms),
    sizeSqFt: row.size_sq_ft,
    imageUrls: row.image_urls ?? [],
    amenities: row.amenities ?? [],
    availabilityDate: row.availability_date,
    propertyType:
      row.property_type.charAt(0).toUpperCase() + row.property_type.slice(1),
    createdAt: row.created_at,
    ownerName: "Property owner",
    averageRating: null,
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-xs text-brand-primary"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={15}
          className={index < Math.round(rating) ? "fill-current" : ""}
        />
      ))}
    </div>
  )
}

function PropertyCard({
  property,
  saved,
  onSave,
  onOpen,
}: {
  property: Property
  saved: boolean
  onSave: () => void
  onOpen: () => void
}) {
  const openWithKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onOpen()
    }
  }
  return (
    <article
      className="property-card dashboard-card cursor-pointer overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={openWithKeyboard}
      aria-label={`View ${property.title}`}
    >
      <div className="property-image-wrap relative">
        {property.imageUrls[0] ? (
          <img
            className="h-full w-full object-cover"
            src={property.imageUrls[0]}
            alt={property.title}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-muted text-label-sm text-text-secondary">
            No image available
          </div>
        )}
        <div
          className="absolute right-0 top-0 p-md"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <IconButton
            type="button"
            variant="neutral"
            size="small"
            icon={
              <Heart
                size={16}
                className={saved ? "fill-current text-brand-primary" : ""}
              />
            }
            aria-label={saved ? "Remove from saved" : "Save property"}
            onClick={onSave}
          />
        </div>
        <div className="absolute bottom-0 left-0 p-md">
          <Badge label="Approved" variant="success" />
        </div>
      </div>
      <div className="p-xl">
        <div className="flex items-start justify-between gap-lg">
          <div>
            <div className="text-heading text-brand-dark">
              {formatRent(property.monthlyRent)}
              <span className="text-video-title text-text-secondary">
                {" "}
                / month
              </span>
            </div>
            <div className="mt-md text-label text-text-primary">
              {property.title}
            </div>
          </div>
          <Badge label={property.propertyType} variant="secondary" />
        </div>
        <div className="mt-md flex items-center gap-xs text-label-sm text-text-secondary">
          <MapPin size={16} />
          <span>
            {property.address}, {property.city}
          </span>
        </div>
        <div className="mt-lg flex items-center gap-md text-video-title text-text-secondary">
          <span>{property.bedrooms || "Studio"} Beds</span>
          <span>·</span>
          <span>{property.bathrooms} Baths</span>
          {property.sizeSqFt ? (
            <>
              <span>·</span>
              <span>{property.sizeSqFt.toLocaleString()} sq ft</span>
            </>
          ) : null}
        </div>
        {property.averageRating !== null ? (
          <div className="mt-lg flex items-center gap-xs text-video-title text-text-secondary">
            <Stars rating={property.averageRating} />
            <span>{property.averageRating.toFixed(1)} / 5</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}

function FilterPanel({
  filters,
  onChange,
  onReset,
  onApply,
}: {
  filters: Filters
  onChange: (field: keyof Filters, value: string) => void
  onReset: () => void
  onApply: () => void
}) {
  const toggleAmenity = (amenity: string) =>
    onChange(
      "amenities",
      filters.amenities.includes(amenity)
        ? filters.amenities.filter((item) => item !== amenity).join(",")
        : [...filters.amenities, amenity].join(","),
    )
  return (
    <aside className="search-filter dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
      <div className="flex items-center justify-between">
        <div className="text-heading text-text-primary">Filters</div>
        <Button variant="subtle" size="small" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Area</div>
        <SelectField
          label="Dhaka South area"
          options={[
            { value: "Any", label: "Any area" },
            ...areas.map((area) => ({ value: area, label: area })),
          ]}
          value={filters.area}
          onChange={(value) => onChange("area", value)}
        />
      </div>
      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Monthly rent</div>
        <div className="grid grid-cols-2 gap-md">
          <InputField
            label="Minimum"
            type="number"
            value={filters.minimumRent}
            onChange={(value) => onChange("minimumRent", value)}
          />
          <InputField
            label="Maximum"
            type="number"
            value={filters.maximumRent}
            onChange={(value) => onChange("maximumRent", value)}
          />
        </div>
      </div>
      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Property type</div>
        <div className="grid grid-cols-2 gap-md">
          {["Any", ...propertyTypes].map((item) => (
            <Button
              key={item}
              type="button"
              variant={filters.propertyType === item ? "primary" : "neutral"}
              size="small"
              aria-pressed={filters.propertyType === item}
              onClick={() => onChange("propertyType", item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>
      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Bedrooms</div>
        <div className="grid grid-cols-5 gap-md">
          {bedrooms.map((item) => (
            <Button
              key={item}
              type="button"
              variant={filters.bedrooms === item ? "primary" : "neutral"}
              size="small"
              aria-pressed={filters.bedrooms === item}
              onClick={() => onChange("bedrooms", item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>
      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Bathrooms</div>
        <div className="grid grid-cols-4 gap-md">
          {bathrooms.map((item) => (
            <Button
              key={item}
              type="button"
              variant={filters.bathrooms === item ? "primary" : "neutral"}
              size="small"
              aria-pressed={filters.bathrooms === item}
              onClick={() => onChange("bathrooms", item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>
      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Amenities</div>
        <div className="flex flex-wrap gap-md">
          {amenityOptions.map((amenity) => (
            <Button
              key={amenity}
              type="button"
              variant={
                filters.amenities.includes(amenity) ? "primary" : "neutral"
              }
              size="small"
              aria-pressed={filters.amenities.includes(amenity)}
              onClick={() => toggleAmenity(amenity)}
            >
              {amenity}
            </Button>
          ))}
        </div>
      </div>
      <Button variant="primary" className="mt-lg w-full" onClick={onApply}>
        Apply filters
      </Button>
    </aside>
  )
}

function SearchResults({
  properties,
  loading,
  error,
  onOpen,
  onRetry,
}: {
  properties: Property[]
  loading: boolean
  error: string | null
  onOpen: (property: Property) => void
  onRetry: () => void
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters)
  const [sort, setSort] = useState("new")
  const [page, setPage] = useState(1)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: saved, error: queryError } = await supabase
        .from("property_favorites")
        .select("property_id")
        .eq("user_id", data.user.id)
      if (active && queryError)
        setSaveError(`Unable to load saved properties: ${queryError.message}`)
      if (active && saved) setSavedIds(saved.map((item) => item.property_id))
    })
    return () => {
      active = false
    }
  }, [])

  const filteredProperties = useMemo(() => {
    const minimum = Number(filters.minimumRent)
    const maximum = Number(filters.maximumRent)
    const result = properties.filter((property) => {
      const keyword = filters.keyword.trim().toLowerCase()
      const searchable = `${property.title} ${property.address}`.toLowerCase()
      return (
        (!keyword || searchable.includes(keyword)) &&
        (filters.area === "Any" ||
          property.address
            .toLowerCase()
            .includes(filters.area.toLowerCase())) &&
        (!filters.minimumRent ||
          (Number.isFinite(minimum) && property.monthlyRent >= minimum)) &&
        (!filters.maximumRent ||
          (Number.isFinite(maximum) && property.monthlyRent <= maximum)) &&
        (filters.propertyType === "Any" ||
          property.propertyType === filters.propertyType) &&
        (filters.bedrooms === "Any" ||
          (filters.bedrooms === "4+"
            ? property.bedrooms >= 4
            : property.bedrooms === Number(filters.bedrooms))) &&
        (filters.bathrooms === "Any" ||
          (filters.bathrooms === "3+"
            ? property.bathrooms >= 3
            : property.bathrooms === Number(filters.bathrooms))) &&
        filters.amenities.every((amenity) =>
          property.amenities.includes(amenity),
        )
      )
    })
    return [...result].sort((a, b) =>
      sort === "low"
        ? a.monthlyRent - b.monthlyRent
        : sort === "high"
          ? b.monthlyRent - a.monthlyRent
          : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
  }, [filters, properties, sort])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / pageSize),
  )
  const pageProperties = filteredProperties.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )
  const changeFilter = (field: keyof Filters, value: string) => {
    setDraftFilters((current) => ({
      ...current,
      [field]: field === "amenities" ? value.split(",").filter(Boolean) : value,
    }))
  }
  const applyFilters = () => {
    setFilters(draftFilters)
    setPage(1)
  }
  const toggleSaved = async (propertyId: string) => {
    setSaveError(null)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setSaveError("Please sign in again to save properties.")
      return
    }
    const saved = savedIds.includes(propertyId)
    const result = saved
      ? await supabase
          .from("property_favorites")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("property_id", propertyId)
      : await supabase
          .from("property_favorites")
          .insert({ user_id: userData.user.id, property_id: propertyId })
    if (result.error)
      setSaveError(`Unable to update saved properties: ${result.error.message}`)
    else
      setSavedIds((current) =>
        saved
          ? current.filter((id) => id !== propertyId)
          : [...current, propertyId],
      )
  }

  return (
    <div className="rent-page-content flex flex-col gap-xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Search Properties</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Find a verified home that fits your life.
        </div>
      </div>
      <div className="dashboard-card flex flex-col gap-lg rounded-corner-lg border border-border-primary bg-surface-bg p-xl sm:flex-row sm:items-end">
        <div className="flex-1">
          <InputField
            label="Search"
            placeholder="Search title or address"
            value={draftFilters.keyword}
            onChange={(value) => changeFilter("keyword", value)}
          />
        </div>
        <Button variant="primary" onClick={applyFilters}>
          Search
        </Button>
      </div>
      {saveError ? (
        <div
          className="rounded-corner-md bg-danger-faint p-lg text-label-sm text-danger"
          role="alert"
        >
          {saveError}
        </div>
      ) : null}
      <div className="search-layout">
        <FilterPanel
          filters={draftFilters}
          onChange={changeFilter}
          onApply={applyFilters}
          onReset={() => {
            setDraftFilters(emptyFilters)
            setFilters(emptyFilters)
            setPage(1)
          }}
        />
        <div className="min-w-0">
          <div className="mb-xl flex flex-col gap-lg sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-heading text-text-primary">
                {filteredProperties.length} properties found
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Approved and available listings from RentEase
              </div>
            </div>
            <SelectField
              label="Sort by"
              options={[
                { value: "low", label: "Rent: low to high" },
                { value: "high", label: "Rent: high to low" },
                { value: "new", label: "Newest" },
              ]}
              value={sort}
              onChange={(value) => {
                setSort(value)
                setPage(1)
              }}
            />
          </div>
          {loading ? (
            <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
              Loading approved properties...
            </div>
          ) : error ? (
            <div
              className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-danger"
              role="alert"
            >
              <div>{error}</div>
              <Button className="mt-lg" variant="neutral" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : pageProperties.length === 0 ? (
            <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
              No approved properties match these filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-xl md:grid-cols-2 xl:grid-cols-3">
                {pageProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    saved={savedIds.includes(property.id)}
                    onSave={() => void toggleSaved(property.id)}
                    onOpen={() => onOpen(property)}
                  />
                ))}
              </div>
              <div className="mt-xl flex items-center justify-between gap-lg">
                <Button
                  variant="neutral"
                  size="small"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <div className="text-label-sm text-text-secondary">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="neutral"
                  size="small"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PropertyDetails({
  property,
  onBack,
  onApply,
}: {
  property: Property
  onBack: () => void
  onApply?: (propertyId: string) => void
}) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewError, setReviewError] = useState<string | null>(null)
  useEffect(() => {
    void supabase
      .rpc("get_approved_property_reviews", { property_uuid: property.id })
      .then(({ data, error }) => {
        if (error) setReviewError(`Unable to load reviews: ${error.message}`)
        else setReviews((data ?? []) as Review[])
      })
  }, [property.id])
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.property_rating), 0) /
      reviews.length
    : 0
  return (
    <div className="rent-page-content flex flex-col gap-xl p-xl md:p-2xl">
      <Button
        type="button"
        variant="subtle"
        iconStart={<ChevronLeft size={16} />}
        onClick={onBack}
      >
        Back to search
      </Button>
      <div className="property-gallery">
        {property.imageUrls.length > 0 ? (
          property.imageUrls
            .slice(0, 3)
            .map((image, index) => (
              <img
                key={image}
                className={
                  index === 0
                    ? "property-gallery-main h-full w-full object-cover"
                    : `property-gallery-small property-gallery-small-${index} h-full w-full object-cover`
                }
                src={image}
                alt={`${property.title} view ${index + 1}`}
              />
            ))
        ) : (
          <div className="property-gallery-main flex items-center justify-center bg-brand-muted text-label-sm text-text-secondary">
            No image available
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 items-start gap-xl lg:grid-cols-3">
        <div className="flex flex-col gap-xl lg:col-span-2">
          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="flex flex-col gap-xl sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-md">
                  <Badge label="Approved" variant="success" />
                  <Badge label={property.propertyType} variant="secondary" />
                </div>
                <div className="mt-lg text-title text-text-primary">
                  {property.title}
                </div>
                <div className="mt-md flex items-center gap-xs text-label-sm text-text-secondary">
                  <MapPin size={16} />
                  <span>
                    {property.address}, {property.city}
                  </span>
                </div>
                <div className="mt-lg text-label-sm text-text-secondary">
                  {property.bedrooms || "Studio"} Beds · {property.bathrooms}{" "}
                  Baths
                  {property.sizeSqFt
                    ? ` · ${property.sizeSqFt.toLocaleString()} sq ft`
                    : ""}
                </div>
              </div>
              <div>
                <div className="text-title text-brand-dark">
                  {formatRent(property.monthlyRent)}
                </div>
                <div className="text-video-title text-text-secondary">
                  per month
                </div>
              </div>
            </div>
            <div className="mt-xl border-t border-border-secondary pt-xl text-label-sm text-text-secondary">
              Owner:{" "}
              <span className="text-text-primary">{property.ownerName}</span>
            </div>
          </section>
          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="text-heading text-text-primary">Amenities</div>
            <div className="mt-xl flex flex-wrap gap-md">
              {property.amenities.length ? (
                property.amenities.map((amenity) => (
                  <Badge key={amenity} label={amenity} variant="secondary" />
                ))
              ) : (
                <div className="text-label-sm text-text-secondary">
                  No amenities listed.
                </div>
              )}
            </div>
          </section>
          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="text-heading text-text-primary">
              About this property
            </div>
            <div className="mt-lg whitespace-pre-wrap text-label-sm text-text-secondary">
              {property.description || "No description provided."}
            </div>
          </section>
          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="flex items-center justify-between gap-lg">
              <div className="text-heading text-text-primary">Reviews</div>
              {reviews.length ? (
                <div className="flex items-center gap-md">
                  <Stars rating={average} />
                  <span className="text-label-sm text-text-secondary">
                    {average.toFixed(1)} ({reviews.length})
                  </span>
                </div>
              ) : null}
            </div>
            {reviewError ? (
              <div className="mt-lg text-label-sm text-danger">
                {reviewError}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-lg text-label-sm text-text-secondary">
                No reviews yet.
              </div>
            ) : (
              <div className="mt-xl flex flex-col gap-lg">
                {reviews.map((review) => (
                  <div
                    key={`${review.created_at}-${review.body}`}
                    className="border-t border-border-secondary pt-lg"
                  >
                    <Stars rating={review.property_rating} />
                    <div className="mt-sm text-label-sm text-text-secondary">
                      {review.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="apply-card dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">Ready to apply?</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Send your rental application to the owner.
          </div>
          <div className="mt-xl rounded-corner-md bg-bg-faint p-lg">
            <div className="flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Security deposit</span>
              <span className="text-text-primary">
                {property.securityDeposit === null
                  ? "Not specified"
                  : formatRent(property.securityDeposit)}
              </span>
            </div>
            <div className="mt-md flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Available from</span>
              <span className="text-text-primary">
                {formatDate(property.availabilityDate)}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            className="mt-xl w-full"
            onClick={() => onApply?.(property.id)}
          >
            Apply to rent
          </Button>
          <div className="mt-lg text-center text-video-title text-text-secondary">
            No payment is required to apply.
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function PropertySearch({
  onApply,
}: {
  onApply?: (propertyId: string) => void
}) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  )
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadProperties = async () => {
    setLoading(true)
    setError(null)
    const today = new Date().toISOString().slice(0, 10)
    const { data, error: queryError } = await supabase
      .from("properties")
      .select(
        "id, title, address, city, description, bedrooms, bathrooms, size_sq_ft, monthly_rent, security_deposit, property_type, image_urls, amenities, availability_date, created_at",
      )
      .eq("status", "approved")
      .or(`availability_date.is.null,availability_date.lte.${today}`)
      .order("created_at", { ascending: false })
    if (queryError) {
      setError(`Unable to load properties: ${queryError.message}`)
      setLoading(false)
      return
    }
    const mapped = (data ?? []).map(mapProperty)
    const ownerResult = await supabase.rpc("get_approved_property_owners", {
      property_ids: mapped.map((property) => property.id),
    })
    if (ownerResult.error) {
      setError(`Unable to load property owners: ${ownerResult.error.message}`)
      setLoading(false)
      return
    }
    const ownerRows = (ownerResult.data ?? []) as Array<{
      property_id: string
      owner_name: string
    }>
    const ownerNames = new Map(
      ownerRows.map((item) => [item.property_id, item.owner_name]),
    )
    const reviewResults = await Promise.all(
      mapped.map((property) =>
        supabase.rpc("get_approved_property_reviews", {
          property_uuid: property.id,
        }),
      ),
    )
    setProperties(
      mapped.map((property, index) => ({
        ...property,
        ownerName: ownerNames.get(property.id) ?? "Property owner",
        averageRating:
          reviewResults[index].error || !reviewResults[index].data?.length
            ? null
            : reviewResults[index].data.reduce(
              (sum: number, review: { property_rating: number }) =>
                sum + Number(review.property_rating),
                0,
              ) / reviewResults[index].data.length,
      })),
    )
    setLoading(false)
  }
  useEffect(() => {
    void loadProperties()
  }, [])
  return selectedProperty ? (
    <PropertyDetails
      property={selectedProperty}
      onBack={() => setSelectedProperty(null)}
      onApply={onApply}
    />
  ) : (
    <SearchResults
      properties={properties}
      loading={loading}
      error={error}
      onRetry={() => void loadProperties()}
      onOpen={setSelectedProperty}
    />
  )
}
