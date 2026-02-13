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
- `lessons/`
  - Markdown lesson files and a manifest.json mapping lesson numbers to files
- `src/lessonsLoader.js`
  - Tiny, dependency-free loader that parses Markdown lessons into the runtime structure
- `src/gitState.js`
  - In-memory “repo” state model
- `src/gitCommands.js`
  - Git command simulation / outputs
- `src/ui.js`
  - UI rendering helpers (lesson rendering, sidebar updates, timeline graph rendering)

## Authoring lessons in Markdown

Lessons are defined as Markdown files under the `lessons/` folder. A `lessons/manifest.json` file maps numeric lesson IDs to their Markdown files.

Example `lessons/manifest.json`:

```
{
  "1": ["1.md"],
  "2": ["2.md"]
}
```

Each lesson file can contain multiple sub-lessons, plus optional per-lesson resources.

### Supported syntax (per lesson .md)

- Frontmatter (optional):
  - `title: <Lesson Title>`
- Sub-lessons (one or more):
  - Start a sub-lesson with a heading: `### Sublesson: <Title>`
  - Optional hint line inside the sub-lesson block: `Hint: <text>`
  - Objectives block:
    - A line `Objectives:` followed by bullet items
    - Bullet format: `- <Objective Title> | <commandIncludes> | <outputIncludes>`
  - Optional reveals block to show UI elements when the sub-lesson starts:
    - A line `Reveals:` followed by bullet items of element IDs (e.g., `- rightSidebar`)
  - The remaining Markdown in the sub-lesson is treated as the description (converted to HTML)

- Optional per-lesson sections (outside sub-lessons):
  - `### Further reading`
    - Content shown inline after the lesson completes (supports headings, lists, links)
  - `### Further reading button`
    - Enables a header button that opens a modal with this content
    - Optional label line to change button text: `Label: <your button label>`
    - Remaining content becomes the modal body (supports lists and links)

### Minimal example (lesson with two sub-lessons)

```
---
title: git init & git status
---

### Sublesson: Initialize a repository
Reveals:
- rightSidebar
Objectives:
- Run git init | git init | Initialized

Before you can track changes, you need to initialize a Git repository.

### Sublesson: Inspect repository status
Objectives:
- Run git status | git status | On branch
- See untracked files | git status | Untracked files:

`git status` tells you what's staged, what isn't, and what branch you're on.

### Further reading
- Why status matters
- https://git-scm.com/docs

### Further reading button
Label: Learn more about Git basics
- Official docs: https://git-scm.com/doc
- Pro Git (free book): https://git-scm.com/book/en/v2
```

### Notes on formatting

- The loader is dependency-free and supports:
  - Headings (###), paragraphs, unordered lists (- or *), and Markdown links `[text](url)`
  - Inline panel and modal content accept the same subset
- Objectives matching checks both the typed command and the output substrings.
- The `Further reading` section is only shown after completing the lesson (all sub-lessons done).
- The `Further reading button` is optional; omit the section to hide the button for a lesson.

## Notes

- This project is intentionally simplified for teaching.
- The command outputs are designed to be recognizable rather than perfectly identical to real Git output.
