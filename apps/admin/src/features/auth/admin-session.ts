const ADMIN_SESSION_TOKEN_KEY = "pet_slay_admin_session_token";

export function getAdminSessionToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ADMIN_SESSION_TOKEN_KEY) ?? "";
}

export function setAdminSessionToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
}

export function clearAdminSessionToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
}
