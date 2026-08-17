import { describe, expect, it } from "vitest";
import { extractHeadings, headingId } from "@/components/marketing/Markdown";

describe("Markdown headings", () => {
  it("derives stable anchor ids", () => {
    expect(headingId("Who qualifies for Non-Dom?")).toBe("who-qualifies-for-non-dom");
  });

  it("extracts H2/H3 in document order for the contents list", () => {
    const md = "Intro para\n\n## First\n\ntext\n\n### Sub\n\n## Second";
    expect(extractHeadings(md)).toEqual([
      { level: 2, text: "First", id: "first" },
      { level: 3, text: "Sub", id: "sub" },
      { level: 2, text: "Second", id: "second" },
    ]);
  });
});
