import { useState } from "react";
import type { FormEvent } from "react";
import type { DemoData } from "../hooks/useDemoData";
import type { Hackathon, Report } from "../types";
import {
  Avatar,
  Badge,
  Dialog,
  EmptyState,
  Icon,
  PageHeading,
} from "../components/ui";
import { Pagination } from "../components/Pagination";
import { paginate } from "../lib/validation";

export function AdminPage({
  demo,
  view = "",
  eventId,
}: {
  demo: DemoData;
  view?: string;
  eventId?: string;
}) {
  const links = [
    ["Overview", ""],
    ["Students", "users"],
    ["Teams", "teams"],
    ["Hackathons", "hackathons"],
    ["Reports", "reports"],
  ];
  return (
    <>
      <PageHeading
        eyebrow="CAMPUS OPERATIONS & MODERATION"
        title="A little care for the community."
        description="Administrative controls for student directory, team moderation, and campus hackathon listings."
      />
      <div className="flex flex-wrap gap-2.5 mb-6">
        {links.map(([label, path]) => (
          <a
            key={label}
            href={`#/admin${path ? `/${path}` : ""}`}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              path === view
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface text-ink border-border hover:border-primary"
            }`}
            aria-current={path === view ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </div>
      {!view ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <a
              className="bg-surface border border-border rounded-xl p-5 hover:border-primary transition-colors block shadow-sm"
              href="#/admin/users"
            >
              <span className="text-xs text-muted block">Active students</span>
              <strong className="text-2xl sm:text-3xl font-display font-medium text-ink block mt-1">
                {
                  (demo.people || []).filter(
                    (person) => (person.status || "Active") === "Active",
                  ).length
                }
              </strong>
              <p className="text-xs text-muted mt-1">Verified campus members</p>
            </a>
            <a
              className="bg-surface border border-border rounded-xl p-5 hover:border-primary transition-colors block shadow-sm"
              href="#/admin/reports"
            >
              <span className="text-xs text-muted block">Open reports</span>
              <strong className="text-2xl sm:text-3xl font-display font-medium text-ink block mt-1">
                {
                  (demo.reports || []).filter(
                    (report) =>
                      report.status === "Open" ||
                      report.status === "Investigating",
                  ).length
                }
              </strong>
              <p className="text-xs text-muted mt-1">Active moderation items</p>
            </a>
            <a
              className="bg-surface border border-border rounded-xl p-5 hover:border-primary transition-colors block shadow-sm"
              href="#/admin/hackathons"
            >
              <span className="text-xs text-muted block">Published events</span>
              <strong className="text-2xl sm:text-3xl font-display font-medium text-ink block mt-1">
                {
                  (demo.events || []).filter(
                    (event) =>
                      !event.publication || event.publication === "Published",
                  ).length
                }
              </strong>
              <p className="text-xs text-muted mt-1">Manage drafts and listings</p>
            </a>
          </div>
          <div className="bg-soft border-l-4 border-primary p-4 rounded-r-xl my-5 text-sm text-ink leading-relaxed flex items-start gap-3">
            <Icon name="lock" />
            <p>
              The live product must enforce admin roles, campus isolation, audit
              logs and authorization on the server. This demo makes the screens
              available so you can explain and test the frontend.
            </p>
          </div>
        </>
      ) : view === "users" ? (
        <StudentReview demo={demo} />
      ) : view === "teams" ? (
        <TeamReview demo={demo} />
      ) : view === "reports" ? (
        <ReportReview demo={demo} />
      ) : view === "hackathons" ? (
        eventId ? (
          <EventEditor id={eventId} demo={demo} />
        ) : (
          <EventReview demo={demo} />
        )
      ) : (
        <EmptyState
          title="This review page isn’t available."
          description="Choose a campus operation from the links above."
        />
      )}
    </>
  );
}

function StudentReview({ demo }: { demo: DemoData }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [suspending, setSuspending] = useState<string | null>(null);
  const people = (demo.people || []).filter(
    (person) =>
      `${person.name || ""} ${person.branch || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || (person.status || "Active") === status),
  );
  const results = paginate(people, page);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-surface/50 p-3 sm:p-4 rounded-xl border border-border">
        <label className="relative flex items-center flex-1 min-w-[240px]">
          <span className="absolute left-3 text-muted pointer-events-none">
            <Icon name="search" size={18} />
          </span>
          <input
            className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-input-border rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
            aria-label="Search student reviews"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Find a student"
          />
        </label>
        <label className="block min-w-[140px]">
          <span className="sr-only">Student review status</span>
          <select
            className="w-full py-2.5 px-3.5 bg-surface border border-input-border rounded-lg text-sm text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option>Active</option>
            <option>Suspended</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-muted font-medium mb-3" aria-live="polite">
        {people.length} student records
      </p>
      {people.length ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm divide-y divide-border">
          {results.items.map((person) => (
            <article
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-soft/30 transition-colors"
              key={person.id}
            >
              <Avatar name={person.name} color={person.color} />
              <div>
                <h3 className="font-semibold text-ink text-base">{person.name}</h3>
                <p className="text-sm text-muted">
                  {person.branch} · {person.year}
                </p>
                <a
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink border-b border-border pb-1 hover:border-primary hover:text-primary transition-colors"
                  href={`#/users/${person.id}`}
                >
                  View profile <Icon name="arrowUp" size={14} />
                </a>
              </div>
              <Badge>{person.status || "Active"}</Badge>
              <div className="flex flex-wrap items-center gap-2.5">
                {person.status === "Suspended" ? (
                  <button
                    className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold bg-transparent text-primary border border-input-border hover:bg-soft transition-colors cursor-pointer"
                    type="button"
                    onClick={() => demo.reviewStudent(person.id, "Active")}
                  >
                    Restore access
                  </button>
                ) : (
                  <button
                    className="border-0 bg-transparent py-1.5 px-0 text-danger text-sm underline underline-offset-4 cursor-pointer hover:opacity-80 transition-opacity font-medium"
                    type="button"
                    onClick={() => setSuspending(person.id)}
                  >
                    Suspend student
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No student records match."
          description="Try another search or status."
        />
      )}
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        onChange={setPage}
      />
      {suspending && (
        <Dialog
          title="Suspend student profile?"
          onClose={() => setSuspending(null)}
        >
          <p>
            The student will disappear from discovery and cannot receive
            invitations or join teams.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              className="inline-flex items-center justify-center gap-2.5 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-bold bg-transparent text-primary border border-input-border hover:bg-soft transition-colors cursor-pointer"
              type="button"
              onClick={() => setSuspending(null)}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2.5 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-bold bg-danger text-white hover:bg-danger/90 transition-colors cursor-pointer"
              type="button"
              onClick={() => {
                demo.reviewStudent(suspending, "Suspended");
                setSuspending(null);
              }}
            >
              Suspend student profile
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}

function TeamReview({ demo }: { demo: DemoData }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const teams = (demo.teams || []).filter((team) =>
    `${team.name || ""} ${team.domain || ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const results = paginate(teams, page);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-surface/50 p-3 sm:p-4 rounded-xl border border-border">
        <label className="relative flex items-center flex-1 min-w-[240px]">
          <span className="absolute left-3 text-muted pointer-events-none">
            <Icon name="search" size={18} />
          </span>
          <input
            className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-input-border rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
            aria-label="Search team reviews"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search example teams"
          />
        </label>
      </div>
      <p className="text-xs text-muted font-medium mb-3">{teams.length} example teams</p>
      {teams.length ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm divide-y divide-border">
          {results.items.map((team) => (
            <article
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-soft/30 transition-colors"
              key={team.id}
            >
              <span className="w-11 h-11 rounded-xl bg-success-bg text-success grid place-items-center shrink-0">
                <Icon name="people" />
              </span>
              <div>
                <h3 className="font-semibold text-ink text-base">{team.name}</h3>
                <p className="text-sm text-muted">
                  {(team.members?.length || 0)}/{team.capacity || 4} members · {team.domain}
                </p>
                <a
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink border-b border-border pb-1 hover:border-primary hover:text-primary transition-colors"
                  href={`#/teams/${team.id}`}
                >
                  Review team <Icon name="arrowUp" size={14} />
                </a>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Recruitment status
                <select
                  className="py-1.5 px-2.5 bg-surface border border-input-border rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
                  aria-label={`${team.name} recruitment status`}
                  value={team.status}
                  onChange={(event) =>
                    demo.moderateTeam(
                      team.id,
                      event.target.value as
                        "Recruiting" | "Closed" | "Archived",
                    )
                  }
                >
                  <option>Recruiting</option>
                  <option>Closed</option>
                  <option>Archived</option>
                </select>
              </label>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No teams match."
          description="Try a different name or domain."
        />
      )}
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        onChange={setPage}
      />
    </>
  );
}

function ReportReview({ demo }: { demo: DemoData }) {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const reports = (demo.reports || []).filter(
    (report) => !status || report.status === status,
  );
  const results = paginate(reports, page);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-surface/50 p-3 sm:p-4 rounded-xl border border-border">
        <label className="flex items-center gap-2 text-xs text-muted">
          Report status
          <select
            className="py-1.5 px-2.5 bg-surface border border-input-border rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All reports</option>
            <option>Open</option>
            <option>Investigating</option>
            <option>Resolved</option>
            <option>Dismissed</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-muted font-medium mb-3" aria-live="polite">
        {reports.length} reports
      </p>
      {reports.length ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm divide-y divide-border">
          {results.items.map((report) => (
            <article
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-soft/30 transition-colors"
              key={report.id}
            >
              <span className="w-11 h-11 rounded-xl bg-[#f4e6d6] text-[#6a4726] dark:bg-[#3c3026] dark:text-[#f1cba4] grid place-items-center shrink-0">
                <Icon name="lock" />
              </span>
              <div>
                <h3 className="font-semibold text-ink text-base">{report.target}</h3>
                <p className="text-sm text-muted">{report.reason}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                Review outcome
                <select
                  className="py-1.5 px-2.5 bg-surface border border-input-border rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
                  aria-label={`Report for ${report.target}`}
                  value={report.status}
                  onChange={(event) =>
                    demo.setReports((current) =>
                      current.map((item) =>
                        item.id === report.id
                          ? {
                              ...item,
                              status: event.target.value as Report["status"],
                            }
                          : item,
                      ),
                    )
                  }
                >
                  <option>Open</option>
                  <option>Investigating</option>
                  <option>Resolved</option>
                  <option>Dismissed</option>
                </select>
              </label>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="A quiet review queue."
          description="All reports have been reviewed."
          action={
            <a
              href="#/discover"
              className="inline-flex items-center justify-center gap-2.5 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-bold bg-transparent text-primary border border-input-border hover:bg-soft transition-colors cursor-pointer"
            >
              Explore people
            </a>
          }
        />
      )}
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        onChange={setPage}
      />
    </>
  );
}

function EventReview({ demo }: { demo: DemoData }) {
  const [page, setPage] = useState(1);
  const results = paginate(demo.events || [], page);
  return (
    <>
      <div className="flex justify-between items-end gap-4 my-8">
        <div>
          <h2>Keep the next opportunity clear.</h2>
          <p>Draft, publish, edit or archive event listings.</p>
        </div>
        <a
          className="inline-flex items-center justify-center gap-2.5 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-bold bg-accent text-on-accent hover:bg-accent/90 transition-colors cursor-pointer"
          href="#/admin/hackathons/create"
        >
          <Icon name="plus" size={17} />
          Create event listing
        </a>
      </div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm divide-y divide-border">
        {results.items.map((event) => (
          <article
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-soft/30 transition-colors"
            key={event.id}
          >
            <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${event.color}`}>
              <Icon name="calendar" />
            </span>
            <div>
              <h3 className="font-semibold text-ink text-base">{event.name}</h3>
              <p className="text-sm text-muted">
                {event.category} · {event.mode}
              </p>
              <a
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink border-b border-border pb-1 hover:border-primary hover:text-primary transition-colors"
                href={`#/admin/hackathons/${event.id}`}
              >
                Edit listing <Icon name="arrowUp" size={14} />
              </a>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted">
              Publication
              <select
                className="py-1.5 px-2.5 bg-surface border border-input-border rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
                aria-label={`${event.name} publication`}
                value={event.publication || "Published"}
                onChange={(change) =>
                  demo.setEventPublication(
                    event.id,
                    change.target.value as "Draft" | "Published" | "Archived",
                  )
                }
              >
                <option>Draft</option>
                <option>Published</option>
                <option>Archived</option>
              </select>
            </label>
          </article>
        ))}
      </div>
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        onChange={setPage}
      />
    </>
  );
}

function istInput(value?: string) {
  return value
    ? new Date(new Date(value).getTime() + 330 * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
}

function EventEditor({ id, demo }: { id: string; demo: DemoData }) {
  const [error, setError] = useState("");
  const event = demo.events.find((item) => item.id === id);
  if (id !== "create" && !event)
    return (
      <EmptyState
        title="This listing isn’t available."
        description="Return to event management to create an example."
      />
    );
  function save(submit: FormEvent<HTMLFormElement>) {
    submit.preventDefault();
    const form = new FormData(submit.currentTarget);
    const values: Hackathon = {
      id: event?.id || crypto.randomUUID(),
      name: String(form.get("name")).trim(),
      category: String(form.get("category")),
      description: String(form.get("description")).trim(),
      date: `${form.get("date")}:00+05:30`,
      deadline: `${form.get("deadline")}:00+05:30`,
      mode: String(form.get("mode")),
      color: event?.color || "sage",
      symbol: event?.symbol || "✳",
      organizer: String(form.get("organizer")).trim(),
      eligibility: String(form.get("eligibility")).trim(),
      rules: String(form.get("rules")).trim(),
      officialUrl: String(form.get("officialUrl")).trim(),
      sourceUrl: String(form.get("sourceUrl")).trim(),
      publication: form.get("publication") as
        "Draft" | "Published" | "Archived",
    };
    const result = demo.saveEvent(values);
    if (result) setError(result);
    else window.location.assign("#/admin/hackathons");
  }
  return (
    <>
      <a
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-7 transition-colors"
        href="#/admin/hackathons"
      >
        ← Back to event management
      </a>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <form
          className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4"
          onSubmit={save}
        >
          <h2 className="text-xl font-bold text-ink">
            {event ? "Make the details clearer." : "A new reason to build."}
          </h2>
          <label>
            Event name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={event?.name}
            />
          </label>
          <label>
            Organizer (example)
            <input
              name="organizer"
              required
              defaultValue={
                event?.organizer || (event ? "Example campus organizers" : "")
              }
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows={4}
              required
              maxLength={1000}
              defaultValue={event?.description}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label>
              Starts (India Standard Time)
              <input
                name="date"
                type="datetime-local"
                required
                defaultValue={istInput(event?.date)}
              />
            </label>
            <label>
              Deadline (India Standard Time)
              <input
                name="deadline"
                type="datetime-local"
                required
                defaultValue={istInput(event?.deadline)}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label>
              Domain
              <select name="category" defaultValue={event?.category}>
                <option>Sustainability</option>
                <option>Social impact</option>
                <option>Developer tools</option>
                <option>Education</option>
                <option>Open exploration</option>
              </select>
            </label>
            <label>
              Format
              <select name="mode" defaultValue={event?.mode}>
                <option>In person</option>
                <option>Online</option>
                <option>Hybrid</option>
              </select>
            </label>
          </div>
          <label>
            Eligibility
            <textarea
              name="eligibility"
              required
              rows={2}
              defaultValue={
                event?.eligibility ||
                (event ? "Enrolled campus students." : "")
              }
            />
          </label>
          <label>
            Team rules
            <textarea
              name="rules"
              rows={3}
              defaultValue={event?.rules}
              placeholder="Team size and participation requirements"
            />
          </label>
          <label>
            Organizer registration URL (optional)
            <input
              name="officialUrl"
              type="url"
              defaultValue={event?.officialUrl}
              placeholder="https://organizer.example/register"
            />
          </label>
          <label>
            Listing source URL (optional)
            <input
              name="sourceUrl"
              type="url"
              defaultValue={event?.sourceUrl}
              placeholder="https://organizer.example/event"
            />
          </label>
          <label>
            Publication
            <select
              name="publication"
              defaultValue={
                event?.publication || (event ? "Published" : "Draft")
              }
            >
              <option>Draft</option>
              <option>Published</option>
              <option>Archived</option>
            </select>
          </label>
          {error && (
            <p className="text-xs text-danger font-medium mt-1" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <a
              className="inline-flex items-center justify-center gap-2.5 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-bold bg-transparent text-primary border border-input-border hover:bg-soft transition-colors cursor-pointer"
              href="#/admin/hackathons"
            >
              Cancel
            </a>
            <button
              className="inline-flex items-center justify-center gap-2.5 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-bold bg-accent text-on-accent hover:bg-accent/90 transition-colors cursor-pointer"
              type="submit"
            >
              Save event <Icon name="check" size={17} />
            </button>
          </div>
        </form>
        <aside className="bg-soft border border-border rounded-xl p-6 shadow-sm flex flex-col gap-3">
          <h2 className="text-xl font-bold text-ink">
            Good details build trust.
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Enter accurate event guidelines, dates, and links. Approved editors
            must verify eligibility, time zones, and official URLs before
            publishing.
          </p>
        </aside>
      </div>
    </>
  );
}
