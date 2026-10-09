import { ArrowRight, Bell, CheckCircle2, HeartHandshake, type LucideIcon, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";

type SignInPromptProps = {
  title?: string;
  description?: string;
  icon?: LucideIcon;
};

const benefits = [
  "Save and follow every donation",
  "Coordinate with trusted local partners",
  "Keep a clear record from pickup to delivery",
];

export default function SignInPrompt({
  title = "Make your next good thing count.",
  description = "Sign in to share food, receive offers, or carry a delivery through to its destination.",
  icon: Icon = Bell,
}: SignInPromptProps) {
  return (
    <main className="signin-page">
      <div className="signin-orbit signin-orbit-one" />
      <div className="signin-orbit signin-orbit-two" />
      <div className="signin-shell">
        <div className="signin-brand-row">
          <Link href="/" className="brand-mark">
            <span className="brand-loop"><span /></span>
            <span className="brand-name">Food<span>Share</span></span>
          </Link>
          <span className="signin-secure"><ShieldCheck size={14} /> Secure access</span>
        </div>

        <section className="signin-panel">
          <div className="signin-story">
            <div className="signin-story-art">
              <div className="signin-art-sun" />
              <div className="signin-art-ring signin-art-ring-one" />
              <div className="signin-art-ring signin-art-ring-two" />
              <span className="signin-art-heart"><HeartHandshake size={31} /></span>
              <span className="signin-art-check"><CheckCircle2 size={18} /></span>
              <span className="signin-art-dot signin-art-dot-one" />
              <span className="signin-art-dot signin-art-dot-two" />
            </div>
            <p className="eyebrow">A little less waste. A lot more care.</p>
            <h1>Good food deserves <em>a next step.</em></h1>
            <p className="signin-story-copy">FoodShare brings the people who have food together with the people who can put it to work.</p>
            <div className="signin-benefits">
              {benefits.map(benefit => <span key={benefit}><CheckCircle2 size={15} /> {benefit}</span>)}
            </div>
          </div>

          <div className="signin-action">
            <span className="signin-icon"><Icon size={21} /></span>
            <p className="eyebrow">Welcome back</p>
            <h2>{title}</h2>
            <p className="signin-description">{description}</p>
            <button className="button button-dark button-large full-width signin-button" onClick={() => startLogin()}>
              Sign in to continue <ArrowRight size={17} />
            </button>
            <p className="signin-note"><ShieldCheck size={15} /> Your account keeps your activity connected and private.</p>
            <Link href="/" className="signin-back">Back to FoodShare <ArrowRight size={14} /></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
