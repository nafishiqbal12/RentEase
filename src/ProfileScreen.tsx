import { useState } from "react"
import { Avatar, Badge, Button, InputField } from "@figma/astraui"

export default function ProfileScreen({
  role,
}: {
  role: "Tenant" | "Owner" | "Admin"
}) {
  const [name, setName] = useState(
    role === "Admin" ? "Admin User" : "Tanvir Hasan",
  )
  const [email, setEmail] = useState("tanvir.hasan@example.com")
  const [phone, setPhone] = useState("+880 1712 345678")
  const [saved, setSaved] = useState(false)

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
              type="initial"
              size="large"
              initials={role === "Admin" ? "AU" : "TH"}
            />
            <div>
              <div className="text-heading text-text-primary">{name}</div>
              <div className="mt-xs flex flex-wrap items-center gap-md">
                <Badge label={role} variant="brand" />
                <Badge label="Verified account" variant="success" />
              </div>
            </div>
          </div>

          <div className="mt-2xl flex flex-col gap-xl">
            <InputField
              label="Full name"
              value={name}
              onChange={(value) => {
                setName(value)
                setSaved(false)
              }}
            />
            <InputField
              type="email"
              label="Email address"
              value={email}
              onChange={(value) => {
                setEmail(value)
                setSaved(false)
              }}
            />
            <InputField
              type="tel"
              label="Phone number"
              value={phone}
              onChange={(value) => {
                setPhone(value)
                setSaved(false)
              }}
            />
          </div>

          <div className="mt-2xl flex flex-wrap items-center gap-lg border-t border-border-secondary pt-xl">
            <Button variant="primary" onClick={() => setSaved(true)}>
              Save changes
            </Button>
            {saved ? <Badge label="Changes saved" variant="success" /> : null}
          </div>
        </section>

        <aside className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">Account</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Your RentEase account is active and verified.
          </div>
          <div className="mt-xl rounded-corner-md bg-bg-faint p-lg">
            <div className="text-video-title text-text-secondary">
              Workspace
            </div>
            <div className="mt-xs text-label-sm text-text-primary">
              {role} portal
            </div>
          </div>
          <div className="mt-md rounded-corner-md bg-bg-faint p-lg">
            <div className="text-video-title text-text-secondary">
              Member since
            </div>
            <div className="mt-xs text-label-sm text-text-primary">
              February 2025
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
