import type {
  Hackathon,
  Invitation,
  JoinRequest,
  Notice,
  Person,
  Team,
} from "../types";

// Every person, team and event in this file is fictional demonstration data.
export const demoProfile: Person = {
  id: "you",
  name: "Alex Morgan",
  role: "Frontend developer",
  branch: "Computer Science",
  year: "3rd year",
  skills: ["React", "TypeScript", "CSS"],
  interests: "Useful products and thoughtful design",
  bio: "I like turning interesting ideas into simple, useful interfaces. Looking for a team to build something meaningful with.",
  available: true,
  color: "sage",
  proficiency: "Comfortable",
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

export const demoPeople: Person[] = [
  {
    id: "maya",
    name: "Maya Sharma",
    role: "Product designer",
    branch: "Design",
    year: "3rd year",
    skills: ["Figma", "UI/UX", "Prototyping"],
    interests: "Design for good",
    bio: "A curious designer who enjoys making complex ideas feel simple. Looking for developers to bring a useful campus idea to life.",
    available: true,
    color: "peach",
  },
  {
    id: "arjun",
    name: "Arjun Mehta",
    role: "Full-stack developer",
    branch: "Computer Science",
    year: "3rd year",
    skills: ["React", "Node.js", "PostgreSQL"],
    interests: "Open source and sustainability",
    bio: "I build for the web and learn by shipping. Happy to work on backend systems or pair on a frontend.",
    available: true,
    color: "sage",
  },
  {
    id: "zoya",
    name: "Zoya Khan",
    role: "AI/ML engineer",
    branch: "Computer Science",
    year: "4th year",
    skills: ["Python", "TensorFlow", "Data science"],
    interests: "Responsible AI",
    bio: "Interested in practical machine learning and tools that make everyday life a little easier.",
    available: true,
    color: "lavender",
  },
  {
    id: "ishaan",
    name: "Ishaan Patel",
    role: "Backend developer",
    branch: "Information Technology",
    year: "2nd year",
    skills: ["Python", "FastAPI", "SQL"],
    interests: "Developer tools",
    bio: "I enjoy clean APIs, good documentation, and small teams that care about their work.",
    available: false,
    color: "sand",
  },
  {
    id: "tara",
    name: "Tara Nair",
    role: "Frontend developer",
    branch: "Computer Science",
    year: "2nd year",
    skills: ["React", "CSS", "JavaScript"],
    interests: "Accessible web experiences",
    bio: "Learning something new with every project. I care about accessibility and thoughtful little details.",
    available: true,
    color: "blue",
  },
  {
    id: "dev",
    name: "Dev Rao",
    role: "Mobile developer",
    branch: "Electronics",
    year: "3rd year",
    skills: ["Flutter", "Dart", "Firebase"],
    interests: "Campus life and mobility",
    bio: "Building mobile apps for real problems. Looking for a designer and a good idea for my next hackathon.",
    available: true,
    color: "rose",
  },
];

export const demoTeams: Team[] = [
  {
    id: "greenbyte",
    name: "Greenbyte",
    description:
      "Making sustainable choices a little easier. We’re building a campus food-sharing app to reduce everyday waste.",
    domain: "Sustainability",
    roles: ["Frontend developer", "Product designer"],
    skills: ["React", "Figma"],
    members: ["arjun", "zoya"],
    capacity: 4,
    leaderId: "arjun",
    eventId: "build-for-better",
    status: "Recruiting",
  },
  {
    id: "pixel-pioneers",
    name: "Pixel Pioneers",
    description:
      "A small team with a big curiosity. Help us build an accessible way for students to discover campus resources.",
    domain: "Social impact",
    roles: ["Backend developer", "AI/ML engineer"],
    skills: ["Python", "SQL"],
    members: ["maya", "tara"],
    capacity: 4,
    leaderId: "maya",
    eventId: "campus-build",
    status: "Recruiting",
  },
  {
    id: "afterhours",
    name: "Afterhours",
    description:
      "Turning late-night ideas into useful developer tools. Come build a simpler way to share project knowledge.",
    domain: "Developer tools",
    roles: ["Product designer"],
    skills: ["Figma", "React"],
    members: ["you", "ishaan"],
    capacity: 3,
    leaderId: "you",
    eventId: "idea-to-impact",
    status: "Recruiting",
  },
];

export const demoEvents: Hackathon[] = [
  {
    id: "build-for-better",
    name: "Build for Better",
    category: "Sustainability",
    description:
      "A weekend of building thoughtful solutions for a greener campus. Bring a small team and a problem worth solving.",
    date: "2026-12-12T09:00:00+05:30",
    deadline: "2026-12-08T23:59:00+05:30",
    mode: "In person",
    color: "sage",
    symbol: "✳",
  },
  {
    id: "campus-build",
    name: "Campus Build Weekend",
    category: "Social impact",
    description:
      "An example campus hackathon about student life, accessibility, and making small changes that matter.",
    date: "2026-12-19T10:00:00+05:30",
    deadline: "2026-12-15T23:59:00+05:30",
    mode: "Hybrid",
    color: "peach",
    symbol: "↗",
  },
  {
    id: "idea-to-impact",
    name: "Idea to Impact",
    category: "Developer tools",
    description:
      "An open-theme innovation sprint. Turn your favourite “what if” into a working prototype with your team.",
    date: "2027-01-09T09:00:00+05:30",
    deadline: "2027-01-04T23:59:00+05:30",
    mode: "Online",
    color: "lavender",
    symbol: "⌘",
  },
];

export const demoRequests: JoinRequest[] = [
  {
    id: "request-tara",
    teamId: "afterhours",
    personId: "tara",
    message:
      "I’d love to help with accessible frontend components and learn from the team.",
    status: "Pending",
  },
];
export const demoInvitations: Invitation[] = [
  { id: "invite-pixels", teamId: "pixel-pioneers", status: "Pending" },
  {
    id: "invite-expired",
    teamId: "greenbyte",
    personId: "you",
    status: "Expired",
    expiresAt: "2026-01-01T00:00:00Z",
  },
];

export const demoPendingStudent: Person = {
  id: "neha",
  name: "Neha Verma",
  role: "Product designer",
  branch: "Design",
  year: "2nd year",
  skills: ["Figma"],
  interests: "Accessible products",
  bio: "Enrolled design student building accessible products.",
  available: true,
  color: "sand",
  status: "Active",
};
export const demoNotices: Notice[] = [
  {
    id: "notice-invite",
    title: "An invitation to build something together",
    description:
      "Pixel Pioneers invited you to their team. Take a look and see if it feels like a fit.",
    href: "#/my-teams",
    read: false,
  },
  {
    id: "notice-request",
    title: "Someone wants to join Afterhours",
    description:
      "Tara is interested in your team. You can review the request on your team page.",
    href: "#/teams/afterhours",
    read: false,
  },
  {
    id: "notice-welcome",
    title: "Your next chapter starts here",
    description:
      "Explore students, teams and hackathons across your campus workspace.",
    href: "#/discover",
    read: true,
  },
];

export function eventDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
