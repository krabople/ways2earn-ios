export function notificationRoute(href: string): string {
  // The server uses the website moderation URL for both web and mobile alerts.
  return href === "/admin" || href.startsWith("/admin?") ? "/moderation" : href;
}
