import { ArrowRight, CheckCircle2, Clock3, HandHeart, HeartHandshake, Lock, PackageCheck, ShieldCheck, Sparkles, Truck, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";

type RoleOption = "donor" | "organization" | "volunteer" | "admin";

const demoAccounts: Array<{ role: RoleOption; title: string; subtitle: string; email: string; icon: typeof HandHeart; badgeColor: string }> = [
  {
    role: "donor",
    title: "Artisan Bakery & Cafe",
    subtitle: "Active Donor sharing fresh sourdough & breakfast pastries",
    email: "bakery@foodshare.local",
    icon: HandHeart,
    badgeColor: "apricot",
  },
  {
    role: "organization",
    title: "Hope Community Kitchen",
    subtitle: "Local NGO receiving dinner meal trays & vegetable stews",
    email: "hope@foodshare.local",
    icon: UsersRound,
    badgeColor: "blue",
  },
  {
    role: "volunteer",
    title: "Alex Rivera",
    subtitle: "Cargo bike volunteer courier ready for downtown pickups",
    email: "alex@foodshare.local",
    icon: Truck,
    badgeColor: "green",
  },
  {
    role: "admin",
    title: "FoodShare Admin",
    subtitle: "Platform management & real-time delivery activity logs",
    email: "admin@foodshare.local",
    icon: ShieldCheck,
    badgeColor: "dark",
  },
];

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleOption>("donor");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get returnUrl from search params if present
  const returnUrl = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("returnUrl") || "/app"
    : "/app";

  const executeLogin = async (loginEmail?: string, loginRole?: RoleOption, isDemo = false) => {
    setLoading(true);
    setError(null);
    const targetEmail = loginEmail !== undefined ? loginEmail : email.trim();
    const targetRole = loginRole || selectedRole;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail || undefined,
          name: targetEmail && !targetEmail.includes("@") ? targetEmail : undefined,
          role: targetRole,
          isDemo,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to sign in. Please verify your details.");
      }

      // Preview auto-login token fallback
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.sessionToken}`);
      } catch {}

      await utils.auth.me.invalidate();
      await utils.profile.mine.invalidate();
      navigate(returnUrl);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(undefined, undefined, false);
  };

  const handleQuickDemoClick = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setSelectedRole(account.role);
    executeLogin(account.email, account.role, true);
  };

  return (
    <div className="public-page login-page-wrapper">
      {/* Header */}
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" className="brand-mark">
            <span className="brand-loop"><span /></span>
            <span className="brand-name">Food<span>Share</span></span>
          </Link>
          <div className="header-actions">
            <span className="login-header-text">New to FoodShare?</span>
            <Link href="/register" className="button button-apricot button-small">
              Create an Account <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="shell login-main">
        <div className="login-grid">
          {/* Left Column: Mission & Trust Banner */}
          <div className="login-story-column">
            <div className="login-story-card">
              <div className="login-story-top">
                <p className="eyebrow"><span className="eyebrow-dot" /> Welcome Back</p>
                <h1>Good food belongs on <em>a next table.</em></h1>
                <p className="login-story-text">
                  Sign in to track active food donations, coordinate with nearby organizations, and complete verified handoffs before the expiry window closes.
                </p>
              </div>

              <div className="login-metrics-box">
                <div className="login-metric">
                  <Clock3 size={20} className="metric-icon" />
                  <div>
                    <strong>Real-Time Windows</strong>
                    <span>Transparent timing countdowns</span>
                  </div>
                </div>
                <div className="login-metric">
                  <PackageCheck size={20} className="metric-icon" />
                  <div>
                    <strong>Verified Receipts</strong>
                    <span>Transparent delivery confirmations</span>
                  </div>
                </div>
                <div className="login-metric">
                  <ShieldCheck size={20} className="metric-icon" />
                  <div>
                    <strong>Zero Platform Fees</strong>
                    <span>Nonprofit community redistribution</span>
                  </div>
                </div>
              </div>

              <div className="login-story-foot">
                <p><CheckCircle2 size={15} /> Your account keeps donation records secure and visible to approved partners.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Form & Quick Access */}
          <div className="login-card-column">
            <div className="login-form-card">
              <div className="login-card-heading">
                <h2>Sign in to your account</h2>
                <p>Sign in with your name or email, or select a community account.</p>
              </div>

              {error && (
                <div className="login-error-banner">
                  {error}
                </div>
              )}

              {/* Standard Login Form */}
              <form onSubmit={handleSubmit} className="login-form">
                <label className="field-label">
                  Your Name or Email Address
                  <input
                    required
                    type="text"
                    placeholder="e.g. Hareesh or contact@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                  />
                </label>

                <div className="login-role-selector">
                  <span className="field-label" style={{ marginBottom: "6px" }}>
                    Sign in as role:
                  </span>
                  <div className="login-role-pills">
                    {(["donor", "organization", "volunteer", "admin"] as RoleOption[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        className={`login-role-pill ${selectedRole === r ? "selected" : ""}`}
                        onClick={() => setSelectedRole(r)}
                      >
                        {r === "donor" ? "Donor" : r === "organization" ? "NGO / Kitchen" : r === "volunteer" ? "Volunteer" : "Admin"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="login-options-row">
                  <label className="remember-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                    />
                    <span>Keep me signed in</span>
                  </label>
                  <Link href="/register" className="forgot-link">
                    Need new role profile?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="button button-dark button-large full-width"
                >
                  {loading ? "Signing you in…" : "Sign In to FoodShare"} <ArrowRight size={17} />
                </button>
              </form>

              {/* Divider */}
              <div className="login-divider">
                <span>or test with sample persona accounts</span>
              </div>

              <p style={{ fontSize: "12px", color: "var(--color-ink-muted)", textAlign: "center", marginBottom: "12px", lineHeight: "1.4" }}>
                <em>Note: Demo tiles sign in with sample business names (e.g. "Artisan Bakery"). To display your own real name, enter it in the form above.</em>
              </p>

              {/* Quick One-Click Demo Accounts */}
              <div className="quick-demo-accounts-grid">
                {demoAccounts.map(account => {
                  const Icon = account.icon;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickDemoClick(account)}
                      className={`demo-account-tile demo-badge-${account.badgeColor}`}
                    >
                      <div className="demo-account-icon">
                        <Icon size={18} />
                      </div>
                      <div className="demo-account-text">
                        <strong>Sample {account.role === "donor" ? "Donor" : account.role === "organization" ? "NGO" : account.role === "volunteer" ? "Courier" : "Admin"}: {account.title}</strong>
                        <span>{account.subtitle}</span>
                      </div>
                      <ArrowRight size={14} className="demo-arrow" />
                    </button>
                  );
                })}
              </div>

              {/* Bottom Registration Hint */}
              <div className="login-card-foot">
                <p>
                  Don't have an account yet?{" "}
                  <Link href="/register" className="register-inline-link">
                    Register here <ArrowRight size={13} />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="shell footer-inner">
          <Link href="/" className="brand-mark">
            <span className="brand-loop"><span /></span>
            <span className="brand-name">Food<span>Share</span></span>
          </Link>
          <span>Share surplus food. Support your community.</span>
          <div>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/register">Register</Link>
            <Link href="/">Home</Link>
            <span>© 2026 FoodShare</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
