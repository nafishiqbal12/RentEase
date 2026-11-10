import { useEffect, useMemo, useState } from "react"
import { Badge, Button, SelectField } from "@figma/astraui"
import { supabase } from "./lib/supabase"

type PaymentStatus = "pending" | "paid" | "overdue" | "failed" | "refunded"
type Payment = {
  id: string
  lease_id: string
  amount: number
  currency: string
  due_date: string
  paid_at: string | null
  method: string | null
  provider_reference: string | null
  verification_status: string
  status: PaymentStatus
  property: string
  leaseStart: string
  leaseEnd: string
}
type PaymentMethod = "bkash" | "nagad" | "rocket" | "visa" | "mastercard" | "card" | "bank_transfer"

const statusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  failed: "Failed",
  refunded: "Refunded",
}

function paymentVariant(status: PaymentStatus) {
  if (status === "paid") return "success" as const
  if (status === "overdue" || status === "failed") return "danger" as const
  if (status === "refunded") return "secondary" as const
  return "warning" as const
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded"
  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value.includes("T") ? value : `${value}T00:00:00`))
}

function formatAmount(amount: number, currency: string) {
  return `${
    currency === "BDT" ? "৳" : `${currency} `
  }${amount.toLocaleString("en-BD")}`
}

function relation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

function Receipt({
  payment,
  onClose,
}: {
  payment: Payment
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-xl">
      <section
        className="dashboard-card w-full max-w-lg rounded-corner-lg border border-border-primary bg-surface-bg p-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Payment receipt"
      >
        <div className="flex items-start justify-between gap-lg">
          <div>
            <div className="text-title text-text-primary">Payment receipt</div>
            <div className="mt-xs text-label-sm text-text-secondary">
              RentEase mock gateway receipt
            </div>
          </div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-2xl flex flex-col gap-lg border-y border-border-secondary py-xl text-label-sm">
          <div className="flex justify-between gap-lg">
            <span className="text-text-secondary">Property</span>
            <span className="text-right text-text-primary">
              {payment.property}
            </span>
          </div>
          <div className="flex justify-between gap-lg">
            <span className="text-text-secondary">Amount</span>
            <span className="text-text-primary">
              {formatAmount(payment.amount, payment.currency)}
            </span>
          </div>
          <div className="flex justify-between gap-lg">
            <span className="text-text-secondary">Method</span>
            <span className="text-text-primary">
              {payment.method?.replace("_", " ") ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-lg">
            <span className="text-text-secondary">Transaction ID</span>
            <span className="break-all text-right text-text-primary">
              {payment.provider_reference ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-lg">
            <span className="text-text-secondary">Verification</span>
            <span className="text-text-primary">
              {payment.verification_status === "verified"
                ? "Verified"
                : "Manual / unverified"}
            </span>
          </div>
          <div className="flex justify-between gap-lg">
            <span className="text-text-secondary">Paid date</span>
            <span className="text-text-primary">
              {formatDate(payment.paid_at)}
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          className="mt-xl w-full"
          onClick={() => window.print()}
        >
          Print receipt
        </Button>
      </section>
    </div>
  )
}

function PaymentModal({
  payment,
  onClose,
  onPaid,
}: {
  payment: Payment
  onClose: () => void
  onPaid: (payment: Payment) => void
}) {
  const [method, setMethod] = useState<PaymentMethod>("bkash")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirm = async () => {
    setSaving(true)
    setError(null)
    const { data, error: paymentError } = await supabase.rpc("pay_rent_mock", {
      payment_uuid: payment.id,
      payment_method: method,
    })
    setSaving(false)
    if (paymentError) {
      setError(`Unable to confirm payment: ${paymentError.message}`)
      return
    }
    const result = Array.isArray(data) ? data[0] : data
    onPaid({
      ...payment,
      status: "paid",
      method,
      provider_reference: result?.provider_reference ?? null,
      verification_status: "manual_unverified",
      paid_at: result?.paid_at ?? new Date().toISOString(),
    })
  }
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-xl">
      <section
        className="dashboard-card w-full max-w-lg rounded-corner-lg border border-border-primary bg-surface-bg p-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Pay rent"
      >
        <div className="flex items-start justify-between gap-lg">
          <div>
            <div className="text-title text-text-primary">Pay rent</div>
            <div className="mt-xs text-label-sm text-text-secondary">
              {payment.property}
            </div>
          </div>
          <Button variant="subtle" size="small" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-xl rounded-corner-md bg-bg-faint p-lg text-label-sm">
          <div className="text-text-secondary">Amount due</div>
          <div className="mt-xs text-heading text-text-primary">
            {formatAmount(payment.amount, payment.currency)}
          </div>
        </div>
        <div className="mt-xl">
          <SelectField
            label="Payment method"
            options={[
              { value: "bkash", label: "bKash" },
              { value: "nagad", label: "Nagad" },
              { value: "rocket", label: "Rocket" },
              { value: "visa", label: "Visa" },
              { value: "mastercard", label: "Mastercard" },
              { value: "bank_transfer", label: "Bank transfer" },
            ]}
            value={method}
            onChange={(value) => setMethod(value as PaymentMethod)}
          />
        </div>
        {error ? (
          <div className="mt-lg text-label-sm text-danger" role="alert">
            {error}
          </div>
        ) : null}
        <Button
          variant="primary"
          className="mt-xl w-full"
          disabled={saving}
          onClick={() => void confirm()}
        >
          {saving ? "Confirming..." : "Confirm payment"}
        </Button>
        <div className="mt-lg text-center text-video-title text-text-secondary">
          This demonstration records a manual/unverified payment. No card
          number, CVV, PIN, or OTP is stored. Official gateway verification can
          be connected later.
        </div>
      </section>
    </div>
  )
}

export default function TenantPayments({
  tenantId,
  initialOpen = false,
}: {
  tenantId: string
  initialOpen?: boolean
}) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState("due-newest")
  const [paying, setPaying] = useState<Payment | null>(null)
  const [receipt, setReceipt] = useState<Payment | null>(null)

  const loadPayments = async () => {
    setLoading(true)
    setError(null)
    const { data, error: paymentError } = await supabase
      .from("payments")
      .select(
        "id, lease_id, amount, currency, due_date, paid_at, method, provider_reference, verification_status, status, leases(start_date, end_date, properties(title))",
      )
      .eq("tenant_id", tenantId)
      .order("due_date", { ascending: false })
    if (paymentError)
      setError(`Unable to load payment history: ${paymentError.message}`)
    else
      setPayments(
        (data ?? []).map((item) => {
          const lease = relation(item.leases)
          const property = relation(lease?.properties)
          return {
            id: item.id,
            lease_id: item.lease_id,
            amount: Number(item.amount),
            currency: item.currency,
            due_date: item.due_date,
            paid_at: item.paid_at,
            method: item.method,
            provider_reference: item.provider_reference,
            verification_status: item.verification_status,
            status: item.status as PaymentStatus,
            property: property?.title ?? "Property unavailable",
            leaseStart: lease?.start_date ?? "",
            leaseEnd: lease?.end_date ?? "",
          }
        }),
      )
    setLoading(false)
  }

  useEffect(() => {
    void loadPayments()
  }, [tenantId])
  useEffect(() => {
    if (initialOpen && payments.length)
      setPaying(
        payments.find(
          (payment) =>
            payment.status === "pending" || payment.status === "overdue",
        ) ?? null,
      )
  }, [initialOpen, payments])

  const filteredPayments = useMemo(
    () =>
      [
        ...payments.filter(
          (payment) =>
            statusFilter === "all" || payment.status === statusFilter,
        ),
      ].sort((a, b) =>
        sort === "due-oldest"
          ? a.due_date.localeCompare(b.due_date)
          : sort === "amount-low"
            ? a.amount - b.amount
            : sort === "amount-high"
              ? b.amount - a.amount
              : b.due_date.localeCompare(a.due_date),
      ),
    [payments, sort, statusFilter],
  )
  const totalPaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0)
  const outstanding = payments
    .filter(
      (payment) => payment.status === "pending" || payment.status === "overdue",
    )
    .reduce((total, payment) => total + payment.amount, 0)
  const completePayment = (payment: Payment) => {
    setPayments((current) =>
      current.map((item) => (item.id === payment.id ? payment : item)),
    )
    setPaying(null)
    setReceipt(payment)
  }

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Payments</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          View and pay recorded rent obligations.
        </div>
      </div>
      {loading ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading payment history...
        </div>
      ) : null}
      {error ? (
        <div
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {!loading && !error && payments.length === 0 ? (
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          No payment records are available yet.
        </div>
      ) : null}
      {!loading && !error && payments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-xl sm:grid-cols-2">
            <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
              <Badge label="Total paid" variant="success" />
              <div className="mt-lg text-title text-text-primary">
                ৳{totalPaid.toLocaleString("en-BD")}
              </div>
            </section>
            <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
              <Badge label="Outstanding" variant="warning" />
              <div className="mt-lg text-title text-text-primary">
                ৳{outstanding.toLocaleString("en-BD")}
              </div>
            </section>
          </div>
          <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
            <div className="flex flex-col gap-xl p-xl sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-heading text-text-primary">
                  Payment History
                </div>
                <div className="mt-xs text-video-title text-text-secondary">
                  Real payment records from your active leases.
                </div>
              </div>
              <div className="flex flex-col gap-md sm:flex-row">
                <SelectField
                  label="Status"
                  options={[
                    { value: "all", label: "All statuses" },
                    ...Object.entries(statusLabels).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <SelectField
                  label="Sort by"
                  options={[
                    { value: "due-newest", label: "Due date: newest" },
                    { value: "due-oldest", label: "Due date: oldest" },
                    { value: "amount-low", label: "Amount: low to high" },
                    { value: "amount-high", label: "Amount: high to low" },
                  ]}
                  value={sort}
                  onChange={setSort}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="rent-tracking-table w-full">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Due date</th>
                    <th>Paid date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td data-label="Property">{payment.property}</td>
                      <td data-label="Amount">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td data-label="Due date">
                        {formatDate(payment.due_date)}
                      </td>
                      <td data-label="Paid date">
                        {formatDate(payment.paid_at)}
                      </td>
                      <td data-label="Status">
                        <div className="flex flex-col items-start gap-xs">
                          <Badge
                            label={statusLabels[payment.status]}
                            variant={paymentVariant(payment.status)}
                          />
                          {payment.status === "paid" ? (
                            <span className="text-video-title text-text-secondary">
                              {payment.verification_status === "verified"
                                ? "Verified"
                                : "Manual / unverified"}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td data-label="Action">
                        {payment.status === "pending" ||
                        payment.status === "overdue" ? (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => setPaying(payment)}
                          >
                            Pay now
                          </Button>
                        ) : (
                          <Button
                            variant="subtle"
                            size="small"
                            onClick={() => setReceipt(payment)}
                          >
                            Receipt
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
      {paying ? (
        <PaymentModal
          payment={paying}
          onClose={() => setPaying(null)}
          onPaid={completePayment}
        />
      ) : null}
      {receipt ? (
        <Receipt payment={receipt} onClose={() => setReceipt(null)} />
      ) : null}
    </div>
  )
}
