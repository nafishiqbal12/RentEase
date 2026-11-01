import { useState } from "react"
import { Badge, Button, IconButton, TextareaField } from "@figma/astraui"
import { Star } from "lucide-react"

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <div>
      <div className="text-label text-text-primary">{label}</div>
      <div
        className="mt-md flex gap-md"
        aria-label={`${label}: ${value} stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <IconButton
            key={star}
            type="button"
            variant="subtle"
            size="small"
            icon={
              <Star
                size={20}
                className={
                  star <= value
                    ? "fill-current text-accent"
                    : "text-text-tertiary"
                }
              />
            }
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  )
}

export default function ReviewsScreen() {
  const [propertyRating, setPropertyRating] = useState(0)
  const [ownerRating, setOwnerRating] = useState(0)
  const [review, setReview] = useState("")
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Reviews</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Share your experience after a verified tenancy.
        </div>
      </div>

      <div className="review-layout">
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
          {submitted ? (
            <div className="review-success flex flex-col items-center justify-center text-center">
              <Badge label="Review submitted" variant="success" />
              <div className="mt-xl text-heading text-text-primary">
                Thank you for your feedback
              </div>
              <div className="mt-xs text-label-sm text-text-secondary">
                Your verified review now appears on the property page.
              </div>
              <Button
                variant="neutral"
                className="mt-xl"
                onClick={() => {
                  setSubmitted(false)
                  setPropertyRating(0)
                  setOwnerRating(0)
                  setReview("")
                }}
              >
                Write another review
              </Button>
            </div>
          ) : (
            <>
              <div className="text-heading text-text-primary">
                Lakeview Heights, Flat 4B
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Dhanmondi, Dhaka · Tenancy completed
              </div>

              <div className="mt-2xl flex flex-col gap-2xl">
                <StarRating
                  label="Rate the property"
                  value={propertyRating}
                  onChange={setPropertyRating}
                />
                <StarRating
                  label="Rate the owner"
                  value={ownerRating}
                  onChange={setOwnerRating}
                />
                <TextareaField
                  label="Your review"
                  description="Mention the property condition, location, communication, and overall experience."
                  placeholder="Write your review"
                  rows={6}
                  value={review}
                  onChange={setReview}
                />
                <Button
                  variant="primary"
                  disabled={!propertyRating || !ownerRating || !review.trim()}
                  onClick={() => setSubmitted(true)}
                >
                  Submit review
                </Button>
              </div>
            </>
          )}
        </section>

        <aside className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">Review summary</div>
          <div className="mt-xl rounded-corner-md bg-bg-faint p-xl">
            <div className="text-video-title text-text-secondary">Property</div>
            <div className="mt-xs text-label text-text-primary">
              Lakeview Heights, Flat 4B
            </div>
            <div className="mt-lg text-video-title text-text-secondary">
              Owner
            </div>
            <div className="mt-xs text-label text-text-primary">
              Farhana Ahmed
            </div>
            <div className="mt-lg text-video-title text-text-secondary">
              Current average
            </div>
            <div className="mt-xs text-heading text-brand-dark">4.8 / 5</div>
          </div>
          <div className="mt-lg text-video-title text-text-secondary">
            Reviews are public and marked as verified when linked to a completed
            RentEase agreement.
          </div>
        </aside>
      </div>
    </div>
  )
}
