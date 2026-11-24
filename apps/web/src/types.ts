export interface Person {
  id: string;
  name: string;
  role: string;
  branch: string;
  year: string;
  skills: string[];
  interests: string;
  bio: string;
  available: boolean;
  color: string;
  proficiency?: "Learning" | "Comfortable" | "Experienced";
  availableFrom?: string;
  availableUntil?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  status?: "Active" | "Suspended";
  institution?: string;
  courseProgram?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  domain: string;
  roles: string[];
  skills: string[];
  members: string[];
  capacity: number;
  leaderId: string;
  eventId: string;
  status: "Recruiting" | "Closed" | "Archived";
}

export interface Hackathon {
  id: string;
  name: string;
  category: string;
  description: string;
  date: string;
  deadline: string;
  mode: string;
  color: string;
  symbol: string;
  publication?: "Draft" | "Published" | "Archived";
  organizer?: string;
  eligibility?: string;
  rules?: string;
  officialUrl?: string;
  sourceUrl?: string;
  updatedAt?: string;
}

export interface JoinRequest {
  id: string;
  teamId: string;
  personId: string;
  message: string;
  status: "Pending" | "Accepted" | "Declined" | "Cancelled" | "Expired";
}

export interface Invitation {
  id: string;
  teamId: string;
  personId?: string;
  expiresAt?: string;
  status: "Pending" | "Accepted" | "Declined" | "Expired" | "Revoked";
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  href: string;
  read: boolean;
}

export interface Report {
  id: string;
  target: string;
  reason: string;
  status: "Open" | "Investigating" | "Resolved" | "Dismissed";
}
