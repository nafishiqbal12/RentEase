import { useEffect, useState } from "react"
import { Button, InputField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Props = { role: "Tenant" | "Owner"; userId: string }
type Message = {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  read_at: string | null
  created_at: string
}
type Contact = {
  id: string
  label: string
  leaseId: string | null
  propertyId: string | null
}

export default function MessagesScreen({ role, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [recipientId, setRecipientId] = useState("")
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const [messageResult, leaseResult] = await Promise.all([
      supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, read_at, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("leases")
        .select("id, property_id, tenant_id, owner_id, properties(title)")
        .or(`tenant_id.eq.${userId},owner_id.eq.${userId}`),
    ])
    if (messageResult.error)
      setError(`Unable to load messages: ${messageResult.error.message}`)
    else setMessages(messageResult.data ?? [])
    if (leaseResult.error)
      setError(`Unable to load message contacts: ${leaseResult.error.message}`)
    else {
      const loaded = (leaseResult.data ?? []).map((lease) => {
        const counterpart = role === "Tenant" ? lease.owner_id : lease.tenant_id
        const property = Array.isArray(lease.properties)
          ? lease.properties[0]
          : lease.properties
        return {
          id: counterpart,
          label: `${
            role === "Tenant" ? "Owner" : "Tenant"
          } · ${property?.title ?? "Property"}`,
          leaseId: lease.id,
          propertyId: lease.property_id,
        }
      })
      setContacts(loaded)
      setRecipientId((current) => current || loaded[0]?.id || "")
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          void load()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [role, userId])

  const visible = messages.filter(
    (message) =>
      message.sender_id === recipientId || message.recipient_id === recipientId,
  )
  useEffect(() => {
    if (!recipientId) return
    const unreadIds = visible
      .filter((message) => message.recipient_id === userId && !message.read_at)
      .map((message) => message.id)
    if (unreadIds.length === 0) return
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds)
      .then(({ error: updateError }) => {
        if (updateError)
          setError(`Unable to mark messages read: ${updateError.message}`)
        else void load()
      })
  }, [recipientId, messages, userId])
  const send = async () => {
    const contact = contacts.find((item) => item.id === recipientId)
    if (!contact || !draft.trim()) {
      setError("Select a rental contact and enter a message.")
      return
    }
    setSending(true)
    setError(null)
    const { error: insertError } = await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: contact.id,
      body: draft.trim(),
      lease_id: contact.leaseId,
      property_id: contact.propertyId,
    })
    setSending(false)
    if (insertError) setError(`Unable to send message: ${insertError.message}`)
    else {
      setDraft("")
      await load()
    }
  }

  return (
    <div className="rent-page-content flex h-full min-h-0 flex-col p-xl md:p-2xl">
      <div className="mb-xl">
        <div className="text-title text-text-primary">Messages</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Secure conversations linked to a rental agreement.
        </div>
      </div>
      {error ? (
        <div
          className="mb-lg rounded-corner-md bg-danger-faint p-lg text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="dashboard-card p-2xl text-center text-label-sm text-text-secondary">
          Loading messages...
        </div>
      ) : contacts.length === 0 ? (
        <div className="dashboard-card p-2xl text-center text-label-sm text-text-secondary">
          Messages become available after an approved application has an active
          lease.
        </div>
      ) : (
        <div className="dashboard-card flex min-h-0 flex-1 flex-col rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="border-b border-border-primary p-xl">
            <div className="flex flex-wrap gap-md">
              {contacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant={recipientId === contact.id ? "primary" : "neutral"}
                  size="small"
                  onClick={() => setRecipientId(contact.id)}
                >
                  {contact.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-xl">
            <div className="flex flex-col gap-md">
              {visible.length === 0 ? (
                <div className="text-label-sm text-text-secondary">
                  No messages in this conversation.
                </div>
              ) : (
                visible.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-xl rounded-corner-md p-lg text-label-sm ${
                      message.sender_id === userId
                        ? "self-end bg-brand-primary text-on-brand"
                        : "bg-bg-faint text-text-primary"
                    }`}
                  >
                    {message.body}
                    <div className="mt-xs text-video-title opacity-70">
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex gap-md border-t border-border-primary p-xl">
            <InputField
              label="Message"
              value={draft}
              onChange={setDraft}
              placeholder="Write a message"
            />
            <Button
              variant="primary"
              disabled={sending}
              onClick={() => void send()}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
