import { type ReactNode, useState } from "react"
import { Button } from "@figma/astraui"
import {
  Building2,
  CalendarClock,
  CircleCheck,
  FileCheck,
  Receipt,
  Wrench,
} from "lucide-react"

type NotificationItem = {
  id: number
  title: string
  description: string
  time: string
  group: "Today" | "Earlier"
  unread: boolean
  icon: ReactNode
}

export default function NotificationsScreen({
  role,
}: {
  role: "Tenant" | "Owner"
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: role === "Tenant" ? "Rent due soon" : "Rent payment pending",
      description:
        role === "Tenant"
          ? "Your November rent of ৳18,000 is due on 05 November."
          : "Araf Rahman's November rent is due on 05 November.",
      time: "20 minutes ago",
      group: "Today",
      unread: true,
      icon: <Receipt size={20} />,
    },
    {
      id: 2,
      title: "Payment confirmed",
      description:
        role === "Tenant"
          ? "Your October rent payment was received successfully."
          : "Samira Hossain paid ৳42,000 for October rent.",
      time: "2 hours ago",
      group: "Today",
      unread: true,
      icon: <CircleCheck size={20} />,
    },
    {
      id: 3,
      title: role === "Tenant" ? "Application approved" : "New application",
      description:
        role === "Tenant"
          ? "Your application for Gulshan Lakeview Residence was approved."
          : "A new application was submitted for Dhanmondi Family Apartment.",
      time: "4 hours ago",
      group: "Today",
      unread: true,
      icon: <FileCheck size={20} />,
    },
    {
      id: 4,
      title: "Maintenance update",
      description:
        role === "Tenant"
          ? "Your kitchen tap request is now In Progress."
          : "The technician updated a request to In Progress.",
      time: "Yesterday",
      group: "Earlier",
      unread: false,
      icon: <Wrench size={20} />,
    },
    {
      id: 5,
      title: "Agreement expires soon",
      description: "The current rental agreement expires in 28 days.",
      time: "2 days ago",
      group: "Earlier",
      unread: false,
      icon: <CalendarClock size={20} />,
    },
    {
      id: 6,
      title: "New listing available",
      description: "A verified furnished apartment was listed in Dhanmondi.",
      time: "4 days ago",
      group: "Earlier",
      unread: false,
      icon: <Building2 size={20} />,
    },
  ])

  return (
    <div className="notifications-shell rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="flex flex-col gap-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-title text-text-primary">Notifications</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Updates about rentals, payments, and property activity.
          </div>
        </div>
        <Button
          variant="neutral"
          onClick={() =>
            setNotifications((current) =>
              current.map((item) => ({ ...item, unread: false })),
            )
          }
        >
          Mark all as read
        </Button>
      </div>

      {(["Today", "Earlier"] as const).map((group) => (
        <section key={group}>
          <div className="mb-lg text-heading text-text-primary">{group}</div>
          <div className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
            {notifications
              .filter((item) => item.group === group)
              .map((item) => (
                <div
                  key={item.id}
                  className={`notification-row flex items-start gap-lg border-b border-border-secondary p-xl ${
                    item.unread ? "bg-brand-muted" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setNotifications((current) =>
                      current.map((notification) =>
                        notification.id === item.id
                          ? { ...notification, unread: false }
                          : notification,
                      ),
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setNotifications((current) =>
                        current.map((notification) =>
                          notification.id === item.id
                            ? { ...notification, unread: false }
                            : notification,
                        ),
                      )
                    }
                  }}
                >
                  <div className="notification-icon flex shrink-0 items-center justify-center rounded-corner-md bg-surface-bg text-brand-primary">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-lg">
                      <div className="text-label text-text-primary">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-md">
                        <span className="text-video-title text-text-secondary">
                          {item.time}
                        </span>
                        {item.unread ? (
                          <span
                            className="unread-dot shrink-0 rounded-corner-full bg-brand-primary"
                            aria-label="Unread"
                          />
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-xs text-label-sm text-text-secondary">
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
