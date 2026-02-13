import { createInitialGitState } from "./gitState.js";
import { handleGitCommand, showHelp } from "./gitCommands.js";
import {
  addTerminalOutput,
  applyReveals,
  clearTerminal,
  renderLesson,
  updateLessonNav,
  updateProgress,
  updateVisualPanel
} from "./ui.js";

function tokenize(input) {
  const tokens = [];
  const regex = /"([^"]*)"|'([^']*)'|[^\s]+/g;
  let match;
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[0]);
  }
  return tokens;
}

export class GitTutorial {
  constructor({ lessons, totalLessons } = {}) {
    this.currentLesson = 1;
    this.currentSubLessonIndex = 0;
    this.totalLessons = totalLessons ?? 0;
    this.terminalHistory = [];
    this.gitState = createInitialGitState();
    this.lessons = lessons ?? {};

    this.objectiveCompletion = {};
    this.nextLessonPending = false;

    this.init();
  }

  fileExists(name) {
    return (
      this.gitState.workingDirectory.includes(name) ||
      this.gitState.stagedFiles.includes(name) ||
      this.gitState.commits.some((c) => c.files?.includes?.(name))
    );
  }

  touchFile(name) {
    if (!name) {
      return { output: "touch: missing file operand", success: false };
    }

    if (this.fileExists(name)) {
      return { output: `touch: '${name}' already exists`, success: false };
    }

    this.gitState.workingDirectory.push(name);
    return { output: `Created file '${name}'`, success: true };
  }

  renameFile(oldName, newName) {
    if (!oldName || !newName) {
      return { output: "mv: usage: mv <old> <new>", success: false };
    }

    if (!this.fileExists(oldName)) {
      return { output: `mv: cannot stat '${oldName}': No such file`, success: false };
    }

    if (this.fileExists(newName)) {
      return { output: `mv: cannot move '${oldName}' to '${newName}': File exists`, success: false };
    }

    const wdIdx = this.gitState.workingDirectory.indexOf(oldName);
    if (wdIdx !== -1) {
      this.gitState.workingDirectory[wdIdx] = newName;
    }

    const stIdx = this.gitState.stagedFiles.indexOf(oldName);
    if (stIdx !== -1) {
      this.gitState.stagedFiles[stIdx] = newName;
    }

    return { output: `Renamed '${oldName}' to '${newName}'`, success: true };
  }

  deleteFile(name) {
    if (!name) {
      return { output: "rm: missing file operand", success: false };
    }

    const inWd = this.gitState.workingDirectory.includes(name);
    const inStage = this.gitState.stagedFiles.includes(name);

    if (!inWd && !inStage) {
      return { output: `rm: cannot remove '${name}': No such file`, success: false };
    }

    this.gitState.workingDirectory = this.gitState.workingDirectory.filter((f) => f !== name);
    this.gitState.stagedFiles = this.gitState.stagedFiles.filter((f) => f !== name);
    return { output: `Deleted file '${name}'`, success: true };
  }

  listFiles() {
    const files = [...this.gitState.workingDirectory, ...this.gitState.stagedFiles];
    const unique = Array.from(new Set(files));
    if (unique.length === 0) {
      return { output: "(no files)", success: true };
    }
    return { output: unique.join("\n"), success: true };
  }

  init() {
    this.setupEventListeners();
    this.loadLesson(1, 0);
    updateVisualPanel(this.gitState);
  }

  setupEventListeners() {
    const terminalInput = document.getElementById("terminalInput");
    const helpBtn = document.getElementById("helpBtn");
    const closeHelp = document.getElementById("closeHelp");
    const helpModal = document.getElementById("helpModal");
    const furtherReadingBtn = document.getElementById("furtherReadingBtn");
    const furtherReadingModal = document.getElementById("furtherReadingModal");
    const closeFurtherReading = document.getElementById("closeFurtherReading");
    const closeFurtherReadingBottom = document.getElementById("closeFurtherReadingBottom");
    const lessonItems = document.querySelectorAll(".lesson-item");
    const createFileBtn = document.getElementById("createFileBtn");
    const createFileModal = document.getElementById("createFileModal");
    const closeCreateFile = document.getElementById("closeCreateFile");
    const cancelCreateFile = document.getElementById("cancelCreateFile");
    const confirmCreateFile = document.getElementById("confirmCreateFile");
    const createFileName = document.getElementById("createFileName");
    const workingFiles = document.getElementById("workingFiles");
    const renameFileModal = document.getElementById("renameFileModal");
    const closeRenameFile = document.getElementById("closeRenameFile");
    const cancelRenameFile = document.getElementById("cancelRenameFile");
    const confirmRenameFile = document.getElementById("confirmRenameFile");
    const renameFileOld = document.getElementById("renameFileOld");
    const renameFileNew = document.getElementById("renameFileNew");
    const deleteFileModal = document.getElementById("deleteFileModal");
    const closeDeleteFile = document.getElementById("closeDeleteFile");
    const cancelDeleteFile = document.getElementById("cancelDeleteFile");
    const confirmDeleteFile = document.getElementById("confirmDeleteFile");
    const deleteFileName = document.getElementById("deleteFileName");
    const postLessonPanel = document.getElementById("postLessonPanel");
    const nextLessonBtn = document.getElementById("nextLessonBtn");

    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleCommand(terminalInput.value);
        terminalInput.value = "";
        return;
      }
      if (e.key === "ArrowUp") {
        const last = this.terminalHistory[this.terminalHistory.length - 1];
        if (last) {
          e.preventDefault();
          terminalInput.value = last;
          const end = terminalInput.value.length;
          terminalInput.setSelectionRange(end, end);
        }
      }
    });

    helpBtn.addEventListener("click", () => {
      helpModal.classList.add("active");
    });

    closeHelp.addEventListener("click", () => {
      helpModal.classList.remove("active");
    });

    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) {
        helpModal.classList.remove("active");
      }
    });

    if (furtherReadingBtn && furtherReadingModal) {
      furtherReadingBtn.addEventListener("click", () => {
        furtherReadingModal.classList.add("active");
      });
    }

    const closeFurtherReadingModal = () => {
      if (!furtherReadingModal) return;
      furtherReadingModal.classList.remove("active");
    };

    if (closeFurtherReading) {
      closeFurtherReading.addEventListener("click", closeFurtherReadingModal);
    }

    if (closeFurtherReadingBottom) {
      closeFurtherReadingBottom.addEventListener("click", () => {
        if (furtherReadingModal) furtherReadingModal.classList.remove("active");
        if (this.nextLessonPending) {
          this.nextLessonPending = false;
          // reset button label
          closeFurtherReadingBottom.textContent = "Got it";
          if (this.currentLesson < this.totalLessons) {
            this.loadLesson(this.currentLesson + 1, 0);
          }
        }
      });
    }

    if (furtherReadingModal) {
      furtherReadingModal.addEventListener("click", (e) => {
        if (e.target === furtherReadingModal) {
          closeFurtherReadingModal();
        }
      });
    }

    if (nextLessonBtn) {
      nextLessonBtn.addEventListener("click", () => {
        if (postLessonPanel) postLessonPanel.classList.add("tutorial-hidden");
        if (this.nextLessonPending && this.currentLesson < this.totalLessons) {
          this.nextLessonPending = false;
          this.loadLesson(this.currentLesson + 1, 0);
        }
      });
    }

    const openCreateFileModal = () => {
      if (!createFileModal) return;
      createFileModal.classList.add("active");
      if (createFileName) {
        createFileName.value = "";
        createFileName.focus();
      }
    };

    const openDeleteFileModal = (file) => {
      if (!deleteFileModal || !deleteFileName) return;
      deleteFileName.value = file;
      deleteFileModal.classList.add("active");
    };

    const closeDeleteFileModal = () => {
      if (!deleteFileModal) return;
      deleteFileModal.classList.remove("active");
    };

    const submitDeleteFile = () => {
      if (!deleteFileName) return;
      const file = deleteFileName.value.trim();
      if (!file) return;

      closeDeleteFileModal();

      const cmd = `rm ${file}`;
      addTerminalOutput(`$ ${cmd}`, "input");
      const result = this.deleteFile(file);
      addTerminalOutput(result.output, result.success ? "success" : "error");
      updateVisualPanel(this.gitState);
      this.checkLessonProgress(cmd, result.output);
    };

    const openRenameFileModal = (oldName) => {
      if (!renameFileModal || !renameFileOld || !renameFileNew) return;
      renameFileOld.value = oldName;
      renameFileNew.value = "";
      renameFileModal.classList.add("active");
      renameFileNew.focus();
    };

    const closeRenameFileModal = () => {
      if (!renameFileModal) return;
      renameFileModal.classList.remove("active");
    };

    const submitRenameFile = () => {
      if (!renameFileOld || !renameFileNew) return;
      const oldName = renameFileOld.value.trim();
      const newName = renameFileNew.value.trim();
      if (!oldName || !newName) return;

      closeRenameFileModal();

      const cmd = `mv ${oldName} ${newName}`;
      addTerminalOutput(`$ ${cmd}`, "input");
      const result = this.renameFile(oldName, newName);
      addTerminalOutput(result.output, result.success ? "success" : "error");
      updateVisualPanel(this.gitState);
      this.checkLessonProgress(cmd, result.output);
    };

    const closeCreateFileModal = () => {
      if (!createFileModal) return;
      createFileModal.classList.remove("active");
    };

    const submitCreateFile = () => {
      if (!createFileName) return;
      const fileName = createFileName.value.trim();
      if (!fileName) return;

      closeCreateFileModal();

      const cmd = `touch ${fileName}`;
      addTerminalOutput(`$ ${cmd}`, "input");
      const result = this.touchFile(fileName);
      addTerminalOutput(result.output, result.success ? "success" : "error");
      updateVisualPanel(this.gitState);
      this.checkLessonProgress(cmd, result.output);
    };

    lessonItems.forEach((item) => {
      item.addEventListener("click", () => {
        const lessonNum = Number.parseInt(item.dataset.lesson, 10);
        if (lessonNum <= this.currentLesson || this.currentLesson === this.totalLessons) {
          this.loadLesson(lessonNum, 0);
        }
      });
    });

    if (createFileBtn) {
      createFileBtn.addEventListener("click", () => {
        openCreateFileModal();
      });
    }

    if (closeCreateFile) {
      closeCreateFile.addEventListener("click", closeCreateFileModal);
    }

    if (cancelCreateFile) {
      cancelCreateFile.addEventListener("click", closeCreateFileModal);
    }

    if (confirmCreateFile) {
      confirmCreateFile.addEventListener("click", submitCreateFile);
    }

    if (createFileName) {
      createFileName.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          submitCreateFile();
        }
      });
    }

    if (createFileModal) {
      createFileModal.addEventListener("click", (e) => {
        if (e.target === createFileModal) {
          closeCreateFileModal();
        }
      });
    }

    if (workingFiles) {
      workingFiles.addEventListener("click", (e) => {
        const btn = e.target?.closest?.("button[data-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const file = btn.getAttribute("data-file");
        if (!action || !file) return;
        if (!this.gitState.workingDirectory.includes(file)) return;
        if (action === "rename") {
          openRenameFileModal(file);
        }
        if (action === "delete") {
          openDeleteFileModal(file);
        }
      });
    }

    if (closeRenameFile) {
      closeRenameFile.addEventListener("click", closeRenameFileModal);
    }

    if (cancelRenameFile) {
      cancelRenameFile.addEventListener("click", closeRenameFileModal);
    }

    if (confirmRenameFile) {
      confirmRenameFile.addEventListener("click", submitRenameFile);
    }

    if (renameFileNew) {
      renameFileNew.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          submitRenameFile();
        }
      });
    }

    if (renameFileModal) {
      renameFileModal.addEventListener("click", (e) => {
        if (e.target === renameFileModal) {
          closeRenameFileModal();
        }
      });
    }

    if (closeDeleteFile) {
      closeDeleteFile.addEventListener("click", closeDeleteFileModal);
    }

    if (cancelDeleteFile) {
      cancelDeleteFile.addEventListener("click", closeDeleteFileModal);
    }

    if (confirmDeleteFile) {
      confirmDeleteFile.addEventListener("click", submitDeleteFile);
    }

    if (deleteFileModal) {
      deleteFileModal.addEventListener("click", (e) => {
        if (e.target === deleteFileModal) {
          closeDeleteFileModal();
        }
      });
    }
  }

  getLesson(lessonNum) {
    return this.lessons[lessonNum];
  }

  getSubLesson(lessonNum, subLessonIndex) {
    const lesson = this.getLesson(lessonNum);
    return lesson.subLessons[subLessonIndex];
  }

  getObjectiveStates(lessonNum, subLessonIndex) {
    const key = `${lessonNum}:${subLessonIndex}`;
    const subLesson = this.getSubLesson(lessonNum, subLessonIndex);
    if (!this.objectiveCompletion[key]) {
      this.objectiveCompletion[key] = new Array(subLesson.objectives.length).fill(false);
    }
    return this.objectiveCompletion[key];
  }

  getTotalSubLessonCount() {
    return Object.values(this.lessons).reduce((acc, lesson) => acc + lesson.subLessons.length, 0);
  }

  getCurrentSubLessonStepIndex() {
    let idx = 0;
    for (let ln = 1; ln <= this.totalLessons; ln++) {
      const lesson = this.getLesson(ln);
      for (let s = 0; s < lesson.subLessons.length; s++) {
        if (ln === this.currentLesson && s === this.currentSubLessonIndex) {
          return idx;
        }
        idx++;
      }
    }
    return 0;
  }

  refreshLessonUI() {
    const lesson = this.getLesson(this.currentLesson);
    const subLesson = this.getSubLesson(this.currentLesson, this.currentSubLessonIndex);
    const objectiveStates = this.getObjectiveStates(this.currentLesson, this.currentSubLessonIndex);

    renderLesson(lesson, subLesson, objectiveStates);
    updateLessonNav(this.currentLesson);

    const totalSteps = this.getTotalSubLessonCount();
    const stepIndex = this.getCurrentSubLessonStepIndex();
    const stepText = `Lesson ${this.currentLesson} of ${this.totalLessons} — Step ${stepIndex + 1} of ${totalSteps}`;
    const percent = totalSteps === 0 ? 0 : ((stepIndex + 1) / totalSteps) * 100;
    updateProgress(stepText, percent);
  }

  loadLesson(lessonNum, subLessonIndex) {
    this.currentLesson = lessonNum;
    this.currentSubLessonIndex = subLessonIndex;

    const subLesson = this.getSubLesson(this.currentLesson, this.currentSubLessonIndex);
    this.getObjectiveStates(this.currentLesson, this.currentSubLessonIndex);
    this.refreshLessonUI();
    // Hide inline post-lesson panel when loading a lesson and reset pending state
    const postPanel = document.getElementById("postLessonPanel");
    if (postPanel) postPanel.classList.add("tutorial-hidden");
    const postBody = document.getElementById("postLessonBody");
    if (postBody) postBody.innerHTML = '<p>Review key concepts from this lesson. When you\'re ready, continue to the next lesson.</p>';
    this.nextLessonPending = false;
    applyReveals(subLesson);

    if (subLesson.hint) {
      addTerminalOutput(`💡 Hint: ${subLesson.hint}`, "hint");
    }
  }

  handleCommand(input) {
    const command = input.trim();
    if (!command) return;

    addTerminalOutput(`$ ${command}`, "input");
    this.terminalHistory.push(command);

    const parts = tokenize(command);
    const mainCommand = parts[0];
    const args = parts.slice(1);

    let output = "";
    let success = false;

    switch (mainCommand) {
      case "help":
        output = showHelp();
        success = true;
        break;

      case "clear":
        clearTerminal();
        return;

      case "cls":
        clearTerminal();
        return;

      case "touch": {
        const result = this.touchFile(args[0]);
        output = result.output;
        success = result.success;
        break;
      }

      case "mv": {
        const result = this.renameFile(args[0], args[1]);
        output = result.output;
        success = result.success;
        break;
      }

      case "ls": {
        const result = this.listFiles();
        output = result.output;
        success = result.success;
        break;
      }

      case "git":
        if (args.length === 0) {
          output = "git: missing command\nUsage: git <command> [<args>]";
        } else {
          const result = handleGitCommand(this.gitState, args[0], args.slice(1));
          output = result.output;
          success = result.success;
        }
        break;

      default:
        output = `Command not found: ${mainCommand}. Type 'help' for available commands.`;
    }

    addTerminalOutput(output, success ? "success" : "error");
    updateVisualPanel(this.gitState);
    this.checkLessonProgress(command, output);
  }

  checkLessonProgress(command, output) {
    const lesson = this.getLesson(this.currentLesson);
    const subLesson = this.getSubLesson(this.currentLesson, this.currentSubLessonIndex);
    const objectiveStates = this.getObjectiveStates(this.currentLesson, this.currentSubLessonIndex);

    let changed = false;

    subLesson.objectives.forEach((obj, idx) => {
      if (objectiveStates[idx]) return;
      if (!command.includes(obj.commandIncludes)) return;
      if (!output.includes(obj.outputIncludes)) return;
      objectiveStates[idx] = true;
      changed = true;
      addTerminalOutput(`✅ Objective complete: ${obj.title}`, "success");
    });

    if (changed) {
      this.refreshLessonUI();
    }

    const allDone = objectiveStates.every(Boolean);
    if (!allDone) return;

    setTimeout(() => {
      addTerminalOutput("🎉 Sub-lesson complete!", "success");

      const nextSubIndex = this.currentSubLessonIndex + 1;
      if (nextSubIndex < lesson.subLessons.length) {
        this.loadLesson(this.currentLesson, nextSubIndex);
        return;
      }

      if (this.currentLesson < this.totalLessons) {
        addTerminalOutput("🎉 Lesson complete!", "success");
        const pl = document.getElementById("postLessonPanel");
        if (pl) {
          pl.classList.remove("tutorial-hidden");
          pl.classList.add("tutorial-reveal");
        }
        const bodyEl = document.getElementById("postLessonBody");
        if (bodyEl && lesson?.furtherReadingHtml) {
          bodyEl.innerHTML = lesson.furtherReadingHtml;
        }
        this.nextLessonPending = true;
        return;
      }

      addTerminalOutput("🎊 Congratulations! You've completed all lessons!", "success");
    }, 600);
  }
}
