import { ArrowRight, Clock3, HandHeart, MapPin, Menu, MoveRight, PackageCheck, ShieldCheck, Sparkles, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-mark" aria-label="FoodShare home">
      <span className="brand-loop"><span /></span>
      {!compact && <span className="brand-name">Food<span>Share</span></span>}
    </Link>
  );
}

function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Logo />
        <nav className={open ? "desktop-nav nav-open" : "desktop-nav"}>
          <Link href="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
          <a href="#roles" onClick={() => setOpen(false)}>User roles</a>
          <a href="#impact" onClick={() => setOpen(false)}>Statistics</a>
        </nav>
        <div className="header-actions">
          <button className="text-button" onClick={() => startLogin()}>Sign in</button>
          <button className="button button-dark button-small" onClick={() => startLogin()}>Register / Sign in <ArrowRight size={15} /></button>
          <button className="icon-button mobile-menu" onClick={() => setOpen(value => !value)} aria-label="Open navigation">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function EmptyImpact() {
  return <span className="impact-empty">The first rescue is waiting to begin.</span>;
}

export default function Home() {
  const { data: impact } = trpc.public.impact.useQuery();
  const { data: offers } = trpc.public.availableOffers.useQuery();
  const hasImpact = Boolean(impact && impact.offers > 0);

  return (
    <div className="public-page">
      <PublicHeader />
      <main>
        <section className="hero-section">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" /> A community food redistribution platform</p>
              <h1>Share surplus food. <em>Support your community.</em></h1>
              <p className="hero-lede">FoodShare helps surplus food find a nearby next table before its expiry time.</p>
              <div className="hero-actions">
                <button className="button button-apricot button-large" onClick={() => startLogin()}>Donate food <ArrowRight size={18} /></button>
                <Link href="/how-it-works" className="button button-ghost button-large">See how it works <MoveRight size={18} /></Link>
              </div>
              <div className="hero-note"><ShieldCheck size={16} /> Every delivery is tracked. Every status is recorded.</div>
            </div>
            <div className="hero-visual" aria-label="Illustration of food pickup and delivery">
              <div className="visual-sun" />
              <div className="visual-card offer-card-float">
                <div className="mini-card-top"><span className="status-dot status-green" /> Food donation</div>
                <strong>Warm bread &amp; vegetable soup</strong>
                <div className="mini-card-meta"><Clock3 size={14} /> Needs pickup soon</div>
              </div>
              <div className="visual-path"><span /><span /><span /></div>
              <div className="visual-card receipt-card-float">
                <div className="receipt-stamp"><PackageCheck size={18} /></div>
                <div><span className="mini-label">Delivery record</span><strong>Delivery complete</strong></div>
              </div>
              <div className="visual-leaf leaf-one">✦</div>
              <div className="visual-leaf leaf-two">✦</div>
              <div className="visual-bowl"><div className="bowl-fill" /><div className="bowl-rim" /></div>
            </div>
          </div>
        </section>

        <section className="proof-strip" id="impact">
          <div className="shell proof-grid">
            <div className="proof-intro"><span className="proof-kicker">Platform activity</span><p>We make the next step easy to see — and easier to take.</p></div>
            <div className="proof-stat"><strong>{hasImpact ? impact?.offers : "—"}</strong><span>{hasImpact ? "food donations shared" : <EmptyImpact />}</span></div>
            <div className="proof-stat"><strong>{hasImpact ? impact?.servings : "—"}</strong><span>{hasImpact ? "servings confirmed" : <EmptyImpact />}</span></div>
            <div className="proof-stat"><strong>{hasImpact ? impact?.completed : "—"}</strong><span>{hasImpact ? "deliveries completed" : <EmptyImpact />}</span></div>
          </div>
        </section>

        <section className="section-pad story-section">
          <div className="shell story-grid">
            <div className="section-heading"><p className="eyebrow">Meet the Expiry Window</p><h2>Timing matters. <em>Clarity matters more.</em></h2></div>
            <div className="story-copy"><p>Every offer gets a simple, honest window between “ready to share” and “best before.” FoodShare turns that window into a calm next step — not a countdown to panic.</p><Link href="/how-it-works" className="inline-link">Learn the rhythm <ArrowRight size={16} /></Link></div>
          </div>
          <div className="shell window-demo">
            <div className="window-label"><span>Expiry Window</span><strong>What needs attention?</strong></div>
            <div className="window-track"><span className="window-fill" /><span className="window-pin" /></div>
            <div className="window-legend"><span><i className="legend-dot green" /> Comfortable window</span><span><i className="legend-dot apricot" /> Plan soon</span><span><i className="legend-dot coral" /> Collect now</span></div>
          </div>
        </section>

        <section className="section-pad roles-section" id="roles">
          <div className="shell">
            <div className="center-heading"><p className="eyebrow">There is a place for you here</p><h2>One platform. <em>Many ways to care.</em></h2><p>Choose the part that feels natural. FoodShare keeps delivery steps clear for everyone.</p></div>
            <div className="role-grid">
              <button className="role-card role-apricot" onClick={() => startLogin("donor")}><span className="role-icon"><HandHeart size={23} /></span><span className="role-title">Donate food</span><span>Turn today's extra into someone else's next meal.</span><span className="role-arrow"><ArrowRight size={18} /></span></button>
              <button className="role-card role-blue" onClick={() => startLogin("organization")}><span className="role-icon"><UsersRound size={23} /></span><span className="role-title">NGO / Receive donations</span><span>Find offers that fit your kitchen, community, and moment.</span><span className="role-arrow"><ArrowRight size={18} /></span></button>
              <button className="role-card role-green" onClick={() => startLogin("volunteer")}><span className="role-icon"><MapPin size={23} /></span><span className="role-title">Volunteer delivery</span><span>Help food travel the last mile with care.</span><span className="role-arrow"><ArrowRight size={18} /></span></button>
            </div>
          </div>
        </section>

        <section className="section-pad available-section">
          <div className="shell available-grid">
            <div><p className="eyebrow">What is moving right now</p><h2>Offers need people, <em>not perfect timing.</em></h2><p className="section-copy">When a real offer is shared, it will appear here with the details needed for a safe delivery.</p><Link href="/app" className="inline-link">Open the workspace <ArrowRight size={16} /></Link></div>
            <div className="available-panel">
              {offers && offers.length > 0 ? offers.slice(0, 3).map(offer => <Link href={`/offers/${offer.id}`} className="mini-offer" key={offer.id}><span className="offer-icon"><Sparkles size={17} /></span><span><strong>{offer.foodName}</strong><small>{offer.servings} servings · {offer.pickupAddress}</small></span><ArrowRight size={16} /></Link>) : <div className="panel-empty"><span className="empty-orbit"><PackageCheck size={20} /></span><strong>No food donations nearby yet.</strong><p>When someone shares food, it will find its way here.</p></div>}
            </div>
          </div>
        </section>

        <section className="closing-section"><div className="shell closing-inner"><div><p className="eyebrow eyebrow-light">Ready when you are</p><h2>Make the next moment <em>count.</em></h2></div><button className="button button-apricot button-large" onClick={() => startLogin()}>Join FoodShare <ArrowRight size={18} /></button></div></section>
      </main>
      <footer className="site-footer"><div className="shell footer-inner"><Logo /><span>Share surplus food. Support your community.</span><div><Link href="/how-it-works">How it works</Link><a href="mailto:support@foodshare.local">Contact</a><span>© 2026 FoodShare</span></div></div></footer>
    </div>
  );
}
