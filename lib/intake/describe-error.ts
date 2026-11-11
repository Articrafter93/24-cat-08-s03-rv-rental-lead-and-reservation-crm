// Turns an error response from /api/intake/[source] into a message the intake form can show.
// The API returns either a plain string ({ error: "Unauthorized" }) or the flattened zod payload
// ({ error: { formErrors, fieldErrors } }) for validation failures.
type FlattenedErrors = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

export function describeIntakeError(body: unknown, status: number): string {
  const error = (body as { error?: unknown } | null)?.error;
  if (typeof error === "string" && error.trim()) return error;

  if (error && typeof error === "object") {
    const { formErrors = [], fieldErrors = {} } = error as FlattenedErrors;
    const fieldMessages = Object.entries(fieldErrors).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => `${field}: ${message}`),
    );
    const messages = [...formErrors, ...fieldMessages];
    if (messages.length > 0) return messages.join(" · ");
  }

  return `Request failed (HTTP ${status})`;
}
