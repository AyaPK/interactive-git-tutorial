# Git Interactive Tutorial

A browser-based, interactive Git tutorial that simulates a command-line workflow while providing visual guidance for repository state, lessons, and a timeline/branch graph.

## What this is

- A **learning app**: type commands into a built-in terminal and see immediate feedback.
- A **safe simulation**: commands update an in-memory “repo” model (no real Git is executed).
- A **visual explainer**: working directory / staging area / commits and a timeline graph help learners understand what’s happening.

## Features

- **Interactive terminal**
  - Simulated Git commands (e.g. `git init`, `git status`, `git add`, `git commit`, `git push`, `git pull`, branching, merging).
  - Helpful output messages to reinforce concepts.

- **Lesson system**
  - Lessons are composed of **sub-lessons**.
  - Each sub-lesson has **objectives**.
  - Objectives validate both:
    - a **substring in the command** the learner typed
    - a **substring in the output** they received

- **Repository State sidebar**
  - Visualizes:
    - Working directory files
    - Staging area files
    - Commit list
  - Clearly shows when the repo is **uninitialized**.

- **File operations (simulated)**
  - CLI: `touch`, `mv`, `rm`, `ls`
  - UI: create / rename / delete files via modals (and actions echo to the terminal)

- **Timeline graph**
  - Bottom timeline visualizes commits, branches, split points, merges, plus labels like `HEAD` and `REMOTE`.

- **Further reading**
  - Optional modal explaining how GitHub remotes (`origin`) work and how to set them up.

## Getting started

### Prerequisites

- Node.js 18+ recommended

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`). Open it in your browser.

### Build

```bash
npm run build
```

### Preview the build

```bash
npm run preview
```

## Usage

- Type `help` in the terminal to see available commands.
- Follow the lesson objectives.
- Use the right sidebar to observe repository state changes.
- Use the bottom timeline panel to understand history/branches visually.

### Useful simulated commands

- **Basics**
  - `help`, `clear`, `cls`
- **Files (simulated)**
  - `ls`
  - `touch <file>`
  - `mv <old> <new>`
  - `rm <file>`
- **Git (simulated)**
  - `git init`
  - `git status`
  - `git add <file>` / `git add .`
  - `git commit -m "message"`
  - `git branch <name>`
  - `git checkout <name>`
  - `git merge <name>`
  - `git push`, `git pull`
  - `git remote -v`

## Project structure

- `index.html`
  - App layout (terminal, lesson area, sidebar, modals, timeline panel)
- `styles.css`
  - Styling for the app UI
- `src/main.js`
  - Entry point
- `src/GitTutorial.js`
  - Main controller (event wiring, command dispatch, lesson progression)
- `src/lessons.js`
  - Lesson content (lessons → sub-lessons → objectives)
- `src/gitState.js`
  - In-memory “repo” state model
- `src/gitCommands.js`
  - Git command simulation / outputs
- `src/ui.js`
  - UI rendering helpers (lesson rendering, sidebar updates, timeline graph rendering)

## Notes

- This project is intentionally simplified for teaching.
- The command outputs are designed to be recognizable rather than perfectly identical to real Git output.
