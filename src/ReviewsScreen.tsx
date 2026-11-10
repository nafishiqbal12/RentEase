import { useEffect, useState } from "react"
import { Badge, Button, SelectField, TextareaField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Lease = {
  id: string
  property_id: string
  property: { title: string; city: string } | null
  owner_id: string
  owner: { full_name: string } | null
}
type OwnerReview = {
  id: string
  property_id: string
  property: { title: string; city: string } | null
  tenant: { full_name: string } | null
  property_rating: number
  owner_rating: number
  body: string
  created_at: string
}

export default function ReviewsScreen({
  userId,
  role = "Tenant",
}: {
  userId: string
  role?: "Tenant" | "Owner"
}) {
  const [leases, setLeases] = useState<Lease[]>([])
  const [leaseId, setLeaseId] = useState("")
  const [propertyRating, setPropertyRating] = useState("5")
  const [ownerRating, setOwnerRating] = useState("5")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [ownerReviews, setOwnerReviews] = useState<OwnerReview[]>([])

  useEffect(() => {
    void supabase
      .from("leases")
      .select(
        "id, property_id, owner_id, properties(title, city), owner:profiles!leases_owner_id_fkey(full_name)",
      )
      .eq("tenant_id", userId)
      .in("status", ["active", "expired", "terminated"])
      .then(({ data, error }) => {
        if (error)
          setMessage(`Unable to load completed leases: ${error.message}`)
        else {
          const loaded = (data ?? []).map((item) => ({
            ...item,
            property: Array.isArray(item.properties)
              ? item.properties[0]
              : item.properties,
            owner: Array.isArray(item.owner) ? item.owner[0] : item.owner,
          })) as Lease[]
          setLeases(loaded)
          setLeaseId(loaded[0]?.id ?? "")
        }
        setLoading(false)
      })
  }, [userId, role])

  useEffect(() => {
    if (role !== "Owner") return
    void supabase
      .from("reviews")
      .select(
        "id, property_id, property_rating, owner_rating, body, created_at, properties!inner(title, city, owner_id), tenant:profiles!reviews_tenant_id_fkey(full_name)",
      )
      .eq("properties.owner_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error)
          setMessage(`Unable to load property reviews: ${error.message}`)
        else
          setOwnerReviews(
            (data ?? []).map((item) => ({
              ...item,
              property: Array.isArray(item.properties)
                ? item.properties[0]
                : item.properties,
              tenant: Array.isArray(item.tenant) ? item.tenant[0] : item.tenant,
            })) as OwnerReview[],
          )
        setLoading(false)
      })
  }, [role, userId])

  const submit = async () => {
    if (role !== "Tenant" || !leaseId || !body.trim()) {
      setMessage("Select a completed lease and write a review.")
      return
    }
    const lease = leases.find((item) => item.id === leaseId)
    if (!lease) return
    setSaving(true)
    setMessage(null)
    const { error } = await supabase.from("reviews").insert({
      lease_id: lease.id,
      property_id: lease.property_id,
      tenant_id: userId,
      owner_id: lease.owner_id,
      property_rating: Number(propertyRating),
      owner_rating: Number(ownerRating),
      body: body.trim(),
      verified: true,
    })
    setSaving(false)
    setMessage(
      error
        ? `Unable to submit review: ${error.message}`
        : "Verified review submitted.",
    )
    if (!error) setBody("")
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Reviews</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          {role === "Owner"
            ? "Read feedback from tenants of your properties."
            : "Share feedback during or after a tenancy."}
        </div>
      </div>
      {message ? (
        <div
          className="rounded-corner-md bg-bg-faint p-lg text-label-sm text-text-secondary"
          role="status"
        >
          {message}
        </div>
      ) : null}
      {role === "Tenant" ? (
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
          {loading ? (
            <div className="text-label-sm text-text-secondary">
              Loading completed leases...
            </div>
          ) : leases.length === 0 ? (
            <div className="text-label-sm text-text-secondary">
              No completed lease is available for review.
            </div>
          ) : (
            <div className="flex flex-col gap-xl">
              <Badge label="Verified tenancy" variant="success" />
              <SelectField
                label="Completed lease"
                options={leases.map((lease) => ({
                  value: lease.id,
                  label: `${lease.property?.title ?? "Property"} · ${lease.property?.city ?? ""}`,
                }))}
                value={leaseId}
                onChange={setLeaseId}
              />
              <SelectField
                label="Property rating"
                options={[1, 2, 3, 4, 5].map((value) => ({
                  value: String(value),
                  label: `${value} / 5`,
                }))}
                value={propertyRating}
                onChange={setPropertyRating}
              />
              <SelectField
                label="Owner rating"
                options={[1, 2, 3, 4, 5].map((value) => ({
                  value: String(value),
                  label: `${value} / 5`,
                }))}
                value={ownerRating}
                onChange={setOwnerRating}
              />
              <TextareaField
                label="Review"
                value={body}
                onChange={setBody}
                rows={5}
              />
              <Button
                variant="primary"
                disabled={saving}
                onClick={() => void submit()}
              >
                {saving ? "Submitting..." : "Submit review"}
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          {loading ? (
            <div className="text-label-sm text-text-secondary">
              Loading property reviews...
            </div>
          ) : ownerReviews.length === 0 ? (
            <div className="text-label-sm text-text-secondary">
              No reviews have been submitted for your properties.
            </div>
          ) : (
            <div className="flex flex-col gap-xl">
              {ownerReviews.map((review) => (
                <article
                  key={review.id}
                  className="border-b border-border-secondary pb-xl last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-lg">
                    <div>
                      <div className="text-label text-text-primary">
                        {review.property?.title ?? "Property"}
                      </div>
                      <div className="mt-xs text-video-title text-text-secondary">
                        {review.property?.city} ·{" "}
                        {review.tenant?.full_name ?? "Tenant"}
                      </div>
                    </div>
                    <Badge
                      label={`${review.property_rating} / 5`}
                      variant="success"
                    />
                  </div>
                  <div className="mt-md text-label-sm text-text-secondary">
                    {review.body}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
