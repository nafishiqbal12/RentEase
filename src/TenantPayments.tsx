import { useEffect, useMemo, useState } from "react"
import { Badge, SelectField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Payment = {
  id: string
  amount: number
  due_date: string
  paid_at: string | null
  status: string
  lease_id: string
  property: string
}

function paymentVariant(status: string) {
  if (status === "paid") return "success" as const
  if (status === "overdue") return "danger" as const
  return "warning" as const
}

export default function TenantPayments({ tenantId }: { tenantId: string }) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    let active = true
    const loadPayments = async () => {
      const { data: leases, error: leaseError } = await supabase
        .from("leases")
        .select("id, properties(title)")
        .eq("tenant_id", tenantId)
      if (leaseError) {
        if (active) {
          setError(`Unable to load leases: ${leaseError.message}`)
          setLoading(false)
        }
        return
      }
      if (!leases?.length) {
        if (active) setLoading(false)
        return
      }
      const leaseNames = new Map(
        leases.map((lease) => [
          lease.id,
          (() => {
            const property = lease.properties as
              | { title?: string }
              | { title?: string }[]
              | null
            return Array.isArray(property)
              ? property[0]?.title ?? "Property"
              : property?.title ?? "Property"
          })(),
        ]),
      )
      const { data, error: paymentError } = await supabase
        .from("payments")
        .select("id, lease_id, amount, due_date, paid_at, status")
        .in("lease_id", leases.map((lease) => lease.id))
        .order("due_date", { ascending: false })
      if (!active) return
      if (paymentError) setError(`Unable to load payments: ${paymentError.message}`)
      else {
        setPayments(
          (data ?? []).map((payment) => ({
            ...payment,
            property: leaseNames.get(payment.lease_id) ?? "Property",
          })),
        )
      }
      setLoading(false)
    }
    void loadPayments()
    return () => {
      active = false
    }
  }, [tenantId])

  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (payment) => statusFilter === "all" || payment.status === statusFilter,
      ),
    [payments, statusFilter],
  )
  const outstanding = payments.filter((payment) => payment.status !== "paid")

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Payments</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          View outstanding rent and payment history for your tenancy.
        </div>
      </div>
      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading payment history...
        </div>
      ) : null}
      {error ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-danger" role="alert">
          {error}
        </div>
      ) : null}
      {!loading && !error && payments.length === 0 ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          No payment records are available yet.
        </div>
      ) : null}
      {outstanding.length > 0 ? (
        <section className="payment-highlight dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
          <Badge label="Outstanding payments" variant="warning" />
          <div className="mt-lg text-title text-text-primary">
            ৳{outstanding.reduce((total, payment) => total + Number(payment.amount), 0).toLocaleString("en-BD")}
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            {outstanding.length} payment{outstanding.length === 1 ? "" : "s"} awaiting payment.
          </div>
        </section>
      ) : null}
      {payments.length > 0 ? (
        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="flex flex-col gap-xl p-xl sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-heading text-text-primary">Payment History</div>
              <div className="mt-xs text-video-title text-text-secondary">Invoices and rent records for your tenancy.</div>
            </div>
            <SelectField
              label="Status"
              options={[
                { value: "all", label: "All statuses" },
                { value: "paid", label: "Paid" },
                { value: "pending", label: "Pending" },
                { value: "overdue", label: "Overdue" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full">
              <thead><tr><th>Property</th><th>Amount</th><th>Due date</th><th>Payment date</th><th>Status</th></tr></thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Property">{payment.property}</td>
                    <td data-label="Amount">৳{Number(payment.amount).toLocaleString("en-BD")}</td>
                    <td data-label="Due date">{payment.due_date}</td>
                    <td data-label="Payment date">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "Not paid"}</td>
                    <td data-label="Status"><Badge label={payment.status.charAt(0).toUpperCase() + payment.status.slice(1)} variant={paymentVariant(payment.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
