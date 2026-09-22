import type { Metadata } from "next";

import { ProfileDashboard } from "@/components/profile/profile-dashboard";

export const metadata: Metadata = {
  title: "Wallet | Midnight",
};

export default function ProfilePage() {
  return <ProfileDashboard />;
}
