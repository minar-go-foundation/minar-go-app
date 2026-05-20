export interface MGMember {
  id: string;
  name: string;
  createdAt?: string;
}

export interface MGTransaction {
  id: string;
  n: string; // Name
  c: string; // Category
  a: string; // Amount
  d: string; // Date
}

export type Tab = "home" | "members" | "history" | "chat" | "gallery" | "setting" | "call" | "ai";
export type Theme = "navy" | "glass" | "gradient" | "midnight" | "emerald" | "royal";
