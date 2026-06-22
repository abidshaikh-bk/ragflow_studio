export function shouldUseE2ELoginBypass() {
  return process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === "true";
}
