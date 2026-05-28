import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand anchors
        base: "var(--bg-base)",
        indigo: "var(--indigo)",
        purple: "var(--purple)",
        coral: {
          DEFAULT: "var(--coral)",
          lighter: "var(--coral-lighter)",
        },
        cream: "var(--cream)",

        // Text
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",

        // Surfaces
        "border-default": "var(--border-default)",
        "border-hover": "var(--border-hover)",
        "bg-input": "var(--bg-input)",

        // Functional
        success: "var(--success)",
        warning: "var(--warning)",
        info: "var(--info)",
        error: "var(--error)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
      },
      fontSize: {
        // Brand guide hierarchy — weight first, size second
        "display-hero": ["clamp(48px, 8vw, 72px)", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-lg": ["clamp(36px, 5vw, 56px)", { lineHeight: "1.08", letterSpacing: "-0.015em", fontWeight: "800" }],
        "h1": ["clamp(28px, 4vw, 40px)", { lineHeight: "1.15", fontWeight: "700" }],
        "h2": ["clamp(24px, 3vw, 32px)", { lineHeight: "1.2", fontWeight: "700" }],
        "h3": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "h4": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.55" }],
        "body": ["16px", { lineHeight: "1.55" }],
        "body-sm": ["14px", { lineHeight: "1.55" }],
        "label": ["11px", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "700" }],
      },
      borderRadius: {
        input: "10px",
        btn: "12px",
        card: "16px",
        modal: "20px",
      },
      spacing: {
        // 8px scale (1=4px Tailwind already), brand spacing names
        "brand-1": "4px",
        "brand-2": "8px",
        "brand-3": "12px",
        "brand-4": "16px",
        "brand-6": "24px",
        "brand-8": "32px",
        "brand-12": "48px",
        "brand-16": "64px",
        "brand-24": "96px",
      },
      backdropBlur: {
        glass: "20px",
        sidebar: "40px",
      },
      animation: {
        "aurora-drift": "auroraDrift 24s ease-in-out infinite",
        "flame-flicker": "flameFlicker 2.4s ease-in-out infinite",
        "live-pulse": "livePulse 2s ease-in-out infinite",
        "orbit-slow": "orbit 60s linear infinite",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
        "modal-in": "modalIn 300ms cubic-bezier(.2,.7,.2,1)",
        "modal-content-in": "modalContentIn 320ms cubic-bezier(.2,.7,.2,1)",
        "step-in": "stepIn 420ms cubic-bezier(.2,.7,.2,1)",
        "check-draw": "checkdraw 320ms ease-out forwards",
        "spin-slow": "spin 800ms linear infinite",
      },
      keyframes: {
        auroraDrift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(-2%, 1%, 0) scale(1.04)" },
        },
        flameFlicker: {
          "0%, 100%": { transform: "scale(1)", filter: "drop-shadow(0 0 8px rgba(255,122,89,0.5))" },
          "50%": { transform: "scale(1.05)", filter: "drop-shadow(0 0 14px rgba(255,122,89,0.9))" },
        },
        livePulse: {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 6px #FF7A59" },
          "50%": { opacity: "0.6", boxShadow: "0 0 12px #FF7A59" },
        },
        orbit: { to: { transform: "rotate(360deg)" } },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        modalIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        modalContentIn: {
          from: { opacity: "0", transform: "scale(0.94) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        stepIn: {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        checkdraw: {
          from: { strokeDashoffset: "30" },
          to: { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
