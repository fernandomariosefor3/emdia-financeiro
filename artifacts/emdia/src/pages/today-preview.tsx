import { Redirect } from "wouter";
import { TodayDashboardPrototype } from "@/features/today";

export default function TodayPreview() {
  const isTodayV3Enabled = import.meta.env.VITE_ENABLE_TODAY_V3 === "true";
  
  if (!isTodayV3Enabled) {
    return <Redirect to="/dashboard" />;
  }

  return <TodayDashboardPrototype />;
}
