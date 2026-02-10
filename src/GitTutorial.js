import { lessons, totalLessons } from "./lessons.js";
import { createInitialGitState } from "./gitState.js";
import { handleGitCommand, showHelp } from "./gitCommands.js";
import {
  addTerminalOutput,
  clearTerminal,
  renderLesson,
  updateLessonNav,
  updateProgress,
  updateVisualPanel
} from "./ui.js";

export class GitTutorial {
  constructor() {
    this.currentLesson = 1;
    this.currentSubLessonIndex = 0;
    this.totalLessons = totalLessons;
    this.terminalHistory = [];
    this.gitState = createInitialGitState();
    this.lessons = lessons;

    this.objectiveCompletion = {};

    this.init();
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
    const lessonItems = document.querySelectorAll(".lesson-item");

    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.handleCommand(terminalInput.value);
        terminalInput.value = "";
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

    lessonItems.forEach((item) => {
      item.addEventListener("click", () => {
        const lessonNum = Number.parseInt(item.dataset.lesson, 10);
        if (lessonNum <= this.currentLesson || this.currentLesson === this.totalLessons) {
          this.loadLesson(lessonNum, 0);
        }
      });
    });
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

    if (subLesson.hint) {
      addTerminalOutput(`💡 Hint: ${subLesson.hint}`, "hint");
    }
  }

  handleCommand(input) {
    const command = input.trim();
    if (!command) return;

    addTerminalOutput(`$ ${command}`, "input");
    this.terminalHistory.push(command);

    const parts = command.split(" ");
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
        addTerminalOutput("🎉 Lesson complete! Moving to the next lesson.", "success");
        this.loadLesson(this.currentLesson + 1, 0);
        return;
      }

      addTerminalOutput("🎊 Congratulations! You've completed all lessons!", "success");
    }, 600);
  }
}
