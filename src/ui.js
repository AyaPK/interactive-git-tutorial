const NOTIF_ICONS = { hint: "💡", success: "✅", complete: "🎉" };

export function showNotification(message, type = "success") {
  const area = document.getElementById("notificationArea");
  if (!area) return;
  const el = document.createElement("div");
  el.className = `notification notif-${type}`;
  const icon = NOTIF_ICONS[type] ?? "";
  el.innerHTML = `${icon ? `<span class="notification-icon">${icon}</span>` : ""}<span>${message}</span>`;
  area.appendChild(el);
  area.scrollTop = area.scrollHeight;
}

export function clearNotifications() {
  const area = document.getElementById("notificationArea");
  if (area) area.innerHTML = "";
}

export function addTerminalOutput(text, className = "") {
  const terminalOutput = document.getElementById("terminalOutput");
  const line = document.createElement("div");
  line.className = `terminal-line ${className}`;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

export function clearTerminal() {
  const terminalOutput = document.getElementById("terminalOutput");
  terminalOutput.innerHTML = "";
  addTerminalOutput("Terminal cleared. Type 'help' to see available commands.", "system");
}

export function renderLesson(mainLesson, subLesson, objectiveStates) {
  const titleParts = [mainLesson.title, subLesson.title].filter(Boolean);
  document.getElementById("lessonTitle").textContent = titleParts.join(": ");
  document.getElementById("lessonDescription").innerHTML = subLesson.description;

  const objectivesList = document.getElementById("objectives").querySelector("ul");
  objectivesList.innerHTML = subLesson.objectives
    .map((obj, idx) => {
      const completed = Boolean(objectiveStates?.[idx]);
      const cls = completed ? "completed" : "";
      return `<li class="${cls}">${obj.title}</li>`;
    })
    .join("");
}

export function updateProgress(progressTextValue, progressPercent) {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  progressFill.style.width = `${progressPercent}%`;
  progressText.textContent = progressTextValue;
}

export function updateLessonNav(currentLesson) {
  const lessonItems = document.querySelectorAll(".lesson-item");
  lessonItems.forEach((item, index) => {
    const lessonNum = index + 1;
    if (lessonNum === currentLesson) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

export function applyReveals(subLesson) {
  const ids = subLesson.reveals;
  if (!Array.isArray(ids) || ids.length === 0) return;
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (!el.classList.contains("tutorial-hidden")) continue;
    el.classList.remove("tutorial-hidden");
    el.classList.add("tutorial-reveal");
  }
}

export function updateVisualPanel(gitState) {
  const visualPanel = document.getElementById("visualPanel");
  const panelTitle = visualPanel?.querySelector(".panel-header h3");
  const panelContent = visualPanel?.querySelector(".panel-content");
  let repoNotice = document.getElementById("repoNotice");

  if (!repoNotice && panelContent) {
    repoNotice = document.createElement("div");
    repoNotice.id = "repoNotice";
    repoNotice.className = "repo-notice";
    panelContent.prepend(repoNotice);
  }

  if (panelTitle) {
    panelTitle.textContent = gitState.initialized ? "📊 Repository State" : "📊 Repository State (Uninitialized)";
  }

  if (repoNotice) {
    if (!gitState.initialized) {
      repoNotice.classList.add("active");
      repoNotice.innerHTML = "<strong>Git is not initialized yet.</strong><div>Run <code>git init</code> to start tracking changes in this folder.</div>";
    } else {
      repoNotice.classList.remove("active");
      repoNotice.textContent = "";
    }
  }

  const workingFiles = document.getElementById("workingFiles");
  const stagedFiles = document.getElementById("stagedFiles");
  const commits = document.getElementById("commits");
  const remoteCommits = document.getElementById("remoteCommits");
  const remoteHeader = visualPanel?.querySelector(".remote-repository h4");

  const modified = Array.isArray(gitState.modifiedFiles) ? gitState.modifiedFiles : [];
  const allWorkingFiles = Array.from(new Set([...gitState.workingDirectory, ...modified]));

  if (allWorkingFiles.length > 0) {
    workingFiles.innerHTML = allWorkingFiles
      .map((file) => {
        const isModified = modified.includes(file);
        const modBadge = isModified ? `<span class="file-modified-badge">M</span>` : "";
        return `<div class="file-item file-row${isModified ? " file-modified" : ""}"><span class="file-name">${escapeHtml(file)}${modBadge}</span></div>`;
      })
      .join("");
  } else {
    workingFiles.innerHTML = '<div class="empty-state">No untracked files</div>';
  }

  if (gitState.stagedFiles.length > 0) {
    stagedFiles.innerHTML = gitState.stagedFiles
      .map((file) => `<div class="file-item">${file}</div>`)
      .join("");
  } else {
    stagedFiles.innerHTML = '<div class="empty-state">No files staged</div>';
  }

  if (gitState.commits.length > 0) {
    commits.innerHTML = gitState.commits
      .slice()
      .reverse()
      .map(
        (commit) => `
                    <div class="commit-item">
                        <div class="commit-hash">${commit.hash}</div>
                        <div class="commit-message">${commit.message}</div>
                        <div class="commit-author">${commit.author} • ${commit.timestamp}</div>
                    </div>
                `
      )
      .join("");
  } else {
    commits.innerHTML = '<div class="empty-state">No commits yet</div>';
  }

  if (remoteHeader) {
    const remoteRef = `origin/${gitState.currentBranch}`;
    remoteHeader.textContent = `Remote: ${remoteRef}`;
  }

  if (remoteCommits) {
    if (!gitState.initialized) {
      remoteCommits.innerHTML = '<div class="empty-state">Initialize repository to view remote</div>';
    } else if (!gitState.remoteConnected) {
      remoteCommits.innerHTML = '<div class="empty-state">No remote connected</div>';
    } else {
      const remoteRef = `origin/${gitState.currentBranch}`;
      const remoteHead = gitState.remoteBranchHeads?.[remoteRef] ?? null;
      if (!remoteHead) {
        remoteCommits.innerHTML = '<div class="empty-state">No commits on remote</div>';
      } else {
        const commitsByHash = new Map((gitState.commits || []).map((c) => [c.hash, c]));
        const reachable = new Set();
        const stack = [remoteHead];
        while (stack.length) {
          const h = stack.pop();
          if (!h || reachable.has(h)) continue;
          reachable.add(h);
          const c = commitsByHash.get(h);
          if (c?.parents?.length) {
            for (const p of c.parents) stack.push(p);
          }
        }
        const list = (gitState.commits || [])
          .filter((c) => reachable.has(c.hash) && c.branch === gitState.currentBranch)
          .slice()
          .reverse()
          .map(
            (commit) => `
                      <div class="commit-item">
                          <div class="commit-hash">${commit.hash}</div>
                          <div class="commit-message">${commit.message}</div>
                          <div class="commit-author">${commit.author} • ${commit.timestamp}</div>
                      </div>
                  `
          )
          .join("");
        remoteCommits.innerHTML = list || '<div class="empty-state">No commits on remote</div>';
      }
    }
  }

  renderTimeline(gitState);
  renderFileSystem(gitState);
}

function renderFileSystem(gitState) {
  const container = document.getElementById("fileSystemList");
  if (!container) return;

  const committed = new Set(gitState.commits.flatMap((c) => c.files ?? []));
  const staged = new Set(gitState.stagedFiles ?? []);
  const modified = new Set(gitState.modifiedFiles ?? []);
  const untracked = new Set(gitState.workingDirectory ?? []);

  const allFiles = Array.from(new Set([
    ...untracked,
    ...staged,
    ...modified,
    ...committed,
  ])).sort();

  if (allFiles.length === 0) {
    container.innerHTML = '<div class="empty-state">No files yet — create one with the + button above</div>';
    return;
  }

  container.innerHTML = allFiles.map((file) => {
    let statusClass = "fs-status-committed";
    let statusLabel = "clean";
    let canRename = untracked.has(file) || modified.has(file);
    let canDelete = untracked.has(file) || modified.has(file);

    if (untracked.has(file)) {
      statusClass = "fs-status-untracked";
      statusLabel = "untracked";
    } else if (modified.has(file)) {
      statusClass = "fs-status-modified";
      statusLabel = "modified";
    } else if (staged.has(file)) {
      statusClass = "fs-status-staged";
      statusLabel = "staged";
    } else if (committed.has(file)) {
      statusClass = "fs-status-committed";
      statusLabel = "clean";
    }

    const editBtn = `<button class="file-action-btn" type="button" data-action="edit" data-file="${escapeHtml(file)}" title="Edit">✏</button>`;
    const renameBtn = canRename ? `<button class="file-action-btn" type="button" data-action="rename" data-file="${escapeHtml(file)}" title="Rename">✎</button>` : "";
    const deleteBtn = canDelete ? `<button class="file-action-btn file-action-danger" type="button" data-action="delete" data-file="${escapeHtml(file)}" title="Delete">🗑</button>` : "";

    return `<div class="fs-file-row">
      <span class="fs-file-icon">📄</span>
      <span class="fs-file-name">${escapeHtml(file)}</span>
      <span class="fs-status-badge ${statusClass}">${statusLabel}</span>
      <span class="file-actions">${editBtn}${renameBtn}${deleteBtn}</span>
    </div>`;
  }).join("");
}

function renderTimeline(gitState) {
  const rowsEl = document.getElementById("timelineRows");
  const emptyEl = document.getElementById("timelineEmpty");
  if (!rowsEl || !emptyEl) return;

  const branches = gitState.branches?.length ? gitState.branches : [gitState.currentBranch];
  const commits = Array.isArray(gitState.commits) ? gitState.commits : [];

  if (commits.length === 0) {
    emptyEl.style.display = "block";
    rowsEl.classList.remove("active");
    rowsEl.innerHTML = "";
    return;
  }

  emptyEl.style.display = "none";
  rowsEl.classList.add("active");

  const headByBranch = gitState.branchHeads || {};
  const remoteHeadByBranch = gitState.remoteBranchHeads || {};
  const branchBases = gitState.branchBases || {};
  const branchParents = gitState.branchParents || {};

  const labelWidth = 119;
  const leftPadding = 14;
  const topPadding = 14;
  const laneHeight = 29;
  const stepX = 37;
  const radius = 5;

  const colors = [
    "#667eea",
    "#48bb78",
    "#ed8936",
    "#805ad5",
    "#38b2ac",
    "#e53e3e"
  ];

  const branchToColor = new Map();
  branches.forEach((b, i) => branchToColor.set(b, colors[i % colors.length]));

  const branchToY = new Map();
  branches.forEach((b, i) => branchToY.set(b, topPadding + i * laneHeight));

  const commitToX = new Map();
  commits.forEach((c, i) => commitToX.set(c.hash, labelWidth + leftPadding + i * stepX));

  const commitToY = new Map();
  commits.forEach((c) => {
    const y = branchToY.get(c.branch) ?? topPadding;
    commitToY.set(c.hash, y);
  });

  const width = labelWidth + leftPadding * 2 + Math.max(1, commits.length - 1) * stepX + stepX;
  const height = topPadding * 2 + Math.max(1, branches.length) * laneHeight;

  const lines = [];
  const nodes = [];
  const labels = [];

  const branchLabelHtml = branches
    .map((b) => {
      const isCurrent = b === gitState.currentBranch;
      const badge = isCurrent ? `<span class="timeline-branch-badge">current</span>` : "";
      return `<div class="timeline-branch" style="height:${laneHeight}px">${escapeHtml(b)}${badge}</div>`;
    })
    .join("");

  const commitsByHash = new Map(commits.map((c) => [c.hash, c]));

  const getReachableSet = (headHash) => {
    const reachable = new Set();
    const stack = headHash ? [headHash] : [];
    while (stack.length) {
      const h = stack.pop();
      if (!h || reachable.has(h)) continue;
      reachable.add(h);
      const c = commitsByHash.get(h);
      if (!c?.parents?.length) continue;
      for (const p of c.parents) stack.push(p);
    }
    return reachable;
  };

  branches.forEach((branch) => {
    const head = headByBranch?.[branch] ?? null;
    const reachable = getReachableSet(head);
    const y = branchToY.get(branch);
    if (y === undefined) return;

    const baseHash = branchBases?.[branch] ?? null;
    const parentBranch = branchParents?.[branch] ?? null;
    if (branch !== "main" && baseHash && parentBranch && branchToY.has(parentBranch)) {
      const x = commitToX.get(baseHash);
      const parentY = branchToY.get(parentBranch);
      if (x !== undefined && parentY !== undefined) {
        lines.push(
          `<path class="timeline-path split" d="M ${x} ${parentY} C ${x} ${parentY + 9}, ${x} ${y - 9}, ${x} ${y}" />`
        );
      }
    }

    const reachableCommits = commits
      .filter((c) => reachable.has(c.hash) && c.branch === branch)
      .map((c) => c.hash);

    const coords = reachableCommits
      .map((h) => ({ x: commitToX.get(h), y }))
      .filter((p) => typeof p.x === "number");

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      lines.push(
        `<path class="timeline-path" stroke="${branchToColor.get(branch)}" d="M ${a.x} ${a.y} L ${b.x} ${b.y}" />`
      );
    }
  });

  commits.forEach((c) => {
    const x = commitToX.get(c.hash);
    const y = commitToY.get(c.hash);
    if (typeof x !== "number" || typeof y !== "number") return;

    const color = branchToColor.get(c.branch) ?? "#667eea";
    nodes.push(
      `<circle class="timeline-node" cx="${x}" cy="${y}" r="${radius}" fill="${color}" />`
    );

    if (Array.isArray(c.parents) && c.parents.length > 1) {
      const otherParent = c.parents[1];
      const px = commitToX.get(otherParent);
      const py = commitToY.get(otherParent);
      if (typeof px === "number" && typeof py === "number") {
        const midX = (px + x) / 2;
        lines.push(
          `<path class="timeline-path merge" d="M ${px} ${py} C ${midX} ${py}, ${midX} ${y}, ${x} ${y}" />`
        );
      }
    }

    if (headByBranch?.[gitState.currentBranch] === c.hash) {
      labels.push(`<text class="timeline-label head" x="${x}" y="${y - 10}" text-anchor="middle">HEAD</text>`);
    }

    const remoteHash = remoteHeadByBranch?.[`origin/${c.branch}`] ?? null;
    if (remoteHash && remoteHash === c.hash) {
      labels.push(
        `<text class="timeline-label remote" x="${x}" y="${y - 10}" text-anchor="middle">REMOTE</text>`
      );
    }
  });

  const svg = `
    <div class="timeline-graph">
      <div class="timeline-graph-labels" style="width:${labelWidth}px">
        ${branchLabelHtml}
      </div>
      <div class="timeline-graph-canvas">
        <svg class="timeline-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <g class="timeline-layer lines">${lines.join("")}</g>
          <g class="timeline-layer nodes">${nodes.join("")}</g>
          <g class="timeline-layer labels">${labels.join("")}</g>
        </svg>
      </div>
    </div>
  `;

  rowsEl.innerHTML = svg;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
