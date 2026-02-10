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

export function renderLesson(lesson) {
  document.getElementById("lessonTitle").textContent = lesson.title;
  document.getElementById("lessonDescription").innerHTML = lesson.description;

  const objectivesList = document.getElementById("objectives").querySelector("ul");
  objectivesList.innerHTML = lesson.objectives.map((obj) => `<li>${obj}</li>`).join("");
}

export function updateProgress(currentLesson, totalLessons) {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  const progress = (currentLesson / totalLessons) * 100;
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `Lesson ${currentLesson} of ${totalLessons}`;
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
  const workingFiles = document.getElementById("workingFiles");
  const stagedFiles = document.getElementById("stagedFiles");
  const commits = document.getElementById("commits");

  if (gitState.workingDirectory.length > 0) {
    workingFiles.innerHTML = gitState.workingDirectory
      .map((file) => `<div class="file-item">${file}</div>`)
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
