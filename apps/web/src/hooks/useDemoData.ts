import { useCallback, useEffect, useRef, useState } from "react";
import {
  demoInvitations,
  demoNotices,
  demoProfile,
  demoRequests,
  demoTeams,
  demoPeople,
  demoPendingStudent,
  demoEvents,
} from "../data/demo";
import type { Hackathon, JoinRequest, Notice, Person, Report, Team } from "../types";
import {
  isHttpUrl,
  joinRequestError,
  teamCapacityError,
} from "../lib/validation";
import {
  adminApi,
  applicationsApi,
  authApi,
  catalogApi,
  clearStoredTokens,
  connectLiveSocket,
  createLiveSocket,
  eventsApi,
  getStoredTokens,
  membersApi,
  notificationsApi,
  profilesApi,
  projectsApi,
  studentsApi,
  type BackendApplication,
  type BackendEvent,
  type BackendNotification,
  type BackendProject,
  type FullProfile,
} from "../lib/api";

const AVATAR_COLORS = [
  "#115e59",
  "#964a27",
  "#285a4a",
  "#3b5998",
  "#6b46c1",
  "#b83280",
  "#2c7a7b",
  "#d69e2e",
];

function pickColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] || "#115e59";
}

function mapBackendStudent(student: FullProfile, currentUserId?: number): Person {
  const isSelf = currentUserId && student.userId === currentUserId;
  const roleName = student.preferredRoles?.[0]?.name || "Exploring";
  const branchName = student.department || student.courseProgram || "Computer Science";
  const yearName = student.academicYear || "3rd year";

  const gh = student.socialLinks?.find((l) => l.platform.toLowerCase() === "github")?.url;
  const li = student.socialLinks?.find((l) => l.platform.toLowerCase() === "linkedin")?.url;
  const pf = student.socialLinks?.find((l) => l.platform.toLowerCase() === "portfolio")?.url;

  return {
    id: isSelf ? "you" : String(student.userId),
    name: student.displayName || student.email.split("@")[0] || "Student",
    role: roleName,
    branch: branchName,
    year: yearName,
    skills: student.skills?.map((s) => s.name) || [],
    interests: student.interests?.map((i) => i.name).join(", ") || "",
    bio: student.bio || "",
    available: student.availabilityStatus === "AVAILABLE",
    color: pickColor(student.displayName || student.email),
    proficiency: "Comfortable",
    githubUrl: gh || undefined,
    linkedinUrl: li || undefined,
    portfolioUrl: pf || undefined,
    status:
      student.accountStatus === "SUSPENDED"
        ? "Suspended"
        : "Active",
    institution: student.institution || "Collabryd Campus",
    courseProgram: student.courseProgram || student.department || "B.Tech Computer Science",
  };
}

function mapBackendProject(proj: BackendProject, currentUserId?: number): Team {
  const isOwner = currentUserId && proj.ownerId === currentUserId;
  const memberList = (proj.members || []).map((m) =>
    currentUserId && m.userId === currentUserId ? "you" : String(m.userId)
  );
  if (isOwner && !memberList.includes("you")) {
    memberList.unshift("you");
  }
  if (memberList.length === 0) {
    memberList.push(isOwner ? "you" : String(proj.ownerId));
  }

  const status: Team["status"] =
    proj.status === "ARCHIVED"
      ? "Archived"
      : proj.status === "OPEN"
        ? "Recruiting"
        : "Closed";

  return {
    id: String(proj.projectId),
    name: proj.title,
    description: proj.description || proj.summary,
    domain: proj.category || "Developer tools",
    roles: proj.roles?.map((r) => r.name) || ["Full-stack developer"],
    skills: proj.skills?.map((s) => s.name) || [],
    members: memberList,
    capacity: proj.maxTeamSize || 4,
    leaderId: isOwner ? "you" : String(proj.ownerId),
    eventId: "",
    status,
  };
}

function mapBackendApplication(app: BackendApplication, currentUserId?: number): JoinRequest {
  const isApplicant = currentUserId && app.applicantId === currentUserId;
  const status: JoinRequest["status"] =
    app.status === "ACCEPTED"
      ? "Accepted"
      : app.status === "REJECTED"
        ? "Declined"
        : app.status === "WITHDRAWN"
          ? "Cancelled"
          : "Pending";

  return {
    id: String(app.applicationId),
    teamId: String(app.projectId),
    personId: isApplicant ? "you" : String(app.applicantId),
    message: app.message || "",
    status,
  };
}

function mapBackendNotification(notif: BackendNotification): Notice {
  return {
    id: String(notif.notificationId),
    title: notif.title,
    description: notif.message,
    href: notif.linkUrl || "#/notifications",
    read: notif.isRead,
  };
}

function mapBackendEvent(evt: BackendEvent): Hackathon {
  return {
    id: evt.slug || String(evt.eventId),
    name: evt.name,
    category: evt.category,
    description: evt.description,
    date: evt.eventDate,
    deadline: evt.deadline,
    mode: evt.mode,
    color: evt.color,
    symbol: evt.symbol,
    publication: evt.publication,
    organizer: evt.organizer || undefined,
    eligibility: evt.eligibility || undefined,
    rules: evt.rules || undefined,
    officialUrl: evt.officialUrl || undefined,
    sourceUrl: evt.sourceUrl || undefined,
    updatedAt: evt.updatedAt,
  };
}

function getMockReviews(): Record<string, NonNullable<Person["status"]>> {
  try {
    return JSON.parse(localStorage.getItem("collabryd_mock_reviews") || "{}");
  } catch {
    return {};
  }
}

function saveMockReview(id: string, status: NonNullable<Person["status"]>) {
  try {
    const current = getMockReviews();
    current[id] = status;
    localStorage.setItem("collabryd_mock_reviews", JSON.stringify(current));
  } catch {}
}

export function useDemoData() {
  const [signedIn, setSignedIn] = useState(false);
  const [verified, setVerified] = useState(false);
  const [profile, setProfile] = useState<Person>(demoProfile);
  const [teams, setTeams] = useState<Team[]>(demoTeams);
  const [people, setPeople] = useState<Person[]>(() => {
    const mockReviews = getMockReviews();
    return [...demoPeople, demoPendingStudent].map((p) =>
      mockReviews[p.id] ? { ...p, status: mockReviews[p.id] } : p
    );
  });
  const [events, setEvents] = useState<Hackathon[]>(demoEvents);
  const [requests, setRequests] = useState<JoinRequest[]>(demoRequests);
  const [invitations, setInvitations] = useState(demoInvitations);
  const [notices, setNotices] = useState<Notice[]>(demoNotices);
  const [reports, setReports] = useState<Report[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);
  const [currentUserRole, setCurrentUserRole] = useState<string>("STUDENT");
  const onboardingEmail = useRef("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [verificationToken, setVerificationToken] = useState<string>("");

  const catalogSkillsRef = useRef<Array<{ skillId: number; name: string }>>([]);
  const catalogRolesRef = useRef<Array<{ roleId: number; name: string }>>([]);

  const notify = useCallback(
    (message: string, href = "#/notifications") => {
      setFeedback(message);
      const notice: Notice = {
        id: crypto.randomUUID(),
        title: message,
        description: "Synced with platform session.",
        href,
        read: false,
      };
      if (notificationsEnabled) setNotices((current) => [notice, ...current]);
    },
    [notificationsEnabled]
  );

  // Load catalogs on mount
  useEffect(() => {
    catalogApi
      .getSkills({ limit: 100 })
      .then((skills) => {
        catalogSkillsRef.current = skills;
      })
      .catch(() => {});
    catalogApi
      .getRoles({ limit: 100 })
      .then((roles) => {
        catalogRolesRef.current = roles;
      })
      .catch(() => {});
  }, []);

  // Sync session and backend resources
  const loadPlatformData = useCallback(async (activeUserId?: number, activeUserRole?: string) => {
    try {
      const [backendProjects, backendStudents, backendEvents, adminUsers] = await Promise.all([
        projectsApi.list({ limit: 100 }).catch(() => null),
        studentsApi.discover({ limit: 100 }).catch(() => null),
        eventsApi.list({ limit: 100 }).catch(() => null),
        activeUserRole === "ADMIN" ? adminApi.listUsers({ limit: 100 }).catch(() => null) : null,
      ]);

      if (backendProjects && Array.isArray(backendProjects)) {
        const mapped = backendProjects.map((p) => mapBackendProject(p, activeUserId));
        if (mapped.length > 0) setTeams(mapped);
      }

      const peopleList: Person[] = [];

      if (adminUsers && Array.isArray(adminUsers) && adminUsers.length > 0) {
        peopleList.push(...adminUsers.map((u) => mapBackendStudent(u, activeUserId)));
      } else if (backendStudents && Array.isArray(backendStudents) && backendStudents.length > 0) {
        peopleList.push(
          ...backendStudents.map((s) =>
            mapBackendStudent({ ...s, accountStatus: (s as any).accountStatus || "ACTIVE" }, activeUserId)
          )
        );
      }

      if (peopleList.length > 0) {
        setPeople(peopleList);
      }

      if (backendEvents && Array.isArray(backendEvents) && backendEvents.length > 0) {
        const mappedEvents = backendEvents.map(mapBackendEvent);
        setEvents(mappedEvents);
      }

      if (activeUserId) {
        const [myApps, incomingApps, backendNotices] = await Promise.all([
          applicationsApi.listMine({ limit: 50 }).catch(() => null),
          applicationsApi.listIncoming({ limit: 50 }).catch(() => null),
          notificationsApi.list({ limit: 50 }).catch(() => null),
        ]);

        const allApps: JoinRequest[] = [];
        if (myApps && Array.isArray(myApps)) {
          allApps.push(...myApps.map((a) => mapBackendApplication(a, activeUserId)));
        }
        if (incomingApps && Array.isArray(incomingApps)) {
          allApps.push(...incomingApps.map((a) => mapBackendApplication(a, activeUserId)));
        }
        if (allApps.length > 0) {
          setRequests(allApps);
        }

        if (backendNotices && Array.isArray(backendNotices)) {
          const mappedNotices = backendNotices.map(mapBackendNotification);
          if (mappedNotices.length > 0) setNotices(mappedNotices);
        }
      }
    } catch {
      // Graceful fallback to initial values if network/API is temporarily unavailable
    }
  }, []);

  // Check stored tokens on mount
  useEffect(() => {
    let generation = 0;
    function resetSession() {
      generation++;
      setSignedIn(false);
      setVerified(false);
      setCurrentUserId(undefined);
      setCurrentUserRole("STUDENT");
    }

    async function initializeSession() {
      const request = ++generation;
      await Promise.resolve();
      if (request !== generation) return;
      const tokens = getStoredTokens();
      if (!tokens.accessToken && !tokens.refreshToken) {
        resetSession();
        await loadPlatformData();
        return;
      }

      try {
        const user = await authApi.me();
        if (request !== generation) return;
        setCurrentUserId(user.userId);
        setCurrentUserRole(user.systemRole || "STUDENT");
        setSignedIn(true);
        setVerified(user.accountStatus === "ACTIVE");
        const full = await profilesApi.getOwnProfile().catch(() => null);
        if (request !== generation) return;
        if (full) setProfile(mapBackendStudent(full, user.userId));
        await loadPlatformData(user.userId, user.systemRole);
      } catch (err) {
        if (request !== generation) return;
        const status = (err as { status?: number }).status;
        if ((status === 401 || status === 403) &&
            getStoredTokens().refreshToken === tokens.refreshToken) {
          clearStoredTokens();
        } else {
          resetSession();
          setAuthMessage("Could not restore your session. Reload to try again.");
        }
      }
    }

    function syncOtherTab(event: StorageEvent) {
      if (event.key === "collabryd_refresh_token" || event.key === null) {
        void initializeSession();
      }
    }
    window.addEventListener("storage", syncOtherTab);
    window.addEventListener("collabryd-signout", resetSession);
    void initializeSession();
    return () => {
      generation++;
      window.removeEventListener("storage", syncOtherTab);
      window.removeEventListener("collabryd-signout", resetSession);
    };
  }, [loadPlatformData]);

  const [liveSocket] = useState(createLiveSocket);

  // Connect live notifications via Socket.IO
  useEffect(() => {
    if (!signedIn) return;
    const disconnect = connectLiveSocket(liveSocket, (notice) => {
      const mapped = mapBackendNotification(notice);
      setNotices((current) => [mapped, ...current]);
      setFeedback(notice.title);
    });
    return disconnect;
  }, [signedIn, currentUserId, liveSocket]);

  async function openDemo() {
    const error = await login("aarav.sharma@campus.edu", "Password123!");
    if (error) {
      setAuthMessage(error);
      window.location.hash = "/login";
    }
  }

  // Real login against backend
  async function login(email: string, pass: string): Promise<string | undefined> {
    setAuthMessage("");
    try {
      const res = await authApi.login({ email, password: pass });
      setCurrentUserId(res.user.userId);
      setCurrentUserRole(res.user.systemRole || "STUDENT");
      setSignedIn(true);
      const isActive = res.user.accountStatus === "ACTIVE";
      setVerified(isActive);

      const own = await profilesApi.getOwnProfile().catch(() => null);
      if (own) setProfile(mapBackendStudent(own, res.user.userId));
      await loadPlatformData(res.user.userId, res.user.systemRole);

      if (isActive) {
        window.location.hash = res.user.email === onboardingEmail.current ? "/onboarding" : "/dashboard";
        onboardingEmail.current = "";
      } else {
        window.location.hash = "/verify-campus";
      }
      return undefined;
    } catch (err) {
      const error = err as Error & { code?: string };
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setPendingEmail(email);
        setVerificationToken("");
        window.location.hash = "/verify-campus";
        return undefined;
      }
      return error.message || "Failed to log in";
    }
  }

  // Real registration against backend
  async function registerStudentAccount(data: {
    email: string;
    password: string;
    name: string;
    branch?: string;
    year?: string;
  }): Promise<string | undefined> {
    setAuthMessage("");
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        displayName: data.name,
        institution: "Collabryd Campus",
        courseProgram: data.branch || "Computer Science",
        academicYear: data.year || "1st year",
        department: data.branch,
      });

      setPendingEmail(data.email);
      setVerificationToken(res.verificationToken || "");
      window.location.hash = "/verify-campus";
      return undefined;
    } catch (err) {
      const error = err as Error & { code?: string };
      if (error.code === "EMAIL_DELIVERY_UNAVAILABLE") {
        setPendingEmail(data.email);
        setVerificationToken("");
        setAuthMessage(error.message);
        window.location.hash = "/verify-campus";
        return undefined;
      }
      return error.message || "Registration failed";
    }
  }

  // Real email verification
  async function verifyEmailToken(token: string): Promise<string | undefined> {
    try {
      const user = await authApi.verifyEmail(token);
      onboardingEmail.current = user.email;
      setPendingEmail(user.email);
      setVerificationToken("");
      setAuthMessage("Email verified. Sign in to continue.");
      window.location.replace("#/login");
      return undefined;
    } catch (err) {
      const error = err as Error;
      return error.message || "Invalid or expired verification token";
    }
  }

  // Real OTP login
  async function loginWithOtp(email: string, otp: string): Promise<string | undefined> {
    setAuthMessage("");
    try {
      const res = await authApi.loginWithOtp(email, otp);
      setCurrentUserId(res.user.userId);
      setCurrentUserRole(res.user.systemRole || "STUDENT");
      setSignedIn(true);
      const isActive = res.user.accountStatus === "ACTIVE";
      setVerified(isActive);

      const own = await profilesApi.getOwnProfile().catch(() => null);
      if (own) setProfile(mapBackendStudent(own, res.user.userId));
      await loadPlatformData(res.user.userId, res.user.systemRole);

      if (isActive) {
        window.location.hash = res.user.email === onboardingEmail.current ? "/onboarding" : "/dashboard";
        onboardingEmail.current = "";
      } else {
        window.location.hash = "/verify-campus";
      }
      return undefined;
    } catch (err) {
      const error = err as Error & { code?: string };
      return error.message || "Failed to log in with code";
    }
  }

  async function sendLoginOtp(email: string): Promise<{ success: boolean; message: string; otp?: string }> {
    try {
      const res = await authApi.sendOtp(email, "LOGIN");
      return { success: true, message: res.message, otp: res.otp };
    } catch (err) {
      const error = err as Error;
      return { success: false, message: error.message || "Failed to send login code" };
    }
  }

  function signOut() {
    void authApi.logout().catch(() => {
      setAuthMessage("Signed out of this browser. The server could not confirm logout.");
      window.location.hash = "/login";
    });
    setAuthMessage("");
    onboardingEmail.current = "";
    setPendingEmail("");
    setVerificationToken("");
    setSignedIn(false);
    setVerified(false);
    setCurrentUserId(undefined);
    setCurrentUserRole("STUDENT");
    setFeedback("");
    window.location.hash = "/";
  }

  function saveProfile(next: Person) {
    setProfile(next);
    notify("Your profile has been updated.", "#/settings/profile");

    // Sync to backend asynchronously
    profilesApi
      .updateOwnProfile({
        displayName: next.name?.trim() || "Student",
        bio: next.bio || "",
        department: next.branch || "Computer Science",
        academicYear: next.year || "3rd Year",
        institution: next.institution || profile.institution || "Collabryd Campus",
        courseProgram: next.courseProgram || profile.courseProgram || "B.Tech Computer Science",
        availabilityStatus: next.available ? "AVAILABLE" : "BUSY",
        profileVisibility: "CAMPUS_ONLY",
      })
      .then(() => {
        // Sync skills if catalog matches
        if (catalogSkillsRef.current.length > 0 && next.skills.length > 0) {
          const matchedSkills = next.skills
            .map((sName) => {
              const found = catalogSkillsRef.current.find(
                (cs) => cs.name.toLowerCase() === sName.toLowerCase()
              );
              return found
                ? { skillId: found.skillId, proficiencyLevel: "INTERMEDIATE" as const }
                : null;
            })
            .filter(Boolean) as Array<{ skillId: number; proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" }>;
          if (matchedSkills.length > 0) {
            void profilesApi.replaceSkills(matchedSkills);
          }
        }
      })
      .catch((err) => {
        const error = err as Error;
        setFeedback(`Could not save profile to server: ${error.message || "Request failed"}`);
      });
  }

  function createTeam(values: Omit<Team, "id" | "members" | "leaderId" | "status">) {
    const capacityError = teamCapacityError(values.capacity, 1);
    if (capacityError) return capacityError;

    const localId = crypto.randomUUID();
    const newTeam: Team = {
      ...values,
      id: localId,
      members: ["you"],
      leaderId: "you",
      status: "Recruiting",
    };
    setTeams((current) => [newTeam, ...current]);
    notify("Your team is ready.", `#/teams/${newTeam.id}`);
    window.location.hash = `/teams/${newTeam.id}`;

    const desc = values.description.trim().length >= 10
      ? values.description.trim()
      : `${values.description.trim()} — A new project team on Collabryd.`;
    const summary = desc.slice(0, 180);

    // Sync to backend
    projectsApi
      .create({
        title: values.name.trim(),
        summary,
        description: desc,
        category: values.domain?.trim() || "Developer tools",
        projectType: "HACKATHON",
        status: "OPEN",
        visibility: "CAMPUS_ONLY",
        minTeamSize: 1,
        maxTeamSize: values.capacity,
      })
      .then((created) => {
        setTeams((current) =>
          current.map((t) => (t.id === localId ? mapBackendProject(created, currentUserId) : t))
        );
        window.location.hash = `/teams/${created.projectId}`;
      })
      .catch((err) => {
        const error = err as Error;
        setFeedback(`Could not save team to server: ${error.message || "Request failed"}`);
      });

    return "";
  }

  function applyToTeam(teamId: string, message: string) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return "This team is no longer available.";
    const error = joinRequestError(team, "you", requests);
    if (error) return error;

    const localId = crypto.randomUUID();
    setRequests((current) => [
      ...current,
      {
        id: localId,
        teamId,
        personId: "you",
        message,
        status: "Pending",
      },
    ]);
    notify("Your join request is pending.", "#/my-teams");

    const pid = Number(teamId);
    if (Number.isFinite(pid)) {
      applicationsApi
        .submit(pid, { message })
        .then((created) => {
          setRequests((current) =>
            current.map((r) =>
              r.id === localId ? mapBackendApplication(created, currentUserId) : r
            )
          );
        })
        .catch(() => {});
    }

    return "";
  }

  function reviewRequest(id: string, accept: boolean) {
    const request = requests.find((item) => item.id === id);
    const team = teams.find((item) => item.id === request?.teamId);
    if (!request || request.status !== "Pending" || !team || team.leaderId !== "you")
      return;
    if (
      accept &&
      (team.members.length >= team.capacity || team.status !== "Recruiting")
    ) {
      setFeedback("This team is full or no longer recruiting. The request is still pending.");
      return;
    }
    const applicant = people.find((person) => person.id === request.personId);
    if (accept && applicant?.status && applicant.status !== "Active") {
      setFeedback("This applicant no longer has active campus access.");
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: accept ? "Accepted" : "Declined" } : item
      )
    );
    if (accept) {
      setTeams((current) =>
        current.map((item) =>
          item.id === team.id
            ? { ...item, members: [...new Set([...item.members, request.personId])] }
            : item
        )
      );
    }
    notify(
      accept ? "Your team has a new member." : "The request was declined.",
      `#/teams/${team.id}`
    );

    const appId = Number(id);
    if (Number.isFinite(appId)) {
      if (accept) {
        applicationsApi.accept(appId).catch(() => {});
      } else {
        applicationsApi.reject(appId).catch(() => {});
      }
    }
  }

  function cancelRequest(id: string) {
    setRequests((current) =>
      current.map((item) =>
        item.id === id && item.personId === "you" && item.status === "Pending"
          ? { ...item, status: "Cancelled" }
          : item
      )
    );
    notify("Your request was cancelled.", "#/my-teams");

    const appId = Number(id);
    if (Number.isFinite(appId)) {
      applicationsApi.withdraw(appId).catch(() => {});
    }
  }

  function respondToInvite(id: string, accept: boolean) {
    const invitation = invitations.find((item) => item.id === id);
    const team = teams.find((item) => item.id === invitation?.teamId);
    if (!invitation || invitation.status !== "Pending" || !team) return;
    if ((invitation.personId || "you") !== "you") return;
    if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() <= Date.now()) {
      setInvitations((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "Expired" } : item))
      );
      setFeedback("This invitation has expired. Ask the team leader for a new one.");
      return;
    }
    if (accept && (team.members.length >= team.capacity || team.status !== "Recruiting")) {
      setFeedback("This team has no open places now. The invitation could not be accepted.");
      return;
    }
    setInvitations((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: accept ? "Accepted" : "Declined" } : item
      )
    );
    if (accept) {
      setTeams((current) =>
        current.map((item) =>
          item.id === team.id
            ? { ...item, members: [...new Set([...item.members, "you"])] }
            : item
        )
      );
    }
    notify(accept ? "You joined a team." : "The invitation was declined.", "#/my-teams");
  }

  function invitePerson(personId: string, teamId: string) {
    const team = teams.find((item) => item.id === teamId);
    if (
      !team ||
      team.leaderId !== "you" ||
      team.status !== "Recruiting" ||
      team.members.length >= team.capacity ||
      team.members.includes(personId)
    )
      return "Choose an owned recruiting team with an open place.";
    const person = people.find((item) => item.id === personId);
    if (!person || blockedIds.includes(personId) || (person.status && person.status !== "Active"))
      return "This profile cannot receive an invitation.";
    if (
      invitations.some(
        (item) =>
          item.teamId === teamId && item.personId === personId && item.status === "Pending"
      )
    )
      return "This person already has a pending invitation to that team.";

    setInvitations((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        teamId,
        personId,
        status: "Pending",
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
    ]);
    notify("Invitation sent.", `#/teams/${teamId}`);
    return "";
  }

  function changeTeamStatus(id: string, status: Team["status"]) {
    setTeams((current) =>
      current.map((team) =>
        team.id === id && team.leaderId === "you" ? { ...team, status } : team
      )
    );
    notify(`Recruitment is now ${status.toLowerCase()}.`, `#/teams/${id}`);

    const pid = Number(id);
    if (Number.isFinite(pid)) {
      const backendStatus =
        status === "Recruiting" ? "OPEN" : status === "Closed" ? "IN_PROGRESS" : "ARCHIVED";
      projectsApi.updateStatus(pid, backendStatus).catch(() => {});
    }
  }

  function submitReport(target: string, reason: string) {
    setReports((current) => [
      ...current,
      { id: crypto.randomUUID(), target, reason, status: "Open" },
    ]);
    setFeedback("Report submitted to moderation review queue.");
  }

  function updateTeam(id: string, values: Partial<Team>) {
    const team = teams.find((item) => item.id === id);
    if (!team || team.leaderId !== "you")
      return "Only the team leader can edit this team.";
    const error = teamCapacityError(values.capacity ?? team.capacity, team.members.length);
    if (error) return error;

    setTeams((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              ...values,
              id: item.id,
              leaderId: item.leaderId,
              members: item.members,
            }
          : item
      )
    );
    notify("Your team has been updated.", `#/teams/${id}`);

    const pid = Number(id);
    if (Number.isFinite(pid)) {
      const desc = values.description
        ? (values.description.trim().length >= 10 ? values.description.trim() : `${values.description.trim()} — Collabryd project.`)
        : undefined;

      projectsApi
        .update(pid, {
          title: values.name?.trim(),
          description: desc,
          summary: desc ? desc.slice(0, 180) : undefined,
          category: values.domain?.trim(),
          maxTeamSize: values.capacity,
        })
        .catch((err) => {
          const error = err as Error;
          setFeedback(`Could not save team changes to server: ${error.message || "Request failed"}`);
        });
    }

    return "";
  }

  function removeMember(teamId: string, personId: string) {
    const team = teams.find((item) => item.id === teamId);
    if (!team || team.leaderId !== "you" || personId === team.leaderId)
      return "Transfer leadership before removing the leader.";

    setTeams((current) =>
      current.map((item) =>
        item.id === teamId
          ? { ...item, members: item.members.filter((id) => id !== personId) }
          : item
      )
    );
    notify("The member was removed from this team.", `#/teams/${teamId}`);

    const pid = Number(teamId);
    const uid = Number(personId);
    if (Number.isFinite(pid) && Number.isFinite(uid)) {
      membersApi.remove(pid, uid).catch(() => {});
    }

    return "";
  }

  function transferLeadership(teamId: string, personId: string) {
    const team = teams.find((item) => item.id === teamId);
    const nextLeader = people.find((person) => person.id === personId);
    if (
      !team ||
      team.leaderId !== "you" ||
      personId === "you" ||
      !team.members.includes(personId) ||
      !nextLeader ||
      (nextLeader.status && nextLeader.status !== "Active")
    )
      return "Choose another current member to lead the team.";

    setTeams((current) =>
      current.map((item) => (item.id === teamId ? { ...item, leaderId: personId } : item))
    );
    notify("Leadership transferred. You remain a member.", `#/teams/${teamId}`);

    const pid = Number(teamId);
    const uid = Number(personId);
    if (Number.isFinite(pid) && Number.isFinite(uid)) {
      membersApi.updateRole(pid, uid, "ADMIN").catch(() => {});
    }

    return "";
  }

  function leaveTeam(teamId: string) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return "This team is unavailable.";
    if (team.leaderId === "you" && team.status !== "Archived")
      return "Transfer leadership or archive the team before leaving.";

    setTeams((current) =>
      current.map((item) =>
        item.id === teamId
          ? {
              ...item,
              members: item.members.filter((id) => id !== "you"),
              leaderId: item.leaderId === "you" ? "" : item.leaderId,
            }
          : item
      )
    );
    notify("You left the team.", "#/my-teams");

    const pid = Number(teamId);
    if (Number.isFinite(pid) && currentUserId) {
      membersApi.remove(pid, currentUserId).catch(() => {});
    }

    return "";
  }

  function revokeInvitation(id: string) {
    const invitation = invitations.find((item) => item.id === id);
    const team = teams.find((item) => item.id === invitation?.teamId);
    if (!team || team.leaderId !== "you" || invitation?.status !== "Pending") return;

    setInvitations((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "Revoked" } : item))
    );
    notify("The invitation was revoked.", `#/teams/${team.id}`);
  }

  function reviewStudent(id: string, status: NonNullable<Person["status"]>) {
    setPeople((current) =>
      current.map((person) => (person.id === id ? { ...person, status } : person))
    );

    const uid = id === "you" && currentUserId ? currentUserId : Number(id);
    if (Number.isFinite(uid)) {
      const action =
        status === "Suspended"
          ? adminApi.suspendUser(uid, "Moderated by administrator")
          : adminApi.activateUser(uid, "Restored by administrator");

      action
        .then(() => {
          notify(`Student status changed to ${status.toLowerCase()}.`, "#/admin/users");
        })
        .catch((err) => {
          const error = err as Error;
          setFeedback(`Could not update student status on server: ${error.message || "Admin access required"}`);
        });
    } else {
      saveMockReview(id, status);
      notify(`Student status changed to ${status.toLowerCase()}.`, "#/admin/users");
    }
  }

  function moderateTeam(id: string, status: Team["status"]) {
    const team = teams.find((item) => item.id === id);
    if (status === "Recruiting" && !team?.leaderId) {
      setFeedback("This archived team has no leader and cannot reopen recruitment.");
      return;
    }
    setTeams((current) =>
      current.map((t) => (t.id === id ? { ...t, status } : t))
    );

    const pid = Number(id);
    if (Number.isFinite(pid)) {
      const backendStatus =
        status === "Recruiting" ? "OPEN" : status === "Closed" ? "IN_PROGRESS" : "ARCHIVED";
      adminApi
        .moderateProject(pid, backendStatus, "Moderated by admin")
        .then(() => {
          notify(`Team status changed to ${status.toLowerCase()}.`, "#/admin/teams");
        })
        .catch((err) => {
          const error = err as Error;
          setFeedback(`Could not update team status on server: ${error.message || "Admin access required"}`);
        });
    } else {
      notify(`Team status changed to ${status.toLowerCase()}.`, "#/admin/teams");
    }
  }

  function saveEvent(values: Hackathon) {
    if (!isHttpUrl(values.officialUrl || "") || !isHttpUrl(values.sourceUrl || ""))
      return "Use a full http:// or https:// link.";
    if (!values.name.trim() || !values.organizer?.trim() || !values.eligibility?.trim())
      return "Add the event name, organizer and eligibility.";
    if (
      !Number.isFinite(new Date(values.date).getTime()) ||
      !Number.isFinite(new Date(values.deadline).getTime())
    )
      return "Add valid event and deadline dates.";
    if (new Date(values.deadline).getTime() > new Date(values.date).getTime())
      return "The registration deadline must be on or before the start.";

    const event = { ...values, updatedAt: new Date().toISOString() };
    const existing = events.find((item) => item.id === event.id);

    setEvents((current) =>
      current.some((item) => item.id === event.id)
        ? current.map((item) => (item.id === event.id ? event : item))
        : [...current, event]
    );
    notify("Event saved successfully.", "#/admin/hackathons");

    // Sync with backend API
    if (existing) {
      eventsApi
        .update(event.id, {
          name: event.name,
          category: event.category,
          description: event.description,
          eventDate: event.date,
          deadline: event.deadline,
          mode: event.mode,
          color: event.color,
          symbol: event.symbol,
          publication: event.publication || "Published",
          organizer: event.organizer,
          eligibility: event.eligibility,
          rules: event.rules,
          officialUrl: event.officialUrl,
          sourceUrl: event.sourceUrl,
        })
        .catch((err) => {
          const error = err as Error;
          setFeedback(`Could not save event to server: ${error.message || "Request failed"}`);
        });
    } else {
      eventsApi
        .create({
          slug: event.id,
          name: event.name,
          category: event.category,
          description: event.description,
          eventDate: event.date,
          deadline: event.deadline,
          mode: event.mode,
          color: event.color,
          symbol: event.symbol,
          publication: event.publication || "Published",
          organizer: event.organizer,
          eligibility: event.eligibility,
          rules: event.rules,
          officialUrl: event.officialUrl,
          sourceUrl: event.sourceUrl,
        })
        .then((created) => {
          setEvents((current) =>
            current.map((item) => (item.id === event.id ? mapBackendEvent(created) : item))
          );
        })
        .catch((err) => {
          const error = err as Error;
          setFeedback(`Could not create event on server: ${error.message || "Request failed"}`);
        });
    }

    return "";
  }

  function setEventPublication(
    id: string,
    publication: NonNullable<Hackathon["publication"]>
  ) {
    setEvents((current) =>
      current.map((event) =>
        event.id === id
          ? { ...event, publication, updatedAt: new Date().toISOString() }
          : event
      )
    );
    notify(`Event is now ${publication.toLowerCase()}.`, "#/admin/hackathons");

    eventsApi.setPublication(id, publication).catch(() => {});
  }

  return {
    signedIn,
    verified,
    profile,
    setProfile,
    teams,
    people,
    events,
    requests,
    invitations,
    notices,
    setNotices,
    reports,
    setReports,
    blockedIds,
    setBlockedIds,
    visible,
    setVisible,
    notificationsEnabled,
    setNotificationsEnabled,
    deletionRequested,
    setDeletionRequested,
    feedback,
    setFeedback,
    currentUserId,
    currentUserRole,
    isAdmin: currentUserRole === "ADMIN",
    liveSocket,
    verificationToken,
    openDemo,
    login,
    loginWithOtp,
    sendLoginOtp,
    registerStudentAccount,
    verifyEmailToken,
    pendingEmail,
    authMessage,
    signOut,
    saveProfile,
    createTeam,
    applyToTeam,
    reviewRequest,
    cancelRequest,
    respondToInvite,
    invitePerson,
    changeTeamStatus,
    submitReport,
    updateTeam,
    removeMember,
    transferLeadership,
    leaveTeam,
    revokeInvitation,
    reviewStudent,
    moderateTeam,
    saveEvent,
    setEventPublication,
    loadPlatformData,
  };
}

export type DemoData = ReturnType<typeof useDemoData>;
