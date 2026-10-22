import type { CatalogApp } from "./types.ts";

/**
 * An invented catalog for an invented platform: "Northdesk", a help-desk tool that comes in a
 * cloud edition and a self-hosted edition. None of these apps exist.
 */
export const catalog: CatalogApp[] = [
  {
    id: "ticket-templates",
    name: "Ticket Templates",
    problem:
      "Agents create the same kinds of tickets over and over and fill in the same fields by hand, so tickets come out inconsistent.",
    forumPhrases: [
      "prefill ticket fields",
      "create tickets from a template",
      "same fields every time",
      "standard ticket for onboarding",
      "copy a ticket with all its fields",
    ],
    hosting: ["cloud", "self-hosted"],
    nativeAlternative: "Northdesk can clone a single ticket, but has no reusable templates.",
    nativeEnoughSignals: ["clone one ticket", "duplicate this one ticket"],
    marketplaceUrl: "https://marketplace.example/apps/ticket-templates",
  },
  {
    id: "sla-clock",
    name: "SLA Clock Pro",
    problem:
      "SLA timers keep running at night, at weekends and on public holidays, so breaches show up that aren't real.",
    forumPhrases: [
      "sla business hours",
      "pause sla outside working hours",
      "holiday calendar sla",
      "sla counting weekends",
      "different sla per region",
    ],
    hosting: ["cloud"],
    nativeAlternative: "Northdesk has basic SLA timers that run 24/7.",
    nativeEnoughSignals: ["24/7 sla", "simple sla timer", "basic response time target"],
    marketplaceUrl: "https://marketplace.example/apps/sla-clock-pro",
  },
  {
    id: "mailbridge",
    name: "Mailbridge",
    problem:
      "Customers email support without a Northdesk account, and agents copy and paste email threads into tickets by hand.",
    forumPhrases: [
      "email thread into ticket",
      "customers without an account",
      "reply to customer by email from the ticket",
      "copy paste emails into tickets",
      "external customers email",
    ],
    hosting: ["cloud"],
    nativeAlternative: "Northdesk can create a ticket from an email, but replies don't thread back.",
    nativeEnoughSignals: ["create a ticket from an email", "email to ticket once"],
    marketplaceUrl: "https://marketplace.example/apps/mailbridge",
  },
  {
    id: "checklists",
    name: "Checklist Buddy",
    problem:
      "Multi-step work like onboarding or offboarding gets steps missed, because there is nowhere to tick them off inside the ticket.",
    forumPhrases: [
      "checklist inside a ticket",
      "tick off steps",
      "offboarding steps",
      "make sure no step is missed",
      "definition of done list",
    ],
    hosting: ["cloud", "self-hosted"],
    nativeAlternative: "Northdesk has sub-tickets, which work for big steps but are heavy for small ones.",
    nativeEnoughSignals: ["sub-ticket", "subtickets are fine"],
    marketplaceUrl: "https://marketplace.example/apps/checklist-buddy",
  },
  {
    id: "export-studio",
    name: "Export Studio",
    problem:
      "Managers want ticket reports sent to them on a schedule as PDF or spreadsheet, and someone builds them by hand every week.",
    forumPhrases: [
      "scheduled report",
      "weekly export to pdf",
      "email a report every monday",
      "export tickets automatically",
      "report for management",
    ],
    hosting: ["cloud", "self-hosted"],
    nativeAlternative: "Northdesk can export the current ticket list to CSV on demand.",
    nativeEnoughSignals: ["export to csv once", "one-off export", "download the list as csv"],
    marketplaceUrl: "https://marketplace.example/apps/export-studio",
  },
];
