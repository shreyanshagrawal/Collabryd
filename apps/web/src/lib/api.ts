import { io, type Socket } from "socket.io-client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserSummary {
  userId: number;
  email: string;
  accountStatus: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  systemRole: "STUDENT" | "CAMPUS_ADMIN" | "ADMIN";
  displayName: string | null;
  institution: string | null;
  courseProgram: string | null;
  academicYear: string | null;
  avatarUrl?: string | null;
}

export interface FullProfile {
  userId: number;
  email: string;
  accountStatus: string;
  systemRole: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  institution: string;
  courseProgram: string;
  academicYear: string;
  department: string | null;
  preferredProjectType: string | null;
  availabilityStatus: "AVAILABLE" | "BUSY" | "NOT_LOOKING";
  profileVisibility: "CAMPUS_ONLY" | "PUBLIC" | "PRIVATE";
  skills: Array<{
    skillId: number;
    name: string;
    category: string;
    proficiencyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
    yearsExperience: number | null;
  }>;
  interests: Array<{
    interestId: number;
    name: string;
    domain: string;
  }>;
  preferredRoles: Array<{
    roleId: number;
    name: string;
    description: string | null;
  }>;
  achievements: Array<{
    achievementId: number;
    title: string;
    description: string | null;
    issuer: string | null;
    dateAchieved: string | null;
    url: string | null;
  }>;
  socialLinks: Array<{
    linkId: number;
    platform: string;
    url: string;
  }>;
}

export interface BackendProject {
  projectId: number;
  ownerId: number;
  title: string;
  summary: string;
  description: string;
  category: string;
  projectType: string;
  status: "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  visibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
  minTeamSize: number;
  maxTeamSize: number;
  applicationDeadline: string | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  ownerDisplayName?: string;
  ownerEmail?: string;
  membersCount?: number;
  skills?: Array<{ skillId: number; name: string; isRequired: boolean }>;
  roles?: Array<{ roleId: number; name: string; openPositions: number; description?: string | null }>;
  members?: Array<{
    userId: number;
    role: "OWNER" | "ADMIN" | "MEMBER" | "OBSERVER";
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  }>;
}

export interface BackendApplication {
  applicationId: number;
  projectId: number;
  applicantId: number;
  roleId: number | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  message: string | null;
  createdAt: string;
  updatedAt: string;
  projectTitle?: string;
  roleName?: string | null;
  applicantDisplayName?: string;
  applicantEmail?: string;
}

export interface BackendNotification {
  notificationId: number;
  recipientId: number;
  title: string;
  message: string;
  notificationType: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface BackendEvent {
  eventId: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  eventDate: string;
  deadline: string;
  mode: string;
  color: string;
  symbol: string;
  publication: "Draft" | "Published" | "Archived";
  organizer: string | null;
  eligibility: string | null;
  rules: string | null;
  officialUrl: string | null;
  sourceUrl: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendedProject {
  projectId: number;
  title: string;
  summary: string;
  category: string;
  projectType: string;
  maxTeamSize: number;
  ownerName: string;
  createdAt: string;
  matchedSkillsCount: number;
  matchedSkills: string[];
}

export interface RecommendedCandidate {
  userId: number;
  displayName: string;
  institution: string;
  courseProgram: string;
  academicYear: string;
  availabilityStatus: "AVAILABLE" | "BUSY" | "NOT_LOOKING";
  matchingSkillsCount: number;
  matchedSkills: string[];
}

export interface ConversationParticipant {
  userId: number;
  displayName: string;
  avatarUrl?: string | null;
}

export interface BackendConversation {
  conversationId: number;
  type: "DIRECT" | "GROUP";
  projectId: number | null;
  projectTitle: string | null;
  lastReadSequence: number;
  latestSequence: number;
  unreadMessagesCount: number;
  createdAt: string;
  participants: ConversationParticipant[];
}

export interface BackendMessage {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string | null;
  clientMessageId: string;
  sequenceNumber: number;
  content: string;
  createdAt: string;
}

const ACCESS_TOKEN_KEY = "collabryd_access_token";
const REFRESH_TOKEN_KEY = "collabryd_refresh_token";

export function getStoredTokens(): AuthTokens {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || "",
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || "",
  };
}

export function setStoredTokens(tokens: AuthTokens): void {
  if (tokens.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event("collabryd-signout"));
}

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const pendingRefreshes = new Map<string, Promise<string | null>>();

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  async function rotate() {
    if (getStoredTokens().refreshToken !== refreshToken) return null;
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (getStoredTokens().refreshToken !== refreshToken) return null;
    if (res.status === 401 || res.status === 403) {
      clearStoredTokens();
      return null;
    }
    if (!res.ok) throw new Error(`Unable to refresh the session (HTTP ${res.status}).`);
    const payload: ApiResponse<{ tokens: AuthTokens }> = await res.json();
    if (!payload.data?.tokens) throw new Error("Invalid session refresh response.");
    if (getStoredTokens().refreshToken !== refreshToken) return null;
    setStoredTokens(payload.data.tokens);
    return payload.data.tokens.accessToken;
  }

  // The backend revokes every session if two tabs submit the same refresh token.
  return navigator.locks ? navigator.locks.request("collabryd-refresh", rotate) : rotate();
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const tokens = getStoredTokens();

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated && tokens.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  let res = await fetch(url, { ...options, headers });

  if (authenticated && res.status === 401 && tokens.refreshToken &&
      getStoredTokens().refreshToken === tokens.refreshToken) {
    let refresh = pendingRefreshes.get(tokens.refreshToken);
    if (!refresh) {
      refresh = refreshAccessToken(tokens.refreshToken).finally(() => {
        pendingRefreshes.delete(tokens.refreshToken);
      });
      pendingRefreshes.set(tokens.refreshToken, refresh);
    }
    const newAccessToken = await refresh;
    if (newAccessToken && getStoredTokens().accessToken === newAccessToken) {
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      res = await fetch(url, { ...options, headers });
    }
  }

  if (res.status === 204) {
    return {} as T;
  }

  const payload: ApiResponse<T> = await res.json();
  if (!res.ok || !payload.success) {
    const msg = payload.error?.message || `API Error: ${res.status} ${res.statusText}`;
    const err = new Error(msg) as Error & { code?: string; details?: unknown; status?: number };
    err.code = payload.error?.code;
    err.details = payload.error?.details;
    err.status = res.status;
    throw err;
  }

  return payload.data as T;
}

// ==================== AUTH API ====================

export const authApi = {
  async register(data: {
    email: string;
    password: string;
    displayName: string;
    institution: string;
    courseProgram: string;
    academicYear: string;
    department?: string;
    bio?: string;
    preferredProjectType?: string;
  }) {
    return apiRequest<{
      user: UserSummary;
      profile: unknown;
      verificationToken?: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }, false);
  },

  async verifyEmail(token: string) {
    return apiRequest<UserSummary>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }, false);
  },

  async resendVerification(email: string) {
    return apiRequest<{ message: string; otp?: string; verificationToken?: string }>(
      "/auth/resend-verification",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }, false
    );
  },

  async sendOtp(email: string, purpose: "SIGNUP" | "LOGIN" = "LOGIN") {
    return apiRequest<{ message: string; otp?: string; verificationToken?: string }>(
      "/auth/send-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, purpose }),
      },
      false
    );
  },

  async verifyOtp(email: string, otp: string, purpose?: "SIGNUP" | "LOGIN") {
    return apiRequest<{
      message: string;
      user: UserSummary;
      tokens?: AuthTokens;
    }>(
      "/auth/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, otp, purpose }),
      },
      false
    );
  },

  async loginWithOtp(email: string, otp: string) {
    const res = await apiRequest<{
      user: UserSummary;
      tokens: AuthTokens;
    }>(
      "/auth/login-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      },
      false
    );
    setStoredTokens(res.tokens);
    return res;
  },

  async login(data: { email: string; password: string }) {
    const res = await apiRequest<{
      user: UserSummary;
      tokens: AuthTokens;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }, false);
    setStoredTokens(res.tokens);
    return res;
  },

  async me() {
    return apiRequest<UserSummary & { profile: FullProfile }>("/auth/me");
  },

  async logout() {
    const revoke = async () => {
      const { refreshToken } = getStoredTokens();
      clearStoredTokens();
      if (refreshToken) {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }, false);
      }
    };
    if (navigator.locks) await navigator.locks.request("collabryd-refresh", revoke);
    else await revoke();
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiRequest<{ message: string }>("/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ==================== CATALOG API ====================

export const catalogApi = {
  async getSkills(params?: { search?: string; category?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return apiRequest<Array<{ skillId: number; name: string; category: string }>>(`/catalog/skills${qs ? `?${qs}` : ""}`);
  },

  async getInterests(params?: { search?: string; domain?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.domain) searchParams.set("domain", params.domain);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return apiRequest<Array<{ interestId: number; name: string; domain: string }>>(`/catalog/interests${qs ? `?${qs}` : ""}`);
  },

  async getRoles(params?: { search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return apiRequest<Array<{ roleId: number; name: string; description: string | null }>>(`/catalog/roles${qs ? `?${qs}` : ""}`);
  },
};

// ==================== PROFILES & STUDENTS API ====================

export const profilesApi = {
  async getOwnProfile() {
    return apiRequest<FullProfile>("/profiles/me");
  },

  async updateOwnProfile(data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    institution?: string;
    courseProgram?: string;
    academicYear?: string;
    department?: string;
    preferredProjectType?: string;
    availabilityStatus?: "AVAILABLE" | "BUSY" | "NOT_LOOKING";
    profileVisibility?: "CAMPUS_ONLY" | "PUBLIC" | "PRIVATE";
  }) {
    return apiRequest<FullProfile>("/profiles/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async replaceSkills(skills: Array<{ skillId: number; proficiencyLevel: string; yearsExperience?: number }>) {
    return apiRequest<{ skills: FullProfile["skills"] }>("/profiles/me/skills", {
      method: "PUT",
      body: JSON.stringify({ skills }),
    });
  },

  async replaceInterests(interestIds: number[]) {
    return apiRequest<{ interests: FullProfile["interests"] }>("/profiles/me/interests", {
      method: "PUT",
      body: JSON.stringify({ ids: interestIds }),
    });
  },

  async replacePreferredRoles(roleIds: number[]) {
    return apiRequest<{ preferredRoles: FullProfile["preferredRoles"] }>("/profiles/me/preferred-roles", {
      method: "PUT",
      body: JSON.stringify({ ids: roleIds }),
    });
  },

  async addSocialLink(data: { platform: string; url: string }) {
    return apiRequest("/profiles/me/social-links", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteSocialLink(linkId: number) {
    return apiRequest(`/profiles/me/social-links/${linkId}`, {
      method: "DELETE",
    });
  },
};

export const studentsApi = {
  async discover(params?: {
    search?: string;
    skillId?: number;
    roleId?: number;
    interestId?: number;
    availabilityStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.skillId) sp.set("skillId", String(params.skillId));
    if (params?.roleId) sp.set("roleId", String(params.roleId));
    if (params?.interestId) sp.set("interestId", String(params.interestId));
    if (params?.availabilityStatus) sp.set("availabilityStatus", params.availabilityStatus);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiRequest<FullProfile[]>(`/students${qs ? `?${qs}` : ""}`);
  },

  async getById(userId: number) {
    return apiRequest<FullProfile>(`/students/${userId}`);
  },
};

// ==================== PROJECTS & TEAMS API ====================

export const projectsApi = {
  async list(params?: {
    search?: string;
    projectType?: string;
    status?: string;
    skillId?: number;
    roleId?: number;
    page?: number;
    limit?: number;
  }) {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.projectType) sp.set("projectType", params.projectType);
    if (params?.status) sp.set("status", params.status);
    if (params?.skillId) sp.set("skillId", String(params.skillId));
    if (params?.roleId) sp.set("roleId", String(params.roleId));
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiRequest<BackendProject[]>(`/projects${qs ? `?${qs}` : ""}`);
  },

  async getById(projectId: number) {
    return apiRequest<BackendProject>(`/projects/${projectId}`);
  },

  async create(data: {
    title: string;
    summary: string;
    description: string;
    category: string;
    projectType: string;
    status: "DRAFT" | "OPEN";
    visibility: "PUBLIC" | "CAMPUS_ONLY" | "PRIVATE";
    minTeamSize: number;
    maxTeamSize: number;
    applicationDeadline?: string;
    startDate?: string;
    skills?: Array<{ skillId: number; isRequired: boolean }>;
    roles?: Array<{ roleId: number; openPositions: number; description?: string }>;
  }) {
    return apiRequest<BackendProject>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(projectId: number, data: Partial<BackendProject>) {
    return apiRequest<BackendProject>(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async updateStatus(projectId: number, status: string) {
    return apiRequest<BackendProject>(`/projects/${projectId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async delete(projectId: number) {
    return apiRequest(`/projects/${projectId}`, {
      method: "DELETE",
    });
  },
};

// ==================== MEMBERS API ====================

export const membersApi = {
  async list(projectId: number) {
    return apiRequest<Array<{
      userId: number;
      role: "OWNER" | "ADMIN" | "MEMBER" | "OBSERVER";
      displayName: string;
      email: string;
      avatarUrl?: string | null;
      joinedAt: string;
    }>>(`/projects/${projectId}/members`);
  },

  async updateRole(projectId: number, userId: number, role: "ADMIN" | "MEMBER" | "OBSERVER") {
    return apiRequest(`/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async remove(projectId: number, userId: number) {
    return apiRequest(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
    });
  },
};

// ==================== APPLICATIONS API ====================

export const applicationsApi = {
  async submit(projectId: number, data: { roleId?: number; message?: string }) {
    return apiRequest<BackendApplication>(`/projects/${projectId}/applications`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async listProjectApplications(projectId: number, params?: { status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiRequest<BackendApplication[]>(`/projects/${projectId}/applications${qs ? `?${qs}` : ""}`);
  },

  async listMine(params?: { status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiRequest<BackendApplication[]>(`/applications/me${qs ? `?${qs}` : ""}`);
  },

  async listIncoming(params?: { status?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiRequest<BackendApplication[]>(`/applications/incoming${qs ? `?${qs}` : ""}`);
  },

  async accept(applicationId: number) {
    return apiRequest<BackendApplication>(`/applications/${applicationId}/accept`, {
      method: "POST",
    });
  },

  async reject(applicationId: number) {
    return apiRequest<BackendApplication>(`/applications/${applicationId}/reject`, {
      method: "POST",
    });
  },

  async withdraw(applicationId: number) {
    return apiRequest<BackendApplication>(`/applications/${applicationId}/withdraw`, {
      method: "POST",
    });
  },
};

// ==================== NOTIFICATIONS API ====================

export const notificationsApi = {
  async list(params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.unreadOnly) sp.set("unreadOnly", "true");
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiRequest<BackendNotification[]>(`/notifications${qs ? `?${qs}` : ""}`);
  },

  async getUnreadCount() {
    return apiRequest<{ unreadCount: number }>("/notifications/unread-count");
  },

  async markRead(notificationId: number) {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  async markAllRead() {
    return apiRequest("/notifications/read-all", {
      method: "PATCH",
    });
  },

  async getPreferences() {
    return apiRequest<{
      projectInvites: boolean;
      applicationUpdates: boolean;
      directMessages: boolean;
      teamAnnouncements: boolean;
      emailDigest: boolean;
    }>("/notifications/preferences");
  },

  async updatePreferences(data: Partial<{
    projectInvites: boolean;
    applicationUpdates: boolean;
    directMessages: boolean;
    teamAnnouncements: boolean;
    emailDigest: boolean;
  }>) {
    return apiRequest("/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// ==================== ADMIN API ====================

export const adminApi = {
  async getMetrics() {
    return apiRequest<{
      totalUsers: number;
      activeUsers: number;
      totalProjects: number;
      recruitingProjects: number;
      totalApplications: number;
      totalMessages: number;
    }>("/admin/metrics");
  },

  async getAuditLogs(params?: { page?: number; limit?: number; action?: string }) {
    const sp = new URLSearchParams();
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.action) sp.set("action", params.action);
    const qs = sp.toString();
    return apiRequest<Array<{
      logId: number;
      actorId: number;
      action: string;
      targetType: string;
      targetId: number;
      details: unknown;
      ipAddress: string | null;
      createdAt: string;
    }>>(`/admin/audit-logs${qs ? `?${qs}` : ""}`);
  },

  async listUsers(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<FullProfile[]> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    const res = await apiRequest<FullProfile[]>(`/admin/users${qs ? `?${qs}` : ""}`);
    return res || [];
  },

  async suspendUser(userId: number, reason: string) {
    return apiRequest(`/admin/users/${userId}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async activateUser(userId: number, reason: string) {
    return apiRequest(`/admin/users/${userId}/activate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async moderateProject(projectId: number, status: string, reason: string) {
    return apiRequest(`/admin/projects/${projectId}/moderate`, {
      method: "POST",
      body: JSON.stringify({ status, reason }),
    });
  },

  async overrideProjectStatus(projectId: number, status: string, reason: string) {
    return this.moderateProject(projectId, status, reason);
  },
};

export const eventsApi = {
  async list(params?: {
    category?: string;
    publication?: "Draft" | "Published" | "Archived";
    mode?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BackendEvent[]> {
    const sp = new URLSearchParams();
    if (params?.category) sp.set("category", params.category);
    if (params?.publication) sp.set("publication", params.publication);
    if (params?.mode) sp.set("mode", params.mode);
    if (params?.search) sp.set("search", params.search);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    const res = await apiRequest<BackendEvent[]>(`/events${qs ? `?${qs}` : ""}`);
    return res || [];
  },

  async getBySlug(slug: string): Promise<BackendEvent> {
    return apiRequest<BackendEvent>(`/events/${slug}`);
  },

  async create(data: {
    slug?: string;
    name: string;
    category?: string;
    description: string;
    eventDate: string;
    deadline: string;
    mode?: string;
    color?: string;
    symbol?: string;
    publication?: "Draft" | "Published" | "Archived";
    organizer?: string;
    eligibility?: string;
    rules?: string;
    officialUrl?: string;
    sourceUrl?: string;
  }): Promise<BackendEvent> {
    return apiRequest<BackendEvent>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    slug: string,
    data: Partial<{
      name: string;
      category: string;
      description: string;
      eventDate: string;
      deadline: string;
      mode: string;
      color: string;
      symbol: string;
      publication: "Draft" | "Published" | "Archived";
      organizer: string;
      eligibility: string;
      rules: string;
      officialUrl: string;
      sourceUrl: string;
    }>
  ): Promise<BackendEvent> {
    return apiRequest<BackendEvent>(`/events/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async setPublication(
    slug: string,
    publication: "Draft" | "Published" | "Archived"
  ): Promise<BackendEvent> {
    return apiRequest<BackendEvent>(`/events/${slug}/publication`, {
      method: "PATCH",
      body: JSON.stringify({ publication }),
    });
  },

  async updatePublication(
    slug: string,
    publication: "Draft" | "Published" | "Archived"
  ): Promise<BackendEvent> {
    return this.setPublication(slug, publication);
  },

  async delete(slug: string): Promise<{ deleted: boolean }> {
    return apiRequest<{ deleted: boolean }>(`/events/${slug}`, {
      method: "DELETE",
    });
  },
};

export const recommendationsApi = {
  async getRecommendedProjects(limit = 10): Promise<RecommendedProject[]> {
    const res = await apiRequest<RecommendedProject[]>(
      `/recommendations/projects?limit=${limit}`
    );
    return res || [];
  },

  async getRecommendedCandidates(
    projectId: number,
    limit = 10
  ): Promise<RecommendedCandidate[]> {
    const res = await apiRequest<RecommendedCandidate[]>(
      `/projects/${projectId}/recommendations?limit=${limit}`
    );
    return res || [];
  },
};

export const conversationsApi = {
  async list(): Promise<BackendConversation[]> {
    const res = await apiRequest<BackendConversation[]>("/conversations");
    return res || [];
  },

  async createDirect(recipientId: number): Promise<Pick<BackendConversation, "conversationId">> {
    return apiRequest<Pick<BackendConversation, "conversationId">>("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ recipientId }),
    });
  },

  async getProjectConversation(projectId: number): Promise<Pick<BackendConversation, "conversationId">> {
    return apiRequest<Pick<BackendConversation, "conversationId">>(`/conversations/project/${projectId}`);
  },

  async listMessages(
    conversationId: number,
    params?: {
      afterSequence?: number;
      beforeSequence?: number;
      limit?: number;
    }
  ): Promise<BackendMessage[]> {
    const sp = new URLSearchParams();
    if (params?.afterSequence !== undefined)
      sp.set("afterSequence", String(params.afterSequence));
    if (params?.beforeSequence !== undefined)
      sp.set("beforeSequence", String(params.beforeSequence));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return apiRequest<BackendMessage[]>(
      `/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`
    );
  },

  async sendMessage(
    conversationId: number,
    content: string,
    clientMessageId: string
  ): Promise<Omit<BackendMessage, "senderName" | "senderAvatarUrl">> {
    return apiRequest<Omit<BackendMessage, "senderName" | "senderAvatarUrl">>(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content,
          clientMessageId,
        }),
      }
    );
  },

  async markRead(
    conversationId: number,
    lastReadSequence?: number
  ): Promise<{ lastReadSequence: number }> {
    return apiRequest<{ lastReadSequence: number }>(
      `/conversations/${conversationId}/read`,
      {
        method: "PATCH",
        body: JSON.stringify(
          lastReadSequence !== undefined ? { lastReadSequence } : {}
        ),
      }
    );
  },
};

// ==================== REALTIME WEBSOCKET ====================

export function createLiveSocket(): Socket {
  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
    window.location.origin;

  return io(socketUrl, {
    autoConnect: false,
    auth: (done) => done({ token: getStoredTokens().accessToken }),
    transports: ["polling", "websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
}

export function connectLiveSocket(socket: Socket, onNotification: (notice: BackendNotification) => void) {
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function recover() {
    // Transport failures already use Socket.IO backoff. A rejected/expired JWT needs REST refresh.
    if (closed || socket.active || timer || !getStoredTokens().refreshToken) return;
    timer = setTimeout(async () => {
      timer = undefined;
      try {
        await authApi.me();
        if (!closed) socket.connect();
      } catch {
        recover();
      }
    }, 2000);
  }
  socket.on("notification:new", onNotification);
  socket.on("connect_error", recover);
  socket.on("disconnect", recover);
  socket.connect();
  return () => {
    closed = true;
    clearTimeout(timer);
    socket.off("notification:new", onNotification);
    socket.off("connect_error", recover);
    socket.off("disconnect", recover);
    socket.disconnect();
  };
}
