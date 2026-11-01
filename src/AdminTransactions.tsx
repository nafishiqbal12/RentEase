import { Badge } from "@figma/astraui"

type TransactionStatus = "Completed" | "Pending" | "Failed"

type Transaction = {
  id: string
  tenant: string
  owner: string
  property: string
  amount: string
  date: string
  status: TransactionStatus
}

const transactions: Transaction[] = [
  {
    id: "TXN-251024-1842",
    tenant: "Araf Rahman",
    owner: "Farhana Ahmed",
    property: "Lakeview Heights, Flat 4B",
    amount: "৳18,000",
    date: "24 Oct 2025",
    status: "Completed",
  },
  {
    id: "TXN-251024-1731",
    tenant: "Samira Hossain",
    owner: "Mahmud Karim",
    property: "Gulshan Avenue Residence",
    amount: "৳42,000",
    date: "24 Oct 2025",
    status: "Completed",
  },
  {
    id: "TXN-251023-1610",
    tenant: "Nafis Ahmed",
    owner: "Sadia Rahman",
    property: "Uttara Garden House",
    amount: "৳32,000",
    date: "23 Oct 2025",
    status: "Pending",
  },
  {
    id: "TXN-251022-1459",
    tenant: "Raisa Karim",
    owner: "Farhana Ahmed",
    property: "Banani Executive Studio",
    amount: "৳28,000",
    date: "22 Oct 2025",
    status: "Failed",
  },
  {
    id: "TXN-251021-1324",
    tenant: "Mahin Chowdhury",
    owner: "Mahmud Karim",
    property: "Bashundhara Corner Flat",
    amount: "৳35,000",
    date: "21 Oct 2025",
    status: "Completed",
  },
]

function transactionVariant(status: TransactionStatus) {
  if (status === "Completed") return "success" as const
  if (status === "Failed") return "danger" as const
  return "warning" as const
}

export default function AdminTransactions() {
  const summaries = [
    {
      label: "Total Volume",
      value: "৳4.8Cr",
      detail: "Processed this month",
      variant: "brand" as const,
    },
    {
      label: "Completed",
      value: "৳4.52Cr",
      detail: "1,284 transactions",
      variant: "success" as const,
    },
    {
      label: "Pending",
      value: "৳24.6L",
      detail: "42 transactions",
      variant: "warning" as const,
    },
    {
      label: "Failed",
      value: "৳3.4L",
      detail: "11 transactions",
      variant: "danger" as const,
    },
  ]

  return (
    <div className="rent-page-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div>
        <div className="text-title text-text-primary">Transactions</div>
        <div className="mt-xs text-label-sm text-text-secondary">
          Monitor rent payments processed through RentEase.
        </div>
      </div>

      <section
        className="grid grid-cols-1 gap-xl sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Transaction summary"
      >
        {summaries.map((summary) => (
          <div
            key={summary.label}
            className="dashboard-card h-full rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
          >
            <div className="flex items-center justify-between gap-lg">
              <div className="text-label-sm text-text-secondary">
                {summary.label}
              </div>
              <Badge label={summary.label} variant={summary.variant} />
            </div>
            <div className="mt-md text-heading text-text-primary">
              {summary.value}
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              {summary.detail}
            </div>
          </div>
        ))}
      </section>

      <section className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg">
        <div className="p-xl">
          <div className="text-heading text-text-primary">
            Recent Transactions
          </div>
          <div className="mt-xs text-video-title text-text-secondary">
            Latest platform payment activity
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-transactions-table w-full">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Tenant</th>
                <th>Owner</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="Transaction">{transaction.id}</td>
                  <td data-label="Tenant">{transaction.tenant}</td>
                  <td data-label="Owner">{transaction.owner}</td>
                  <td data-label="Property">{transaction.property}</td>
                  <td data-label="Amount">{transaction.amount}</td>
                  <td data-label="Date">{transaction.date}</td>
                  <td data-label="Status">
                    <Badge
                      label={transaction.status}
                      variant={transactionVariant(transaction.status)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
