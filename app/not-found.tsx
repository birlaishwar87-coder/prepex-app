import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export const metadata = { title: "Not found · Prepex" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 py-12">
      <Logo size={28} className="mb-8" />
      <div className="glass w-full text-center" style={{ padding: 40 }}>
        <div
          className="tabular mx-auto mb-2 text-[64px] font-extrabold leading-none"
          style={{
            background: "linear-gradient(135deg, #FF7A59, #FF9E7D)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>
        <h1 className="t-h3 mb-3">Nothing here.</h1>
        <p className="t-body-sm secondary mb-6">
          The link is off, or this page moved. Both fixable.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link href="/today" className="btn btn-primary">
            <Home size={14} /> Today
          </Link>
          <Link href="/" className="btn btn-ghost">
            <ArrowLeft size={14} /> Landing
          </Link>
        </div>
      </div>
    </div>
  );
}
