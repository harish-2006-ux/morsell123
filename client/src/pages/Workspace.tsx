import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HandHeart,
  HeartHandshake,
  LogOut,
  PackagePlus,
  RefreshCw,
  Sparkles,
  Truck,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SignInPrompt from "@/components/SignInPrompt";

const roleCopy = {
  donor: { title: "Donor", copy: "Add surplus food and track its donation status." },
  organization: { title: "NGO / Organization", copy: "View available food and coordinate acceptance." },
  volunteer: { title: "Volunteer", copy: "Manage pickup, delivery, and status updates." },
} as const;

function ChangeDetailsModal({
  isOpen,
  currentName,
  currentProfile,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  currentName: string;
  currentProfile?: {
    role: "donor" | "organization" | "volunteer" | string;
    displayName: string;
    phone?: string | null;
    serviceArea?: string | null;
    capacity?: number | null;
    availability?: string | null;
    transportMode?: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(currentName || currentProfile?.displayName || "");
  const [phone, setPhone] = useState(currentProfile?.phone || "");
  const [serviceArea, setServiceArea] = useState(currentProfile?.serviceArea || "");
  const [capacity, setCapacity] = useState(currentProfile?.capacity ? String(currentProfile.capacity) : "");
  const [availability, setAvailability] = useState(currentProfile?.availability || "");
  const [transportMode, setTransportMode] = useState(currentProfile?.transportMode || "car");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName || currentProfile?.displayName || "");
      setPhone(currentProfile?.phone || "");
      setServiceArea(currentProfile?.serviceArea || "");
      setCapacity(currentProfile?.capacity ? String(currentProfile.capacity) : "");
      setAvailability(currentProfile?.availability || "");
      setTransportMode(currentProfile?.transportMode || "car");
      setError(null);
    }
  }, [isOpen, currentName, currentProfile]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      setError("Please enter a name with at least 2 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clean,
          phone: phone.trim() || null,
          serviceArea: serviceArea.trim() || null,
          capacity: capacity.trim() ? Number(capacity) : null,
          availability: availability.trim() || null,
          transportMode: transportMode || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update details.");
      }
      toast.success(`Name and details saved successfully!`);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="details-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <p className="eyebrow" style={{ marginBottom: "2px" }}>Account Settings</p>
            <h3>Change Name & Edit Details</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: "13.5px", color: "var(--color-ink-muted)", marginBottom: "14px", lineHeight: "1.45" }}>
          Update your account name, contact number, and operational details for deliveries and donation listings.
        </p>
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSave}>
          <label className="field-label" style={{ marginBottom: "12px" }}>
            Your Name / Organization Name <span style={{ color: "#ef4444" }}>*</span>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Harish or Green Roots Cafe"
            />
            <span style={{ fontSize: "11.5px", color: "var(--color-ink-muted)", marginTop: "4px" }}>
              Visible across all donations, collection requests, and handover receipts.
            </span>
          </label>

          <div className="details-form-row" style={{ marginBottom: "12px" }}>
            <label className="field-label">
              Contact Phone <span className="label-optional">Optional</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
              />
            </label>
            <label className="field-label">
              Service Area / Neighborhood <span className="label-optional">Optional</span>
              <input
                type="text"
                value={serviceArea}
                onChange={e => setServiceArea(e.target.value)}
                placeholder="e.g. Downtown Metro, Sector 4"
              />
            </label>
          </div>

          {currentProfile?.role === "volunteer" && (
            <div className="details-form-row" style={{ marginBottom: "12px" }}>
              <label className="field-label">
                Transport Mode
                <select value={transportMode} onChange={e => setTransportMode(e.target.value)}>
                  <option value="walking">Walking / Public Transit</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="motorbike">Scooter / Motorbike</option>
                  <option value="car">Car / Sedan</option>
                  <option value="van">Van / Cargo Vehicle</option>
                </select>
              </label>
              <label className="field-label">
                Courier Availability <span className="label-optional">Optional</span>
                <input
                  type="text"
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  placeholder="e.g. Weekdays 9 AM - 5 PM"
                />
              </label>
            </div>
          )}

          {currentProfile?.role === "organization" && (
            <div className="details-form-row" style={{ marginBottom: "12px" }}>
              <label className="field-label">
                Daily Capacity (Meals/day) <span className="label-optional">Optional</span>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  placeholder="e.g. 150"
                />
              </label>
              <label className="field-label">
                Operating Hours <span className="label-optional">Optional</span>
                <input
                  type="text"
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  placeholder="e.g. Mon-Sat 8 AM - 8 PM"
                />
              </label>
            </div>
          )}

          {currentProfile?.role === "donor" && (
            <label className="field-label" style={{ marginBottom: "12px" }}>
              Surplus Pickup Hours / Notes <span className="label-optional">Optional</span>
              <input
                type="text"
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                placeholder="e.g. Daily after 5 PM, or contact directly"
              />
            </label>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="button" className="button button-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="button button-dark" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BrandBar({
  user,
  activeRole,
  onLogout,
  onOpenChangeDetails,
  onSwitchRole,
}: {
  user: { name?: string | null; role?: string } | null;
  activeRole?: string;
  onLogout: () => void;
  onOpenChangeDetails: () => void;
  onSwitchRole: (role: "donor" | "organization" | "volunteer") => void;
}) {
  const currentRole = activeRole || (user?.role === "admin" ? "admin" : "donor");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="app-header">
      <div className="shell app-header-inner">
        <Link href="/" className="brand-mark">
          <span className="brand-loop"><span /></span>
          <span className="brand-name">Food<span>Share</span></span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div className="role-switcher">
            <button
              type="button"
              onClick={() => onSwitchRole("donor")}
              className={currentRole === "donor" ? "active" : ""}
              title="Switch to Donor role"
            >
              Donor
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole("organization")}
              className={currentRole === "organization" ? "active" : ""}
              title="Switch to NGO role"
            >
              NGO
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole("volunteer")}
              className={currentRole === "volunteer" ? "active" : ""}
              title="Switch to Volunteer role"
            >
              Volunteer
            </button>
            {user?.role === "admin" && (
              <button
                type="button"
                className={currentRole === "admin" ? "active" : ""}
                title="Admin dashboard"
              >
                Admin
              </button>
            )}
          </div>

          <div className="app-user-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              className={`app-user-box ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Account & profile settings"
            >
              <span className="user-avatar">{user?.name?.slice(0, 1).toUpperCase() || "U"}</span>
              <span className="user-name" title={user?.name || ""}>
                {user?.name || "Your workspace"}
              </span>
              <span className="app-user-role-badge">
                {currentRole === "organization" ? "NGO" : currentRole}
              </span>
              <ChevronDown size={14} className="user-box-chevron" />
            </button>

            {menuOpen && (
              <div className="app-user-dropdown" role="menu">
                <div className="dropdown-user-header">
                  <span className="user-avatar" style={{ width: "34px", height: "34px", fontSize: "13px" }}>
                    {user?.name?.slice(0, 1).toUpperCase() || "U"}
                  </span>
                  <div className="dropdown-user-info">
                    <span className="dropdown-user-name">{user?.name || "Member"}</span>
                    <span className="dropdown-user-email">
                      {user?.role === "admin" ? "Administrator" : `Role: ${currentRole.toUpperCase()}`}
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-item dropdown-item-highlight"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenChangeDetails();
                  }}
                >
                  <UserCog size={16} />
                  <span>Change and edit details</span>
                </button>

                <div className="dropdown-divider" />
                <div className="dropdown-section-label">Switch Role</div>

                <button
                  type="button"
                  className={`dropdown-item ${currentRole === "donor" ? "font-bold" : ""}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onSwitchRole("donor");
                  }}
                >
                  <HandHeart size={15} />
                  <span>Donor Dashboard</span>
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${currentRole === "organization" ? "font-bold" : ""}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onSwitchRole("organization");
                  }}
                >
                  <UsersRound size={15} />
                  <span>NGO Dashboard</span>
                </button>
                <button
                  type="button"
                  className={`dropdown-item ${currentRole === "volunteer" ? "font-bold" : ""}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onSwitchRole("volunteer");
                  }}
                >
                  <Truck size={15} />
                  <span>Volunteer Courier</span>
                </button>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-item dropdown-item-danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function RoleSetup({ onSaved }: { onSaved: () => void }) {
  const [role, setRole] = useState<"donor" | "organization" | "volunteer">("donor");
  const [displayName, setDisplayName] = useState("");
  const save = trpc.profile.save.useMutation({ onSuccess: onSaved });
  return <div className="setup-card"><div className="setup-icon"><HeartHandshake size={25} /></div><p className="eyebrow">Your role in the platform</p><h1>Which role describes you?</h1><p>Choose one starting role. You can add another way to help later.</p><div className="role-picker">{(Object.keys(roleCopy) as Array<keyof typeof roleCopy>).map(option => <button key={option} className={role === option ? "role-choice selected" : "role-choice"} onClick={() => setRole(option)}><span className="choice-check">{role === option ? "✓" : ""}</span><strong>{roleCopy[option].title}</strong><span>{roleCopy[option].copy}</span></button>)}</div><label className="field-label">What should we call you?<input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Your name or organization" /></label><button className="button button-dark button-large full-width" disabled={!displayName.trim() || save.isPending} onClick={() => save.mutate({ role, displayName: displayName.trim() })}>{save.isPending ? "Saving…" : "Enter my dashboard"}<ArrowRight size={18} /></button>{save.error && <p className="form-error">Something went wrong. Please try again.</p>}</div>;
}

function EmptyState({ icon: Icon, title, copy, action }: { icon: typeof Bell; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-orbit"><Icon size={21} /></span><h3>{title}</h3><p>{copy}</p>{action}</div>;
}

function DonorWorkspace() {
  const [, navigate] = useLocation();
  const offersQuery = trpc.donor.offers.useQuery();
  return <div className="workspace-content"><div className="workspace-heading"><div><p className="eyebrow">Donor Dashboard</p><h1>Keep good food <em>in motion.</em></h1><p>Share the details. the platform will keep the next step visible.</p></div><button className="button button-apricot" onClick={() => navigate("/share")}><PackagePlus size={17} /> Add food donation</button></div><div className="workspace-stat-row"><div><span>Active offers</span><strong>{offersQuery.data?.filter(item => !["completed", "cancelled", "expired"].includes(item.status)).length ?? 0}</strong></div><div><span>Completed deliverys</span><strong>{offersQuery.data?.filter(item => item.status === "completed").length ?? 0}</strong></div><div><span>Next reminder</span><strong>{offersQuery.data?.length ? "Check expiry time" : "—"}</strong></div></div><div className="section-title-row"><div><p className="eyebrow">Your food donations</p><h2>What you have shared</h2></div><button className="icon-button" onClick={() => offersQuery.refetch()}><RefreshCw size={17} /></button></div>{offersQuery.isLoading ? <div className="loading-line" /> : offersQuery.data?.length ? <div className="offer-list">{offersQuery.data.map(offer => <Link href={`/offers/${offer.id}`} className="offer-row" key={offer.id}><div className="offer-row-icon"><PackagePlus size={19} /></div><div className="offer-row-main"><strong>{offer.foodName}</strong><span>{offer.quantity} {offer.quantityUnit} · {offer.servings} servings · {offer.pickupAddress}</span></div><span className={`status-pill status-${offer.status}`}>{offer.status === "available" ? "Awaiting acceptance" : offer.status.replaceAll("_", " ")}</span><ArrowRight size={17} /></Link>)}</div> : <EmptyState icon={PackagePlus} title="Nothing shared yet" copy="Your first food donation can start here." action={<button className="button button-dark" onClick={() => navigate("/share")}>Add food donation <ArrowRight size={16} /></button>} />}</div>;
}

function OrganizationWorkspace() {
  const offersQuery = trpc.public.availableOffers.useQuery();
  const request = trpc.organization.requestOffer.useMutation({ onSuccess: () => offersQuery.refetch() });
  return <div className="workspace-content"><div className="workspace-heading"><div><p className="eyebrow">NGO Dashboard</p><h1>Find food for <em>your next table.</em></h1><p>Offers are ordered by their expiry time.</p></div><div className="workspace-heading-note"><Clock3 size={18} /><span>Urgent offers appear first</span></div></div><div className="section-title-row"><div><p className="eyebrow">Available nearby</p><h2>Offers waiting for a next step</h2></div><span className="count-badge">{offersQuery.data?.length ?? 0} available</span></div>{offersQuery.isLoading ? <div className="loading-line" /> : offersQuery.data?.length ? <div className="offer-grid">{offersQuery.data.map(offer => <article className="offer-card" key={offer.id}><div className="offer-card-top"><span className="offer-category">{offer.category}</span><span className="urgency-label"><Clock3 size={13} /> Check timing</span></div><h3>{offer.foodName}</h3><p className="offer-card-servings">{offer.servings} servings · {offer.quantity} {offer.quantityUnit}</p><p className="offer-location">{offer.pickupAddress}</p><div className="offer-card-bottom"><Link href={`/offers/${offer.id}`} className="inline-link">View details <ArrowRight size={15} /></Link><button className="button button-dark button-small" disabled={request.isPending} onClick={() => request.mutate({ offerId: offer.id })}>Request donation</button></div></article>)}</div> : <EmptyState icon={UsersRound} title="No matching offers nearby right now" copy="New offers will appear here when someone shares food." />}</div>;
}

function VolunteerWorkspace() {
  const offersQuery = trpc.public.availableOffers.useQuery();
  return (
    <div className="workspace-content">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Volunteer Dashboard</p>
          <h1>Manage food <em>deliveries.</em></h1>
          <p>Help transport surplus food from donors to local organizations.</p>
        </div>
        <div className="workspace-heading-note">
          <Clock3 size={18} />
          <span>Community courier network</span>
        </div>
      </div>
      <div className="workspace-stat-row">
        <div>
          <span>Available to transport</span>
          <strong>{offersQuery.data?.length ?? 0}</strong>
        </div>
        <div>
          <span>Your status</span>
          <strong>Active</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>On-call</strong>
        </div>
      </div>
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Nearby rescue opportunities</p>
          <h2>Food awaiting courier assistance</h2>
        </div>
        <span className="count-badge">{offersQuery.data?.length ?? 0} active</span>
      </div>
      {offersQuery.isLoading ? (
        <div className="loading-line" />
      ) : offersQuery.data?.length ? (
        <div className="offer-grid">
          {offersQuery.data.map(offer => (
            <article className="offer-card" key={offer.id}>
              <div className="offer-card-top">
                <span className="offer-category">{offer.category}</span>
                <span className="urgency-label"><Clock3 size={13} /> Ready now</span>
              </div>
              <h3>{offer.foodName}</h3>
              <p className="offer-card-servings">{offer.servings} servings · {offer.quantity} {offer.quantityUnit}</p>
              <p className="offer-location">{offer.pickupAddress}</p>
              <div className="offer-card-bottom">
                <Link href={`/offers/${offer.id}`} className="inline-link">
                  View route details <ArrowRight size={15} />
                </Link>
                <Link href={`/offers/${offer.id}`} className="button button-dark button-small">
                  View offer
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title="No delivery requests yet"
          copy="When a real pickup request is assigned to you, it will appear here."
          action={<button className="button button-dark">Set availability <ArrowRight size={16} /></button>}
        />
      )}
    </div>
  );
}

function AdminWorkspace() {
  const impact = trpc.admin.impact.useQuery();
  return <div className="workspace-content"><div className="workspace-heading"><div><p className="eyebrow">Admin Dashboard</p><h1>Monitor the <em>platform.</em></h1><p>Review donation, delivery, user, and system activity from real records.</p></div><span className="count-badge">Administrator</span></div><div className="workspace-stat-row"><div><span>Total donations</span><strong>{impact.data?.offers ?? 0}</strong></div><div><span>Completed deliveries</span><strong>{impact.data?.completed ?? 0}</strong></div><div><span>Food servings saved</span><strong>{impact.data?.servings ?? 0}</strong></div></div><div className="section-title-row"><div><p className="eyebrow">Administration modules</p><h2>System management</h2></div></div><div className="role-grid admin-module-grid"><div className="role-card role-blue"><span className="role-title">User management</span><span>Review registered donors, NGOs, volunteers, and administrators.</span></div><div className="role-card role-green"><span className="role-title">Donation management</span><span>Monitor available, accepted, delivered, and expired food donations.</span></div><div className="role-card role-apricot"><span className="role-title">Reports</span><span>Generate reports from actual donation and delivery records.</span></div></div></div>;
}
export default function Workspace() {
  const auth = useAuth();
  const utils = trpc.useUtils();
  const profileQuery = trpc.profile.mine.useQuery(undefined, { enabled: Boolean(auth.user) });
  const switchRole = trpc.profile.switchRole.useMutation({
    onSuccess: (data) => {
      utils.profile.mine.invalidate();
      toast.success(`Switched role to ${data.profile.role.toUpperCase()}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to switch role.");
    },
  });

  const [, navigate] = useLocation();
  const [isChangeDetailsOpen, setIsChangeDetailsOpen] = useState(false);
  const [dismissNotice, setDismissNotice] = useState(false);

  if (auth.loading) return <div className="center-page"><div className="loading-spinner" /></div>;
  if (!auth.user) return <SignInPrompt title="Open your dashboard." description="Sign in to share food, receive offers, or carry a delivery through to its destination." />;

  const activeRole = auth.user.role === "admin" ? "admin" : profileQuery.data?.role;
  const isDemoAccount =
    Boolean(auth.user.openId?.startsWith("demo-user")) ||
    ["Artisan Bakery & Cafe", "Hope Community Kitchen", "Alex Rivera", "FoodShare Admin"].includes(auth.user.name || "");

  const handleSwitchRole = (role: "donor" | "organization" | "volunteer") => {
    switchRole.mutate({ role });
  };

  const handleSavedName = async () => {
    await utils.auth.me.invalidate();
    await utils.profile.mine.invalidate();
  };

  return (
    <div className="app-page">
      <BrandBar
        user={auth.user}
        activeRole={activeRole}
        onLogout={() => auth.logout().then(() => navigate("/"))}
        onOpenChangeDetails={() => setIsChangeDetailsOpen(true)}
        onSwitchRole={handleSwitchRole}
      />
      <main className="shell app-main">
        {isDemoAccount && !dismissNotice && (
          <div className="demo-notice-banner">
            <div className="demo-notice-content">
              <span className="demo-notice-tag">Sample Account</span>
              <p>
                You are viewing this workspace under sample name: <strong>"{auth.user.name}"</strong>.
                Want to use your real name?
              </p>
            </div>
            <div className="demo-notice-actions">
              <button
                type="button"
                className="button button-small button-dark"
                onClick={() => setIsChangeDetailsOpen(true)}
              >
                <UserCog size={13} /> Change and edit details
              </button>
              <button
                type="button"
                className="button button-small button-ghost"
                onClick={() => auth.logout().then(() => navigate("/login"))}
              >
                Sign In as Yourself
              </button>
              <button
                type="button"
                className="icon-button"
                style={{ width: "24px", height: "24px" }}
                onClick={() => setDismissNotice(true)}
                title="Dismiss notice"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {auth.user.role === "admin" ? (
          <AdminWorkspace />
        ) : profileQuery.isLoading ? (
          <div className="center-page"><div className="loading-spinner" /></div>
        ) : !profileQuery.data ? (
          <RoleSetup onSaved={() => profileQuery.refetch()} />
        ) : profileQuery.data.role === "donor" ? (
          <DonorWorkspace />
        ) : profileQuery.data.role === "organization" ? (
          <OrganizationWorkspace />
        ) : (
          <VolunteerWorkspace />
        )}
      </main>

      <ChangeDetailsModal
        isOpen={isChangeDetailsOpen}
        currentName={auth.user.name || ""}
        currentProfile={profileQuery.data}
        onClose={() => setIsChangeDetailsOpen(false)}
        onSaved={handleSavedName}
      />
    </div>
  );
}
