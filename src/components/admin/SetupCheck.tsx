/**
 * SetupCheck component - no longer redirects to setup wizard
 * Kept for compatibility but now just renders children
 */
export function SetupCheck({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}