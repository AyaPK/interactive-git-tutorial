// Minimal Markdown lessons loader with tiny custom parser (no deps)

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return await res.text();
}

function parseFrontmatter(md) {
  const fm = { meta: {}, body: md };
  if (!md.startsWith('---')) return fm;
  const end = md.indexOf('\n---', 3);
  if (end === -1) return fm;
  const raw = md.slice(3, end).trim();
  const body = md.slice(end + 4).trimStart();
  const meta = {};
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.*)$/);
    if (m) meta[m[1].trim()] = m[2].trim();
  });
  fm.meta = meta;
  fm.body = body;
  return fm;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let buf = [];
  let inUl = false;

  const renderInline = (text) => {
    // Convert Markdown links [text](url) to anchors
    return escapeHtml(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
      const safeHref = href.replace(/"/g, '%22');
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    });
  };

  const flushP = () => {
    const text = buf.join(' ').trim();
    if (text) out.push(`<p>${renderInline(text)}</p>`);
    buf = [];
  };

  const closeUl = () => {
    if (inUl) {
      out.push('</ul>');
      inUl = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('### ')) {
      flushP();
      closeUl();
      out.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`);
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      flushP();
      if (!inUl) {
        out.push('<ul>');
        inUl = true;
      }
      out.push(`<li>${renderInline(li[1].trim())}</li>`);
      continue;
    }
    if (/^\s*$/.test(line)) {
      flushP();
      closeUl();
    } else {
      buf.push(line.trim());
    }
  }
  flushP();
  closeUl();
  return out.join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseLessonMarkdown(md) {
  const { meta, body } = parseFrontmatter(md);
  const lessonTitle = meta.title || '';
  const lines = body.split(/\r?\n/);
  // Capture optional Further reading section (content under '### Further reading' until next '### ' or EOF)
  let furtherReadingHtml = '';
  let furtherButtonHtml = '';
  let furtherButtonText = '';
  (function extractFurtherReading() {
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^###\s+Further\s+reading\s*$/i.test(lines[i].trim())) { start = i + 1; break; }
    }
    if (start === -1) return;
    let end = lines.length;
    for (let j = start; j < lines.length; j++) {
      if (/^###\s+/.test(lines[j])) { end = j; break; }
    }
    const fr = lines.slice(start, end).join('\n').trim();
    furtherReadingHtml = mdToHtml(fr);
  })();

  // Capture optional Further reading button section
  (function extractFurtherReadingButton() {
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^###\s+Further\s+reading\s+button\s*$/i.test(lines[i].trim())) { start = i + 1; break; }
    }
    if (start === -1) return;
    let end = lines.length;
    for (let j = start; j < lines.length; j++) {
      if (/^###\s+/.test(lines[j])) { end = j; break; }
    }
    const raw = lines.slice(start, end).join('\n');
    const fbLines = raw.split(/\r?\n/);
    // Look for optional 'Label: <text>' (preferred) or 'Text: <text>' to customize button label
    for (let i = 0; i < fbLines.length; i++) {
      const m = fbLines[i].match(/^\s*(Label|Text)\s*:\s*(.+)$/i);
      if (m) {
        furtherButtonText = m[2].trim();
        fbLines.splice(i, 1); // remove label line from content
        break;
      }
    }
    const fb = fbLines.join('\n').trim();
    furtherButtonHtml = mdToHtml(fb);
  })();
  // Split into sublesson blocks by heading line starting with '### Sublesson:'
  const blocks = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^###\s+Further\s+reading\s*$/i.test(line.trim())) {
      // Stop collecting sublesson content at the Further reading section
      break;
    }
    const m = line.match(/^###\s+Sublesson:\s*(.+)$/);
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[1].trim(), meta: {}, content: [] };
      continue;
    }
    if (current) current.content.push(line);
  }
  if (current) blocks.push(current);

  const subLessons = blocks.map((b) => {
    const content = b.content.join('\n');
    const hintMatch = content.match(/^\s*Hint:\s*(.+)$/mi);
    const hint = hintMatch ? hintMatch[1].trim() : undefined;

    // Objectives parsing
    const objectives = [];
    const lines = content.split(/\r?\n/);
    let inObj = false;
    let inRev = false;
    const reveals = [];
    for (const l of lines) {
      if (/^\s*Objectives\s*:/i.test(l)) { inObj = true; continue; }
      if (/^\s*Reveals\s*:/i.test(l)) { inRev = true; inObj = false; continue; }
      if (inObj) {
        const item = l.match(/^\s*[-*]\s*(.+)$/);
        if (item) {
          // Expect: Title | commandIncludes | outputIncludes
          const parts = item[1].split('|').map((s) => s.trim());
          const [title, commandIncludes, outputIncludes] = parts;
          if (title) objectives.push({ title, commandIncludes: commandIncludes || '', outputIncludes: outputIncludes || '' });
          continue;
        }
        // Stop if non-list line encountered after objectives started
        if (!/^\s*$/.test(l)) inObj = false;
      }
      if (inRev) {
        const item = l.match(/^\s*[-*]\s*(.+)$/);
        if (item) {
          const id = item[1].trim();
          if (id) reveals.push(id);
          continue;
        }
        if (!/^\s*$/.test(l)) inRev = false;
      }
    }

    // Description markdown = content minus meta lines (Hint/Objectives section)
    const descLines = [];
    let skipObj = false;
    let skipRev = false;
    let skipFr = false;
    for (const l of content.split(/\r?\n/)) {
      if (/^\s*Hint\s*:/i.test(l)) continue;
      if (/^\s*Objectives\s*:/i.test(l)) { skipObj = true; continue; }
      if (skipObj) {
        if (/^\s*[-*]\s+/.test(l)) continue; else if (!/^\s*$/.test(l)) { skipObj = false; }
      }
      if (/^\s*Reveals\s*:/i.test(l)) { skipRev = true; continue; }
      if (skipRev) {
        if (/^\s*[-*]\s+/.test(l)) continue; else if (!/^\s*$/.test(l)) { skipRev = false; }
      }
      if (/^\s*###\s+Further\s+reading\s*$/i.test(l.trim())) { skipFr = true; continue; }
      if (skipFr) { continue; }
      if (!skipObj) descLines.push(l);
    }
    const description = mdToHtml(descLines.join('\n').trim());

    return { title: b.title, description, objectives, hint, reveals };
  });

  const showFurtherButton = Boolean(furtherButtonHtml || furtherButtonText);
  return { title: lessonTitle, subLessons, furtherReadingHtml, furtherButtonHtml, furtherButtonText, showFurtherButton };
}

export async function loadLessons() {
  const manifest = JSON.parse(await fetchText('/lessons/manifest.json'));
  const lessons = {};
  const lessonNums = Object.keys(manifest).sort((a, b) => Number(a) - Number(b));
  for (const ln of lessonNums) {
    const files = manifest[ln];
    if (!Array.isArray(files) || files.length === 0) continue;
    // One file per lesson as requested
    const md = await fetchText(`/lessons/${files[0]}`);
    const parsed = parseLessonMarkdown(md);
    lessons[Number(ln)] = parsed;
  }
  const totalLessons = lessonNums.length;
  return { lessons, totalLessons };
}
