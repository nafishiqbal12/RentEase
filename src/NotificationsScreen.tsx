import { useEffect, useState } from "react"
import { Badge, Button } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Notification = {
  id: string
  title: string
  description: string
  category: string
  read_at: string | null
  created_at: string
}

export default function NotificationsScreen({
  role: _role,
}: {
  role: "Tenant" | "Owner" | "Admin"
}) {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError("Please sign in again to view notifications.")
      setLoading(false)
      return
    }
    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("id, title, description, category, read_at, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
    if (queryError)
      setError(`Unable to load notifications: ${queryError.message}`)
    else setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    let active = true
    const channel = supabase
      .channel(`notifications-${_role}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          if (active) void load()
        },
      )
      .subscribe()
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [_role])

  const markRead = async (id: string) => {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
    if (updateError)
      setError(`Unable to mark notification read: ${updateError.message}`)
    else await load()
  }

  const markAllRead = async () => {
    const unread = items.filter((item) => !item.read_at).map((item) => item.id)
    if (unread.length === 0) return
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread)
    if (updateError)
      setError(`Unable to mark notifications read: ${updateError.message}`)
    else await load()
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="flex items-center justify-between gap-lg">
        <div>
          <div className="text-title text-text-primary">Notifications</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Updates from your RentEase account.
          </div>
        </div>
        <Button variant="neutral" onClick={() => void markAllRead()}>
          Mark all as read
        </Button>
      </div>
      {error ? (
        <div
          className="rounded-corner-md bg-danger-faint p-lg text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
        {loading ? (
          <div className="p-2xl text-center text-label-sm text-text-secondary">
            Loading notifications...
          </div>
        ) : items.length === 0 ? (
          <div className="p-2xl text-center text-label-sm text-text-secondary">
            No notifications yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-lg border-b border-border-secondary p-xl ${
                item.read_at ? "" : "bg-brand-muted"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-md">
                  <div className="text-label text-text-primary">
                    {item.title}
                  </div>
                  {!item.read_at ? <Badge label="New" variant="brand" /> : null}
                </div>
                <div className="mt-xs text-label-sm text-text-secondary">
                  {item.description}
                </div>
                <div className="mt-xs text-video-title text-text-tertiary">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
              {!item.read_at ? (
                <Button
                  variant="subtle"
                  size="small"
                  onClick={() => void markRead(item.id)}
                >
                  Mark read
                </Button>
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  )
}
