import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type Account = {
  email: string
  name: string
  phone: string
  role: "admin" | "owner" | "tenant"
}

type MustResult<T> = { data: T } & { error: { message: string } | null }

const AREAS = [
  ...Array.from({ length: 18 }, (_, index) => `Uttara Sector ${index + 1}`),
  "Airport",
  "Kawla",
  "Dakkhinkhan",
  "Tongi",
  "Abdullahpur",
  "Turag",
  "Uttarkhan",
  "House Building",
  "Azampur",
  "Diabari",
  "Dhanmondi",
  "Mirpur",
]
const PROPERTY_TYPES = ["apartment", "house", "room", "office"] as const
const PROPERTY_LABELS = [
  "Apartment",
  "Flat",
  "Room/Sublet",
  "Duplex",
  "Office space",
]
const PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1737045466261-92204d753268?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1768578927019-8be9eb339fb5?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1761783066826-689af9f13267?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1768413292179-d958b344f1d4?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1768413292140-0442cb61a989?auto=format&fit=crop&w=1200&q=85",
]
const IMAGE_URLS = (index: number) =>
  [0, 1, 2].map(
    (offset) => PROPERTY_IMAGES[(index + offset) % PROPERTY_IMAGES.length],
  )
const now = new Date()

function loadEnv() {
  try {
    const text = readFileSync(".env", "utf8")
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]])
        process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2")
    }
  } catch {
    // Environment variables are also supported for CI and local shell usage.
  }
}

function id(namespace: string, value: string | number) {
  const hex = createHash("sha256")
    .update(`${namespace}:${value}`)
    .digest("hex")
    .slice(0, 32)
    .split("")
  hex[12] = "4"
  hex[16] = ["8", "9", "a", "b"][parseInt(hex[16], 16) % 4]
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`
}

function dateOffset(months: number, day = 5) {
  const date = new Date(now.getFullYear(), now.getMonth() + months, day)
  return date.toISOString().slice(0, 10)
}

function isoOffset(days: number) {
  return new Date(now.getTime() + days * 86_400_000).toISOString()
}

async function must<T>(promise: PromiseLike<MustResult<T>>, label: string) {
  const result = await promise
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.data
}

async function findAuthUser(client: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const result = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (result.error) throw new Error(`List users: ${result.error.message}`)
    const found = result.data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    )
    if (found) return found
    if (result.data.users.length < 1000) break
  }
  return null
}

async function ensureAccount(client: SupabaseClient, account: Account) {
  const existing = await findAuthUser(client, account.email)
  if (existing) return existing
  const result = await client.auth.admin.createUser({
    email: account.email,
    password: process.env.DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: account.name,
      phone: account.phone,
      role: account.role === "admin" ? "tenant" : account.role,
    },
  })
  if (result.error)
    throw new Error(`Create ${account.email}: ${result.error.message}`)
  if (!result.data.user)
    throw new Error(`Create ${account.email}: Supabase returned no user`)
  return result.data.user
}

async function main() {
  loadEnv()
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || key.startsWith("sb_publishable")) {
    throw new Error(
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the local .env file.",
    )
  }
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  if (!process.env.DEMO_PASSWORD) {
    throw new Error(
      "Set DEMO_PASSWORD in the local .env file (the demo password is documented separately).",
    )
  }
  const counts: Record<string, number> = {}
  const record = (name: string, count: number) => {
    counts[name] = count
  }

  const ownerAccounts: Account[] = [
    {
      email: "owner1@rentease.test",
      name: "Farhan Rahman",
      phone: "+8801712345601",
      role: "owner",
    },
    {
      email: "owner2@rentease.test",
      name: "Nusrat Jahan",
      phone: "+8801812345602",
      role: "owner",
    },
    {
      email: "owner3@rentease.test",
      name: "Tanvir Ahmed",
      phone: "+8801912345603",
      role: "owner",
    },
  ]
  const tenantAccounts: Account[] = Array.from({ length: 5 }, (_, index) => ({
    email: `tenant${index + 1}@rentease.test`,
    name: [
      "Afsana Karim",
      "Imran Hossain",
      "Sadia Islam",
      "Rafiul Hasan",
      "Maliha Chowdhury",
    ][index],
    phone: `+8801${["712345604", "812345605", "912345606", "712345607", "812345608"][index]}`,
    role: "tenant",
  }))
  const adminAccount: Account = {
    email: "admin@rentease.test",
    name: "RentEase Demo Admin",
    phone: "+8801912345609",
    role: "admin",
  }
  const samira =
    (await findAuthUser(client, "samira")) ??
    (await findAuthUser(
      client,
      process.env.SAMIRA_EMAIL ?? "samira@rentease.test",
    )) ??
    (
      await must(
        client
          .from("profiles")
          .select("id, email")
          .ilike("email", "%samira%")
          .limit(1),
        "Find Samira profile",
      )
    )?.[0]
  if (!samira)
    throw new Error(
      "Could not find the existing Samira account; create no demo records until it is available.",
    )
  const owners = await Promise.all(
    ownerAccounts.map((account) => ensureAccount(client, account)),
  )
  const tenants = await Promise.all(
    tenantAccounts.map((account) => ensureAccount(client, account)),
  )
  const admin = await ensureAccount(client, adminAccount)
  const userIds = {
    admin: admin.id,
    owners: owners.map((user) => user.id),
    tenants: tenants.map((user) => user.id),
    samira: samira.id,
  }

  await must(client.from("profiles").upsert(
      [
        {
          id: admin.id,
          full_name: adminAccount.name,
          email: admin.email ?? adminAccount.email,
          phone: adminAccount.phone,
          role: "admin",
          status: "active",
        },
        ...ownerAccounts.map((account, index) => ({
          id: owners[index].id,
          full_name: account.name,
          email: account.email,
          phone: account.phone,
          role: "owner",
          status: "active",
        })),
        ...tenantAccounts.map((account, index) => ({
          id: tenants[index].id,
          full_name: account.name,
          email: account.email,
          phone: account.phone,
          role: "tenant",
          status: "active",
        })),
      ],
      { onConflict: "id" },
    ), "Upsert demo profiles")
  record("accounts", 9)

  const properties = Array.from({ length: 30 }, (_, index) => {
    const area = AREAS[index % AREAS.length]
    const type = PROPERTY_TYPES[index % PROPERTY_TYPES.length]
    const label = PROPERTY_LABELS[index % PROPERTY_LABELS.length]
    const rent =
      area.startsWith("Uttara Sector") ||
      [
        "Airport",
        "Kawla",
        "Dakkhinkhan",
        "Tongi",
        "Abdullahpur",
        "Turag",
        "Uttarkhan",
        "House Building",
        "Azampur",
        "Diabari",
      ].includes(area)
        ? 22000 + (index % 5) * 7000
        : area === "Dhanmondi" ||
            area === "Kalabagan" ||
            area === "Shahbag" ||
            area === "Ramna"
          ? 30000 + (index % 5) * 7500
          : [
                "Motijheel",
                "Paltan",
                "Segunbagicha",
                "Malibagh",
                "Shantinagar",
              ].includes(area)
            ? 18000 + (index % 4) * 5000
            : [
                  "Wari",
                  "Gulistan",
                  "Sutrapur",
                  "Lalbagh",
                  "Kotwali (Old Dhaka)",
                  "Chawkbazar",
                  "Hazaribagh",
                ].includes(area)
              ? 10000 + (index % 4) * 3500
              : 8000 + (index % 4) * 3000
    const status =
      index < 24 ? (index < 3 ? "rented" : "approved") : "pending_verification"
    const locality = area.startsWith("Uttara Sector") ||
      [
        "Airport",
        "Kawla",
        "Dakkhinkhan",
        "Tongi",
        "Abdullahpur",
        "Turag",
        "Uttarkhan",
        "House Building",
        "Azampur",
        "Diabari",
      ].includes(area)
      ? "Uttara, Dhaka"
      : "Dhaka"
    return {
      id: id("demo-property", index + 1),
      owner_id: userIds.owners[index % userIds.owners.length],
      title: `${label} ${area} Residence ${index + 1}`,
      description: `Bright ${label.toLowerCase()} in ${area}, with floor ${2 + (index % 6)} and ${
        index % 2 ? "south" : "east"
      }-facing rooms. Well suited to Dhaka residents seeking a comfortable, secure home.`,
      property_type: type,
      address: `Road ${(index % 12) + 1}, ${area}, ${locality}`,
      city: "Dhaka",
      area,
      bedrooms: 1 + (index % 4),
      bathrooms: 1 + (index % 3),
      size_sq_ft: 650 + (index % 8) * 150,
      monthly_rent: rent,
      security_deposit: rent,
      availability_date: dateOffset(index < 3 ? 0 : 1, 1 + (index % 20)),
      amenities: [
        "lift",
        "generator",
        "gas",
        "security",
        ...(index % 2 ? ["balcony"] : ["parking"]),
      ],
      image_urls: IMAGE_URLS(index + 1),
      status,
      verified_by: status === "pending_verification" ? null : userIds.admin,
      verified_at: status === "pending_verification" ? null : isoOffset(-index),
    }
  })
  const existingProperties = await must(
    client
      .from("properties")
      .select("id, status, verified_by, verified_at, availability_date")
      .in(
        "id",
        properties.map((property) => property.id),
      ),
    "Read existing demo properties",
  )
  const existingPropertyById = new Map(
    (existingProperties ?? []).map((property) => [property.id, property]),
  )
  const reconciledProperties = properties.map((property) => {
    const existing = existingPropertyById.get(property.id)
    return {
      ...property,
      ...(existing
        ? {
            status: existing.status,
            verified_by: existing.verified_by,
            verified_at: existing.verified_at,
            availability_date: existing.availability_date,
          }
        : {}),
    }
  })
  await must(
    client
      .from("properties")
      .upsert(reconciledProperties, { onConflict: "id" }),
    "Upsert properties",
  )
  record("properties", properties.length)

  const approvedProperties = properties.filter(
    (property) => property.status === "approved",
  )
  const rentedProperties = properties.filter(
    (property) => property.status === "rented",
  )
  const applicationRows = Array.from({ length: 6 }, (_, index) => {
    const property =
      index < rentedProperties.length
        ? rentedProperties[index]
        : approvedProperties[
            (index - rentedProperties.length) % approvedProperties.length
          ]
    const tenantId = userIds.tenants[index % userIds.tenants.length]
    const status = index < 3 ? "approved" : index === 3 ? "pending" : "rejected"
    return {
      id: id("demo-application", index + 1),
      property_id: property.id,
      tenant_id: tenantId,
      move_in_date: dateOffset(index + 1, 10),
      occupants: 1 + (index % 3),
      occupation: [
        "Software Engineer",
        "Lecturer",
        "Architect",
        "Accountant",
        "Designer",
        "Consultant",
      ][index],
      message:
        "I am interested in this well-maintained property and can provide the required documents.",
      status,
      reviewed_by: status === "pending" ? null : userIds.admin,
      reviewed_at: status === "pending" ? null : isoOffset(-index),
    }
  })
  const existingApplications = await must(
    client
      .from("applications")
      .select("id, status, reviewed_by, reviewed_at")
      .in(
        "id",
        applicationRows.map((application) => application.id),
      ),
    "Read existing demo applications",
  )
  const existingApplicationById = new Map(
    (existingApplications ?? []).map((application) => [
      application.id,
      application,
    ]),
  )
  const reconciledApplications = applicationRows.map((application) => {
    const existing = existingApplicationById.get(application.id)
    return {
      ...application,
      ...(existing
        ? {
            status: existing.status,
            reviewed_by: existing.reviewed_by,
            reviewed_at: existing.reviewed_at,
          }
        : {}),
    }
  })
  await must(
    client
      .from("applications")
      .upsert(reconciledApplications, { onConflict: "id" }),
    "Upsert applications",
  )
  record("applications", applicationRows.length)

  const activeLeasePeople = [
    {
      tenant_id: userIds.tenants[0],
      property: rentedProperties[0],
      application_id: applicationRows[0].id,
    },
    {
      tenant_id: userIds.tenants[1],
      property: rentedProperties[1],
      application_id: applicationRows[1].id,
    },
    {
      tenant_id: userIds.samira,
      property: rentedProperties[2],
      application_id: null,
    },
  ]
  const activeLeases = activeLeasePeople.map((entry, index) => ({
    id: id("demo-active-lease", index + 1),
    application_id: entry.application_id,
    property_id: entry.property.id,
    owner_id: entry.property.owner_id,
    tenant_id: entry.tenant_id,
    monthly_rent: entry.property.monthly_rent,
    security_deposit: entry.property.security_deposit,
    duration_months: 12,
    start_date: dateOffset(-2, 1),
    end_date: dateOffset(10, 1),
    payment_due_day: 5,
    terms: [
      "No subletting without written permission",
      "Rent is due on the fifth day of each month",
    ],
    status: "active",
    signed_at: isoOffset(-60),
  }))
  await must(
    client.from("leases").upsert(activeLeases, { onConflict: "id" }),
    "Upsert active leases",
  )
  record("active leases", activeLeases.length)

  const completedLeases = Array.from({ length: 10 }, (_, index) => {
    const property = approvedProperties[(index + 3) % approvedProperties.length]
    return {
      id: id("demo-completed-lease", index + 1),
      application_id: null,
      property_id: property.id,
      owner_id: property.owner_id,
      tenant_id: userIds.tenants[index % userIds.tenants.length],
      monthly_rent: property.monthly_rent,
      security_deposit: property.security_deposit,
      duration_months: 12,
      start_date: dateOffset(-24, 1),
      end_date: dateOffset(-12, 1),
      payment_due_day: 5,
      terms: ["Historic demo tenancy"],
      status: "expired",
      signed_at: isoOffset(-730),
    }
  })
  await must(
    client.from("leases").upsert(completedLeases, { onConflict: "id" }),
    "Upsert completed leases",
  )
  record("completed leases", completedLeases.length)

  const payments = activeLeases.flatMap((lease, leaseIndex) =>
    Array.from({ length: 5 }, (_, monthIndex) => {
      const status =
        (monthIndex + leaseIndex) % 3 === 0
          ? "paid"
          : (monthIndex + leaseIndex) % 3 === 1
            ? "pending"
            : "overdue"
      return {
        id: id("demo-payment", `${leaseIndex + 1}-${monthIndex + 1}`),
        lease_id: lease.id,
        tenant_id: lease.tenant_id,
        owner_id: activeLeasePeople[leaseIndex].property.owner_id,
        amount: lease.monthly_rent,
        currency: "BDT",
        due_date: dateOffset(monthIndex - 5, 5),
        paid_at: status === "paid" ? isoOffset(-(monthIndex + 1) * 15) : null,
        method: status === "paid" ? (monthIndex % 2 ? "bkash" : "nagad") : null,
        status,
      }
    }),
  )
  const existingPayments = await must(
    client
      .from("payments")
      .select(
        "id, lease_id, tenant_id, owner_id, amount, currency, due_date, paid_at, method, status, provider_reference, receipt_path, verification_status",
      )
      .in(
        "id",
        payments.map((payment) => payment.id),
      ),
    "Read existing demo payments",
  )
  const existingPaymentById = new Map(
    (existingPayments ?? []).map((payment) => [payment.id, payment]),
  )
  const reconciledPayments = payments.map((payment) => {
    const existing = existingPaymentById.get(payment.id)
    return existing
      ? {
          ...payment,
          lease_id: existing.lease_id,
          tenant_id: existing.tenant_id,
          owner_id: existing.owner_id,
          amount: existing.amount,
          currency: existing.currency,
          due_date: existing.due_date,
          paid_at: existing.paid_at,
          method: existing.method,
          status: existing.status,
          provider_reference: existing.provider_reference,
          receipt_path: existing.receipt_path,
          verification_status: existing.verification_status,
        }
      : payment
  })
  await must(
    client.from("payments").upsert(reconciledPayments, { onConflict: "id" }),
    "Upsert payments",
  )
  record("payments", payments.length)

  const maintenance = Array.from({ length: 8 }, (_, index) => {
    const lease = activeLeases[index % activeLeases.length]
    return {
      id: id("demo-maintenance", index + 1),
      property_id: lease.property_id,
      lease_id: lease.id,
      tenant_id: lease.tenant_id,
      assigned_to:
        index % 4 === 0
          ? null
          : activeLeasePeople[index % activeLeasePeople.length].property
              .owner_id,
      title: [
        "Kitchen tap leak",
        "Lift service request",
        "Air conditioner repair",
        "Bathroom plumbing",
        "Power backup check",
        "Window latch repair",
        "Water pressure issue",
        "Ceiling fan noise",
      ][index],
      description:
        "Demo maintenance request created for workflow demonstration.",
      category: [
        "plumbing",
        "structural",
        "appliance",
        "plumbing",
        "electrical",
        "other",
        "plumbing",
        "electrical",
      ][index],
      urgency: [
        "medium",
        "low",
        "high",
        "medium",
        "low",
        "high",
        "emergency",
        "low",
      ][index],
      status: ["pending", "assigned", "in_progress", "completed"][index % 4],
    }
  })
  await must(
    client
      .from("maintenance_requests")
      .upsert(maintenance, { onConflict: "id" }),
    "Upsert maintenance requests",
  )
  record("maintenance requests", maintenance.length)

  const complaints = Array.from({ length: 5 }, (_, index) => {
    const lease = activeLeases[index % activeLeases.length]
    return {
      id: id("demo-complaint", index + 1),
      tenant_id: lease.tenant_id,
      property_id: lease.property_id,
      lease_id: lease.id,
      subject: [
        "Noise after midnight",
        "Water supply interruption",
        "Parking access",
        "Shared corridor lighting",
        "Waste collection",
      ][index],
      description:
        "Demo complaint for demonstrating tenant submission and administrator review.",
      status: ["submitted", "in_review", "resolved"][index % 3],
      resolved_by: index % 3 === 2 ? userIds.admin : null,
      resolved_at: index % 3 === 2 ? isoOffset(-index - 1) : null,
    }
  })
  await must(
    client.from("complaints").upsert(complaints, { onConflict: "id" }),
    "Upsert complaints",
  )
  record("complaints", complaints.length)

  const messages = Array.from({ length: 10 }, (_, index) => {
    const lease = activeLeases[index % activeLeases.length]
    const participant = activeLeasePeople[index % activeLeasePeople.length]
    return {
      id: id("demo-message", index + 1),
      sender_id: index % 2 ? participant.property.owner_id : lease.tenant_id,
      recipient_id: index % 2 ? lease.tenant_id : participant.property.owner_id,
      property_id: lease.property_id,
      lease_id: lease.id,
      application_id: null,
      body:
        index % 2
          ? "Thanks, I will arrange the requested visit."
          : "Could you please confirm a suitable time for the maintenance visit?",
      read_at: index < 6 ? null : isoOffset(-index),
    }
  })
  await must(
    client.from("messages").upsert(messages, { onConflict: "id" }),
    "Upsert messages",
  )
  record("messages", messages.length)

  const notifications = Array.from({ length: 12 }, (_, index) => ({
    id: id("demo-notification", index + 1),
    user_id: [
      userIds.tenants[index % userIds.tenants.length],
      userIds.owners[index % userIds.owners.length],
      userIds.admin,
    ][index % 3],
    title: [
      "Application update",
      "Payment reminder",
      "Maintenance update",
      "New message",
    ][index % 4],
    description: "Demo notification for the RentEase workflow.",
    category: ["application", "payment", "maintenance", "message"][index % 4],
    read_at: index < 7 ? null : isoOffset(-index),
  }))
  await must(
    client.from("notifications").upsert(notifications, { onConflict: "id" }),
    "Upsert notifications",
  )
  record("notifications", notifications.length)

  const reviews = completedLeases.map((lease, index) => ({
    id: id("demo-review", index + 1),
    lease_id: lease.id,
    property_id: lease.property_id,
    tenant_id: lease.tenant_id,
    owner_id: lease.owner_id,
    property_rating: 3 + (index % 3),
    owner_rating: 4 + (index % 2),
    body: "A positive demo review for a completed RentEase tenancy.",
    verified: true,
  }))
  await must(
    client.from("reviews").upsert(reviews, { onConflict: "id" }),
    "Upsert reviews",
  )
  record("reviews", reviews.length)

  console.log("RentEase demo seed complete")
  for (const [label, count] of Object.entries(counts))
    console.log(`- ${label}: ${count}`)
  console.log(
    "Demo passwords are available only in the runbook request; no password was written to source files.",
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
