import { FormEvent, useEffect, useState } from "react"
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  IconButton,
  InputField,
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
import { supabase } from "./lib/supabase"

type AppView = "login" | "register" | "workspace"
type RegistrationRole = "Tenant" | "Owner"
type WorkspaceRole = RegistrationRole | "Admin"
type LoginErrors = Partial<Record<"email" | "password", string>>
type RegisterErrors = Partial<Record<"role" | "fullName" | "email" | "phone" | "password" | "confirmPassword" | "terms", string>>
type AuthMessage = { type: "error" | "success"; text: string } | null
type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  area: string | null
  avatar_url: string | null
  role: "tenant" | "owner" | "admin"
  status: "active" | "suspended"
}

function formatAuthError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes("invalid login credentials")) {
    return "Email or password is incorrect."
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before logging in."
  }
  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Try logging in."
  }
  if (normalized.includes("only an administrator")) {
    return "Only an authorized administrator can perform this action."
  }
  return message
}

const registrationRoles: RegistrationRole[] = ["Tenant", "Owner"]
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
    "Reviews",
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
    "Notifications",
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
        className={`text-heading ${
          inverse ? "text-on-brand" : "text-text-primary"
        }`}
      >
        RentEase
      </div>
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null

  return (
    <div
      id={id}
      className="auth-field-error mt-1 text-xs text-danger"
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
  onSuccess: (email: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [message, setMessage] = useState<AuthMessage>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetMessage, setResetMessage] = useState<AuthMessage>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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
    setMessage(null)
    if (Object.keys(nextErrors).length === 0) {
      setSubmitting(true)
      try {
        await onSuccess(email.trim(), password)
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Unable to log in.",
        })
      } finally {
        setSubmitting(false)
      }
    }
  }

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResetMessage(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetMessage({ type: "error", text: "Enter a valid email address." })
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail.trim(),
    )
    if (error) {
      setResetMessage({ type: "error", text: error.message })
    } else {
      setResetMessage({
        type: "success",
        text: "Check your email for a password reset link.",
      })
    }
  }

  if (resetMode) {
    return (
      <form className="flex flex-col gap-4" onSubmit={resetPassword} noValidate>
        <div>
          <div className="text-heading text-text-primary">Reset password</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Enter your email and we will send a secure reset link.
          </div>
        </div>
        <InputField
          id="reset-email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={resetEmail}
          autoComplete="email"
          className="auth-input-field"
          onChange={setResetEmail}
        />
        {resetMessage ? (
          <div
            className={`text-label-sm ${
              resetMessage.type === "error"
                ? "text-danger"
                : "text-brand-primary"
            }`}
            role="status"
          >
            {resetMessage.text}
          </div>
        ) : null}
        <Button type="submit" variant="primary" className="w-full">
          Send reset link
        </Button>
        <Button
          type="button"
          variant="subtle"
          size="small"
          onClick={() => setResetMode(false)}
        >
          Back to log in
        </Button>
      </form>
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <div>
        <InputField
          id="login-email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          autoComplete="email"
          className="auth-input-field"
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
          className="auth-input-field"
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
        <Button
          type="button"
          variant="subtle"
          size="small"
          onClick={() => setResetMode(true)}
        >
          Forgot password?
        </Button>
      </div>

      {message ? (
        <div
          className={`text-label-sm ${
            message.type === "error" ? "text-danger" : "text-brand-primary"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={submitting}
      >
        {submitting ? "Logging in..." : "Log in"}
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

function RegisterForm({
  onLogin,
  onSuccess,
}: {
  onLogin: () => void
  onSuccess: (
    role: RegistrationRole,
    fullName: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<boolean>
}) {
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
  const [message, setMessage] = useState<AuthMessage>(null)
  const [submitting, setSubmitting] = useState(false)

  const clearError = (field: keyof RegisterErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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
    setMessage(null)
    if (Object.keys(nextErrors).length === 0) {
      setSubmitting(true)
      try {
        const signedIn = await onSuccess(
          role as RegistrationRole,
          fullName.trim(),
          email.trim(),
          phone.trim(),
          password,
        )
        if (signedIn) onLogin()
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Unable to create account.",
        })
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <div>
        <div className="mt-4 mb-2 text-sm font-medium text-text-primary">
          I want to join as
        </div>
        <div className="grid grid-cols-2 gap-3">
          {registrationRoles.map((item) => (
            <Button
              key={item}
              type="button"
              variant="neutral"
              className={`rent-role-card min-w-0 rounded-xl border p-4 ${
                role === item
                  ? "border-2 border-[#1F7F78] bg-[#E8F4F2] text-brand-dark"
                  : "border-[#D5DEDE] text-text-primary"
              }`}
              aria-pressed={role === item}
              onClick={() => {
                setRole(item)
                clearError("role")
              }}
            >
              <span className="relative flex min-w-0 flex-col items-start gap-1 break-words pr-5 text-left">
                <span className="text-sm font-medium leading-5">
                  {item === "Owner" ? "Owner / Landlord" : "Tenant"}
                </span>
                <span className="text-xs leading-4 text-text-secondary">
                  {item === "Owner"
                    ? "List and manage properties"
                    : "Find and manage your home"}
                </span>
                {item === "Owner" ? (
                  <span className="text-[10px] leading-4 text-[#A45A0C]">
                    Approval required
                  </span>
                ) : null}
                {role === item ? (
                  <Check
                    size={14}
                    className="absolute right-0 top-0 text-[#1F7F78]"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            </Button>
          ))}
        </div>
        <FieldError id="register-role-error" message={errors.role} />
        <div className="mt-3 text-xs text-text-secondary">
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
          className="auth-input-field"
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
          className="auth-input-field"
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
          className="auth-input-field"
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
          className="auth-input-field"
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
          className="auth-input-field"
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
        <div className="auth-terms mt-1 flex items-center gap-2 text-sm">
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
        </div>
        <FieldError id="register-terms-error" message={errors.terms} />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="mt-2 h-12 w-full rounded-xl bg-[#1F7F78] text-white hover:bg-[#176963]"
      >
        {submitting ? "Creating account..." : "Create account"}
      </Button>
      {message ? (
        <div
          className={`text-label-sm ${
            message.type === "error" ? "text-danger" : "text-brand-primary"
          }`}
          role="status"
        >
          {message.text}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-center gap-xs text-sm text-text-secondary">
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
  onRegister,
}: {
  view: Exclude<AppView, "workspace">
  onChangeView: (view: Exclude<AppView, "workspace">) => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (
    role: RegistrationRole,
    fullName: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<boolean>
}) {
  const isLogin = view === "login"

  return (
    <div className="auth-layout min-h-dvh overflow-x-hidden bg-brand-tertiary font-sans text-text-primary">
      <section className="auth-visual relative overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={propertyImage}
          alt="Sunlit modern apartment living room"
        />
        <div className="auth-photo-overlay absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-on-brand">
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

      <main className="auth-form-panel flex min-h-0 items-center justify-center overflow-y-auto overflow-x-hidden bg-brand-tertiary p-8">
        <div className="auth-card w-full max-w-[480px] rounded-2xl border border-border-primary bg-surface-bg p-8 shadow-[0_12px_32px_rgba(20,50,48,0.08)]">
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
            <RegisterForm
              onLogin={() => onChangeView("login")}
              onSuccess={onRegister}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function TenantDashboard({
  onNavigate,
  tenantId,
}: {
  onNavigate: (destination: string, options?: { openPayment?: boolean }) => void
  tenantId: string
}) {
  type TenantLease = {
    id: string
    monthly_rent: number
    start_date: string
    end_date: string
    status: string
    property: {
      title: string
      address: string
      city: string
      property_type: string
      image_urls: string[]
    } | null
  }
  type TenantPayment = {
    id: string
    amount: number
    due_date: string
    paid_at: string | null
    status: string
  }
  type TenantRequest = {
    id: string
    title: string
    created_at: string
    status: string
  }
  type TenantComplaint = {
    id: string
    subject: string
    created_at: string
    status: string
  }

  const [lease, setLease] = useState<TenantLease | null>(null)
  const [payments, setPayments] = useState<TenantPayment[]>([])
  const [applications, setApplications] = useState<Array<{
    id: string
    property: string
    status: string
  }>>([])
  const [requests, setRequests] = useState<TenantRequest[]>([])
  const [complaints, setComplaints] = useState<TenantComplaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadDashboard = async () => {
      const [leaseResult, applicationResult, requestResult, complaintResult] =
        await Promise.all([
          supabase
            .from("leases")
            .select(
              "id, monthly_rent, start_date, end_date, status, properties(title, address, city, property_type, image_urls)",
            )
            .eq("tenant_id", tenantId)
            .in("status", ["active", "draft"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("applications")
            .select("id, status, properties(title)")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("maintenance_requests")
            .select("id, title, created_at, status")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("complaints")
            .select("id, subject, created_at, status")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .limit(3),
        ])

      if (!active) return
      const queryError = [
        leaseResult.error,
        applicationResult.error,
        requestResult.error,
        complaintResult.error,
      ].find(Boolean)
      if (queryError) {
        setError(`Unable to load your dashboard: ${queryError.message}`)
        setLoading(false)
        return
      }

      const leaseData = leaseResult.data
      const property = leaseData?.properties
        ? Array.isArray(leaseData.properties)
          ? leaseData.properties[0]
          : leaseData.properties
        : null
      const currentLease = leaseData ? { ...leaseData, property } : null
      setLease(currentLease)
      setApplications(
        (applicationResult.data ?? []).map((application) => {
          const applicationProperty = Array.isArray(application.properties)
            ? application.properties[0]
            : application.properties
          return {
            id: application.id,
            property: applicationProperty?.title ?? "Property",
            status: application.status,
          }
        }),
      )
      setRequests(requestResult.data ?? [])
      setComplaints(complaintResult.data ?? [])

      if (currentLease) {
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("id, amount, due_date, paid_at, status")
          .eq("tenant_id", tenantId)
          .eq("lease_id", currentLease.id)
          .order("due_date", { ascending: false })
          .limit(5)
        if (!active) return
        if (paymentError) {
          setError(`Unable to load payment history: ${paymentError.message}`)
        } else {
          setPayments(paymentData ?? [])
        }
      }
      setLoading(false)
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [tenantId])

  const outstandingPayment = [...payments]
    .filter((payment) => payment.status !== "paid")
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
  const openRequests = requests.filter(
    (request) => request.status !== "completed",
  )
  const nextPaymentDate = outstandingPayment?.due_date
    ? new Date(`${outstandingPayment.due_date}T00:00:00`).toLocaleDateString(
        "en-GB",
        { day: "2-digit", month: "short" },
      )
    : "—"
  const daysUntilPayment = outstandingPayment?.due_date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${outstandingPayment.due_date}T00:00:00`).getTime() -
            Date.now()) /
            86400000,
        ),
      )
    : null
  const stats = [
    {
      label: "Monthly Rent",
      value: lease
        ? `৳${Number(lease.monthly_rent).toLocaleString("en-BD")}`
        : "—",
      detail: lease ? "Due every month" : "No lease yet",
      icon: CircleDollarSign,
      tone: "brand",
      destination: "Payments",
    },
    {
      label: "Next Payment",
      value: nextPaymentDate,
      detail:
        daysUntilPayment === null
          ? "No outstanding payment"
          : `${daysUntilPayment} days remaining`,
      icon: CalendarClock,
      tone: "info",
      destination: "Payments",
    },
    {
      label: "Open Requests",
      value: String(openRequests.length),
      detail: requests.length
        ? `${requests.length} total requests`
        : "No requests",
      icon: Wrench,
      tone: "warning",
      destination: "Maintenance",
    },
    {
      label: "Agreement Expiry",
      value: lease
        ? new Date(lease.end_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
      detail: lease ? `Status: ${lease.status}` : "No active lease",
      icon: FileCheck2,
      tone: "accent",
      destination: "Agreement",
    },
  ]

  if (loading) {
    return (
      <div className="rent-dashboard-content p-xl md:p-2xl">
        <div className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-text-secondary">
          Loading your dashboard...
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="rent-dashboard-content p-xl md:p-2xl">
        <div
          className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-2xl text-center text-label-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      </div>
    )
  }
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
          <div className="text-title text-text-primary">Welcome back 👋</div>
          <div className="mt-xs text-label-sm text-text-secondary">
            Here is what is happening with your rental. Keep everything on
            track.
          </div>
          <Button
            variant="primary"
            className="rent-pay-button relative inline-flex h-11 items-center gap-2 px-5"
            onClick={() => onNavigate("Payments", { openPayment: true })}
          >
            <WalletCards size={18} />
            Pay rent now
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-4 gap-xl" aria-label="Rental summary">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`dashboard-card dashboard-card-interactive dashboard-stat-card dashboard-stat-${stat.tone} relative flex h-full flex-col items-start gap-lg rounded-corner-lg border border-border-primary p-xl`}
          >
            <div className="dashboard-stat-icon flex shrink-0 items-center justify-center rounded-corner-md text-brand-primary">
              <stat.icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-label-sm text-text-primary">
                {stat.label}
              </div>
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
          {lease ? (
            <div className="current-property-layout p-xl">
              <img
                className="dashboard-property-image w-full rounded-corner-md object-cover"
                src={lease.property?.image_urls?.[0] || dashboardPropertyImage}
                alt={lease.property?.title ?? "Current property"}
              />
              <div>
                <div className="text-heading text-text-primary">
                  {lease.property?.title ?? "Current property"}
                </div>
                <div className="mt-md flex items-center gap-md text-label-sm text-text-secondary">
                  <MapPin size={16} />
                  {lease.property
                    ? `${lease.property.address}, ${lease.property.city}`
                    : "Address unavailable"}
                </div>
                <div className="mt-lg flex items-center gap-md text-label-sm text-text-primary">
                  <House size={16} className="text-brand-primary" />
                  {lease.property?.property_type ?? "Property"}
                </div>
                <div className="mt-lg flex items-center gap-md text-label-sm text-text-primary">
                  <CircleDollarSign size={16} className="text-brand-primary" />
                  Monthly rent:{" "}
                  <span className="text-label text-text-primary">
                    ৳{Number(lease.monthly_rent).toLocaleString("en-BD")}
                  </span>
                </div>
                <div className="mt-lg flex items-center gap-md text-label-sm text-text-primary">
                  <FileCheck2 size={16} className="text-brand-primary" />
                  Status:{" "}
                  <Badge
                    label={
                      lease.status.charAt(0).toUpperCase() +
                      lease.status.slice(1)
                    }
                    variant={lease.status === "active" ? "success" : "warning"}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-xl text-label-sm text-text-secondary">
              No current lease. Applications:{" "}
              {applications.length
                ? applications
                    .map(
                      (application) =>
                        `${application.property} (${application.status})`,
                    )
                    .join(", ")
                : "none"}
              .
            </div>
          )}
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
            {requests.length ? (
              requests.map((request) => (
                <div
                  key={request.title}
                  className="maintenance-row flex items-center justify-between gap-lg border-b border-border-secondary py-lg"
                >
                  <div className="flex min-w-0 items-center gap-lg">
                    <div className="maintenance-icon flex shrink-0 items-center justify-center rounded-corner-md bg-brand-muted text-brand-primary">
                      <Wrench size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-label-sm text-text-primary">
                        {request.title}
                      </div>
                      <div className="mt-xs text-video-title text-text-secondary">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    <Badge
                      label={request.status.replace(/_/g, " ")}
                      variant={
                        request.status === "completed" ? "success" : "warning"
                      }
                      className={
                        request.status === "assigned"
                          ? "status-assigned"
                          : undefined
                      }
                    />
                    <ChevronRight size={16} className="text-text-tertiary" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-lg text-label-sm text-text-secondary">
                No maintenance requests yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section
        className="dashboard-card rounded-corner-lg border border-border-primary bg-surface-bg p-xl"
        aria-label="Complaints"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-heading text-text-primary">Complaints</div>
            <div className="mt-xs text-video-title text-text-secondary">
              Track issues raised with RentEase.
            </div>
          </div>
          <Button
            variant="subtle"
            size="small"
            onClick={() => onNavigate("Complaints")}
          >
            View all
          </Button>
        </div>
        <div className="mt-xl flex flex-col gap-lg">
          {complaints.length ? (
            complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="flex items-center justify-between gap-lg border-b border-border-secondary pb-lg last:border-b-0 last:pb-0"
              >
                <div>
                  <div className="text-label-sm text-text-primary">
                    {complaint.subject}
                  </div>
                  <div className="mt-xs text-video-title text-text-secondary">
                    Submitted{" "}
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge
                  label={complaint.status.replace(/_/g, " ")}
                  variant={
                    complaint.status === "resolved" ? "success" : "warning"
                  }
                />
              </div>
            ))
          ) : (
            <div className="text-label-sm text-text-secondary">
              No complaints submitted yet.
            </div>
          )}
        </div>
      </section>

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
              {payments.length ? (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Month">
                      {new Date(
                        `${payment.due_date}T00:00:00`,
                      ).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td data-label="Amount">
                      ৳{Number(payment.amount).toLocaleString("en-BD")}
                    </td>
                    <td data-label="Payment date">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString()
                        : "Not paid"}
                    </td>
                    <td data-label="Status">
                      <Badge
                        label={
                          payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)
                        }
                        variant={
                          payment.status === "paid"
                            ? "success"
                            : payment.status === "overdue"
                              ? "danger"
                              : "warning"
                        }
                      />
                    </td>
                    <td data-label="Action">
                      <Button
                        type="button"
                        variant="subtle"
                        size="small"
                        iconStart={<Download size={16} />}
                        aria-label={`Download receipt for ${payment.due_date}`}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-xl text-center text-label-sm text-text-secondary"
                  >
                    No payment history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function RentEaseShell({
  profile,
  onLogout,
  onProfileUpdated,
}: {
  profile: Profile
  onLogout: () => Promise<void>
  onProfileUpdated: (profile: Profile) => void
}) {
  const role: WorkspaceRole =
    profile.role === "admin"
      ? "Admin"
      : profile.role === "owner"
        ? "Owner"
        : "Tenant"
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [applicationPropertyId, setApplicationPropertyId] =
    useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [openPaymentOnLoad, setOpenPaymentOnLoad] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0,
  })
  const navigation = navigationByRole[role]

  useEffect(() => {
    let active = true
    const loadUnreadCounts = async () => {
      const [messagesResult, notificationsResult] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", profile.id)
          .is("read_at", null),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .is("read_at", null),
      ])

      if (!active) return
      if (messagesResult.error || notificationsResult.error) {
        console.error("Unable to load unread counts.", {
          messagesError: messagesResult.error,
          notificationsError: notificationsResult.error,
        })
        return
      }
      setUnreadCounts({
        messages: messagesResult.count ?? 0,
        notifications: notificationsResult.count ?? 0,
      })
    }

    void loadUnreadCounts()
    const interval = window.setInterval(() => void loadUnreadCounts(), 30000)
    const channel = supabase
      .channel(`unread-counts-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => void loadUnreadCounts(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void loadUnreadCounts(),
      )
      .subscribe()

    return () => {
      active = false
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [profile.id])

  const navigate = (
    destination: string,
    options?: { openPayment?: boolean },
  ) => {
    setActiveNav(destination)
    setOpenPaymentOnLoad(
      destination === "Payments" && options?.openPayment === true,
    )
  }

  return (
    <div className="rent-app-shell flex h-dvh bg-brand-tertiary font-sans text-text-primary">
      <aside className="rent-sidebar fixed inset-y-0 left-0 flex shrink-0 flex-col border-r border-border-primary bg-surface-bg">
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
            <span className="min-w-0 truncate">{role} workspace</span>
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
              {[role].map((item) => (
                <Button
                  key={item}
                  size="small"
                  variant="subtle"
                  className="workspace-menu-item w-full justify-start bg-brand-muted text-brand-primary"
                  role="menuitemradio"
                  aria-checked
                  onClick={() => setWorkspaceMenuOpen(false)}
                >
                  <span className="flex-1 text-left">{item}</span>
                  <Check size={16} />
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
                item === "Messages"
                  ? unreadCounts.messages
                  : item === "Notifications"
                    ? unreadCounts.notifications
                    : 0
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
                  {count > 0 ? (
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
            onClick={() => void onLogout()}
          >
            <LogOut size={18} />
            Log out
          </Button>
        </div>
      </aside>

      <div className="rent-workspace flex min-w-0 flex-1 flex-col">
        <header className="rent-topbar flex shrink-0 items-center gap-lg border-b border-border-primary bg-surface-bg px-xl py-md lg:px-2xl">
          <div className="rent-global-search flex h-10 items-center gap-2 rounded-full bg-surface-bg px-5">
            <Search size={16} className="shrink-0 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search properties, requests, or anything..."
              aria-label="Search RentEase"
              className="w-full bg-transparent text-input-sm text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>

          <div className="flex-1" />

          <div className="rent-notification">
            <IconButton
              variant="subtle"
              icon={<Bell size={20} />}
              aria-label={`Open notifications, ${unreadCounts.notifications} unread`}
              onClick={() => {
                if (navigation.includes("Notifications")) {
                  navigate("Notifications")
                }
              }}
            />
            {unreadCounts.notifications > 0 ? (
              <div className="rent-notification-badge" aria-hidden="true">
                {unreadCounts.notifications}
              </div>
            ) : null}
          </div>

          <div className="rent-profile flex items-center gap-md border-l border-border-secondary pl-lg">
            <Avatar
              type="initial"
              size="medium"
              initials={profile.full_name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            />
            <div>
              <div className="rent-profile-name text-label-sm text-text-primary">
                {profile.full_name}
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
            <TenantDashboard onNavigate={navigate} tenantId={profile.id} />
          ) : null}
          {role === "Tenant" && activeNav === "Search Properties" ? (
            <PropertySearch
              onApply={(propertyId) => {
                setApplicationPropertyId(propertyId)
                setActiveNav("Apply to Rent")
              }}
            />
          ) : null}
          {role === "Tenant" && activeNav === "My Applications" ? (
            <TenantApplications tenantId={profile.id} />
          ) : null}
          {role === "Tenant" && activeNav === "Apply to Rent" ? (
            <TenantApplications
              tenantId={profile.id}
              initialPropertyId={applicationPropertyId}
              initialView="apply"
            />
          ) : null}
          {role === "Tenant" && activeNav === "Agreement" ? (
            <AgreementScreen role="Tenant" userId={profile.id} />
          ) : null}
          {role === "Tenant" && activeNav === "Payments" ? (
            <TenantPayments
              tenantId={profile.id}
              initialOpen={openPaymentOnLoad}
            />
          ) : null}
          {role === "Tenant" && activeNav === "Maintenance" ? (
            <TenantMaintenance />
          ) : null}
          {role === "Tenant" && activeNav === "Complaints" ? (
            <ComplaintsScreen role="Tenant" />
          ) : null}
          {role === "Tenant" && activeNav === "Messages" ? (
            <MessagesScreen role="Tenant" userId={profile.id} />
          ) : null}
          {role === "Tenant" && activeNav === "Notifications" ? (
            <NotificationsScreen role="Tenant" />
          ) : null}
          {role === "Tenant" && activeNav === "Reviews" ? (
            <ReviewsScreen userId={profile.id} />
          ) : null}
          {activeNav === "Profile" ? (
            <ProfileScreen
              profile={profile}
              role={role}
              onProfileUpdated={onProfileUpdated}
            />
          ) : null}
          {role === "Owner" && activeNav === "Dashboard" ? (
            <OwnerDashboard ownerId={profile.id} />
          ) : null}
          {role === "Owner" && activeNav === "My Properties" ? (
            <OwnerProperties ownerId={profile.id} />
          ) : null}
          {role === "Owner" && activeNav === "Applications" ? (
            <OwnerApplications ownerId={profile.id} />
          ) : null}
          {role === "Owner" && activeNav === "Agreements" ? (
            <AgreementScreen role="Owner" userId={profile.id} />
          ) : null}
          {role === "Owner" && activeNav === "Rent Tracking" ? (
            <OwnerRentTracking ownerId={profile.id} />
          ) : null}
          {role === "Owner" && activeNav === "Maintenance" ? (
            <OwnerMaintenance />
          ) : null}
          {role === "Owner" && activeNav === "Messages" ? (
            <MessagesScreen role="Owner" userId={profile.id} />
          ) : null}
          {role === "Owner" && activeNav === "Notifications" ? (
            <NotificationsScreen role="Owner" />
          ) : null}
          {role === "Owner" && activeNav === "Reviews" ? (
            <ReviewsScreen userId={profile.id} role="Owner" />
          ) : null}
          {role === "Owner" && activeNav === "Reports" ? (
            <AdminReports scope="Owner" ownerId={profile.id} />
          ) : null}
          {role === "Admin" && activeNav === "Dashboard" ? (
            <AdminDashboard adminId={profile.id} />
          ) : null}
          {role === "Admin" && activeNav === "Property Verification" ? (
            <AdminDashboard adminId={profile.id} queueOnly />
          ) : null}
          {role === "Admin" && activeNav === "Complaints" ? (
            <ComplaintsScreen role="Admin" />
          ) : null}
          {role === "Admin" && activeNav === "Notifications" ? (
            <NotificationsScreen role="Admin" />
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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState<AuthMessage>(null)

  const loadProfile = async (userId: string) => {
    const profileFields =
      "id, full_name, email, phone, address, city, area, avatar_url, role, status"
    const { data, error } = await supabase
      .from("profiles")
      .select(profileFields)
      .eq("id", userId)
      .single()

    if (error && error.code !== "42703") {
      throw new Error(`Unable to load your profile: ${error.message}`)
    }

    let loadedProfile = data
    if (!error && !loadedProfile) {
      throw new Error("Unable to load your profile: profile record not found.")
    }
    if (error?.code === "42703") {
      const fallback = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, status")
        .eq("id", userId)
        .single()

      if (fallback.error) {
        throw new Error(`Unable to load your profile: ${fallback.error.message}`)
      }
      loadedProfile = {
        ...fallback.data,
        address: null,
        city: null,
        area: null,
        avatar_url: null,
      }
    }

    if (!loadedProfile) {
      throw new Error("Unable to load your profile: profile record not found.")
    }
    if (loadedProfile.status !== "active") {
      throw new Error("Your RentEase account is not active.")
    }
    setProfile(loadedProfile as Profile)
    setView("workspace")
  }

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        if (active) {
          setAuthMessage({ type: "error", text: error.message })
          setAuthLoading(false)
        }
        return
      }

      if (data.session) {
        try {
          await loadProfile(data.session.user.id)
        } catch (error) {
          await supabase.auth.signOut()
          if (active) {
            setAuthMessage({
              type: "error",
              text:
                error instanceof Error
                  ? error.message
                  : "Unable to load your profile.",
            })
          }
        }
      }
      if (active) setAuthLoading(false)
    }

    void restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === "SIGNED_OUT" || !session) {
        setProfile(null)
        setView("login")
        setAuthLoading(false)
        return
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setAuthLoading(true)
        window.setTimeout(() => {
          if (!active) return
          void loadProfile(session.user.id)
            .catch(async (error) => {
              if (!active) return
              setProfile(null)
              setView("login")
              setAuthMessage({
                type: "error",
                text:
                  error instanceof Error
                    ? error.message
                    : "Unable to load your profile.",
              })
              await supabase.auth.signOut()
            })
            .finally(() => {
              if (active) setAuthLoading(false)
            })
        }, 0)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(formatAuthError(error.message))
    if (!data.session)
      throw new Error("Your email must be confirmed before logging in.")
    if (!data.user)
      throw new Error("Login succeeded but the user session is unavailable.")
    if (!data.user)
      throw new Error(
        "Account was created but the user session is unavailable.",
      )
    await loadProfile(data.user.id)
  }

  const register = async (
    role: RegistrationRole,
    fullName: string,
    email: string,
    phone: string,
    password: string,
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role: role.toLowerCase() },
      },
    })
    if (error) throw new Error(formatAuthError(error.message))
    if (!data.session) {
      setAuthMessage({
        type: "success",
        text: "Account created. Check your email to confirm your account.",
      })
      return false
    }
    if (!data.user)
      throw new Error(
        "Account was created but the user session is unavailable.",
      )
    await loadProfile(data.user.id)
    return true
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) setAuthMessage({ type: "error", text: error.message })
  }

  if (authLoading) {
    return (
      <ThemeProvider>
        <div className="flex min-h-dvh items-center justify-center bg-brand-tertiary font-sans text-text-secondary">
          Loading your RentEase session...
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      {view === "workspace" && profile ? (
        <RentEaseShell
          profile={profile}
          onLogout={logout}
          onProfileUpdated={setProfile}
        />
      ) : (
        <AuthScreen
          view={view === "workspace" ? "login" : view}
          onChangeView={(nextView) => setView(nextView)}
          onLogin={login}
          onRegister={register}
        />
      )}
      {authMessage ? (
        <div className="fixed bottom-xl left-1/2 z-50 -translate-x-1/2 rounded-corner-md bg-surface-bg px-xl py-lg text-label-sm shadow-lg">
          {authMessage.text}
        </div>
      ) : null}
    </ThemeProvider>
  )
}
