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
  document.getElementById("lessonTitle").textContent = titleParts.join(" — ");
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

  if (gitState.workingDirectory.length > 0) {
    workingFiles.innerHTML = gitState.workingDirectory
      .map(
        (file) =>
          `<div class="file-item file-row"><span class="file-name">${file}</span><span class="file-actions"><button class="file-action-btn" type="button" data-action="rename" data-file="${file}" title="Rename">✎</button><button class="file-action-btn file-action-danger" type="button" data-action="delete" data-file="${file}" title="Delete">🗑</button></span></div>`
      )
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
}
