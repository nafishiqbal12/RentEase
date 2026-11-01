import { useState } from "react"
import { Badge, Button } from "@figma/astraui"

type UserRole = "Tenant" | "Owner" | "Admin"
type UserStatus = "Active" | "Suspended"

type PlatformUser = {
  id: number
  name: string
  role: UserRole
  email: string
  phone: string
  status: UserStatus
  joined: string
  location: string
}

const initialUsers: PlatformUser[] = [
  {
    id: 1,
    name: "Araf Rahman",
    role: "Tenant",
    email: "araf.rahman@example.com",
    phone: "+880 1712 345678",
    status: "Active",
    joined: "12 Jan 2025",
    location: "Dhanmondi, Dhaka",
  },
  {
    id: 2,
    name: "Farhana Ahmed",
    role: "Owner",
    email: "farhana.ahmed@example.com",
    phone: "+880 1811 247890",
    status: "Active",
    joined: "08 Nov 2024",
    location: "Gulshan, Dhaka",
  },
  {
    id: 3,
    name: "Nabila Islam",
    role: "Tenant",
    email: "nabila.islam@example.com",
    phone: "+880 1913 467802",
    status: "Active",
    joined: "22 Oct 2025",
    location: "Banani, Dhaka",
  },
  {
    id: 4,
    name: "Mahmud Karim",
    role: "Owner",
    email: "mahmud.karim@example.com",
    phone: "+880 1610 981245",
    status: "Suspended",
    joined: "17 Jul 2024",
    location: "Uttara, Dhaka",
  },
  {
    id: 5,
    name: "Sadia Rahman",
    role: "Owner",
    email: "sadia.rahman@example.com",
    phone: "+880 1715 320198",
    status: "Active",
    joined: "04 Mar 2025",
    location: "Bashundhara, Dhaka",
  },
  {
    id: 6,
    name: "Rafiul Alam",
    role: "Admin",
    email: "rafiul.alam@rentease.bd",
    phone: "+880 1911 882340",
    status: "Active",
    joined: "02 Jun 2024",
    location: "Dhaka",
  },
]

function roleVariant(role: UserRole) {
  if (role === "Owner") return "brand" as const
  if (role === "Admin") return "danger" as const
  return "secondary" as const
}

function UserDrawer({
  user,
  onClose,
  onStatusChange,
}: {
  user: PlatformUser
  onClose: () => void
  onStatusChange: (status: UserStatus) => void
}) {
  return (
    <div className="admin-drawer-layer fixed inset-0">
      <div className="admin-drawer-scrim absolute inset-0" aria-hidden="true" />
      <aside
        className="application-drawer relative ml-auto flex h-full flex-col bg-surface-bg"
        role="dialog"
        aria-modal="true"
        aria-label={`User details for ${user.name}`}
      >
        <div className="flex items-start justify-between gap-lg border-b border-border-primary p-xl">
          <div>
            <div className="text-heading text-text-primary">User Details</div>
            <div className="mt-xs text-video-title text-text-secondary">
              User ID RE-{user.id.toString().padStart(5, "0")}
            </div>
          </div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-xl">
          <div className="flex items-center gap-lg">
            <div className="applicant-avatar flex items-center justify-center rounded-corner-full bg-brand-muted text-label text-brand-dark">
              {user.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="text-heading text-text-primary">{user.name}</div>
              <div className="mt-xs flex gap-md">
                <Badge label={user.role} variant={roleVariant(user.role)} />
                <Badge
                  label={user.status}
                  variant={user.status === "Active" ? "success" : "danger"}
                />
              </div>
            </div>
          </div>

          <div className="admin-info-grid mt-2xl">
            {[
              ["Email", user.email],
              ["Phone", user.phone],
              ["Location", user.location],
              ["Joined", user.joined],
              ["Identity status", "Verified"],
              [
                user.role === "Owner" ? "Properties" : "Applications",
                user.role === "Owner" ? "4 listings" : "3 applications",
              ],
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

          <div className="mt-2xl rounded-corner-lg border border-border-primary p-xl">
            <div className="text-label text-text-primary">Account activity</div>
            <div className="mt-lg flex flex-col gap-lg">
              <div className="flex justify-between gap-lg text-label-sm">
                <span className="text-text-secondary">Last login</span>
                <span className="text-text-primary">Today, 9:42 AM</span>
              </div>
              <div className="flex justify-between gap-lg text-label-sm">
                <span className="text-text-secondary">Completed payments</span>
                <span className="text-text-primary">9</span>
              </div>
              <div className="flex justify-between gap-lg text-label-sm">
                <span className="text-text-secondary">Open complaints</span>
                <span className="text-text-primary">0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border-primary p-xl">
          <Button
            variant="neutral"
            className={
              user.status === "Active" ? "admin-reject-button w-full" : "w-full"
            }
            onClick={() =>
              onStatusChange(user.status === "Active" ? "Suspended" : "Active")
            }
          >
            {user.status === "Active" ? "Suspend user" : "Activate user"}
          </Button>
        </div>
      </aside>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState(initialUsers)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = users.find((user) => user.id === selectedId) ?? null

  const updateStatus = (id: number, status: UserStatus) => {
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, status } : user)),
    )
  }

  return (
    <>
      <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
        <div>
          <div className="text-title text-text-primary">Users</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Manage tenant, owner, and administrator accounts.
          </div>
        </div>

        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="overflow-x-auto">
            <table className="admin-users-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Name">{user.name}</td>
                    <td data-label="Role">
                      <Badge
                        label={user.role}
                        variant={roleVariant(user.role)}
                      />
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Status">
                      <Badge
                        label={user.status}
                        variant={
                          user.status === "Active" ? "success" : "danger"
                        }
                      />
                    </td>
                    <td data-label="Joined">{user.joined}</td>
                    <td data-label="Actions">
                      <div className="flex justify-end gap-md">
                        <Button
                          variant="subtle"
                          size="small"
                          onClick={() => setSelectedId(user.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="neutral"
                          size="small"
                          className={
                            user.status === "Active"
                              ? "admin-reject-button"
                              : ""
                          }
                          onClick={() =>
                            updateStatus(
                              user.id,
                              user.status === "Active" ? "Suspended" : "Active",
                            )
                          }
                        >
                          {user.status === "Active" ? "Suspend" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected ? (
        <UserDrawer
          user={selected}
          onClose={() => setSelectedId(null)}
          onStatusChange={(status) => {
            updateStatus(selected.id, status)
            setSelectedId(null)
          }}
        />
      ) : null}
    </>
  )
}
