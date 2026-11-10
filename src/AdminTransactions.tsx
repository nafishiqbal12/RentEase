import { useEffect, useState } from "react"
import { Badge } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type Payment = {
  id: string
  amount: number
  due_date: string
  paid_at: string | null
  status: string
  method: string | null
  provider_reference: string | null
  tenant: string
  owner: string
  property: string
}

function variant(status: string) {
  return status === "paid"
    ? "success" as const
    : status === "overdue"
      ? "danger" as const
      : "warning" as const
}

export default function AdminTransactions() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void supabase
      .from("payments")
      .select(
        "id, amount, due_date, paid_at, status, method, provider_reference, leases(properties(title), owner:profiles!leases_owner_id_fkey(full_name)), tenant:profiles!payments_tenant_id_fkey(full_name)",
      )
      .order("due_date", { ascending: false })
      .limit(100)
      .then(({ data, error: queryError }) => {
        if (queryError)
          setError(`Unable to load payments: ${queryError.message}`)
        else
          setPayments(
            (data ?? []).map((item) => {
              const lease = Array.isArray(item.leases)
                ? item.leases[0]
                : item.leases
              const property =
                lease?.properties &&
                (Array.isArray(lease.properties)
                  ? lease.properties[0]
                  : lease.properties)
              const owner =
                lease?.owner &&
                (Array.isArray(lease.owner) ? lease.owner[0] : lease.owner)
              const tenant = Array.isArray(item.tenant)
                ? item.tenant[0]
                : item.tenant
              return {
                id: item.id,
                amount: Number(item.amount),
                due_date: item.due_date,
                paid_at: item.paid_at,
                status: item.status,
                method: item.method,
                provider_reference: item.provider_reference,
                tenant: tenant?.full_name ?? "Tenant",
                owner: owner?.full_name ?? "Owner",
                property: property?.title ?? "Property",
              }
            }),
          )
        setLoading(false)
      })
  }, [])

  const paid = payments.filter((payment) => payment.status === "paid")
  const pending = payments.filter((payment) => payment.status !== "paid")
  const summaryCards: Array<[string, Payment[]]> = [
    ["Total", payments],
    ["Paid", paid],
    ["Outstanding", pending],
  ]
  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Transactions</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Monitor payment records and platform activity.
        </div>
      </div>
      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading transactions...
        </div>
      ) : null}
      {error ? (
        <div
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {!loading && !error && payments.length === 0 ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          No payment records found.
        </div>
      ) : null}
      <section className="grid grid-cols-1 gap-xl sm:grid-cols-3">
        {summaryCards.map(([name, rows]) => (
          <div
            key={name}
            className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
          >
            <div className="text-label-sm text-text-secondary">{name}</div>
            <div className="mt-md text-heading text-text-primary">
              ৳
              {rows
                .reduce((sum, payment) => sum + payment.amount, 0)
                .toLocaleString("en-BD")}
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              {rows.length} records
            </div>
          </div>
        ))}
      </section>
      {payments.length > 0 ? (
        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="p-xl">
            <div className="text-heading text-text-primary">
              Payment Activity
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-transactions-table w-full">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Owner</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Payment date</th>
                  <th>Method / transaction</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Tenant">{payment.tenant}</td>
                    <td data-label="Owner">{payment.owner}</td>
                    <td data-label="Property">{payment.property}</td>
                    <td data-label="Amount">
                      ৳{payment.amount.toLocaleString("en-BD")}
                    </td>
                    <td data-label="Due date">{payment.due_date}</td>
                    <td data-label="Payment date">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString()
                        : "Not paid"}
                    </td>
                    <td data-label="Method / transaction">
                      {payment.method
                        ? `${payment.method.replace("_", " ")} / ${payment.provider_reference ?? "—"}`
                        : "—"}
                    </td>
                    <td data-label="Status">
                      <Badge
                        label={
                          payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)
                        }
                        variant={variant(payment.status)}
                      />
                    </td>
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
