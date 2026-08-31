export type DemoAttentionItem = {
  id: string;
  category: "insurance" | "invoice" | "request";
  organization: string;
  title: string;
  detail: string;
  dueLabel: string;
  source: string;
  priority: "urgent" | "high" | "normal";
};

export const demoAttentionItems: DemoAttentionItem[] = [
  {
    id: "demo-insurance-renewal",
    category: "insurance",
    organization: "Northline Insurance · fictional",
    title: "Review your insurance renewal",
    detail: "The annual price appears to increase by 12%.",
    dueLabel: "Renews Sep 24",
    source: "Renewal notice · page 1",
    priority: "high",
  },
  {
    id: "demo-invoice-849",
    category: "invoice",
    organization: "Sundby Energy · fictional",
    title: "Pay 849 SEK",
    detail: "Invoice reference and amount were found with high confidence.",
    dueLabel: "Due Sep 5",
    source: "August invoice · page 1",
    priority: "normal",
  },
  {
    id: "demo-information-request",
    category: "request",
    organization: "Civic Learning Office · fictional",
    title: "Submit requested information",
    detail:
      "The letter asks for one supporting document before review can continue.",
    dueLabel: "Due in 4 days",
    source: "Information request · page 2",
    priority: "urgent",
  },
];

export const demoDocuments = [
  {
    id: "demo-renewal",
    title: "Home insurance renewal",
    organization: "Northline Insurance",
    understood: "18 min ago",
    status: "Action found",
    type: "PDF",
  },
  {
    id: "demo-energy",
    title: "August energy invoice",
    organization: "Sundby Energy",
    understood: "Yesterday",
    status: "Ready",
    type: "PDF",
  },
  {
    id: "demo-employment",
    title: "Employment terms update",
    organization: "Aster & Co.",
    understood: "Aug 28",
    status: "Review suggested",
    type: "PDF",
  },
] as const;
