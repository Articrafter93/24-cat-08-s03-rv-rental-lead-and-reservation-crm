import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FOLLOW_UP_CLAIM_TIMEOUT_MS } from "./follow-up-claim";

// processFollowUpEvents (Prisma implementation) with Prisma and Resend mocked: an in-memory row
// stands in for the FollowUpEvent table and evaluates the claim's WHERE clause, so the claim logic
// runs for real. It does not prove the database's own atomicity, only that the code relies on a
// single conditional UPDATE for it.
type Row = { status: string; sentAt: Date | null };
type Condition = { status: string; sentAt?: { lt: Date } };

const { rows, sendFollowUpEmail, prisma, failRelease } = vi.hoisted(() => {
  const rows = new Map<string, { status: string; sentAt: Date | null }>();
  const failRelease = { value: false };
  const event = {
    id: "evt_1",
    contactId: "c_1",
    sequenceId: "s_1",
    step: 0,
    contact: { email: "lead@example.com", name: "Lead" },
    sequence: { steps: [{ step: 0, subject: "Following up", template: "t" }] },
  };
  const matches = (row: Row, condition: Condition) =>
    row.status === condition.status && (!condition.sentAt || (row.sentAt !== null && row.sentAt < condition.sentAt.lt));
  const prisma = {
    followUpEvent: {
      findMany: vi.fn(async () => [event]),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; OR: Condition[] }; data: Row }) => {
        const row = rows.get(where.id)!;
        if (!where.OR.some((condition) => matches(row, condition))) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
        if (failRelease.value && data.status === "pending") throw new Error("db down");
        Object.assign(rows.get(where.id)!, data);
      }),
      create: vi.fn(async () => undefined),
    },
    auditLog: { create: vi.fn(async () => undefined) },
    pipelineEntry: { updateMany: vi.fn(async () => ({ count: 0 })) },
  };
  return { rows, sendFollowUpEmail: vi.fn(), prisma, failRelease };
});

vi.mock("@/lib/prisma/client", () => ({ prisma }));
vi.mock("@/lib/email/resend", () => ({
  sendFollowUpEmail,
  sendConfirmationEmail: vi.fn(async () => null),
  sendInternalAlert: vi.fn(async () => null),
}));

const { processFollowUpEvents } = await import("@/lib/data/prisma");

describe("processFollowUpEvents claim (Prisma implementation)", () => {
  beforeEach(() => {
    rows.clear();
    rows.set("evt_1", { status: "pending", sentAt: null });
    sendFollowUpEmail.mockReset();
    failRelease.value = false;
  });

  it("sends a step once when two cron runs overlap, and counts only that send", async () => {
    sendFollowUpEmail.mockResolvedValue({ data: { id: "email_1" }, error: null });
    const [first, second] = await Promise.all([processFollowUpEvents(), processFollowUpEvents()]);
    expect(sendFollowUpEmail).toHaveBeenCalledTimes(1);
    expect(rows.get("evt_1")!.status).toBe("sent");
    expect(first.processed + second.processed).toBe(1);
  });

  it("sends with an idempotency key per event", async () => {
    sendFollowUpEmail.mockResolvedValue({ data: { id: "email_1" }, error: null });
    await processFollowUpEvents();
    expect(sendFollowUpEmail.mock.calls[0][4]).toBe("follow-up-evt_1");
  });

  it("puts the step back to pending when Resend reports an error", async () => {
    sendFollowUpEmail.mockResolvedValue({ data: null, error: { name: "validation_error", message: "bad" } });
    const result = await processFollowUpEvents();
    expect(rows.get("evt_1")).toEqual({ status: "pending", sentAt: null });
    expect(result.errors).toBe(1);
    expect(result.processed).toBe(0);
  });

  it("reports the send error even if releasing the claim fails", async () => {
    sendFollowUpEmail.mockResolvedValue({ data: null, error: { name: "validation_error", message: "bad" } });
    failRelease.value = true;
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await processFollowUpEvents();
    expect(result.errors).toBe(1);
    expect(errors).toHaveBeenCalledWith("[follow-up] could not release a claim", "Error");
    errors.mockRestore();
  });

  it("leaves a fresh claim alone and takes over an abandoned one", async () => {
    sendFollowUpEmail.mockResolvedValue({ data: { id: "email_1" }, error: null });
    rows.set("evt_1", { status: "sending", sentAt: new Date() });
    await processFollowUpEvents();
    expect(sendFollowUpEmail).not.toHaveBeenCalled();

    rows.set("evt_1", { status: "sending", sentAt: new Date(Date.now() - FOLLOW_UP_CLAIM_TIMEOUT_MS - 1000) });
    await processFollowUpEvents();
    expect(sendFollowUpEmail).toHaveBeenCalledTimes(1);
    expect(rows.get("evt_1")!.status).toBe("sent");
  });

  it("marks the step sent when email is disabled (no Resend key)", async () => {
    sendFollowUpEmail.mockResolvedValue(null);
    await processFollowUpEvents();
    expect(rows.get("evt_1")!.status).toBe("sent");
  });
});

describe("processFollowUpEvents claim (in-memory implementation)", () => {
  beforeEach(() => sendFollowUpEmail.mockReset());
  afterEach(() => sendFollowUpEmail.mockReset());

  it("sends a step once when two runs overlap in the same instance", async () => {
    const { localStore } = await import("@/lib/data/local-store");
    const local = await import("@/lib/data/local");
    // The seed has no follow-up events: add one due step for a seeded contact.
    for (const event of localStore.followUpEvents) event.scheduledAt = new Date(Date.now() + 86_400_000);
    const due = {
      id: "evt_local_claim",
      contactId: localStore.contacts[0].id,
      sequenceId: localStore.sequences[0].id,
      step: 0,
      scheduledAt: new Date(0),
      sentAt: null,
      status: "pending",
    };
    localStore.followUpEvents.push(due);
    let release: (value: { data: { id: string }; error: null }) => void = () => {};
    sendFollowUpEmail.mockImplementation(() => new Promise((resolve) => (release = resolve)));

    const first = local.processFollowUpEvents();
    const second = local.processFollowUpEvents();
    await vi.waitFor(() => expect(sendFollowUpEmail).toHaveBeenCalledTimes(1));
    release({ data: { id: "email_1" }, error: null });
    await Promise.all([first, second]);

    expect(sendFollowUpEmail).toHaveBeenCalledTimes(1);
    expect(due.status).toBe("sent");
  });
});
