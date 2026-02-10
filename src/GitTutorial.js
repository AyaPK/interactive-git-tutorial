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
    this.totalLessons = totalLessons;
    this.terminalHistory = [];
    this.gitState = createInitialGitState();
    this.lessons = lessons;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadLesson(1);
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
          this.loadLesson(lessonNum);
        }
      });
    });
  }

  loadLesson(lessonNum) {
    this.currentLesson = lessonNum;
    const lesson = this.lessons[lessonNum];

    renderLesson(lesson);
    updateProgress(this.currentLesson, this.totalLessons);
    updateLessonNav(this.currentLesson);

    if (lesson.hint) {
      addTerminalOutput(`💡 Hint: ${lesson.hint}`, "hint");
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
    this.checkLessonProgress(command);
  }

  checkLessonProgress(command) {
    const lesson = this.lessons[this.currentLesson];
    if (!lesson.expectedCommands) return;

    const commandMatch = lesson.expectedCommands.some((expected) => command.includes(expected));

    if (!commandMatch) return;

    setTimeout(() => {
      if (this.currentLesson < this.totalLessons) {
        addTerminalOutput("🎉 Great job! You can proceed to the next lesson.", "success");
        this.loadLesson(this.currentLesson + 1);
      } else {
        addTerminalOutput("🎊 Congratulations! You've completed all lessons!", "success");
      }
    }, 1000);
  }
}
