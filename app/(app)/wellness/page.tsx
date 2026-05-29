import Link from "next/link";
import { ArrowLeft, Globe, Phone, Stethoscope } from "lucide-react";

export const metadata = {
  title: "Wellness Resources · Prepex",
};

// PRD §4.5 — Wellness Resources page. India-context helplines. Calm,
// factual, non-medicalised. Resources presented as options for any
// student who'd benefit, not as labels.

type Resource = {
  name: string;
  description: string;
  phone: string;
  hours: string;
  languages?: string;
  website?: string;
};

const RESOURCES: Resource[] = [
  {
    name: "iCall (TISS)",
    description: "Mental health helpline run by Tata Institute of Social Sciences. Trained counsellors.",
    phone: "9152987821",
    hours: "Mon – Sat, 8 AM – 10 PM",
    languages: "English, Hindi",
    website: "https://icallhelpline.org",
  },
  {
    name: "Vandrevala Foundation",
    description: "Free, confidential mental-health support for anyone in distress.",
    phone: "1860 2662 345",
    hours: "24 × 7",
    languages: "English, Hindi, and regional languages",
    website: "https://www.vandrevalafoundation.com",
  },
  {
    name: "AASRA",
    description: "Crisis intervention for people feeling overwhelmed, alone, or having suicidal thoughts.",
    phone: "+91 9820466726",
    hours: "24 × 7",
    languages: "English, Hindi",
    website: "http://www.aasra.info",
  },
  {
    name: "KIRAN (Govt of India)",
    description: "Toll-free 24×7 mental health rehabilitation helpline by the Ministry of Social Justice.",
    phone: "1800 599 0019",
    hours: "24 × 7",
    languages: "13 Indian languages",
    website: "https://www.mohfw.gov.in",
  },
  {
    name: "Sneha India",
    description: "Chennai-based emotional support service. Listens without judgment.",
    phone: "044 24640050",
    hours: "8 AM – 10 PM",
    languages: "English, Tamil",
    website: "https://snehaindia.org",
  },
  {
    name: "National Mental Health Helpline",
    description: "Government-supported counselling for stress, anxiety, depression, and substance use.",
    phone: "1800 599 0019",
    hours: "24 × 7",
    languages: "English, Hindi, and regional languages",
  },
];

export default function WellnessPage() {
  return (
    <div>
      <Link
        href="/settings"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={13} /> Back to settings
      </Link>

      <div className="mb-7 flex items-start gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(76, 29, 149, 0.15)", color: "#C4B5FD" }}
        >
          <Stethoscope size={20} />
        </div>
        <div>
          <h1 className="t-h1 mb-2">Wellness resources</h1>
          <p className="t-body secondary" style={{ maxWidth: 600 }}>
            If you&apos;re going through something heavy, talking helps. These are free and
            confidential. You&apos;re not alone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {RESOURCES.map((r) => (
          <div
            key={r.name}
            className="glass flex flex-col gap-3"
            style={{ padding: 20 }}
          >
            <div>
              <h3 className="t-h4 mb-1">{r.name}</h3>
              <p className="text-[13px] secondary leading-relaxed">{r.description}</p>
            </div>

            <a
              href={`tel:${r.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-2.5 rounded-input border px-3.5 py-3 text-[14px] font-semibold transition-all"
              style={{
                background: "rgba(255, 122, 89, 0.10)",
                borderColor: "rgba(255, 122, 89, 0.30)",
                color: "var(--coral-lighter)",
              }}
            >
              <Phone size={14} /> {r.phone}
            </a>

            <div className="grid grid-cols-1 gap-1 text-[12px] tertiary md:grid-cols-2">
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Hours:</span> {r.hours}
              </div>
              {r.languages && (
                <div>
                  <span style={{ color: "var(--text-secondary)" }}>Languages:</span>{" "}
                  {r.languages}
                </div>
              )}
            </div>

            {r.website && (
              <a
                href={r.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] tertiary"
              >
                <Globe size={12} /> Website
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-[12.5px] tertiary">
        In an emergency, please call your local emergency number immediately.
      </p>
    </div>
  );
}
