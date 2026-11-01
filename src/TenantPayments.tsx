import { useMemo, useState } from "react"
import {
  Badge,
  Button,
  IconButton,
  InputField,
  Modal,
  SelectField,
} from "@figma/astraui"
import { Download, FileDown } from "lucide-react"

type PaymentMethod = "bkash" | "nagad" | "card"
type PaymentStatus = "Paid" | "Pending" | "Overdue"

type Payment = {
  id: number
  month: string
  monthValue: string
  amount: string
  paidOn: string
  status: PaymentStatus
}

const paymentHistory: Payment[] = [
  {
    id: 1,
    month: "October 2025",
    monthValue: "october",
    amount: "৳18,000",
    paidOn: "05 Oct 2025",
    status: "Paid",
  },
  {
    id: 2,
    month: "September 2025",
    monthValue: "september",
    amount: "৳18,000",
    paidOn: "04 Sep 2025",
    status: "Paid",
  },
  {
    id: 3,
    month: "August 2025",
    monthValue: "august",
    amount: "৳18,000",
    paidOn: "08 Aug 2025",
    status: "Overdue",
  },
  {
    id: 4,
    month: "November 2025",
    monthValue: "november",
    amount: "৳18,000",
    paidOn: "Not paid",
    status: "Pending",
  },
]

function paymentVariant(status: PaymentStatus) {
  if (status === "Paid") return "success" as const
  if (status === "Overdue") return "danger" as const
  return "warning" as const
}

function PaymentModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [method, setMethod] = useState<PaymentMethod>("bkash")
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [successful, setSuccessful] = useState(false)

  const close = () => {
    onClose()
    setSuccessful(false)
  }

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title={successful ? "Payment successful" : "Pay November rent"}
      size="large"
      className="payment-modal"
      footer={
        successful ? (
          <>
            <Button variant="neutral" onClick={close}>
              Done
            </Button>
            <Button
              variant="primary"
              iconStart={<Download size={16} />}
              onClick={onSuccess}
            >
              Download receipt
            </Button>
          </>
        ) : (
          <>
            <Button variant="neutral" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSuccessful(true)
                onSuccess()
              }}
            >
              Pay ৳18,000
            </Button>
          </>
        )
      }
    >
      {successful ? (
        <div className="payment-success flex flex-col items-center justify-center text-center">
          <Badge label="Paid" variant="success" />
          <div className="mt-xl text-heading text-text-primary">
            Your rent has been paid
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Transaction RE-PAY-251105-1842
          </div>
          <div className="mt-xl w-full rounded-corner-md bg-bg-faint p-xl">
            <div className="flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Amount paid</span>
              <span className="text-text-primary">৳18,000</span>
            </div>
            <div className="mt-md flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Payment method</span>
              <span className="text-text-primary">
                {method === "bkash"
                  ? "bKash"
                  : method === "nagad"
                    ? "Nagad"
                    : "Card"}
              </span>
            </div>
            <div className="mt-md flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Payment for</span>
              <span className="text-text-primary">November 2025 rent</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-xl md:grid-cols-2">
          <div>
            <div className="text-label text-text-primary">Payment method</div>
            <div className="mt-lg grid grid-cols-3 gap-md">
              {[
                { id: "bkash" as const, label: "bKash" },
                { id: "nagad" as const, label: "Nagad" },
                { id: "card" as const, label: "Card" },
              ].map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={method === item.id ? "primary" : "neutral"}
                  className="payment-method-button"
                  aria-pressed={method === item.id}
                  onClick={() => setMethod(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="mt-xl flex flex-col gap-lg">
              {method === "card" ? (
                <>
                  <InputField
                    label="Card number"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={setCardNumber}
                  />
                  <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                    <InputField
                      label="Expiry"
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={setExpiry}
                    />
                    <InputField
                      label="CVC"
                      placeholder="123"
                      value={cvc}
                      onChange={setCvc}
                    />
                  </div>
                </>
              ) : (
                <>
                  <InputField
                    type="tel"
                    label={`${method === "bkash" ? "bKash" : "Nagad"} number`}
                    placeholder="+880 17XX XXXXXX"
                    value={phone}
                    onChange={setPhone}
                  />
                  <InputField
                    type="password"
                    label="PIN"
                    placeholder="Enter your PIN"
                    value={pin}
                    onChange={setPin}
                  />
                </>
              )}
            </div>
          </div>

          <div className="rounded-corner-lg bg-bg-faint p-xl">
            <div className="text-heading text-text-primary">Summary</div>
            <div className="mt-xl flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">November 2025 rent</span>
              <span className="text-text-primary">৳18,000</span>
            </div>
            <div className="mt-lg flex justify-between gap-lg text-label-sm">
              <span className="text-text-secondary">Processing fee</span>
              <span className="text-text-primary">৳0</span>
            </div>
            <div className="mt-xl flex justify-between gap-lg border-t border-border-secondary pt-xl text-label">
              <span className="text-text-primary">Total</span>
              <span className="text-brand-dark">৳18,000</span>
            </div>
            <div className="mt-xl text-video-title text-text-secondary">
              Payments are encrypted and processed securely. No card or wallet
              credentials are stored by RentEase.
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function TenantPayments() {
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paid, setPaid] = useState(false)
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredPayments = useMemo(
    () =>
      paymentHistory.filter(
        (payment) =>
          (monthFilter === "all" || payment.monthValue === monthFilter) &&
          (statusFilter === "all" ||
            payment.status.toLowerCase() === statusFilter),
      ),
    [monthFilter, statusFilter],
  )

  return (
    <>
      <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
        <div>
          <div className="text-title text-text-primary">Payments</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Pay rent securely and keep every receipt in one place.
          </div>
        </div>

        <section
          className="payment-highlight dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl"
          aria-label="Next payment due"
        >
          <div className="flex flex-col gap-xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge
                label={paid ? "Payment complete" : "Next payment due"}
                variant={paid ? "success" : "warning"}
              />
              <div className="mt-lg text-title text-text-primary">৳18,000</div>
              <div className="mt-xs text-label-sm text-text-secondary">
                {paid
                  ? "November 2025 rent paid successfully"
                  : "Due 05 November 2025"}
              </div>
              {!paid ? (
                <div className="mt-lg text-label-sm text-warning">
                  A late fee of ৳500 applies after 10 November.
                </div>
              ) : null}
            </div>
            {paid ? (
              <Button variant="neutral" iconStart={<Download size={16} />}>
                Download receipt
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setPaymentOpen(true)}>
                Pay now
              </Button>
            )}
          </div>
        </section>

        <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
          <div className="flex flex-col gap-xl p-xl sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-heading text-text-primary">
                Payment History
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Invoices and receipts for your tenancy
              </div>
            </div>
            <div className="flex flex-col gap-md sm:flex-row">
              <div className="payment-filter">
                <SelectField
                  label="Month"
                  options={[
                    { value: "all", label: "All months" },
                    { value: "november", label: "November" },
                    { value: "october", label: "October" },
                    { value: "september", label: "September" },
                    { value: "august", label: "August" },
                  ]}
                  value={monthFilter}
                  onChange={setMonthFilter}
                />
              </div>
              <div className="payment-filter">
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="dashboard-table w-full">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Payment date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Month">{payment.month}</td>
                    <td data-label="Amount">{payment.amount}</td>
                    <td data-label="Payment date">{payment.paidOn}</td>
                    <td data-label="Status">
                      <Badge
                        label={payment.status}
                        variant={paymentVariant(payment.status)}
                      />
                    </td>
                    <td data-label="Action">
                      <div className="flex justify-end gap-md">
                        <IconButton
                          variant="subtle"
                          size="small"
                          icon={<FileDown size={16} />}
                          aria-label={`Download invoice for ${payment.month}`}
                        />
                        <IconButton
                          variant="subtle"
                          size="small"
                          icon={<Download size={16} />}
                          aria-label={`Download receipt for ${payment.month}`}
                          disabled={payment.status !== "Paid"}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl">
          <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-heading text-text-primary">
                Security Deposit
              </div>
              <div className="mt-xs text-label-sm text-text-secondary">
                ৳36,000 held securely for your current agreement
              </div>
            </div>
            <Badge label="Paid · Refundable" variant="success" />
          </div>
        </section>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={() => setPaid(true)}
      />
    </>
  )
}
