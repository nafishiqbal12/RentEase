import { useEffect, useMemo, useState } from "react"
import { Avatar, Badge, Button, InputField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Role = "Tenant" | "Owner" | "Admin"
type AccountStatus = "active" | "suspended"

type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  area: string | null
  avatar_url: string | null
  role: "tenant" | "owner" | "admin"
  status: AccountStatus
}

type ProfileForm = {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  area: string
  avatarUrl: string
}

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  )
}

function formFromProfile(profile: Profile): ProfileForm {
  return {
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    area: profile.area ?? "",
    avatarUrl: profile.avatar_url ?? "",
  }
}

export default function ProfileScreen({
  profile,
  role,
  onProfileUpdated,
}: {
  profile: Profile
  role: Role
  onProfileUpdated: (profile: Profile) => void
}) {
  const [form, setForm] = useState(() => formFromProfile(profile))
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    setForm(formFromProfile(profile))
  }, [profile])

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setMessage(null)
  }

  const validate = () => {
    const nextErrors: ProfileErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required."
    else if (form.fullName.trim().length > 120) {
      nextErrors.fullName = "Full name must be 120 characters or fewer."
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }
    if (form.phone.length > 40) {
      nextErrors.phone = "Phone number must be 40 characters or fewer."
    }
    if (form.address.length > 240) {
      nextErrors.address = "Address must be 240 characters or fewer."
    }
    if (form.city.length > 120) {
      nextErrors.city = "City must be 120 characters or fewer."
    }
    if (form.area.length > 120) {
      nextErrors.area = "Area must be 120 characters or fewer."
    }
    if (form.avatarUrl && !/^https?:\/\/\S+$/i.test(form.avatarUrl.trim())) {
      nextErrors.avatarUrl = "Avatar must be a valid http(s) URL."
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    setMessage(null)

    const nextEmail = form.email.trim()
    const emailChanged = nextEmail.toLowerCase() !== profile.email.toLowerCase()
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      ...(emailChanged ? { email: nextEmail } : {}),
      data: {
        full_name: form.fullName.trim(),
        phone: form.phone.trim() || null,
      },
    })

    if (authError) {
      setSaving(false)
      setMessage({ type: "error", text: `Unable to update account: ${authError.message}` })
      return
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: form.fullName.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        area: form.area.trim() || null,
        avatar_url: form.avatarUrl.trim() || null,
      })
      .eq("id", profile.id)
      .select(
        "id, full_name, email, phone, address, city, area, avatar_url, role, status",
      )
      .single()

    setSaving(false)
    if (profileError) {
      setMessage({
        type: "error",
        text: `Account settings changed, but profile details could not be saved: ${profileError.message}`,
      })
      return
    }

    const savedProfile = data as Profile
    onProfileUpdated(savedProfile)
    setForm(formFromProfile(savedProfile))
    setMessage({
      type: "success",
      text:
        emailChanged && authData.user?.email?.toLowerCase() !== nextEmail.toLowerCase()
          ? "Profile saved. Check your new email inbox to confirm the email change."
          : "Profile changes saved.",
    })
  }

  const avatarInitials = useMemo(() => initials(form.fullName), [form.fullName])

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Profile</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Manage your personal details and account preferences.
        </div>
      </div>

      <div className="profile-layout">
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
          <div className="flex flex-col items-start gap-lg sm:flex-row sm:items-center">
            <Avatar
              type={form.avatarUrl ? "image" : "initial"}
              size="large"
              initials={avatarInitials}
              src={form.avatarUrl || undefined}
              alt={`${form.fullName} avatar`}
            />
            <div>
              <div className="text-heading text-text-primary">
                {form.fullName || "Your profile"}
              </div>
              <div className="mt-xs flex flex-wrap items-center gap-md">
                <Badge label={role} variant="brand" />
                <Badge
                  label={profile.status === "active" ? "Active account" : "Suspended"}
                  variant={profile.status === "active" ? "success" : "danger"}
                />
              </div>
            </div>
          </div>

          <div className="mt-2xl grid grid-cols-1 gap-xl md:grid-cols-2">
            <InputField
              label="Full name"
              value={form.fullName}
              onChange={(value) => updateField("fullName", value)}
            />
            <InputField
              type="email"
              label="Email address"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              description="A changed email may require confirmation."
            />
            <InputField
              type="tel"
              label="Phone number"
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
            />
            <InputField
              label="Address"
              value={form.address}
              onChange={(value) => updateField("address", value)}
            />
            <InputField
              label="City"
              value={form.city}
              onChange={(value) => updateField("city", value)}
            />
            <InputField
              label="Area"
              value={form.area}
              onChange={(value) => updateField("area", value)}
            />
            <InputField
              label="Avatar URL"
              value={form.avatarUrl}
              onChange={(value) => updateField("avatarUrl", value)}
              description="Optional HTTPS image URL."
            />
          </div>

          {Object.values(errors).map((error) => (
            <div key={error} className="mt-md text-label-sm text-danger" role="alert">
              {error}
            </div>
          ))}
          {message ? (
            <div
              className={`mt-xl text-label-sm ${
                message.type === "success" ? "text-success" : "text-danger"
              }`}
              role={message.type === "success" ? "status" : "alert"}
            >
              {message.text}
            </div>
          ) : null}

          <div className="mt-2xl flex flex-wrap items-center gap-lg border-t border-border-secondary pt-xl">
            <Button variant="primary" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </section>

        <aside className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">Account</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Role and account status are managed by RentEase access controls.
          </div>
          <div className="mt-xl rounded-corner-md bg-bg-faint p-lg">
            <div className="text-video-title text-text-secondary">Workspace</div>
            <div className="mt-xs text-label-sm text-text-primary">{role} portal</div>
          </div>
          <div className="mt-md rounded-corner-md bg-bg-faint p-lg">
            <div className="text-video-title text-text-secondary">Account status</div>
            <div className="mt-xs text-label-sm text-text-primary">
              {profile.status === "active" ? "Active" : "Suspended"}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
