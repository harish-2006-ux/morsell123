import { ArrowRight, CheckCircle2, HandHeart, HeartHandshake, MapPin, PackageCheck, ShieldCheck, Sparkles, Truck, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";

type RoleOption = "donor" | "organization" | "volunteer";

const rolesConfig: Record<RoleOption, { title: string; subtitle: string; icon: typeof HandHeart; badge: string; exampleName: string; capacityLabel: string }> = {
  donor: {
    title: "Food Donor",
    subtitle: "Bakeries, restaurants, grocers, caterers & individuals sharing extra food.",
    icon: HandHeart,
    badge: "Share Surplus",
    exampleName: "e.g. Golden Crust Bakery or Metro Bistro",
    capacityLabel: "Estimated weekly surplus servings",
  },
  organization: {
    title: "Receiving NGO",
    subtitle: "Community pantries, soup kitchens, shelters & relief charities.",
    icon: UsersRound,
    badge: "Receive Food",
    exampleName: "e.g. Hope Community Kitchen or Downtown Shelter",
    capacityLabel: "Estimated meal receiving capacity per week",
  },
  volunteer: {
    title: "Volunteer Courier",
    subtitle: "Local delivery helpers transporting food safely between neighbors.",
    icon: Truck,
    badge: "Deliver & Help",
    exampleName: "e.g. Alex Rivera or Sarah Jenkins",
    capacityLabel: "Deliveries you can take per week",
  },
};

export default function Register() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [role, setRole] = useState<RoleOption>("donor");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    serviceArea: "",
    capacity: "",
    availability: "Daily 8am - 7pm",
    transportMode: "Car / Van",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please provide your name or organization name.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          serviceArea: formData.serviceArea.trim() || undefined,
          capacity: formData.capacity ? Number(formData.capacity) : undefined,
          availability: formData.availability.trim() || undefined,
          transportMode: role !== "donor" ? formData.transportMode.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create account.");
      }

      // Store preview fallback cookie
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.sessionToken}`);
      } catch {}

      await utils.auth.me.invalidate();
      await utils.profile.mine.invalidate();
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: RoleOption) => {
    window.location.href = `/api/auth/dev-login?role=${demoRole}&returnUrl=/app`;
  };

  const currentRole = rolesConfig[role];
  const IconComponent = currentRole.icon;

  return (
    <div className="public-page register-page-wrapper">
      {/* Header */}
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" className="brand-mark">
            <span className="brand-loop"><span /></span>
            <span className="brand-name">Food<span>Share</span></span>
          </Link>
          <div className="header-actions">
            <span className="register-header-text">Already registered?</span>
            <Link href="/login" className="button button-outline button-small">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="shell register-main">
        <div className="register-grid">
          {/* Left Column: Context & Proof */}
          <div className="register-sidebar">
            <p className="eyebrow"><span className="eyebrow-dot" /> Join the food redistribution network</p>
            <h1>Create your <em>FoodShare</em> account.</h1>
            <p className="register-lede">
              Connect surplus food directly with organizations and volunteer couriers to make sure good food never goes to waste.
            </p>

            <div className="register-benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon"><CheckCircle2 size={18} /></span>
                <div>
                  <strong>Clear Expiry Windows</strong>
                  <p>Smart timing notifications so food is collected while fresh.</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><PackageCheck size={18} /></span>
                <div>
                  <strong>Verified Trust Receipts</strong>
                  <p>Every handoff generates a permanent confirmation code for transparency.</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon"><ShieldCheck size={18} /></span>
                <div>
                  <strong>100% Free &amp; Community-Powered</strong>
                  <p>No platform fees or hidden subscriptions for donors or charities.</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Login Box */}
            <div className="quick-demo-box">
              <div className="quick-demo-head">
                <Sparkles size={16} />
                <strong>Need instant testing?</strong>
              </div>
              <p>Skip form filling and explore pre-populated workspaces:</p>
              <div className="quick-demo-buttons">
                <button type="button" className="button button-ghost button-small" onClick={() => handleQuickDemo("donor")}>
                  Bakery (Donor)
                </button>
                <button type="button" className="button button-ghost button-small" onClick={() => handleQuickDemo("organization")}>
                  Kitchen (NGO)
                </button>
                <button type="button" className="button button-ghost button-small" onClick={() => handleQuickDemo("volunteer")}>
                  Alex (Volunteer)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="register-card">
            <div className="role-selector-header">
              <span className="register-step-badge">Step 1 of 2</span>
              <h2>Select your primary role</h2>
            </div>

            {/* Role Cards */}
            <div className="register-role-grid">
              {(Object.keys(rolesConfig) as RoleOption[]).map(r => {
                const cfg = rolesConfig[r];
                const Icon = cfg.icon;
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    className={`role-select-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setRole(r)}
                  >
                    <div className="role-select-top">
                      <span className={`role-badge-pill role-badge-${r}`}>
                        <Icon size={14} /> {cfg.badge}
                      </span>
                      {isSelected && <span className="role-selected-check">✓</span>}
                    </div>
                    <strong>{cfg.title}</strong>
                    <span>{cfg.subtitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="register-form">
              <div className="role-selector-header" style={{ marginTop: "24px" }}>
                <span className="register-step-badge">Step 2 of 2</span>
                <h2>Your profile details</h2>
              </div>

              {error && (
                <div className="register-error-banner">
                  {error}
                </div>
              )}

              <div className="field-grid two-col">
                <label className="field-label">
                  {role === "donor" ? "Organization / Bakery / Store Name" : role === "organization" ? "NGO / Kitchen Name" : "Your Full Name"}
                  <input
                    required
                    type="text"
                    placeholder={currentRole.exampleName}
                    value={formData.name}
                    onChange={e => update("name", e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Email Address
                  <input
                    type="email"
                    placeholder="contact@example.org"
                    value={formData.email}
                    onChange={e => update("email", e.target.value)}
                  />
                </label>
              </div>

              <div className="field-grid two-col">
                <label className="field-label">
                  Phone Number
                  <span className="label-optional">For dispatch</span>
                  <input
                    type="tel"
                    placeholder="555-0144"
                    value={formData.phone}
                    onChange={e => update("phone", e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Service Area / District
                  <input
                    type="text"
                    placeholder="e.g. Downtown Metro & Central East"
                    value={formData.serviceArea}
                    onChange={e => update("serviceArea", e.target.value)}
                  />
                </label>
              </div>

              <div className="field-grid two-col">
                <label className="field-label">
                  {currentRole.capacityLabel}
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={formData.capacity}
                    onChange={e => update("capacity", e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Operating / Availability Hours
                  <input
                    type="text"
                    placeholder="e.g. Weekdays 8am - 6pm"
                    value={formData.availability}
                    onChange={e => update("availability", e.target.value)}
                  />
                </label>
              </div>

              {role !== "donor" && (
                <label className="field-label">
                  Transport Method
                  <select
                    value={formData.transportMode}
                    onChange={e => update("transportMode", e.target.value)}
                  >
                    <option value="Car / Van">Personal Car or Delivery Van</option>
                    <option value="Bicycle / Cargo Bike">Bicycle / Cargo Bike</option>
                    <option value="Public Transit / Walking">Public Transit / Foot</option>
                    <option value="Refrigerated Truck">Refrigerated Truck</option>
                  </select>
                </label>
              )}

              <div className="register-submit-box">
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="button button-apricot button-large full-width"
                >
                  {loading ? "Creating your account…" : "Complete Registration"} <ArrowRight size={17} />
                </button>
                <p className="register-terms-note">
                  <ShieldCheck size={14} /> By registering, you join a trusted community dedicated to reducing food waste and supporting local neighbors.
                </p>
              </div>
            </form>
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
            <Link href="/">Home</Link>
            <span>© 2026 FoodShare</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
