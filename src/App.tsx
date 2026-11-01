import { FormEvent, useState } from "react"
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  IconButton,
  InputField,
  SearchComponent,
  ThemeProvider,
} from "@figma/astraui"
import {
  Bell,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  Grid3X3,
  House,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Mail,
  MapPin,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import AgreementScreen from "./AgreementScreen"
import AdminDashboard from "./AdminDashboard"
import AdminReports from "./AdminReports"
import AdminTransactions from "./AdminTransactions"
import AdminUsers from "./AdminUsers"
import ComplaintsScreen from "./ComplaintsScreen"
import MessagesScreen from "./MessagesScreen"
import NotificationsScreen from "./NotificationsScreen"
import OwnerApplications from "./OwnerApplications"
import OwnerDashboard from "./OwnerDashboard"
import OwnerMaintenance from "./OwnerMaintenance"
import OwnerProperties from "./OwnerProperties"
import OwnerRentTracking from "./OwnerRentTracking"
import ProfileScreen from "./ProfileScreen"
import PropertySearch from "./PropertySearch"
import ReviewsScreen from "./ReviewsScreen"
import TenantApplications from "./TenantApplications"
import TenantMaintenance from "./TenantMaintenance"
import TenantPayments from "./TenantPayments"

type AppView = "login" | "register" | "workspace"
type RegistrationRole = "Tenant" | "Owner"
type WorkspaceRole = RegistrationRole | "Admin"
type LoginErrors = Partial<Record<"email" | "password", string>>
type RegisterErrors = Partial<Record<"role" | "fullName" | "email" | "phone" | "password" | "confirmPassword" | "terms", string>>

const registrationRoles: RegistrationRole[] = ["Tenant", "Owner"]
const workspaceRoles: WorkspaceRole[] = ["Tenant", "Owner", "Admin"]

const navigationByRole: Record<WorkspaceRole, string[]> = {
  Tenant: [
    "Dashboard",
    "Search Properties",
    "My Applications",
    "Agreement",
    "Payments",
    "Maintenance",
    "Complaints",
    "Messages",
    "Notifications",
    "Reviews",
    "Profile",
  ],
  Owner: [
    "Dashboard",
    "My Properties",
    "Applications",
    "Agreements",
    "Rent Tracking",
    "Maintenance",
    "Messages",
    "Notifications",
    "Reports",
    "Profile",
  ],
  Admin: [
    "Dashboard",
    "Property Verification",
    "Users",
    "Rentals",
    "Transactions",
    "Complaints",
    "Reports",
    "Profile",
  ],
}

const propertyImage =
  "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMERoYWthJTIwaG9tZSUyMHdhcm0lMjBkYXlsaWdodHxlbnwxfHx8fDE3OTE4ODUyMzd8MA&ixlib=rb-4.1.0&q=80&w=1080"

const dashboardPropertyImage =
  "https://images.unsplash.com/photo-1737045466261-92204d753268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tJTIwQmFuZ2xhZGVzaCUyMHJlbnRhbCUyMGJyaWdodCUyMGZ1cm5pc2hlZHxlbnwxfHx8fDE3OTE4ODUzNTR8MA&ixlib=rb-4.1.0&q=80&w=1080"

const welcomeBannerImage =
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aGl0ZSUyMGFwYXJ0bWVudCUyMGJ1aWxkaW5nJTIwZXh0ZXJpb3IlMjBpc29sYXRlZCUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3OTM1MzM2MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080"

const navigationIcons: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  "Search Properties": Search,
  "My Applications": ClipboardCheck,
  "Apply to Rent": FileCheck2,
  Agreement: FileText,
  Agreements: FileText,
  Payments: CreditCard,
  Maintenance: Wrench,
  Complaints: MessageSquareText,
  Messages: Mail,
  Notifications: Bell,
  Reviews: Star,
  Profile: Settings,
  "My Properties": Building2,
  Applications: ClipboardCheck,
  "Rent Tracking": CircleDollarSign,
  Reports: Gauge,
  "Property Verification": ShieldCheck,
  Users,
  Rentals: House,
  Transactions: CreditCard,
}

function Brand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean
  inverse?: boolean
}) {
  return (
    <div className="flex items-center gap-lg">
      <div
        className={`${
          compact ? "rent-logo-small" : "rent-logo"
        } flex shrink-0 items-center justify-center rounded-corner-md ${
          inverse
            ? "bg-surface-bg text-brand-primary"
            : "bg-brand-primary text-on-brand"
        }`}
        aria-hidden="true"
      >
        <House size={compact ? 18 : 22} />
      </div>
      <div
        className={`text-heading ${inverse ? "text-on-brand" : "text-text-primary"}`}
      >
        RentEase
      </div>
    </div>
  )
}

function FieldError({ id, message }: { id: string message?: string }) {
  if (!message) return null

  return (
    <div
      id={id}
      className="mt-xs text-video-title text-danger"
      aria-live="polite"
    >
      {message}
    </div>
  )
}

function PasswordControl({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}) {
  return (
    <Button
      type="button"
      variant="subtle"
      size="small"
      className="rent-inline-action text-brand-primary"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? "Hide" : "Show"}
    </Button>
  )
}

function LoginForm({
  onRegister,
  onSuccess,
}: {
  onRegister: () => void
  onSuccess: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: LoginErrors = {}
    if (!email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address."
    }
    if (!password) {
      nextErrors.password = "Password is required."
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onSuccess()
  }

  return (
    <form className="flex flex-col gap-xl" onSubmit={submit} noValidate>
      <div>
        <InputField
          id="login-email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          onChange={(value) => {
            setEmail(value)
            setErrors((current) => ({ ...current, email: undefined }))
          }}
        />
        <FieldError id="login-email-error" message={errors.email} />
      </div>

      <div>
        <InputField
          id="login-password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="Enter your password"
          value={password}
          autoComplete="current-password"
          suffix={
            <PasswordControl
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          }
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "login-password-error" : undefined
          }
          onChange={(value) => {
            setPassword(value)
            setErrors((current) => ({ ...current, password: undefined }))
          }}
        />
        <FieldError id="login-password-error" message={errors.password} />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="subtle" size="small">
          Forgot password?
        </Button>
      </div>

      <Button type="submit" variant="primary" className="w-full">
        Log in
      </Button>

      <div className="flex items-center justify-center gap-xs text-label-sm text-text-secondary">
        <span>New to RentEase?</span>
        <Button
          type="button"
          variant="subtle"
          size="small"
          className="text-brand-primary"
          onClick={onRegister}
        >
          Create an account
        </Button>
      </div>
    </form>
  )
}

function RegisterForm({ onLogin }: { onLogin: () => void }) {
  const [role, setRole] = useState<RegistrationRole | null>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<RegisterErrors>({})

  const clearError = (field: keyof RegisterErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: RegisterErrors = {}
    if (!role) nextErrors.role = "Choose how you will use RentEase."
    if (!fullName.trim()) nextErrors.fullName = "Full name is required."
    if (!email.trim()) {
      nextErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address."
    }
    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required."
    } else if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      nextErrors.phone = "Enter a valid Bangladeshi phone number."
    }
    if (!password) {
      nextErrors.password = "Password is required."
    } else if (password.length < 8) {
      nextErrors.password = "Use at least 8 characters."
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password."
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match."
    }
    if (!acceptedTerms) {
      nextErrors.terms = "Accept the terms to create your account."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) onLogin()
  }

  return (
    <form className="flex flex-col gap-xl" onSubmit={submit} noValidate>
      <div>
        <div className="mb-md text-label text-text-primary">
          I want to join as
        </div>
        <div className="grid grid-cols-2 gap-md">
          {registrationRoles.map((item) => (
            <Button
              key={item}
              type="button"
              variant="neutral"
              className={`rent-role-card ${
                role === item
                  ? "border-border-selected bg-brand-muted text-brand-dark"
                  : "text-text-primary"
              }`}
              aria-pressed={role === item}
              onClick={() => {
                setRole(item)
                clearError("role")
              }}
            >
              <span className="flex flex-col items-start gap-xs text-left">
                <span className="text-label">
                  {item === "Owner" ? "Owner / Landlord" : "Tenant"}
                </span>
                <span className="text-video-title text-text-secondary">
                  {item === "Owner"
                    ? "List and manage properties"
                    : "Find and manage your home"}
                </span>
              </span>
            </Button>
          ))}
        </div>
        <FieldError id="register-role-error" message={errors.role} />
        <div className="mt-md text-video-title text-text-secondary">
          Admin accounts are created by RentEase administrators.
        </div>
      </div>

      <div>
        <InputField
          id="register-name"
          label="Full name"
          placeholder="e.g. Nusrat Jahan"
          value={fullName}
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "register-name-error" : undefined}
          onChange={(value) => {
            setFullName(value)
            clearError("fullName")
          }}
        />
        <FieldError id="register-name-error" message={errors.fullName} />
      </div>

      <div>
        <InputField
          id="register-email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          onChange={(value) => {
            setEmail(value)
            clearError("email")
          }}
        />
        <FieldError id="register-email-error" message={errors.email} />
      </div>

      <div>
        <InputField
          id="register-phone"
          type="tel"
          label="Phone number"
          placeholder="+880 17XX XXXXXX"
          value={phone}
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "register-phone-error" : undefined}
          onChange={(value) => {
            setPhone(value)
            clearError("phone")
          }}
        />
        <FieldError id="register-phone-error" message={errors.phone} />
      </div>

      <div>
        <InputField
          id="register-password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          autoComplete="new-password"
          suffix={
            <PasswordControl
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          }
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "register-password-error" : undefined
          }
          onChange={(value) => {
            setPassword(value)
            clearError("password")
          }}
        />
        <FieldError id="register-password-error" message={errors.password} />
      </div>

      <div>
        <InputField
          id="register-confirm-password"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          autoComplete="new-password"
          suffix={
            <PasswordControl
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
            />
          }
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword
              ? "register-confirm-password-error"
              : undefined
          }
          onChange={(value) => {
            setConfirmPassword(value)
            clearError("confirmPassword")
          }}
        />
        <FieldError
          id="register-confirm-password-error"
          message={errors.confirmPassword}
        />
      </div>

      <div>
        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy"
          defaultChecked={false}
          onChange={(checked) => {
            setAcceptedTerms(checked)
            clearError("terms")
          }}
          aria-invalid={Boolean(errors.terms)}
          aria-describedby={errors.terms ? "register-terms-error" : undefined}
        />
        <FieldError id="register-terms-error" message={errors.terms} />
      </div>

      <Button type="submit" variant="primary" className="w-full">
        Create account
      </Button>

      <div className="flex items-center justify-center gap-xs text-label-sm text-text-secondary">
        <span>Already have an account?</span>
        <Button
          type="button"
          variant="subtle"
          size="small"
          className="text-brand-primary"
          onClick={onLogin}
        >
          Log in
        </Button>
      </div>
    </form>
  )
}

function AuthScreen({
  view,
  onChangeView,
  onLogin,
}: {
  view: Exclude<AppView, "workspace">
  onChangeView: (view: Exclude<AppView, "workspace">) => void
  onLogin: () => void
}) {
  const isLogin = view === "login"

  return (
    <div className="auth-layout min-h-dvh bg-brand-tertiary font-sans text-text-primary">
      <section className="auth-visual relative overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={propertyImage}
          alt="Sunlit modern apartment living room"
        />
        <div className="auth-photo-overlay absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-2xl text-on-brand">
          <div className="auth-brand-on-photo">
            <Brand />
          </div>
          <div className="auth-tagline text-title">
            Find your next home,
            <br />
            manage it with ease
          </div>
          <div className="text-video-title">Photo by Aalo Lens on Unsplash</div>
        </div>
      </section>

      <main
        className={`auth-form-panel flex min-h-0 items-start justify-center overflow-y-auto bg-brand-tertiary p-xl md:p-2xl ${
          isLogin ? "lg:items-center" : ""
        }`}
      >
        <div className="auth-card w-full rounded-corner-lg border border-border-primary bg-surface-bg p-xl md:p-2xl">
          <div className="mb-2xl lg:hidden">
            <Brand compact />
          </div>

          <div className="mb-2xl">
            <div className="text-title text-text-primary">
              {isLogin ? "Welcome back" : "Create your account"}
            </div>
            <div className="mt-xs text-label-sm text-text-secondary">
              {isLogin
                ? "Log in to continue to your RentEase workspace."
                : "Set up your account to get started with RentEase."}
            </div>
          </div>

          {isLogin ? (
            <LoginForm
              onRegister={() => onChangeView("register")}
              onSuccess={onLogin}
            />
          ) : (
            <RegisterForm onLogin={() => onChangeView("login")} />
          )}
        </div>
      </main>
    </div>
  )
}

function TenantDashboard({
  onNavigate,
}: {
  onNavigate: (destination: string) => void
}) {
  const stats = [
    {
      label: "Monthly Rent",
      value: "৳18,000",
      detail: "Due every month",
      icon: CircleDollarSign,
      tone: "brand",
      destination: "Payments",
    },
    {
      label: "Next Payment",
      value: "05 Nov",
      detail: "23 days remaining",
      icon: CalendarClock,
      tone: "info",
      destination: "Payments",
    },
    {
      label: "Open Requests",
      value: "2",
      detail: "1 update today",
      icon: Wrench,
      tone: "warning",
      destination: "Maintenance",
    },
    {
      label: "Agreement Expiry",
      value: "103 days",
      detail: "Ends 24 Jan 2027",
      icon: FileCheck2,
      tone: "accent",
      destination: "Agreement",
    },
  ]

  const requests = [
    {
      title: "Leaking kitchen tap",
      date: "Reported 12 Oct",
      status: "In Progress",
      variant: "warning" as const,
      icon: Wrench,
    },
    {
      title: "Bedroom AC servicing",
      date: "Reported 10 Oct",
      status: "Assigned",
      variant: "brand" as const,
      icon: Building2,
    },
    {
      title: "Switch not working",
      date: "Reported 06 Oct",
      status: "Pending",
      variant: "secondary" as const,
      icon: Lightbulb,
    },
  ]

  const payments = [
    {
      month: "October 2026",
      amount: "৳18,000",
      paidOn: "05 Oct 2026",
      status: "Paid",
      variant: "success" as const,
    },
    {
      month: "September 2026",
      amount: "৳18,000",
      paidOn: "04 Sep 2026",
      status: "Paid",
      variant: "success" as const,
    },
    {
      month: "August 2026",
      amount: "৳18,000",
      paidOn: "05 Aug 2026",
      status: "Paid",
      variant: "success" as const,
    },
    {
      month: "July 2026",
      amount: "৳18,000",
      paidOn: "Pending",
      status: "Pending",
      variant: "warning" as const,
    },
    {
      month: "June 2026",
      amount: "৳18,000",
      paidOn: "Overdue",
      status: "Overdue",
      variant: "danger" as const,
    },
  ]

  return (
    <div className="rent-dashboard-content flex flex-col gap-2xl p-xl md:p-2xl">
      <div className="dashboard-welcome relative overflow-hidden rounded-corner-lg border border-border-primary p-xl md:p-2xl">
        <img
          className="dashboard-welcome-image absolute"
          src={welcomeBannerImage}
          alt=""
          aria-hidden="true"
        />
        <div className="dashboard-welcome-copy relative">
          <div className="text-title text-text-primary">
            Welcome back, Tanvir 👋
          </div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Here is what is happening with your rental. Keep everything on
            track.
          </div>
          <Button
            variant="primary"
            className="rent-pay-button relative"
            onClick={() => onNavigate("Payments")}
          >
            <WalletCards size={18} />
            Pay rent now
          </Button>
        </div>
      </div>

      <section
        className="grid grid-cols-4 gap-xl"
        aria-label="Rental summary"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`dashboard-card dashboard-card-interactive dashboard-stat-card dashboard-stat-${stat.tone} relative flex h-full flex-col items-start gap-lg rounded-corner-lg border border-border-primary p-xl`}
          >
            <div className="dashboard-stat-icon flex shrink-0 items-center justify-center rounded-corner-md text-brand-primary">
              <stat.icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-label-sm text-text-primary">{stat.label}</div>
              <div className="mt-md text-heading text-text-primary">
                {stat.value}
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                {stat.detail}
              </div>
            </div>
            <IconButton
              variant="subtle"
              size="small"
              className="dashboard-stat-action"
              icon={<ChevronRight size={16} />}
              aria-label={`Open ${stat.label}`}
              onClick={() => onNavigate(stat.destination)}
            />
          </div>
        ))}
      </section>

      <div className="dashboard-lower-grid grid gap-xl">
        <section
          className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"
          aria-label="Current property"
        >
          <div className="flex items-center justify-between gap-lg border-b border-border-secondary px-xl py-lg">
            <div className="text-heading text-text-primary">
              Current Property
            </div>
            <Button
              variant="subtle"
              size="small"
              onClick={() => onNavigate("Agreement")}
            >
              View details
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="current-property-layout p-xl">
            <img
              className="dashboard-property-image w-full rounded-corner-md object-cover"
              src={dashboardPropertyImage}
              alt="Furnished apartment living room in Dhanmondi"
            />
            <div>
              <div className="text-heading text-text-primary">
                Green View Apartment
              </div>
              <div className="mt-md flex items-center gap-md text-label-sm text-text-secondary">
                <MapPin size={16} />
                Dhanmondi Dhaka
              </div>
              <div className="mt-lg flex items-center gap-md text-label-sm text-text-primary">
                <House size={16} className="text-brand-primary" />
                Apartment
              </div>
              <div className="mt-lg flex items-center gap-md text-label-sm text-text-primary">
                <CircleDollarSign size={16} className="text-brand-primary" />
                Monthly rent:
                <span className="text-label text-text-primary">৳18,000</span>
              </div>
              <div className="mt-lg flex items-center gap-md text-label-sm text-text-primary">
                <FileCheck2 size={16} className="text-brand-primary" />
                Status: <Badge label="Rented" variant="success" />
              </div>
            </div>
          </div>
        </section>

        <section
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
          aria-label="Maintenance requests"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-heading text-text-primary">
                Maintenance Requests
              </div>
              <div className="mt-xs text-video-title text-text-secondary">
                Recent service requests
              </div>
            </div>
            <Button
              variant="subtle"
              size="small"
              onClick={() => onNavigate("Maintenance")}
            >
              View all
            </Button>
          </div>

          <div className="mt-xl flex flex-col">
            {requests.map((request) => (
              <div
                key={request.title}
                className="maintenance-row flex items-center justify-between gap-lg border-b border-border-secondary py-lg"
              >
                <div className="flex min-w-0 items-center gap-lg">
                  <div className="maintenance-icon flex shrink-0 items-center justify-center rounded-corner-md bg-brand-muted text-brand-primary">
                    <request.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-label-sm text-text-primary">
                      {request.title}
                    </div>
                    <div className="mt-xs text-video-title text-text-secondary">
                      {request.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-md">
                  <Badge
                    label={request.status}
                    variant={request.variant}
                    className={
                      request.status === "Assigned"
                        ? "status-assigned"
                        : undefined
                    }
                  />
                  <ChevronRight size={16} className="text-text-tertiary" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        className="dashboard-card overflow-hidden rounded-corner-lg border border-border-primary bg-surface-bg"
        aria-label="Payment history"
      >
        <div className="flex items-center justify-between p-xl">
          <div>
            <div className="text-heading text-text-primary">
              Payment History
            </div>
            <div className="mt-xs text-video-title text-text-secondary">
              Your latest rent payments
            </div>
          </div>
          <Button
            variant="neutral"
            size="small"
            onClick={() => onNavigate("Payments")}
          >
            View all payments
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="dashboard-table w-full">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Payment date</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.month}>
                  <td data-label="Month">{payment.month}</td>
                  <td data-label="Amount">{payment.amount}</td>
                  <td data-label="Payment date">{payment.paidOn}</td>
                  <td data-label="Status">
                    <Badge
                      label={payment.status}
                      variant={payment.variant}
                    />
                  </td>
                  <td data-label="Action">
                    <Button
                      type="button"
                      variant="subtle"
                      size="small"
                      iconStart={<Download size={16} />}
                      aria-label={`Download receipt for ${payment.month}`}
                    >
                      Download
                    </Button>
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

function RentEaseShell({ onLogout }: { onLogout: () => void }) {
  const [role, setRole] = useState<WorkspaceRole>("Tenant")
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const navigation = navigationByRole[role]

  const changeRole = (nextRole: WorkspaceRole) => {
    setRole(nextRole)
    setActiveNav(navigationByRole[nextRole][0])
    setWorkspaceMenuOpen(false)
  }

  const navigate = (destination: string) => {
    setActiveNav(destination)
  }

  return (
    <div className="rent-app-shell flex h-dvh bg-brand-tertiary font-sans text-text-primary">
      <aside
        className="rent-sidebar fixed inset-y-0 left-0 flex shrink-0 flex-col border-r border-border-primary bg-surface-bg"
      >
        <div className="rent-sidebar-brand flex items-center px-lg">
          <Brand inverse />
        </div>

        <div className="workspace-switcher relative">
          <Button
            type="button"
            variant="subtle"
            className="workspace-switcher-button w-full rounded-corner-lg bg-brand-muted text-brand-dark"
            aria-expanded={workspaceMenuOpen}
            aria-haspopup="menu"
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
          >
            <Grid3X3 size={18} />
            <span className="min-w-0 truncate">
              {role} workspace
            </span>
            <ChevronDown
              size={16}
              className={`ml-auto shrink-0 ${
                workspaceMenuOpen ? "workspace-chevron-open" : ""
              }`}
            />
          </Button>
          {workspaceMenuOpen ? (
            <div
              className="workspace-menu absolute left-0 right-0 top-full mt-xs rounded-corner-md border border-border-primary bg-surface-bg p-xs"
              role="menu"
              aria-label="Choose workspace"
            >
            {workspaceRoles.map((item) => (
              <Button
                key={item}
                size="small"
                variant="subtle"
                className={`workspace-menu-item w-full justify-start ${
                  role === item
                    ? "bg-brand-muted text-brand-primary"
                    : "text-text-secondary"
                }`}
                role="menuitemradio"
                aria-checked={role === item}
                onClick={() => changeRole(item)}
              >
                <span className="flex-1 text-left">{item}</span>
                {role === item ? <Check size={16} /> : null}
              </Button>
            ))}
            </div>
          ) : null}
        </div>

        <div className="rent-sidebar-content flex flex-1 flex-col overflow-y-auto px-lg pb-lg">
          <div className="flex flex-col gap-xs">
            {navigation.map((item) => {
              const NavIcon = navigationIcons[item] ?? LayoutDashboard
              const count =
                item === "Messages" ? 3 : item === "Notifications" ? 2 : null
              return (
                <Button
                  key={item}
                  variant="subtle"
                  className={`rent-nav-button ${
                    activeNav === item
                      ? "bg-brand-primary text-on-brand"
                      : "text-text-secondary"
                  }`}
                  aria-current={activeNav === item ? "page" : undefined}
                  onClick={() => navigate(item)}
                >
                  <NavIcon size={20} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-left">
                    {item}
                  </span>
                  {count ? (
                    <Badge
                      label={count.toString()}
                      variant="danger"
                      className="rent-nav-count ml-auto"
                    />
                  ) : null}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-md border-t border-border-secondary p-lg">
          <Button
            variant="subtle"
            className="rent-nav-button text-text-secondary"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Log out
          </Button>
        </div>
      </aside>

      <div className="rent-workspace flex min-w-0 flex-1 flex-col">
        <header className="rent-topbar flex shrink-0 items-center gap-lg border-b border-border-primary bg-surface-bg px-xl py-md lg:px-2xl">
          <SearchComponent
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={setSearchQuery}
            placeholder="Search properties, requests, or anything..."
            aria-label="Search RentEase"
            className="rent-global-search"
          />

          <div className="flex-1" />

          <div className="rent-notification">
            <IconButton
              variant="subtle"
              icon={<Bell size={20} />}
              aria-label="Open notifications, 2 unread"
              onClick={() => {
                if (navigation.includes("Notifications")) {
                  navigate("Notifications")
                }
              }}
            />
            <div className="rent-notification-badge" aria-hidden="true">
              2
            </div>
          </div>

          <div className="rent-profile flex items-center gap-md border-l border-border-secondary pl-lg">
            <Avatar type="initial" size="medium" initials="TH" />
            <div>
              <div className="rent-profile-name text-label-sm text-text-primary">
                Tanvir Hasan
              </div>
              <div className="text-video-title text-text-secondary">{role}</div>
            </div>
            <ChevronDown size={16} className="text-text-secondary" />
          </div>
        </header>

        <main
          className="rent-workspace-main min-h-0 flex-1 overflow-y-auto bg-brand-tertiary"
          aria-label={`${role} workspace`}
        >
          {role === "Tenant" && activeNav === "Dashboard" ? (
            <TenantDashboard onNavigate={setActiveNav} />
          ) : null}
          {role === "Tenant" && activeNav === "Search Properties" ? (
            <PropertySearch onApply={() => setActiveNav("Apply to Rent")} />
          ) : null}
          {role === "Tenant" && activeNav === "My Applications" ? (
            <TenantApplications />
          ) : null}
          {role === "Tenant" && activeNav === "Apply to Rent" ? (
            <TenantApplications initialView="apply" />
          ) : null}
          {role === "Tenant" && activeNav === "Agreement" ? (
            <AgreementScreen role="Tenant" />
          ) : null}
          {role === "Tenant" && activeNav === "Payments" ? (
            <TenantPayments />
          ) : null}
          {role === "Tenant" && activeNav === "Maintenance" ? (
            <TenantMaintenance />
          ) : null}
          {role === "Tenant" && activeNav === "Complaints" ? (
            <ComplaintsScreen role="Tenant" />
          ) : null}
          {role === "Tenant" && activeNav === "Messages" ? (
            <MessagesScreen role="Tenant" />
          ) : null}
          {role === "Tenant" && activeNav === "Notifications" ? (
            <NotificationsScreen role="Tenant" />
          ) : null}
          {role === "Tenant" && activeNav === "Reviews" ? (
            <ReviewsScreen />
          ) : null}
          {activeNav === "Profile" ? <ProfileScreen role={role} /> : null}
          {role === "Owner" && activeNav === "Dashboard" ? (
            <OwnerDashboard />
          ) : null}
          {role === "Owner" && activeNav === "My Properties" ? (
            <OwnerProperties />
          ) : null}
          {role === "Owner" && activeNav === "Applications" ? (
            <OwnerApplications />
          ) : null}
          {role === "Owner" && activeNav === "Agreements" ? (
            <AgreementScreen role="Owner" />
          ) : null}
          {role === "Owner" && activeNav === "Rent Tracking" ? (
            <OwnerRentTracking />
          ) : null}
          {role === "Owner" && activeNav === "Maintenance" ? (
            <OwnerMaintenance />
          ) : null}
          {role === "Owner" && activeNav === "Messages" ? (
            <MessagesScreen role="Owner" />
          ) : null}
          {role === "Owner" && activeNav === "Notifications" ? (
            <NotificationsScreen role="Owner" />
          ) : null}
          {role === "Owner" && activeNav === "Reports" ? (
            <AdminReports scope="Owner" />
          ) : null}
          {role === "Admin" && activeNav === "Dashboard" ? (
            <AdminDashboard />
          ) : null}
          {role === "Admin" && activeNav === "Property Verification" ? (
            <AdminDashboard queueOnly />
          ) : null}
          {role === "Admin" && activeNav === "Complaints" ? (
            <ComplaintsScreen role="Admin" />
          ) : null}
          {role === "Admin" && activeNav === "Users" ? <AdminUsers /> : null}
          {role === "Admin" && activeNav === "Transactions" ? (
            <AdminTransactions />
          ) : null}
          {role === "Admin" && activeNav === "Rentals" ? (
            <OwnerRentTracking scope="Admin" />
          ) : null}
          {role === "Admin" && activeNav === "Reports" ? (
            <AdminReports />
          ) : null}
        </main>

      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<AppView>("login")

  return (
    <ThemeProvider>
      {view === "workspace" ? (
        <RentEaseShell onLogout={() => setView("login")} />
      ) : (
        <AuthScreen
          view={view}
          onChangeView={setView}
          onLogin={() => setView("workspace")}
        />
      )}
    </ThemeProvider>
  )
}
