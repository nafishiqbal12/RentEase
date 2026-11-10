import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  InputField,
  SelectField,
  TextareaField,
} from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Role = "Tenant" | "Admin"
type Complaint = {
  id: string
  subject: string
  description: string
  status: "submitted" | "in_review" | "resolved"
  admin_reply: string | null
  created_at: string
  tenant_id: string
  properties: { title: string; city: string } | null
  profiles: { full_name: string } | null
}

function label(value: string) {
  return value
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ComplaintsScreen({ role }: { role: Role }) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [contexts, setContexts] = useState<Array<{
    value: string
    label: string
  }>>([])
  const [propertyId, setPropertyId] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<Complaint["status"]>("submitted")
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      setError("Please sign in again to view complaints.")
      setLoading(false)
      return
    }
    const complaintResult = await supabase
      .from("complaints")
      .select(
        "id, subject, description, status, admin_reply, created_at, tenant_id, properties(title, city), profiles!complaints_tenant_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
    if (complaintResult.error)
      setError(`Unable to load complaints: ${complaintResult.error.message}`)
    else
      setComplaints(
        (complaintResult.data ?? []).map((item) => ({
          ...item,
          properties: Array.isArray(item.properties)
            ? item.properties[0]
            : item.properties,
          profiles: Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles,
        })) as Complaint[],
      )
    if (role === "Tenant") {
      const { data } = await supabase
        .from("applications")
        .select("property_id, properties(title, city)")
        .eq("tenant_id", userData.user.id)
        .in("status", ["pending", "approved"])
      setContexts(
        (data ?? []).map((item) => {
          const property = Array.isArray(item.properties)
            ? item.properties[0]
            : item.properties
          return {
            value: item.property_id,
            label: property
              ? `${property.title}, ${property.city}`
              : item.property_id,
          }
        }),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [role])

  const submit = async () => {
    setError(null)
    setSuccess(null)
    if (!subject.trim() || !description.trim() || !propertyId) {
      setError("Choose a property and provide a subject and description.")
      return
    }
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setError("Please sign in again before submitting.")
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from("complaints").insert({
      tenant_id: userData.user.id,
      property_id: propertyId,
      subject: subject.trim(),
      description: description.trim(),
    })
    setSaving(false)
    if (insertError)
      setError(`Unable to submit complaint: ${insertError.message}`)
    else {
      setSubject("")
      setDescription("")
      setSuccess("Complaint submitted.")
      await load()
    }
  }

  const updateComplaint = async (
    id: string,
    nextStatus: Complaint["status"],
  ) => {
    setStatus(nextStatus)
    setError(null)
    setSuccess(null)
    const { error: updateError } = await supabase
      .from("complaints")
      .update({
        status: nextStatus,
        admin_reply: replies[id]?.trim() || null,
        resolved_at:
          nextStatus === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", id)
    if (updateError)
      setError(`Unable to update complaint: ${updateError.message}`)
    else {
      setSuccess("Complaint updated and the tenant was notified.")
      await load()
    }
  }

  const replyToComplaint = async (complaint: Complaint) => {
    setError(null)
    setSuccess(null)
    const reply = replies[complaint.id]?.trim()
    if (!reply) {
      setError("Enter a reply before sending it.")
      return
    }
    const { error: updateError } = await supabase
      .from("complaints")
      .update({ admin_reply: reply })
      .eq("id", complaint.id)
    if (updateError) setError(`Unable to send reply: ${updateError.message}`)
    else {
      setSuccess("Reply sent and the tenant was notified.")
      await load()
    }
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Complaints</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Track formal concerns with persistent Supabase records.
        </div>
      </div>
      {error ? (
        <div
          className="rounded-corner-md bg-danger-faint p-lg text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="rounded-corner-md bg-success-faint p-lg text-label-sm text-success"
          role="status"
        >
          {success}
        </div>
      ) : null}
      {role === "Tenant" ? (
        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="text-heading text-text-primary">
            Submit a complaint
          </div>
          <div className="mt-xl flex flex-col gap-lg">
            <SelectField
              label="Property"
              options={contexts}
              value={propertyId}
              onChange={setPropertyId}
            />
            <InputField label="Subject" value={subject} onChange={setSubject} />
            <TextareaField
              label="Description"
              value={description}
              onChange={setDescription}
              rows={4}
            />
            <Button
              variant="primary"
              disabled={saving}
              onClick={() => void submit()}
            >
              {saving ? "Submitting..." : "Submit complaint"}
            </Button>
          </div>
        </section>
      ) : null}
      <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
        {loading ? (
          <div className="p-2xl text-center text-label-sm text-text-secondary">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-2xl text-center text-label-sm text-text-secondary">
            No complaints found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Tenant</th>
                  <th>Property</th>
                  <th>Status</th>
                  {role === "Admin" ? <th>Admin response</th> : null}
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td data-label="Subject">
                      <div className="text-label-sm text-text-primary">
                        {complaint.subject}
                      </div>
                      <div className="text-video-title text-text-secondary">
                        {complaint.description}
                      </div>
                    </td>
                    <td data-label="Tenant">
                      {complaint.profiles?.full_name ?? "Tenant"}
                    </td>
                    <td data-label="Property">
                      {complaint.properties?.title ?? "Unavailable"}
                    </td>
                    <td data-label="Status">
                      <Badge
                        label={label(complaint.status)}
                        variant={
                          complaint.status === "resolved"
                            ? "success"
                            : complaint.status === "in_review"
                              ? "brand"
                              : "warning"
                        }
                      />
                      {role === "Tenant" && complaint.admin_reply ? (
                        <div className="mt-xs text-video-title text-text-secondary">
                          Reply: {complaint.admin_reply}
                        </div>
                      ) : null}
                    </td>
                    {role === "Admin" ? (
                      <td data-label="Admin response">
                        <SelectField
                          label="Status"
                          options={[
                            { value: "submitted", label: "Submitted" },
                            { value: "in_review", label: "In review" },
                            { value: "resolved", label: "Resolved" },
                          ]}
                          value={complaint.status}
                          onChange={(value) =>
                            void updateComplaint(
                              complaint.id,
                              value as Complaint["status"],
                            )
                          }
                        />
                        <TextareaField
                          label="Reply"
                          rows={2}
                          placeholder="Reply to tenant"
                          value={
                            replies[complaint.id] ?? complaint.admin_reply ?? ""
                          }
                          onChange={(value) =>
                            setReplies((current) => ({
                              ...current,
                              [complaint.id]: value,
                            }))
                          }
                        />
                        <Button
                          variant="subtle"
                          size="small"
                          onClick={() => void replyToComplaint(complaint)}
                        >
                          Send reply
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
