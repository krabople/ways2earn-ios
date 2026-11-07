export function notificationRoute(href: string): string {
  // Notifications use website URLs. Translate paths that differ in the app.
  if (href.startsWith("/opportunities/")) {
    return href.replace("/opportunities/", "/opportunity/");
  }
  return href === "/admin" || href.startsWith("/admin?") ? "/moderation" : href;
}
