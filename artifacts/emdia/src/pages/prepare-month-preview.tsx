import { Redirect } from "wouter";

/** Deprecated path — the official route is /prepare-seu-mes. */
export default function PrepareMonthPreview() {
  return <Redirect to="/prepare-seu-mes" />;
}
