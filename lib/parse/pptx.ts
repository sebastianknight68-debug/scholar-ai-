import unzipper from "unzipper";
import { Readable } from "node:stream";

// Extract text from a .pptx (zip with ppt/slides/slide*.xml).
// Strips XML tags from each slide and concatenates with a slide separator.
export async function extractPptxText(buf: Buffer): Promise<string> {
  const stream = Readable.from(buf);
  const slides: { name: string; xml: string }[] = [];

  await new Promise<void>((resolve, reject) => {
    stream
      .pipe(unzipper.Parse())
      .on("entry", async (entry) => {
        const name: string = entry.path;
        if (/^ppt\/slides\/slide\d+\.xml$/.test(name)) {
          try {
            const chunks: Buffer[] = [];
            for await (const c of entry) chunks.push(c as Buffer);
            slides.push({ name, xml: Buffer.concat(chunks).toString("utf8") });
          } catch (e) {
            reject(e);
            return;
          }
        } else {
          entry.autodrain();
        }
      })
      .on("close", () => resolve())
      .on("error", reject);
  });

  // sort slide1, slide2, … numerically
  slides.sort((a, b) => slideNum(a.name) - slideNum(b.name));

  return slides
    .map((s, i) => `--- Slide ${i + 1} ---\n${stripXml(s.xml)}`)
    .join("\n\n");
}

function slideNum(p: string): number {
  const m = p.match(/slide(\d+)\.xml/);
  return m ? parseInt(m[1], 10) : 0;
}

// Pull text from <a:t>…</a:t> elements; fall back to stripping all tags.
function stripXml(xml: string): string {
  const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
  if (matches && matches.length > 0) {
    return matches
      .map((m) => m.replace(/<a:t[^>]*>/, "").replace(/<\/a:t>/, ""))
      .map(decodeEntities)
      .filter(Boolean)
      .join(" ");
  }
  return decodeEntities(xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeEntities(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
