// src/lib/utils/calendar.ts

export interface MeetingOptions {
  title: string;
  sourceUtcIso: string;
  durationMinutes?: number;
  fromZone: string;
  toZone: string;
  sourceLocal: string;
  targetLocal: string;
  sourceAbbrev: string;
  targetAbbrev: string;
  zoomLink?: string;
}

function toGoogleUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// 1. Google Meet / Google Calendar Link
export function buildGoogleMeetUrl(opts: MeetingOptions): string {
  const startDate = new Date(opts.sourceUtcIso);
  const endDate = new Date(startDate.getTime() + (opts.durationMinutes ?? 60) * 60 * 1000);

  const fromTime = opts.sourceLocal.split("T")[1]?.slice(0, 5) ?? "";
  const toTime = opts.targetLocal.split("T")[1]?.slice(0, 5) ?? "";

  const description = [
    `Cross-Timezone Sync:`,
    `• ${opts.fromZone.replace(/_/g, " ")}: ${fromTime} (${opts.sourceAbbrev})`,
    `• ${opts.toZone.replace(/_/g, " ")}: ${toTime} (${opts.targetAbbrev})`,
    opts.zoomLink ? `\nVideo Link: ${opts.zoomLink}` : "",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${toGoogleUtc(startDate)}/${toGoogleUtc(endDate)}`,
    details: description,
    location: opts.zoomLink || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// 2. Direct Microsoft Teams Scheduler (Bypasses Outlook)
export function buildTeamsMeetingUrl(opts: MeetingOptions): string {
  const startDate = new Date(opts.sourceUtcIso);
  const endDate = new Date(startDate.getTime() + (opts.durationMinutes ?? 60) * 60 * 1000);

  const fromTime = opts.sourceLocal.split("T")[1]?.slice(0, 5) ?? "";
  const toTime = opts.targetLocal.split("T")[1]?.slice(0, 5) ?? "";

  const content = `Cross-Timezone Meeting: ${opts.fromZone} (${fromTime}) / ${opts.toZone} (${toTime})`;

  // Official Microsoft Teams deep link to create a new meeting directly
  const params = new URLSearchParams({
    subject: opts.title,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    content: content,
  });

  return `https://teams.microsoft.com/l/meeting/new?${params.toString()}`;
}

// 3. Zoom Quick Launcher
export function getZoomScheduleUrl(): string {
  return "https://zoom.us/meeting/schedule";
}

// 4. Copy-Pasteable Invite Formatter (For Slack, WhatsApp, Zoom chat)
export function formatInviteClipboard(opts: MeetingOptions): string {
  const fromTime = opts.sourceLocal.split("T")[1]?.slice(0, 5) ?? "";
  const toTime = opts.targetLocal.split("T")[1]?.slice(0, 5) ?? "";
  const fromCity = opts.fromZone.split("/").pop()?.replace(/_/g, " ") ?? opts.fromZone;
  const toCity = opts.toZone.split("/").pop()?.replace(/_/g, " ") ?? opts.toZone;

  return [
    `📅 ${opts.title}`,
    `• ${fromCity}: ${fromTime} (${opts.sourceAbbrev})`,
    `• ${toCity}: ${toTime} (${opts.targetAbbrev})`,
    opts.zoomLink ? `🔗 Meeting Link: ${opts.zoomLink}` : "",
  ].filter(Boolean).join("\n");
}