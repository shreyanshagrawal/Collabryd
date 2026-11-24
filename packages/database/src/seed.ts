import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { closePool, db as database } from "./client.js";
import {
  achievements,
  applications,
  conversationMembers,
  conversations,
  events,
  interests,
  messages,
  notificationPreferences,
  notifications,
  projectMembers,
  projectRoles,
  projects,
  projectSkills,
  roles,
  skills,
  socialLinks,
  userInterests,
  userPreferredRoles,
  userProfiles,
  users,
  userSkills,
  type AccountStatus,
} from "./schema/index.js";

const __filename = fileURLToPath(import.meta.url);

// Pre-computed Argon2id hash for demo password: "Password123!"
async function hashDemoPassword(plain: string): Promise<string> {
  try {
    const argon2 = await import("argon2");
    return await argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
  } catch {
    if (process.env.SEED_PASSWORD_HASH) {
      return process.env.SEED_PASSWORD_HASH;
    }
    throw new Error(
      "Unable to hash demo password: install argon2 or provide SEED_PASSWORD_HASH"
    );
  }
}

export async function seedDatabase(): Promise<void> {
  await database.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(824512003)`);
    await seedRows(tx);
  });
}

async function seedRows(db: Pick<typeof database, "select" | "insert" | "update">) {
  const catalogSkills = [
    { name: "TypeScript", category: "Languages" },
    { name: "Python", category: "Languages" },
    { name: "Go", category: "Languages" },
    { name: "Rust", category: "Languages" },
    { name: "C++", category: "Languages" },
    { name: "React", category: "Frontend" },
    { name: "Next.js", category: "Frontend" },
    { name: "Tailwind CSS", category: "Frontend" },
    { name: "Node.js", category: "Backend" },
    { name: "Express", category: "Backend" },
    { name: "FastAPI", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Redis", category: "Database" },
    { name: "Docker", category: "DevOps" },
    { name: "Kubernetes", category: "DevOps" },
    { name: "PyTorch", category: "AI/ML" },
    { name: "LangChain", category: "AI/ML" },
    { name: "Flutter", category: "Mobile" },
    { name: "Figma", category: "Design" },
    { name: "Solidity", category: "Web3" },
  ];

  const catalogInterests = [
    { name: "Generative AI", domain: "AI/ML" },
    { name: "Computer Vision", domain: "AI/ML" },
    { name: "Distributed Systems", domain: "Systems" },
    { name: "Developer Tools", domain: "Software Engineering" },
    { name: "FinTech", domain: "Product" },
    { name: "EdTech", domain: "Product" },
    { name: "Cybersecurity", domain: "Security" },
    { name: "Robotics & IoT", domain: "Hardware" },
    { name: "Open Source", domain: "Community" },
    { name: "UI/UX Design", domain: "Design" },
  ];

  const catalogRoles = [
    {
      name: "Backend Engineer",
      description: "Designs APIs, databases, and scalable server architectures.",
    },
    {
      name: "Frontend Engineer",
      description: "Builds responsive web interfaces and client-side state.",
    },
    {
      name: "Full-Stack Developer",
      description: "Contributes across frontend, backend, and deployment.",
    },
    {
      name: "ML Engineer",
      description: "Trains, evaluates, and deploys machine learning models.",
    },
    {
      name: "UI/UX Designer",
      description: "Crafts wireframes, prototypes, and visual design systems.",
    },
    {
      name: "Mobile Developer",
      description: "Develops cross-platform or native iOS/Android applications.",
    },
    {
      name: "DevOps Engineer",
      description: "Manages CI/CD pipelines, containers, and cloud infra.",
    },
    {
      name: "Product Manager",
      description: "Coordinates roadmap, user research, and sprint priorities.",
    },
  ];

  await db.insert(skills).values(catalogSkills).onConflictDoNothing();
  await db.insert(interests).values(catalogInterests).onConflictDoNothing();
  await db.insert(roles).values(catalogRoles).onConflictDoNothing();

  const allSkills = await db.select().from(skills);
  const allInterests = await db.select().from(interests);
  const allRoles = await db.select().from(roles);

  const skillByName = new Map(allSkills.map((s) => [s.name, s.skillId]));
  const interestByName = new Map(
    allInterests.map((i) => [i.name, i.interestId])
  );
  const roleByName = new Map(allRoles.map((r) => [r.name, r.roleId]));

  const passwordHash = await hashDemoPassword("Password123!");

  const demoUsers: Array<{
    email: string;
    systemRole: "ADMIN" | "STUDENT";
    accountStatus?: AccountStatus;
    profile: {
      displayName: string;
      bio: string;
      institution: string;
      courseProgram: string;
      academicYear: string;
      department: string;
      preferredProjectType: string;
      availabilityStatus: "AVAILABLE" | "BUSY" | "NOT_LOOKING";
      profileVisibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
    };
    skills: Array<{ name: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"; years: string }>;
    interests: string[];
    roles: string[];
  }> = [
    {
      email: "shreyansh.a25625@nst.rishihood.edu.in",
      systemRole: "ADMIN",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Shreyansh Agrawal",
        bio: "Campus Administrator & Lead Engineer. Building collaborative student tools.",
        institution: "Newton School of Technology, Rishihood University",
        courseProgram: "B.Tech Computer Science & AI",
        academicYear: "3rd Year",
        department: "Computer Science",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "TypeScript", level: "EXPERT", years: "3.0" },
        { name: "React", level: "EXPERT", years: "3.0" },
        { name: "Node.js", level: "ADVANCED", years: "2.5" },
        { name: "PostgreSQL", level: "ADVANCED", years: "2.0" },
        { name: "Docker", level: "INTERMEDIATE", years: "1.5" },
      ],
      interests: ["Developer Tools", "Open Source", "Generative AI"],
      roles: ["Full-Stack Developer", "Product Manager", "Backend Engineer"],
    },
    {
      email: "admin@campus.edu",
      systemRole: "ADMIN",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Campus Admin",
        bio: "Platform administrator for Collabryd Campus.",
        institution: "IIT Delhi",
        courseProgram: "Administration",
        academicYear: "Staff",
        department: "Student Affairs",
        preferredProjectType: "OPEN_SOURCE",
        availabilityStatus: "NOT_LOOKING",
        profileVisibility: "CAMPUS_ONLY",
      },
      skills: [{ name: "PostgreSQL", level: "EXPERT", years: "5.0" }],
      interests: ["Open Source"],
      roles: ["Product Manager"],
    },
    {
      email: "aarav.sharma@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Aarav Sharma",
        bio: "Backend & distributed systems enthusiast building campus developer tools.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech Computer Science",
        academicYear: "3rd Year",
        department: "Computer Science",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "TypeScript", level: "ADVANCED", years: "2.5" },
        { name: "Node.js", level: "ADVANCED", years: "2.5" },
        { name: "PostgreSQL", level: "INTERMEDIATE", years: "1.5" },
        { name: "Docker", level: "INTERMEDIATE", years: "1.0" },
      ],
      interests: ["Distributed Systems", "Developer Tools"],
      roles: ["Backend Engineer", "Full-Stack Developer"],
    },
    {
      email: "diya.verma@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Diya Verma",
        bio: "ML researcher focused on multimodal LLMs and applied AI products.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech AI & Data Science",
        academicYear: "4th Year",
        department: "Artificial Intelligence",
        preferredProjectType: "RESEARCH",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "Python", level: "EXPERT", years: "3.5" },
        { name: "PyTorch", level: "ADVANCED", years: "2.0" },
        { name: "FastAPI", level: "ADVANCED", years: "2.0" },
        { name: "LangChain", level: "INTERMEDIATE", years: "1.0" },
      ],
      interests: ["Generative AI", "Computer Vision"],
      roles: ["ML Engineer", "Backend Engineer"],
    },
    {
      email: "kabir.mehta@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Kabir Mehta",
        bio: "Frontend engineer and product designer crafting fast, accessible UIs.",
        institution: "IIT Delhi",
        courseProgram: "B.Des + CS Minor",
        academicYear: "2nd Year",
        department: "Design",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "CAMPUS_ONLY",
      },
      skills: [
        { name: "React", level: "ADVANCED", years: "2.0" },
        { name: "TypeScript", level: "INTERMEDIATE", years: "1.5" },
        { name: "Tailwind CSS", level: "EXPERT", years: "2.5" },
        { name: "Figma", level: "ADVANCED", years: "3.0" },
      ],
      interests: ["UI/UX Design", "EdTech"],
      roles: ["Frontend Engineer", "UI/UX Designer"],
    },
    {
      email: "maya.sharma@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Maya Sharma",
        bio: "A curious designer who enjoys making complex ideas feel simple. Looking for developers to bring useful campus ideas to life.",
        institution: "IIT Delhi",
        courseProgram: "Bachelor of Design",
        academicYear: "3rd Year",
        department: "Design",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "Figma", level: "EXPERT", years: "3.0" },
        { name: "React", level: "INTERMEDIATE", years: "1.5" },
        { name: "Tailwind CSS", level: "ADVANCED", years: "2.0" },
      ],
      interests: ["UI/UX Design", "EdTech"],
      roles: ["UI/UX Designer", "Product Manager"],
    },
    {
      email: "arjun.mehta@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Arjun Mehta",
        bio: "I build for the web and learn by shipping. Happy to work on backend systems or pair on a frontend.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech Computer Science",
        academicYear: "3rd Year",
        department: "Computer Science",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "React", level: "ADVANCED", years: "2.5" },
        { name: "Node.js", level: "ADVANCED", years: "2.5" },
        { name: "PostgreSQL", level: "ADVANCED", years: "2.0" },
      ],
      interests: ["Open Source", "Developer Tools"],
      roles: ["Full-Stack Developer", "Backend Engineer"],
    },
    {
      email: "zoya.khan@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Zoya Khan",
        bio: "Exploring applied machine learning and natural language processing. Looking for a team with ambitious ideas.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech Data Science",
        academicYear: "4th Year",
        department: "Computer Science",
        preferredProjectType: "RESEARCH",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "Python", level: "EXPERT", years: "3.0" },
        { name: "PyTorch", level: "ADVANCED", years: "2.0" },
        { name: "LangChain", level: "INTERMEDIATE", years: "1.0" },
      ],
      interests: ["Generative AI", "Computer Vision"],
      roles: ["ML Engineer"],
    },
    {
      email: "ishaan.patel@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Ishaan Patel",
        bio: "Systems programmer interested in low-latency infrastructure and distributed databases.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech Computer Science",
        academicYear: "3rd Year",
        department: "Computer Science",
        preferredProjectType: "OPEN_SOURCE",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "Go", level: "ADVANCED", years: "2.0" },
        { name: "Rust", level: "INTERMEDIATE", years: "1.5" },
        { name: "Docker", level: "ADVANCED", years: "2.0" },
      ],
      interests: ["Distributed Systems", "Developer Tools"],
      roles: ["Backend Engineer", "DevOps Engineer"],
    },
    {
      email: "tara.iyer@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Tara Iyer",
        bio: "Learning something new with every project. I care deeply about accessibility, UI polish, and thoughtful micro-interactions.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech Information Technology",
        academicYear: "2nd Year",
        department: "Information Technology",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "React", level: "ADVANCED", years: "2.0" },
        { name: "Tailwind CSS", level: "EXPERT", years: "2.0" },
        { name: "TypeScript", level: "INTERMEDIATE", years: "1.0" },
      ],
      interests: ["UI/UX Design", "EdTech"],
      roles: ["Frontend Engineer"],
    },
    {
      email: "dev.rao@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Dev Rao",
        bio: "Building mobile applications for real-world campus problems. Looking for a designer and a good idea for the upcoming hackathon.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech Electronics & Communication",
        academicYear: "3rd Year",
        department: "Electronics",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "Flutter", level: "ADVANCED", years: "2.0" },
        { name: "TypeScript", level: "INTERMEDIATE", years: "1.0" },
        { name: "FastAPI", level: "INTERMEDIATE", years: "1.0" },
      ],
      interests: ["Robotics & IoT", "Developer Tools"],
      roles: ["Mobile Developer", "Full-Stack Developer"],
    },
    {
      email: "neha.verma@campus.edu",
      systemRole: "STUDENT",
      accountStatus: "ACTIVE",
      profile: {
        displayName: "Neha Verma",
        bio: "Pre-final year IT student building full-stack applications. Looking for a high-energy hackathon team.",
        institution: "IIT Delhi",
        courseProgram: "B.Tech Information Technology",
        academicYear: "3rd Year",
        department: "Information Technology",
        preferredProjectType: "HACKATHON",
        availabilityStatus: "AVAILABLE",
        profileVisibility: "PUBLIC",
      },
      skills: [
        { name: "React", level: "ADVANCED", years: "2.0" },
        { name: "Node.js", level: "ADVANCED", years: "2.0" },
        { name: "PostgreSQL", level: "INTERMEDIATE", years: "1.5" },
        { name: "Docker", level: "INTERMEDIATE", years: "1.0" },
      ],
      interests: ["EdTech", "Developer Tools"],
      roles: ["Full-Stack Developer", "Frontend Engineer"],
    },
  ];

  const userIdByEmail = new Map<string, number>();

  for (const item of demoUsers) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, item.email));

    let userId: number;
    if (existing.length > 0 && existing[0]) {
      userId = existing[0].userId;
      await db
        .update(users)
        .set({
          systemRole: item.systemRole,
          accountStatus: item.accountStatus ?? "ACTIVE",
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId));

      await db
        .update(userProfiles)
        .set({
          displayName: item.profile.displayName,
          bio: item.profile.bio,
          institution: item.profile.institution,
          courseProgram: item.profile.courseProgram,
          academicYear: item.profile.academicYear,
          department: item.profile.department,
          preferredProjectType: item.profile.preferredProjectType,
          availabilityStatus: item.profile.availabilityStatus,
          profileVisibility: item.profile.profileVisibility,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          email: item.email,
          passwordHash,
          accountStatus: item.accountStatus ?? "ACTIVE",
          systemRole: item.systemRole,
        })
        .returning({ userId: users.userId });
      userId = inserted!.userId;

      await db
        .insert(userProfiles)
        .values({
          userId,
          displayName: item.profile.displayName,
          bio: item.profile.bio,
          institution: item.profile.institution,
          courseProgram: item.profile.courseProgram,
          academicYear: item.profile.academicYear,
          department: item.profile.department,
          preferredProjectType: item.profile.preferredProjectType,
          availabilityStatus: item.profile.availabilityStatus,
          profileVisibility: item.profile.profileVisibility,
        })
        .onConflictDoNothing();
    }

    userIdByEmail.set(item.email, userId);

    await db
      .insert(notificationPreferences)
      .values({ userId })
      .onConflictDoNothing();

    for (const s of item.skills) {
      const skillId = skillByName.get(s.name);
      if (skillId) {
        await db
          .insert(userSkills)
          .values({
            userId,
            skillId,
            proficiencyLevel: s.level,
            yearsExperience: s.years,
          })
          .onConflictDoNothing();
      }
    }

    for (const iName of item.interests) {
      const interestId = interestByName.get(iName);
      if (interestId) {
        await db
          .insert(userInterests)
          .values({ userId, interestId })
          .onConflictDoNothing();
      }
    }

    for (const rName of item.roles) {
      const roleId = roleByName.get(rName);
      if (roleId) {
        await db
          .insert(userPreferredRoles)
          .values({ userId, roleId })
          .onConflictDoNothing();
      }
    }
  }

  // Seed events
  const demoEvents = [
    {
      slug: "build-for-better",
      name: "Build for Better",
      category: "Sustainability",
      description:
        "A weekend of building thoughtful solutions for a greener campus. Bring a small team and a problem worth solving.",
      eventDate: "2026-12-12T09:00:00+05:30",
      deadline: "2026-12-08T23:59:00+05:30",
      mode: "In person",
      color: "sage",
      symbol: "✳",
      publication: "Published",
      organizer: "Campus Sustainability Council",
      eligibility: "Open to all enrolled university students.",
      rules: "Teams of 2 to 4 students. Original code only. Must include live prototype.",
      officialUrl: "https://campus.edu/events/build-for-better",
      sourceUrl: "https://campus.edu/events/build-for-better",
    },
    {
      slug: "campus-build",
      name: "Campus Build Weekend",
      category: "Social impact",
      description:
        "An example campus hackathon about student life, accessibility, and making small changes that matter.",
      eventDate: "2026-12-19T10:00:00+05:30",
      deadline: "2026-12-15T23:59:00+05:30",
      mode: "Hybrid",
      color: "peach",
      symbol: "↗",
      publication: "Published",
      organizer: "Tech For Good Guild",
      eligibility: "Open to undergraduate and graduate students.",
      rules: "Solutions must address campus accessibility or welfare.",
      officialUrl: "https://campus.edu/events/campus-build",
      sourceUrl: "https://campus.edu/events/campus-build",
    },
    {
      slug: "idea-to-impact",
      name: "Idea to Impact",
      category: "Developer tools",
      description:
        "An open-theme innovation sprint. Turn your favourite 'what if' into a working prototype with your team.",
      eventDate: "2027-01-09T09:00:00+05:30",
      deadline: "2027-01-04T23:59:00+05:30",
      mode: "Online",
      color: "lavender",
      symbol: "⌘",
      publication: "Published",
      organizer: "Developer Student Club",
      eligibility: "All engineering and design students.",
      rules: "Open source submission required on GitHub.",
      officialUrl: "https://campus.edu/events/idea-to-impact",
      sourceUrl: "https://campus.edu/events/idea-to-impact",
    },
  ];

  for (const ev of demoEvents) {
    const existing = await db
      .select()
      .from(events)
      .where(eq(events.slug, ev.slug));
    if (existing.length === 0) {
      await db.insert(events).values(ev);
    }
  }

  // Seed projects
  const shreyanshId = userIdByEmail.get("shreyansh.a25625@nst.rishihood.edu.in")!;
  const aaravId = userIdByEmail.get("aarav.sharma@campus.edu")!;
  const diyaId = userIdByEmail.get("diya.verma@campus.edu")!;
  const kabirId = userIdByEmail.get("kabir.mehta@campus.edu")!;
  const arjunId = userIdByEmail.get("arjun.mehta@campus.edu")!;
  const mayaId = userIdByEmail.get("maya.sharma@campus.edu")!;
  const zoyaId = userIdByEmail.get("zoya.khan@campus.edu")!;
  const ishaanId = userIdByEmail.get("ishaan.patel@campus.edu")!;
  const taraId = userIdByEmail.get("tara.iyer@campus.edu")!;

  // 1. CampusMind
  const existingCampusMind = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, diyaId));

  if (existingCampusMind.length === 0) {
    const [project] = await db
      .insert(projects)
      .values({
        ownerId: diyaId,
        title: "CampusMind — Academic Paper Copilot",
        summary: "RAG-powered study assistant trained on open-access lecture notes.",
        description:
          "We are building an open-source campus research assistant that indexes course PDFs, cites exact page spans, and lets study groups collaborate in real time.",
        category: "Artificial Intelligence",
        projectType: "HACKATHON",
        status: "OPEN",
        visibility: "PUBLIC",
        minTeamSize: 2,
        maxTeamSize: 4,
      })
      .returning();

    const projectId = project!.projectId;

    await db.insert(projectMembers).values([
      { projectId, userId: diyaId, role: "OWNER" },
      { projectId, userId: aaravId, role: "ADMIN" },
    ]);

    const projSkills = [
      { skillId: skillByName.get("Python")!, isRequired: true },
      { skillId: skillByName.get("TypeScript")!, isRequired: true },
      { skillId: skillByName.get("React")!, isRequired: true },
      { skillId: skillByName.get("PostgreSQL")!, isRequired: false },
    ];
    await db
      .insert(projectSkills)
      .values(projSkills.map((s) => ({ projectId, ...s })))
      .onConflictDoNothing();

    await db
      .insert(projectRoles)
      .values([
        {
          projectId,
          roleId: roleByName.get("Frontend Engineer")!,
          openPositions: 1,
          description: "Own the React + Tailwind PDF viewer and citation UI.",
        },
        {
          projectId,
          roleId: roleByName.get("UI/UX Designer")!,
          openPositions: 1,
          description: "Design intuitive study room and search flows.",
        },
      ])
      .onConflictDoNothing();

    const [groupConv] = await db
      .insert(conversations)
      .values({ type: "GROUP", projectId })
      .returning();

    await db.insert(conversationMembers).values([
      {
        conversationId: groupConv!.conversationId,
        userId: diyaId,
        lastReadSequence: 1,
      },
      {
        conversationId: groupConv!.conversationId,
        userId: aaravId,
        lastReadSequence: 0,
      },
    ]);

    await db.insert(messages).values({
      conversationId: groupConv!.conversationId,
      senderId: diyaId,
      clientMessageId: "seed-msg-welcome-1",
      sequenceNumber: 1,
      content: "Welcome to CampusMind! Let's finalize the API contract tonight.",
    });

    const [app] = await db
      .insert(applications)
      .values({
        projectId,
        applicantId: kabirId,
        roleId: roleByName.get("Frontend Engineer")!,
        status: "PENDING",
        message: "Love the idea! I have built PDF annotation UIs with React and Tailwind.",
      })
      .returning();

    await db.insert(notifications).values({
      recipientId: diyaId,
      type: "APPLICATION_RECEIVED",
      resourceType: "APPLICATION",
      resourceId: app!.applicationId,
      message: "Kabir Mehta applied for Frontend Engineer on CampusMind — Academic Paper Copilot.",
    });
  }

  // 2. Greenbyte
  const existingGreenbyte = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, arjunId));

  if (existingGreenbyte.length === 0) {
    const [project] = await db
      .insert(projects)
      .values({
        ownerId: arjunId,
        title: "Greenbyte — Campus Food Sharing App",
        summary: "Making sustainable choices easier by reducing everyday campus food waste.",
        description:
          "Connecting hostels, canteens, and students to redistribute surplus meals and track carbon offset scores in real time.",
        category: "Sustainability",
        projectType: "HACKATHON",
        status: "OPEN",
        visibility: "PUBLIC",
        minTeamSize: 2,
        maxTeamSize: 4,
      })
      .returning();

    const projectId = project!.projectId;

    await db.insert(projectMembers).values([
      { projectId, userId: arjunId, role: "OWNER" },
      { projectId, userId: zoyaId, role: "MEMBER" },
    ]);

    await db.insert(projectSkills).values([
      { projectId, skillId: skillByName.get("React")!, isRequired: true },
      { projectId, skillId: skillByName.get("Node.js")!, isRequired: true },
      { projectId, skillId: skillByName.get("Figma")!, isRequired: true },
    ]).onConflictDoNothing();

    await db.insert(projectRoles).values([
      {
        projectId,
        roleId: roleByName.get("UI/UX Designer")!,
        openPositions: 1,
        description: "Design delightful food listing and claim cards.",
      },
    ]).onConflictDoNothing();

    const [groupConv] = await db
      .insert(conversations)
      .values({ type: "GROUP", projectId })
      .returning();

    await db.insert(conversationMembers).values([
      { conversationId: groupConv!.conversationId, userId: arjunId, lastReadSequence: 1 },
      { conversationId: groupConv!.conversationId, userId: zoyaId, lastReadSequence: 0 },
    ]);

    await db.insert(messages).values({
      conversationId: groupConv!.conversationId,
      senderId: arjunId,
      clientMessageId: "seed-greenbyte-1",
      sequenceNumber: 1,
      content: "Hey team! Hackathon kickoff is in 2 weeks. Let's build the pantry map first.",
    });
  }

  // 3. Pixel Pioneers
  const existingPixel = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, mayaId));

  if (existingPixel.length === 0) {
    const [project] = await db
      .insert(projects)
      .values({
        ownerId: mayaId,
        title: "Pixel Pioneers — Accessible Campus Resource Discovery",
        summary: "A small team with big curiosity building accessible ways to find campus resources.",
        description:
          "High-contrast, screen-reader friendly maps, room bookings, and event finders built with WCAG AAA standards for campus diversity.",
        category: "Social impact",
        projectType: "HACKATHON",
        status: "OPEN",
        visibility: "PUBLIC",
        minTeamSize: 2,
        maxTeamSize: 4,
      })
      .returning();

    const projectId = project!.projectId;

    await db.insert(projectMembers).values([
      { projectId, userId: mayaId, role: "OWNER" },
      { projectId, userId: taraId, role: "MEMBER" },
    ]);

    await db.insert(projectSkills).values([
      { projectId, skillId: skillByName.get("React")!, isRequired: true },
      { projectId, skillId: skillByName.get("Tailwind CSS")!, isRequired: true },
      { projectId, skillId: skillByName.get("Python")!, isRequired: true },
    ]).onConflictDoNothing();

    await db.insert(projectRoles).values([
      {
        projectId,
        roleId: roleByName.get("Backend Engineer")!,
        openPositions: 1,
        description: "Build FastAPI endpoints for accessible campus geolocation.",
      },
    ]).onConflictDoNothing();
  }

  // 4. Afterhours (Led by Shreyansh Agrawal)
  const existingAfterhours = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, shreyanshId));

  if (existingAfterhours.length === 0) {
    const [project] = await db
      .insert(projects)
      .values({
        ownerId: shreyanshId,
        title: "Afterhours — Real-time Developer Knowledge Base",
        summary: "Turning late-night ideas into useful developer tools with live Markdown collaboration.",
        description:
          "A collaborative workspace for campus hackathons featuring real-time state synchronization, smart component previews, and automated team matching.",
        category: "Developer tools",
        projectType: "HACKATHON",
        status: "OPEN",
        visibility: "PUBLIC",
        minTeamSize: 2,
        maxTeamSize: 4,
      })
      .returning();

    const projectId = project!.projectId;

    await db.insert(projectMembers).values([
      { projectId, userId: shreyanshId, role: "OWNER" },
      { projectId, userId: ishaanId, role: "ADMIN" },
    ]);

    await db.insert(projectSkills).values([
      { projectId, skillId: skillByName.get("TypeScript")!, isRequired: true },
      { projectId, skillId: skillByName.get("React")!, isRequired: true },
      { projectId, skillId: skillByName.get("PostgreSQL")!, isRequired: true },
      { projectId, skillId: skillByName.get("Docker")!, isRequired: false },
    ]).onConflictDoNothing();

    await db.insert(projectRoles).values([
      {
        projectId,
        roleId: roleByName.get("UI/UX Designer")!,
        openPositions: 1,
        description: "Design clean dark-mode developer interfaces.",
      },
    ]).onConflictDoNothing();

    const [groupConv] = await db
      .insert(conversations)
      .values({ type: "GROUP", projectId })
      .returning();

    await db.insert(conversationMembers).values([
      { conversationId: groupConv!.conversationId, userId: shreyanshId, lastReadSequence: 1 },
      { conversationId: groupConv!.conversationId, userId: ishaanId, lastReadSequence: 0 },
    ]);

    await db.insert(messages).values({
      conversationId: groupConv!.conversationId,
      senderId: shreyanshId,
      clientMessageId: "seed-afterhours-1",
      sequenceNumber: 1,
      content: "Welcome to Afterhours! The core engine is live. Let's ship the hackathon release.",
    });
  }

  // Direct conversation between Shreyansh and Aarav
  const existingConv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.type, "DIRECT"));

  if (existingConv.length === 0) {
    const [directConv] = await db
      .insert(conversations)
      .values({ type: "DIRECT" })
      .returning();

    await db.insert(conversationMembers).values([
      { conversationId: directConv!.conversationId, userId: shreyanshId, lastReadSequence: 1 },
      { conversationId: directConv!.conversationId, userId: aaravId, lastReadSequence: 0 },
    ]);

    await db.insert(messages).values({
      conversationId: directConv!.conversationId,
      senderId: aaravId,
      clientMessageId: "seed-direct-aarav-1",
      sequenceNumber: 1,
      content: "Hey Shreyansh! Checked out the Afterhours architecture, looks super crisp.",
    });
  }
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  seedDatabase()
    .then(() => {
      console.log("Database seed completed successfully.");
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exitCode = 1;
    })
    .finally(() => closePool());
}
