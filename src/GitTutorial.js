import { createInitialGitState } from "./gitState.js";
import { handleGitCommand, showHelp } from "./gitCommands.js";
import {
  addTerminalOutput,
  applyReveals,
  clearNotifications,
  clearTerminal,
  renderLesson,
  showNotification,
  updateLessonNav,
  updateProgress,
  updateVisualPanel
} from "./ui.js";

function openModal(modal, triggerEl) {
  if (!modal) return;
  modal.classList.add("active");
  modal._triggerEl = triggerEl || document.activeElement;
  const focusable = modal.querySelectorAll(
    'button, [href], input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length) focusable[0].focus();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("active");
  if (modal._triggerEl && typeof modal._triggerEl.focus === "function") {
    modal._triggerEl.focus();
    modal._triggerEl = null;
  }
}

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
    this.completedLessons = this._loadCompletedLessons();
    this.undoStack = [];

    this.init();
  }

  fileExists(name) {
    return (
      this.gitState.workingDirectory.includes(name) ||
      this.gitState.stagedFiles.includes(name) ||
      (this.gitState.modifiedFiles ?? []).includes(name) ||
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
    if (!this.gitState.fileContents) this.gitState.fileContents = {};
    this.gitState.fileContents[name] = "";
    return { output: `Created file '${name}'`, success: true };
  }

  openFileEditor(name) {
    if (!this.fileExists(name)) {
      return { output: `edit: '${name}': No such file`, success: false };
    }
    const content = (this.gitState.fileContents ?? {})[name] ?? "";
    this._openEditorModal(name, content);
    return { output: `Opened '${name}' in editor`, success: true };
  }

  _openEditorModal(name, content) {
    const modal = document.getElementById("fileEditorModal");
    const titleEl = document.getElementById("fileEditorTitle");
    const textarea = document.getElementById("fileEditorTextarea");
    if (!modal || !titleEl || !textarea) return;
    titleEl.textContent = name;
    textarea.value = content;
    modal.dataset.file = name;
    openModal(modal);
  }

  _saveEditorModal() {
    const modal = document.getElementById("fileEditorModal");
    const textarea = document.getElementById("fileEditorTextarea");
    if (!modal || !textarea) return;
    const name = modal.dataset.file;
    if (!name) return;
    const newContent = textarea.value;
    if (!this.gitState.fileContents) this.gitState.fileContents = {};
    const oldContent = this.gitState.fileContents[name] ?? null;
    this.gitState.fileContents[name] = newContent;
    if (!Array.isArray(this.gitState.modifiedFiles)) this.gitState.modifiedFiles = [];
    const isTracked = !this.gitState.workingDirectory.includes(name);
    const alreadyModified = this.gitState.modifiedFiles.includes(name);
    if (isTracked && !alreadyModified && oldContent !== newContent) {
      this.gitState.modifiedFiles.push(name);
    }
    modal.classList.remove("active");
    updateVisualPanel(this.gitState);
    addTerminalOutput(`Saved '${name}'`, "success");
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

  getAllFiles() {
    const committed = this.gitState.commits.flatMap((c) => c.files ?? []);
    const all = [
      ...this.gitState.workingDirectory,
      ...this.gitState.stagedFiles,
      ...(this.gitState.modifiedFiles ?? []),
      ...committed,
    ];
    return Array.from(new Set(all));
  }

  listFiles() {
    const unique = this.getAllFiles();
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
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
      const root = document.documentElement;
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        root.setAttribute("data-theme", "dark");
        darkModeToggle.textContent = "☀️";
      }
      darkModeToggle.addEventListener("click", () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        if (isDark) {
          root.removeAttribute("data-theme");
          darkModeToggle.textContent = "🌙";
          localStorage.setItem("theme", "light");
        } else {
          root.setAttribute("data-theme", "dark");
          darkModeToggle.textContent = "☀️";
          localStorage.setItem("theme", "dark");
        }
      });
    }

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
    const tryItOutBtn = document.getElementById("tryItOutBtn");
    const viewTheoryBtn = document.getElementById("viewTheoryBtn");
    const undoBtn = document.getElementById("undoBtn");
    const postLessonModal = document.getElementById("postLessonModal");
    const postLessonNextBtn = document.getElementById("postLessonNextBtn");
    const closePostLessonModal = document.getElementById("closePostLessonModal");

    if (undoBtn) {
      undoBtn.addEventListener("click", () => this.undo());
    }

    const dismissPostLessonModal = () => closeModal(postLessonModal);

    if (closePostLessonModal) {
      closePostLessonModal.addEventListener("click", dismissPostLessonModal);
    }

    if (postLessonModal) {
      postLessonModal.addEventListener("click", (e) => {
        if (e.target === postLessonModal) dismissPostLessonModal();
      });
      postLessonModal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") dismissPostLessonModal();
      });
    }

    if (postLessonNextBtn) {
      postLessonNextBtn.addEventListener("click", () => {
        dismissPostLessonModal();
        if (this.nextLessonPending && this.currentLesson < this.totalLessons) {
          this.nextLessonPending = false;
          this.loadLesson(this.currentLesson + 1, 0);
        }
      });
    }

    const terminalContainer = document.getElementById("terminalContainer");
    if (terminalContainer) {
      terminalContainer.addEventListener("click", () => terminalInput.focus());
    }

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
      openModal(helpModal, helpBtn);
    });

    closeHelp.addEventListener("click", () => {
      closeModal(helpModal);
    });

    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) closeModal(helpModal);
    });

    helpModal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal(helpModal);
    });

    if (furtherReadingBtn && furtherReadingModal) {
      furtherReadingBtn.addEventListener("click", () => {
        openModal(furtherReadingModal, furtherReadingBtn);
      });
    }

    const closeFurtherReadingModal = () => closeModal(furtherReadingModal);

    if (closeFurtherReading) {
      closeFurtherReading.addEventListener("click", closeFurtherReadingModal);
    }

    if (closeFurtherReadingBottom) {
      closeFurtherReadingBottom.addEventListener("click", closeFurtherReadingModal);
    }

    if (furtherReadingModal) {
      furtherReadingModal.addEventListener("click", (e) => {
        if (e.target === furtherReadingModal) closeFurtherReadingModal();
      });
      furtherReadingModal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeFurtherReadingModal();
      });
    }

    if (tryItOutBtn) {
      tryItOutBtn.addEventListener("click", () => {
        this.startInteractiveLesson();
      });
    }

    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (this._theoryPageIndex > 0) {
          this._theoryPageIndex--;
          this._renderTheoryPage(this.getLesson(this.currentLesson));
        }
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        if (this._theoryPages && this._theoryPageIndex < this._theoryPages.length - 1) {
          this._theoryPageIndex++;
          this._renderTheoryPage(this.getLesson(this.currentLesson));
        }
      });
    }

    if (viewTheoryBtn) {
      viewTheoryBtn.addEventListener("click", () => {
        const lesson = this.getLesson(this.currentLesson);
        if (lesson?.theoryHtml) this.showTheoryScreen(lesson);
      });
    }

    const openCreateFileModal = () => {
      if (!createFileModal) return;
      if (createFileName) createFileName.value = "";
      openModal(createFileModal, createFileBtn);
    };

    const openDeleteFileModal = (file) => {
      if (!deleteFileModal || !deleteFileName) return;
      deleteFileName.value = file;
      openModal(deleteFileModal);
    };

    const closeDeleteFileModal = () => closeModal(deleteFileModal);

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
      openModal(renameFileModal);
    };

    const closeRenameFileModal = () => closeModal(renameFileModal);

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

    const closeCreateFileModal = () => closeModal(createFileModal);

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
        const furthest = this.completedLessons.size > 0 ? Math.max(...this.completedLessons) : 0;
        const unlocked = lessonNum <= furthest + 1;
        if (unlocked) {
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
        if (e.target === createFileModal) closeCreateFileModal();
      });
      createFileModal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeCreateFileModal();
      });
    }

    const fileSystemList = document.getElementById("fileSystemList");
    if (fileSystemList) {
      fileSystemList.addEventListener("click", (e) => {
        const btn = e.target?.closest?.("button[data-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const file = btn.getAttribute("data-file");
        if (!action || !file) return;
        if (action === "edit") {
          this.openFileEditor(file);
        }
        if (action === "rename") {
          openRenameFileModal(file);
        }
        if (action === "delete") {
          openDeleteFileModal(file);
        }
      });
    }

    const fileEditorModal = document.getElementById("fileEditorModal");
    const closeFileEditor = document.getElementById("closeFileEditor");
    const cancelFileEditor = document.getElementById("cancelFileEditor");
    const saveFileEditor = document.getElementById("saveFileEditor");
    const fileEditorTextarea = document.getElementById("fileEditorTextarea");

    const closeEditorModal = () => closeModal(fileEditorModal);

    if (closeFileEditor) {
      closeFileEditor.addEventListener("click", closeEditorModal);
    }

    if (cancelFileEditor) {
      cancelFileEditor.addEventListener("click", closeEditorModal);
    }

    if (saveFileEditor) {
      saveFileEditor.addEventListener("click", () => {
        this._saveEditorModal();
      });
    }

    if (fileEditorModal) {
      fileEditorModal.addEventListener("click", (e) => {
        if (e.target === fileEditorModal) closeEditorModal();
      });
      fileEditorModal.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.activeElement !== fileEditorTextarea) closeEditorModal();
      });
    }

    if (fileEditorTextarea) {
      fileEditorTextarea.addEventListener("keydown", (e) => {
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this._saveEditorModal();
        }
        if (e.key === "Escape") {
          closeEditorModal();
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
        if (e.target === renameFileModal) closeRenameFileModal();
      });
      renameFileModal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeRenameFileModal();
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
        if (e.target === deleteFileModal) closeDeleteFileModal();
      });
      deleteFileModal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeDeleteFileModal();
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
    updateLessonNav(this.currentLesson, this.completedLessons);

    const totalSteps = this.getTotalSubLessonCount();
    const stepIndex = this.getCurrentSubLessonStepIndex();
    const stepText = `Lesson ${this.currentLesson} of ${this.totalLessons} - Step ${stepIndex + 1} of ${totalSteps}`;
    const percent = totalSteps === 0 ? 0 : ((stepIndex + 1) / totalSteps) * 100;
    updateProgress(stepText, percent);
  }

  loadLesson(lessonNum, subLessonIndex) {
    this.currentLesson = lessonNum;
    this.currentSubLessonIndex = subLessonIndex;

    const lesson = this.getLesson(this.currentLesson);

    if (subLessonIndex === 0 && lesson?.theoryHtml) {
      this.showTheoryScreen(lesson);
    } else {
      this.startInteractiveLesson();
    }
  }

  showTheoryScreen(lesson, pageIndex = 0) {
    const theoryScreen = document.getElementById("theoryScreen");
    const tutorialArea = document.querySelector(".tutorial-area");
    const theoryContent = document.getElementById("theoryContent");

    const pages = lesson.theoryHtml
      .split('<hr class="theory-page-break">')
      .map((p) => p.trim())
      .filter(Boolean);
    this._theoryPages = pages.length > 0 ? pages : [lesson.theoryHtml];
    this._theoryPageIndex = Math.max(0, Math.min(pageIndex, this._theoryPages.length - 1));

    this._renderTheoryPage(lesson);

    if (tutorialArea) tutorialArea.classList.add("tutorial-hidden");
    if (theoryScreen) theoryScreen.classList.remove("tutorial-hidden");
    updateLessonNav(this.currentLesson, this.completedLessons);
  }

  _renderTheoryPage(lesson) {
    const theoryContent = document.getElementById("theoryContent");
    const tryItOutBtn = document.getElementById("tryItOutBtn");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("theoryPageIndicator");

    const pages = this._theoryPages;
    const idx = this._theoryPageIndex;
    const isLast = idx === pages.length - 1;
    const isFirst = idx === 0;
    const multiPage = pages.length > 1;

    if (theoryContent) {
      const lessonTitle = `<h2 style="margin-bottom:1.25rem;font-size:1.4rem;color:#2d3748;">${lesson.title}</h2>`;
      theoryContent.innerHTML = lessonTitle + pages[idx];
    }

    if (tryItOutBtn) {
      if (isLast) {
        tryItOutBtn.classList.remove("tutorial-hidden");
      } else {
        tryItOutBtn.classList.add("tutorial-hidden");
      }
    }

    if (prevPageBtn) {
      if (multiPage && !isFirst) {
        prevPageBtn.classList.remove("tutorial-hidden");
      } else {
        prevPageBtn.classList.add("tutorial-hidden");
      }
    }

    if (nextPageBtn) {
      if (multiPage && !isLast) {
        nextPageBtn.classList.remove("tutorial-hidden");
      } else {
        nextPageBtn.classList.add("tutorial-hidden");
      }
    }

    if (pageIndicator) {
      if (multiPage) {
        pageIndicator.textContent = `${idx + 1} / ${pages.length}`;
        pageIndicator.classList.remove("tutorial-hidden");
      } else {
        pageIndicator.classList.add("tutorial-hidden");
      }
    }

    const forwardBtn = isLast ? tryItOutBtn : (multiPage ? nextPageBtn : tryItOutBtn);
    if (forwardBtn) forwardBtn.focus();
  }

  startInteractiveLesson() {
    const theoryScreen = document.getElementById("theoryScreen");
    const tutorialArea = document.querySelector(".tutorial-area");
    if (theoryScreen) theoryScreen.classList.add("tutorial-hidden");
    if (tutorialArea) tutorialArea.classList.remove("tutorial-hidden");

    const subLesson = this.getSubLesson(this.currentLesson, this.currentSubLessonIndex);
    const lesson = this.getLesson(this.currentLesson);
    this.getObjectiveStates(this.currentLesson, this.currentSubLessonIndex);
    this.refreshLessonUI();

    this.nextLessonPending = false;

    const vtBtn = document.getElementById("viewTheoryBtn");
    if (vtBtn) {
      if (lesson?.theoryHtml) {
        vtBtn.classList.remove("tutorial-hidden");
      } else {
        vtBtn.classList.add("tutorial-hidden");
      }
    }

    const frBtn = document.getElementById("furtherReadingBtn");
    const frModal = document.getElementById("furtherReadingModal");
    const frContent = frModal?.querySelector(".reading-content");
    if (frBtn) {
      frBtn.textContent = lesson?.furtherButtonText || '📘 Further reading';
      if (lesson?.showFurtherButton) {
        frBtn.classList.remove("tutorial-hidden");
      } else {
        frBtn.classList.add("tutorial-hidden");
        if (frModal) frModal.classList.remove("active");
      }
    }
    if (frContent) {
      frContent.innerHTML = lesson?.furtherButtonHtml || '<p>No additional resources for this lesson.</p>';
    }
    clearNotifications();
    applyReveals(subLesson);

    if (subLesson.hint) {
      showNotification(subLesson.hint, "hint");
    }

    const termInput = document.getElementById("terminalInput");
    if (termInput) termInput.focus();
  }

  _snapshotState() {
    const snapshot = JSON.parse(JSON.stringify(this.gitState));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > 20) this.undoStack.shift();
    this._updateUndoBtn();
  }

  _updateUndoBtn() {
    const btn = document.getElementById("undoBtn");
    if (!btn) return;
    btn.disabled = this.undoStack.length === 0;
  }

  undo() {
    if (this.undoStack.length === 0) return;
    this.gitState = this.undoStack.pop();
    addTerminalOutput("Undid last action.", "system");
    updateVisualPanel(this.gitState);
    this._updateUndoBtn();
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

    const isReadOnly = mainCommand === "help" || mainCommand === "clear" || mainCommand === "cls" || mainCommand === "ls" ||
      (mainCommand === "git" && (args[0] === "status" || args[0] === "log"));

    if (!isReadOnly) this._snapshotState();

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

      case "edit": {
        const result = this.openFileEditor(args[0]);
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

    if (!isReadOnly && !success) this.undoStack.pop();

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
      showNotification(`Objective complete: ${obj.title}`, "success");
    });

    if (changed) {
      this.refreshLessonUI();
    }

    const allDone = objectiveStates.every(Boolean);
    if (!allDone) return;

    setTimeout(() => {
      showNotification("Sub-lesson complete!", "complete");

      const nextSubIndex = this.currentSubLessonIndex + 1;
      if (nextSubIndex < lesson.subLessons.length) {
        this.loadLesson(this.currentLesson, nextSubIndex);
        return;
      }

      if (this.currentLesson < this.totalLessons) {
        showNotification("Lesson complete!", "complete");
        this._markLessonComplete(this.currentLesson);
        this.nextLessonPending = true;
        const modalBody = document.getElementById("postLessonModalBody");
        if (modalBody) {
          modalBody.innerHTML = lesson?.furtherReadingHtml || '<p>Well done! You\'ve completed this lesson.</p>';
        }
        const modal = document.getElementById("postLessonModal");
        if (modal) {
          openModal(modal);
          const nextBtn = document.getElementById("postLessonNextBtn");
          if (nextBtn) nextBtn.focus();
        }
        return;
      }

      this._markLessonComplete(this.currentLesson);
      showNotification("🎊 Congratulations! You've completed all lessons!", "complete");
    }, 600);
  }

  _loadCompletedLessons() {
    try {
      const raw = localStorage.getItem("git_tutorial_completed_lessons");
      if (raw) return new Set(JSON.parse(raw));
    } catch (_) {}
    return new Set();
  }

  _markLessonComplete(lessonNum) {
    this.completedLessons.add(lessonNum);
    try {
      localStorage.setItem("git_tutorial_completed_lessons", JSON.stringify([...this.completedLessons]));
    } catch (_) {}
    updateLessonNav(this.currentLesson, this.completedLessons);
  }
}
