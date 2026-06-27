import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/get-user";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Settings · Prepex",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  return (
    <div>
      <div className="mb-7">
        <h1 className="t-h1 mb-2">Settings</h1>
        <p className="t-body secondary">
          Tune what we know about you. The planner adapts to whatever you change here.
        </p>
      </div>
      <SettingsClient profile={profile} />
    </div>
  );
}
