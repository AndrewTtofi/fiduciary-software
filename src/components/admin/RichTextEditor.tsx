"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* =====================================================================
   Rich-text editor for Insights article bodies.

   Writers see formatted text and click buttons; they never type markdown.
   The value going in and out is still markdown, because that is what the
   public renderer (src/components/marketing/Markdown.tsx) reads and what
   the existing articles are written in — so this is an editing-surface
   change only, with no migration and no new HTML-injection surface.

   The markdown dialect here mirrors that renderer exactly: `## ` / `### `
   headings, `- ` bullets, `**bold**`, `*italic*`, `[text](url)`, blocks
   separated by a blank line. Anything it cannot express is not offered in
   the toolbar, so the round trip stays lossless.
   ===================================================================== */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Inline markdown → HTML: links, then bold, then italic. */
function inlineToHtml(text: string): string {
  let out = esc(text);
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, src) => `<img src="${src}" alt="${alt}">`);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => `<a href="${href}">${label}</a>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  out = out.replace(/\*([^*]+)\*/g, "<i>$1</i>");
  return out;
}

/** Markdown → the HTML shown in the editable surface. */
export function markdownToHtml(md: string): string {
  const blocks = (md ?? "").replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html: string[] = [];
  for (const raw of blocks) {
    const b = raw.trim();
    if (!b) continue;
    if (b.startsWith("### ")) { html.push(`<h3>${inlineToHtml(b.slice(4))}</h3>`); continue; }
    if (b.startsWith("## ")) { html.push(`<h2>${inlineToHtml(b.slice(3))}</h2>`); continue; }
    if (b.startsWith("# ")) { html.push(`<h2>${inlineToHtml(b.slice(2))}</h2>`); continue; }
    const lone = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (lone) { html.push(`<p><img src="${lone[2]}" alt="${lone[1]}"></p>`); continue; }
    const lines = b.split("\n");
    if (lines.every((l) => /^[-*] /.test(l.trim()))) {
      html.push(`<ul>${lines.map((l) => `<li>${inlineToHtml(l.trim().slice(2))}</li>`).join("")}</ul>`);
      continue;
    }
    html.push(`<p>${inlineToHtml(lines.join(" "))}</p>`);
  }
  return html.join("");
}

/** Inline DOM → markdown. */
function inlineToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const inner = Array.from(el.childNodes).map(inlineToMarkdown).join("");
  switch (el.tagName) {
    case "BR":
      return " ";
    case "IMG": {
      const src = el.getAttribute("src") ?? "";
      return src ? `![${el.getAttribute("alt") ?? ""}](${src})` : "";
    }
    case "B":
    case "STRONG":
      return inner.trim() ? `**${inner}**` : inner;
    case "I":
    case "EM":
      return inner.trim() ? `*${inner}*` : inner;
    case "A": {
      const href = el.getAttribute("href") ?? "";
      return href ? `[${inner}](${href})` : inner;
    }
    default:
      return inner;
  }
}

/** The editable surface's HTML → markdown. */
export function htmlToMarkdown(root: HTMLElement): string {
  const blocks: string[] = [];

  const pushBlock = (s: string) => {
    const t = s.replace(/ /g, " ").replace(/[ \t]+/g, " ").trim();
    if (t) blocks.push(t);
  };

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) { pushBlock(node.nodeValue ?? ""); continue; }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;

    switch (el.tagName) {
      case "H1":
      case "H2":
        pushBlock(`## ${inlineToMarkdown(el)}`);
        break;
      case "H3":
      case "H4":
      case "H5":
      case "H6":
        pushBlock(`### ${inlineToMarkdown(el)}`);
        break;
      case "UL":
      case "OL": {
        // The public renderer only draws unordered lists, so both map to `- `.
        const items = Array.from(el.querySelectorAll(":scope > li"))
          .map((li) => `- ${inlineToMarkdown(li).replace(/\s+/g, " ").trim()}`)
          .filter((l) => l !== "- ");
        if (items.length) blocks.push(items.join("\n"));
        break;
      }
      case "BR":
        break;
      default:
        pushBlock(inlineToMarkdown(el));
    }
  }
  return blocks.join("\n\n");
}

type FormatState = { bold: boolean; italic: boolean; h2: boolean; h3: boolean; ul: boolean };
type CmdId = "bold" | "italic" | "h2" | "h3" | "ul" | "link" | "unlink";

/* Static button data. Deliberately holds no closures: an array of callbacks
   built during render would capture the editor refs, and reading a ref while
   rendering is neither pure nor reliable. The click handler dispatches on id. */
const BUTTONS: { id: CmdId; label: string; title: string; activeKey?: keyof FormatState }[] = [
  { id: "bold", label: "B", title: "Bold (Ctrl+B)", activeKey: "bold" },
  { id: "italic", label: "I", title: "Italic (Ctrl+I)", activeKey: "italic" },
  { id: "h2", label: "Heading", title: "Section heading", activeKey: "h2" },
  { id: "h3", label: "Subheading", title: "Sub-heading", activeKey: "h3" },
  { id: "ul", label: "• List", title: "Bullet list", activeKey: "ul" },
  { id: "link", label: "Link", title: "Add a link" },
  { id: "unlink", label: "Unlink", title: "Remove the link" },
];

export function RichTextEditor({
  value,
  onChange,
  rows = 18,
}: {
  value: string;
  onChange: (markdown: string) => void;
  rows?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // What we last handed to onChange. Re-writing innerHTML on every keystroke
  // would destroy the caret, so we only sync when the value changed elsewhere
  // (loading a different article, or the plain-text toggle).
  const lastEmitted = useRef<string | null>(null);
  const [plainText, setPlainText] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Which buttons look "on". Held in state and refreshed from events rather
  // than queried while rendering — the document selection is external mutable
  // state, and reading it during render is neither pure nor reliable.
  const [fmt, setFmt] = useState<FormatState>({ bold: false, italic: false, h2: false, h3: false, ul: false });

  useEffect(() => {
    const el = ref.current;
    if (!el || plainText) return;
    if (value === lastEmitted.current) return;
    el.innerHTML = markdownToHtml(value) || "<p><br></p>";
    lastEmitted.current = value;
  }, [value, plainText]);

  const syncFormat = useCallback(() => {
    try {
      const block = document.queryCommandValue("formatBlock").toLowerCase();
      setFmt({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        h2: block === "h2",
        h3: block === "h3",
        ul: document.queryCommandState("insertUnorderedList"),
      });
    } catch {
      // Older engines refuse these queries; an unlit toolbar still works.
    }
  }, []);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const md = htmlToMarkdown(el);
    lastEmitted.current = md;
    onChange(md);
  }, [onChange]);

  function exec(command: string, arg?: string) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    // Emit tags (<b>, <i>) rather than inline-styled spans, which serialise cleanly.
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, arg);
    emit();
    syncFormat();
  }

  function toggleBlock(tag: "h2" | "h3") {
    const current = document.queryCommandValue("formatBlock").toLowerCase();
    exec("formatBlock", current === tag ? "p" : tag);
  }

  async function insertPhoto(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) throw new Error(j.error ?? "Upload failed");
      // Alt text matters for search and screen readers; offer the filename as a
      // starting point rather than leaving it blank.
      const alt = window.prompt("Describe the photo (used by search engines and screen readers)", file.name.replace(/\.[^.]+$/, "")) ?? "";
      exec("insertHTML", `<p><img src="${j.url}" alt="${alt.replace(/"/g, "&quot;")}"></p><p><br></p>`);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const url = window.prompt("Link address (include https://)", "https://");
    if (!url) return;
    exec("createLink", url);
  }

  function runCommand(id: CmdId) {
    switch (id) {
      case "bold": return exec("bold");
      case "italic": return exec("italic");
      case "h2": return toggleBlock("h2");
      case "h3": return toggleBlock("h3");
      case "ul": return exec("insertUnorderedList");
      case "link": return addLink();
      case "unlink": return exec("unlink");
    }
  }

  return (
    <div className="rte">
      <div className="rte-bar" role="toolbar" aria-label="Formatting">
        {!plainText && BUTTONS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`rte-btn${c.activeKey && fmt[c.activeKey] ? " active" : ""}${c.id === "bold" ? " rte-b" : ""}${c.id === "italic" ? " rte-i" : ""}`}
            title={c.title}
            aria-label={c.title}
            // Keep the selection: mousedown would blur the editable surface first.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(c.id)}
          >
            {c.label}
          </button>
        ))}
        <button
          type="button"
          className="rte-btn"
          title="Upload a photo into the article"
          disabled={uploading || plainText}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void insertPhoto(f);
          }}
        />
        <button
          type="button"
          className="rte-btn rte-plain"
          onClick={() => setPlainText((p) => !p)}
          title="Switch between formatted writing and the raw text"
        >
          {plainText ? "← Back to formatting" : "Edit as plain text"}
        </button>
      </div>

      {uploadError && <p className="rte-error">{uploadError}</p>}

      {plainText ? (
        <textarea
          className="rte-area rte-raw"
          rows={rows}
          value={value}
          onChange={(e) => { lastEmitted.current = e.target.value; onChange(e.target.value); }}
        />
      ) : (
        <div
          ref={ref}
          className="rte-area"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Article body"
          style={{ minHeight: `${rows * 1.6}em` }}
          onInput={emit}
          onBlur={emit}
          onKeyUp={syncFormat}
          onMouseUp={syncFormat}
          // Paste as plain text: pasting from Word or a web page otherwise drags
          // in fonts and colours that the markdown dialect cannot represent.
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            emit();
          }}
        />
      )}
    </div>
  );
}
