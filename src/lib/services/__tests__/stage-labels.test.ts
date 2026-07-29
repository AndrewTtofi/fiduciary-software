import { describe, expect, it } from "vitest";
import { readStageLabels, DEFAULT_STAGE_LABELS } from "../settings";

describe("readStageLabels", () => {
  it("returns defaults for null/malformed stored values", () => {
    expect(readStageLabels(null)).toEqual(DEFAULT_STAGE_LABELS);
    expect(readStageLabels("nonsense")).toEqual(DEFAULT_STAGE_LABELS);
    expect(readStageLabels(42)).toEqual(DEFAULT_STAGE_LABELS);
  });

  it("merges stored wording over defaults, per stage", () => {
    const merged = readStageLabels({ pending: "Documents received", in_progress: "Submitted to the Registrar" });
    expect(merged).toEqual({
      pending: "Documents received",
      in_progress: "Submitted to the Registrar",
      completed: "Completed",
    });
  });

  it("ignores empty strings and unknown keys", () => {
    const merged = readStageLabels({ pending: "  ", bogus: "x", completed: "Done and delivered" });
    expect(merged.pending).toBe("Pending");
    expect(merged.completed).toBe("Done and delivered");
    expect(merged).not.toHaveProperty("bogus");
  });
});
