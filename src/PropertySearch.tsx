import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useState,
} from "react"
import {
  Badge,
  Button,
  Checkbox,
  IconButton,
  InputField,
  SelectField,
  SwitchField,
} from "@figma/astraui"
import { ChevronLeft, Heart, MapPin, Star } from "lucide-react"
import { supabase } from "./lib/supabase"

type Property = {
  id: number | string
  title: string
  location: string
  rent: string
  beds: number
  baths: number
  size: string
  image: string
  type: string
}

const properties: Property[] = [
  {
    id: 1,
    title: "Sunlit Furnished Apartment",
    location: "Road 8A, Dhanmondi, Dhaka",
    rent: "৳32,000",
    beds: 3,
    baths: 3,
    size: "1,650 sq ft",
    type: "Apartment",
    image:
      "https://images.unsplash.com/photo-1737045466261-92204d753268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBob3VzZSUyMGludGVyaW9yJTIwQmFuZ2xhZGVzaCUyMERoYWthJTIwZnVybmlzaGVkJTIwcmVudGFsfGVufDF8fHx8MTc5MTg4NTYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    title: "Modern Lakeview Residence",
    location: "Gulshan 2, Dhaka",
    rent: "৳58,000",
    beds: 4,
    baths: 4,
    size: "2,250 sq ft",
    type: "Apartment",
    image:
      "https://images.unsplash.com/photo-1585074773760-751694845cd9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBob3VzZSUyMGludGVyaW9yJTIwQmFuZ2xhZGVzaCUyMERoYWthJTIwZnVybmlzaGVkJTIwcmVudGFsfGVufDF8fHx8MTc5MTg4NTYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    title: "Quiet Family Home",
    location: "Sector 11, Uttara, Dhaka",
    rent: "৳27,500",
    beds: 3,
    baths: 2,
    size: "1,480 sq ft",
    type: "House",
    image:
      "https://images.unsplash.com/photo-1650191487883-8c888d7f8ca0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBob3VzZSUyMGludGVyaW9yJTIwQmFuZ2xhZGVzaCUyMERoYWthaJTIwZnVybmlzaGVkJTIwcmVudGFsfGVufDF8fHx8MTc5MTg4NTYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 4,
    title: "Compact City Apartment",
    location: "Banani 11, Dhaka",
    rent: "৳24,000",
    beds: 2,
    baths: 2,
    size: "1,120 sq ft",
    type: "Apartment",
    image:
      "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMERoYWthJTIwaG9tZSUyMHdhcm0lMjBkYXlsaWdodHxlbnwxfHx8fDE3OTE4ODUyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    title: "Green View Corner Flat",
    location: "Bashundhara R/A, Dhaka",
    rent: "৳36,000",
    beds: 3,
    baths: 3,
    size: "1,720 sq ft",
    type: "Apartment",
    image:
      "https://images.unsplash.com/photo-1707243794846-e9b391b07dcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tJTIwQmFuZ2xhZGVzaCUyMHJlbnRhbCUyMGJyaWdodCUyMGZ1cm5pc2hlZHxlbnwxfHx8fDE3OTE4ODUzNTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 6,
    title: "Professional Office Suite",
    location: "Motijheel C/A, Dhaka",
    rent: "৳45,000",
    beds: 0,
    baths: 2,
    size: "1,900 sq ft",
    type: "Office",
    image:
      "https://images.unsplash.com/photo-1552489639-c0ebf31e5f99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw2fHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBob3VzZSUyMGludGVyaW9yJTIwQmFuZ2xhZGVzaCUyMERoYWthJTIwZnVybmlzaGVkJTIwcmVudGFsfGVufDF8fHx8MTc5MTg4NTYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  },
]

const galleryImages = [
  properties[0].image,
  properties[3].image,
  properties[4].image,
]

function RentRange() {
  const [minimum, setMinimum] = useState(12000)
  const [maximum, setMaximum] = useState(60000)
  const lowerBound = 5000
  const upperBound = 80000
  const step = 1000
  const percent = (value: number) =>
    ((value - lowerBound) / (upperBound - lowerBound)) * 100

  const rangeStyle = {
    "--range-start": `${percent(minimum)}%`,
    "--range-end": `${percent(maximum)}%`,
  } as CSSProperties

  const updateWithKeyboard = (
    event: KeyboardEvent<HTMLDivElement>,
    thumb: "minimum" | "maximum",
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const change = event.key === "ArrowRight" ? step : -step
    if (thumb === "minimum") {
      setMinimum((value) =>
        Math.min(maximum - step, Math.max(lowerBound, value + change)),
      )
    } else {
      setMaximum((value) =>
        Math.max(minimum + step, Math.min(upperBound, value + change)),
      )
    }
  }

  const updateWithPointer = (
    event: PointerEvent<HTMLDivElement>,
    thumb: "minimum" | "maximum",
  ) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const track = event.currentTarget.parentElement
    if (!track) return
    const bounds = track.getBoundingClientRect()
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - bounds.left) / bounds.width),
    )
    const nextValue =
      Math.round((lowerBound + ratio * (upperBound - lowerBound)) / step) * step
    if (thumb === "minimum") {
      setMinimum(Math.min(maximum - step, nextValue))
    } else {
      setMaximum(Math.max(minimum + step, nextValue))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between text-label-sm text-text-primary">
        <span>৳{minimum.toLocaleString()}</span>
        <span>৳{maximum.toLocaleString()}</span>
      </div>
      <div className="rent-range mt-lg" style={rangeStyle}>
        <div className="rent-range-fill" />
        <div
          className="rent-range-thumb rent-range-thumb-min"
          role="slider"
          tabIndex={0}
          aria-label="Minimum monthly rent"
          aria-valuemin={lowerBound}
          aria-valuemax={maximum - step}
          aria-valuenow={minimum}
          onKeyDown={(event) => updateWithKeyboard(event, "minimum")}
          onPointerDown={(event) =>
            event.currentTarget.setPointerCapture(event.pointerId)
          }
          onPointerMove={(event) => updateWithPointer(event, "minimum")}
        />
        <div
          className="rent-range-thumb rent-range-thumb-max"
          role="slider"
          tabIndex={0}
          aria-label="Maximum monthly rent"
          aria-valuemin={minimum + step}
          aria-valuemax={upperBound}
          aria-valuenow={maximum}
          onKeyDown={(event) => updateWithKeyboard(event, "maximum")}
          onPointerDown={(event) =>
            event.currentTarget.setPointerCapture(event.pointerId)
          }
          onPointerMove={(event) => updateWithPointer(event, "maximum")}
        />
      </div>
    </div>
  )
}

function FilterPanel() {
  const [bedrooms, setBedrooms] = useState("Any")
  const [availability, setAvailability] = useState("any")

  return (
    <aside className="search-filter dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
      <div className="flex items-center justify-between">
        <div className="text-heading text-text-primary">Filters</div>
        <Button variant="subtle" size="small">
          Reset
        </Button>
      </div>

      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Monthly rent</div>
        <RentRange />
      </div>

      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Property type</div>
        <div className="flex flex-col gap-lg">
          {["Apartment", "House", "Room", "Office"].map((item) => (
            <Checkbox key={item} label={item} />
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Bedrooms</div>
        <div className="grid grid-cols-5 gap-md">
          {["Any", "1", "2", "3", "4+"].map((item) => (
            <Button
              key={item}
              type="button"
              variant={bedrooms === item ? "primary" : "neutral"}
              size="small"
              className="filter-bedroom"
              aria-pressed={bedrooms === item}
              onClick={() => setBedrooms(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <SwitchField
          label="Furnished only"
          hasDescription={false}
          defaultSelected={false}
        />
      </div>

      <div className="filter-section">
        <div className="mb-lg text-label text-text-primary">Amenities</div>
        <div className="flex flex-col gap-lg">
          {["Parking", "Lift", "Generator", "Security", "Balcony"].map(
            (item) => (
              <Checkbox key={item} label={item} />
            ),
          )}
        </div>
      </div>

      <div className="filter-section">
        <SelectField
          label="Availability"
          options={[
            { value: "any", label: "Any time" },
            { value: "now", label: "Available now" },
            { value: "month", label: "Within one month" },
          ]}
          value={availability}
          onChange={setAvailability}
        />
      </div>

      <Button variant="primary" className="w-full">
        Apply filters
      </Button>
    </aside>
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
        <img
          className="h-full w-full object-cover"
          src={property.image}
          alt={property.title}
        />
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
          <Badge label="Verified" variant="success" />
        </div>
      </div>

      <div className="p-xl">
        <div className="flex items-start justify-between gap-lg">
          <div>
            <div className="text-heading text-brand-dark">
              {property.rent}
              <span className="text-video-title text-text-secondary">
                {" "}
                / month
              </span>
            </div>
            <div className="mt-md text-label text-text-primary">
              {property.title}
            </div>
          </div>
          <Badge label={property.type} variant="secondary" />
        </div>

        <div className="mt-md flex items-center gap-xs text-label-sm text-text-secondary">
          <MapPin size={16} />
          <span>{property.location}</span>
        </div>

        <div className="mt-lg flex items-center gap-md text-video-title text-text-secondary">
          <span>{property.beds || "Studio"} Beds</span>
          <span aria-hidden="true">·</span>
          <span>{property.baths} Baths</span>
          <span aria-hidden="true">·</span>
          <span>{property.size}</span>
        </div>

        <div
          className="mt-xl border-t border-border-secondary pt-lg"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Checkbox label="Compare" />
        </div>
      </div>
    </article>
  )
}

function MapPanel({
  properties,
  onOpen,
}: {
  properties: Property[]
  onOpen: (property: Property) => void
}) {
  return (
    <div
      className="search-map dashboard-card relative overflow-hidden rounded-corner-lg border border-border-primary"
      aria-label="Property map"
    >
      <div className="map-road map-road-one" />
      <div className="map-road map-road-two" />
      <div className="map-road map-road-three" />
      {properties.slice(0, 4).map((property, index) => (
        <Button
          key={property.id}
          variant="primary"
          size="small"
          className={`map-marker map-marker-${index + 1}`}
          onClick={() => onOpen(property)}
        >
          {property.rent}
        </Button>
      ))}
      <div className="absolute bottom-0 left-0 m-xl rounded-corner-md bg-surface-bg p-lg text-label-sm text-text-primary">
        Showing homes across Dhaka
      </div>
    </div>
  )
}

function SearchResults({
  properties,
  loading,
  error,
  onOpen,
}: {
  properties: Property[]
  loading: boolean
  error: string | null
  onOpen: (property: Property) => void
}) {
  const [location, setLocation] = useState("Dhanmondi, Dhaka")
  const [view, setView] = useState<"list" | "map">("list")
  const [sort, setSort] = useState("recommended")
  const [savedIds, setSavedIds] = useState<number[]>([2])

  const toggleSaved = (id: number) => {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id],
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
            label="Location"
            placeholder="Search area or neighbourhood"
            value={location}
            onChange={setLocation}
          />
        </div>
        <Button variant="primary">Search</Button>
      </div>

      <div className="search-layout">
        <FilterPanel />

        <div className="min-w-0">
          <div className="mb-xl flex flex-col gap-lg sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-heading text-text-primary">
                {properties.length} properties found
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Around Dhanmondi and nearby areas
              </div>
            </div>

            <div className="flex flex-col gap-md sm:flex-row sm:items-end">
              <div
                className="flex gap-xs rounded-corner-md border border-border-primary bg-surface-bg p-xs"
                aria-label="Property view"
              >
                <Button
                  type="button"
                  variant={view === "list" ? "primary" : "subtle"}
                  size="small"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  List
                </Button>
                <Button
                  type="button"
                  variant={view === "map" ? "primary" : "subtle"}
                  size="small"
                  aria-pressed={view === "map"}
                  onClick={() => setView("map")}
                >
                  Map
                </Button>
              </div>
              <div className="sort-field">
                <SelectField
                  label="Sort by"
                  options={[
                    { value: "recommended", label: "Recommended" },
                    { value: "low", label: "Rent: low to high" },
                    { value: "high", label: "Rent: high to low" },
                    { value: "new", label: "Newest" },
                  ]}
                  value={sort}
                  onChange={setSort}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
              Loading verified properties...
            </div>
          ) : error ? (
            <div
              className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-danger"
              role="alert"
            >
              {error}
            </div>
          ) : properties.length === 0 ? (
            <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
              No approved properties are available yet.
            </div>
          ) : view === "list" ? (
            <div className="grid grid-cols-1 gap-xl xl:grid-cols-2">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  saved={savedIds.includes(property.id)}
                  onSave={() => toggleSaved(property.id)}
                  onOpen={() => onOpen(property)}
                />
              ))}
            </div>
          ) : (
            <MapPanel properties={properties} onOpen={onOpen} />
          )}
        </div>
      </div>
    </div>
  )
}

function RatingStars() {
  return (
    <div className="flex items-center gap-xs text-accent" aria-label="5 stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={16} className="fill-current" />
      ))}
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
  onApply?: () => void
}) {
  return (
    <div className="rent-page-content flex flex-col gap-xl p-xl md:p-2xl">
      <div>
        <Button
          type="button"
          variant="subtle"
          iconStart={<ChevronLeft size={16} />}
          onClick={onBack}
        >
          Back to search
        </Button>
      </div>

      <div className="property-gallery">
        <img
          className="property-gallery-main h-full w-full object-cover"
          src={property.image}
          alt={property.title}
        />
        {galleryImages.slice(1).map((image, index) => (
          <img
            key={image}
            className={`property-gallery-small property-gallery-small-${index + 1} h-full w-full object-cover`}
            src={image}
            alt={`${property.title} view ${index + 2}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-xl lg:grid-cols-3">
        <div className="flex flex-col gap-xl lg:col-span-2">
          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="flex flex-col gap-xl sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-md">
                  <Badge label="Verified" variant="success" />
                  <Badge label={property.type} variant="secondary" />
                </div>
                <div className="mt-lg text-title text-text-primary">
                  {property.title}
                </div>
                <div className="mt-md flex items-center gap-xs text-label-sm text-text-secondary">
                  <MapPin size={16} />
                  <span>{property.location}</span>
                </div>
                <div className="mt-lg text-label-sm text-text-secondary">
                  {property.beds || "Studio"} Beds · {property.baths} Baths ·{" "}
                  {property.size} · Furnished
                </div>
              </div>
              <div>
                <div className="text-title text-brand-dark">
                  {property.rent}
                </div>
                <div className="text-video-title text-text-secondary">
                  per month
                </div>
                <div className="mt-md text-label-sm text-text-primary">
                  Deposit ৳64,000
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="text-heading text-text-primary">Amenities</div>
            <div className="mt-xl flex flex-wrap gap-md">
              {[
                "Covered parking",
                "Lift",
                "Generator",
                "24/7 security",
                "Balcony",
                "Gas connection",
                "Air conditioning",
                "Rooftop access",
              ].map((amenity) => (
                <Badge key={amenity} label={amenity} variant="secondary" />
              ))}
            </div>
          </section>

          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="text-heading text-text-primary">
              About this property
            </div>
            <div className="mt-lg text-label-sm text-text-secondary">
              A bright, thoughtfully furnished home in a quiet part of
              Dhanmondi. The apartment has generous natural light, a spacious
              living and dining area, modern fittings, and convenient access to
              schools, hospitals, cafés, and daily essentials.
            </div>
          </section>

          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="text-heading text-text-primary">Location</div>
            <div className="mt-xs text-label-sm text-text-secondary">
              Road 8A, Dhanmondi, Dhaka
            </div>
            <div className="detail-map relative mt-xl overflow-hidden rounded-corner-lg">
              <div className="map-road map-road-one" />
              <div className="map-road map-road-two" />
              <div className="map-road map-road-three" />
              <div className="detail-map-pin">
                <MapPin size={24} />
              </div>
            </div>
          </section>

          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="text-heading text-text-primary">Owner</div>
            <div className="mt-xl flex items-center gap-lg">
              <div className="owner-avatar flex items-center justify-center rounded-corner-full bg-brand-muted text-label text-brand-dark">
                FA
              </div>
              <div>
                <div className="text-label text-text-primary">
                  Farhana Ahmed
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  Verified owner · Responds within 2 hours
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
            <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-heading text-text-primary">
                  Reviews and ratings
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  From 18 verified tenants
                </div>
              </div>
              <div className="flex items-center gap-md">
                <div className="text-heading text-text-primary">4.8</div>
                <RatingStars />
              </div>
            </div>

            <div className="mt-xl grid grid-cols-1 gap-xl sm:grid-cols-2">
              {[
                {
                  name: "Samira H.",
                  review:
                    "Quiet building, responsive owner, and exactly as shown in the photos.",
                },
                {
                  name: "Rafi N.",
                  review:
                    "Great Dhanmondi location with reliable utilities and security.",
                },
              ].map((review) => (
                <div
                  key={review.name}
                  className="rounded-corner-md bg-bg-faint p-xl"
                >
                  <RatingStars />
                  <div className="mt-lg text-label-sm text-text-primary">
                    {review.review}
                  </div>
                  <div className="mt-md text-video-title text-text-secondary">
                    {review.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="apply-card dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">Ready to apply?</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Send your rental application to the owner.
          </div>
          <div className="mt-xl rounded-corner-md bg-bg-faint p-lg">
            <div className="flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Monthly rent</span>
              <span className="text-text-primary">{property.rent}</span>
            </div>
            <div className="mt-md flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Security deposit</span>
              <span className="text-text-primary">৳64,000</span>
            </div>
            <div className="mt-md flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Available from</span>
              <span className="text-text-primary">01 November</span>
            </div>
          </div>
          <Button variant="primary" className="mt-xl w-full" onClick={onApply}>
            Apply to rent
          </Button>
          <Button variant="neutral" className="mt-md w-full">
            Message owner
          </Button>
          <div className="mt-lg text-center text-video-title text-text-secondary">
            No payment is required to apply.
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function PropertySearch({ onApply }: { onApply?: () => void }) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  )
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadProperties = async () => {
      const { data, error: queryError } = await supabase
        .from("properties")
        .select(
          "id, title, address, city, bedrooms, bathrooms, size_sq_ft, monthly_rent, security_deposit, property_type, image_urls",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })

      if (!active) return
      if (queryError) {
        setError(`Unable to load properties: ${queryError.message}`)
      } else {
        setProperties(
          (data ?? []).map((property) => ({
            id: property.id,
            title: property.title,
            location: `${property.address}, ${property.city}`,
            rent: `৳${Number(property.monthly_rent).toLocaleString("en-BD")}`,
            beds: property.bedrooms,
            baths: Number(property.bathrooms),
            size: property.size_sq_ft
              ? `${property.size_sq_ft.toLocaleString()} sq ft`
              : "Size unavailable",
            type:
              property.property_type.charAt(0).toUpperCase() +
              property.property_type.slice(1),
            image: property.image_urls[0] ?? properties[0]?.image ?? "",
          })),
        )
      }
      setLoading(false)
    }

    void loadProperties()
    return () => {
      active = false
    }
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
      onOpen={setSelectedProperty}
    />
  )
}
