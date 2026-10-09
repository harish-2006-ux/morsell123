import { ArrowRight, Bell, CheckCircle2, Clock3, HeartHandshake, LogOut, PackagePlus, RefreshCw, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SignInPrompt from "@/components/SignInPrompt";

const roleCopy = { donor: { title: "Donor", copy: "Add surplus food and track its donation status." }, organization: { title: "NGO / Organization", copy: "View available food and coordinate acceptance." }, volunteer: { title: "Volunteer", copy: "Manage pickup, delivery, and status updates." } } as const;

function BrandBar({ user, onLogout }: { user: { name?: string | null } | null; onLogout: () => void }) {
  return (
    <header className="app-header">
      <div className="shell app-header-inner">
        <Link href="/" className="brand-mark">
          <span className="brand-loop"><span /></span>
          <span className="brand-name">Food<span>Share</span></span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <a href="/api/auth/dev-login?role=donor&returnUrl=/app" className="button button-ghost button-small" title="Switch to Donor role">Donor</a>
            <a href="/api/auth/dev-login?role=organization&returnUrl=/app" className="button button-ghost button-small" title="Switch to NGO role">NGO</a>
            <a href="/api/auth/dev-login?role=volunteer&returnUrl=/app" className="button button-ghost button-small" title="Switch to Volunteer role">Volunteer</a>
            <a href="/api/auth/dev-login?role=admin&returnUrl=/app" className="button button-ghost button-small" title="Switch to Admin role">Admin</a>
          </div>
          <div className="app-user">
            <span className="user-avatar">{user?.name?.slice(0, 1).toUpperCase() || "M"}</span>
            <span className="user-name">{user?.name || "Your workspace"}</span>
            <button className="icon-button" onClick={onLogout} title="Sign out"><LogOut size={17} /></button>
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

function VolunteerWorkspace() { return <div className="workspace-content"><div className="workspace-heading"><div><p className="eyebrow">Volunteer Dashboard</p><h1>Manage food <em>deliveries.</em></h1><p>Pickup and delivery tasks will appear here when an organization assigns them.</p></div></div><EmptyState icon={UsersRound} title="No delivery requests yet" copy="When a real pickup request is assigned to you, it will appear here." action={<button className="button button-dark">Set availability <ArrowRight size={16} /></button>} /></div>; }

function AdminWorkspace() {
  const impact = trpc.admin.impact.useQuery();
  return <div className="workspace-content"><div className="workspace-heading"><div><p className="eyebrow">Admin Dashboard</p><h1>Monitor the <em>platform.</em></h1><p>Review donation, delivery, user, and system activity from real records.</p></div><span className="count-badge">Administrator</span></div><div className="workspace-stat-row"><div><span>Total donations</span><strong>{impact.data?.offers ?? 0}</strong></div><div><span>Completed deliveries</span><strong>{impact.data?.completed ?? 0}</strong></div><div><span>Food servings saved</span><strong>{impact.data?.servings ?? 0}</strong></div></div><div className="section-title-row"><div><p className="eyebrow">Administration modules</p><h2>System management</h2></div></div><div className="role-grid admin-module-grid"><div className="role-card role-blue"><span className="role-title">User management</span><span>Review registered donors, NGOs, volunteers, and administrators.</span></div><div className="role-card role-green"><span className="role-title">Donation management</span><span>Monitor available, accepted, delivered, and expired food donations.</span></div><div className="role-card role-apricot"><span className="role-title">Reports</span><span>Generate reports from actual donation and delivery records.</span></div></div></div>;
}
export default function Workspace() {
  const auth = useAuth();
  const profileQuery = trpc.profile.mine.useQuery(undefined, { enabled: Boolean(auth.user) });
  const [, navigate] = useLocation();
  if (auth.loading) return <div className="center-page"><div className="loading-spinner" /></div>;
  if (!auth.user) return <SignInPrompt title="Open your dashboard." description="Sign in to share food, receive offers, or carry a delivery through to its destination." />;
  return <div className="app-page"><BrandBar user={auth.user} onLogout={() => auth.logout().then(() => navigate("/"))} /><main className="shell app-main">{auth.user.role === "admin" ? <AdminWorkspace /> : profileQuery.isLoading ? <div className="center-page"><div className="loading-spinner" /></div> : !profileQuery.data ? <RoleSetup onSaved={() => profileQuery.refetch()} /> : profileQuery.data.role === "donor" ? <DonorWorkspace /> : profileQuery.data.role === "organization" ? <OrganizationWorkspace /> : <VolunteerWorkspace />}</main></div>;
}
