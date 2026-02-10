export const totalLessons = 8;

export const lessons = {
  1: {
    title: "Introduction to Git",
    description: `
                    <p>Welcome to the interactive Git tutorial! In this lesson, you'll learn the basics of Git and how to use it through a command-line interface.</p>
                    <p>Git is a distributed version control system that helps you track changes in your code and collaborate with others.</p>
                `,
    objectives: [
      "Understand what Git is and why it's useful",
      "Learn basic Git terminology",
      "Navigate the terminal interface"
    ],
    expectedCommands: ["help", "clear"],
    hint: "Try typing 'help' to see available commands!"
  },
  2: {
    title: "git init & git status",
    description: `
                    <p>Every Git project starts with initializing a repository. The <code>git init</code> command creates a new Git repository.</p>
                    <p>The <code>git status</code> command shows the current state of your working directory and staging area.</p>
                `,
    objectives: [
      "Initialize a Git repository",
      "Check repository status",
      "Understand working directory vs staging area"
    ],
    expectedCommands: ["git init", "git status"],
    hint: "Start by typing 'git init' to initialize your repository!"
  },
  3: {
    title: "git add",
    description: `
                    <p>The <code>git add</code> command moves files from your working directory to the staging area.</p>
                    <p>The staging area is where you prepare changes before committing them.</p>
                `,
    objectives: [
      "Add files to the staging area",
      "Stage specific files vs all files",
      "Understand the staging process"
    ],
    expectedCommands: ["git add"],
    hint: "Try 'git add README.md' to stage a specific file, or 'git add .' to stage all files!"
  },
  4: {
    title: "git commit",
    description: `
                    <p>The <code>git commit</code> command saves your staged changes to the repository.</p>
                    <p>Every commit needs a descriptive message that explains what changes were made.</p>
                `,
    objectives: [
      "Create your first commit",
      "Write good commit messages",
      "Understand the commit process"
    ],
    expectedCommands: ["git commit"],
    hint: "First stage some files with 'git add', then commit with 'git commit -m \"Your message\"'"
  },
  5: {
    title: "git push & git pull",
    description: `
                    <p><code>git push</code> uploads your local commits to a remote repository.</p>
                    <p><code>git pull</code> downloads changes from the remote repository and merges them into your local branch.</p>
                `,
    objectives: [
      "Push changes to remote repository",
      "Pull changes from remote repository",
      "Understand remote collaboration"
    ],
    expectedCommands: ["git push", "git pull"],
    hint: "First make a commit, then try 'git push' to share it with the world!"
  },
  6: {
    title: "Branching Basics",
    description: `
                    <p>Branches allow you to work on different features independently.</p>
                    <p>The <code>git branch</code> command manages branches, and <code>git checkout</code> switches between them.</p>
                `,
    objectives: [
      "Create new branches",
      "Switch between branches",
      "Understand branch isolation"
    ],
    expectedCommands: ["git branch", "git checkout"],
    hint: "Try 'git branch feature' to create a new branch, then 'git checkout feature' to switch to it!"
  },
  7: {
    title: "Merging",
    description: `
                    <p>Merging combines changes from different branches.</p>
                    <p>The <code>git merge</code> command integrates changes from one branch into another.</p>
                `,
    objectives: [
      "Merge branches",
      "Handle merge conflicts",
      "Understand merge strategies"
    ],
    expectedCommands: ["git merge"],
    hint: "Switch to main branch, then try 'git merge feature' to bring in changes!"
  },
  8: {
    title: "Git Rebase",
    description: `
                    <p>Rebase is an alternative to merging that rewrites commit history.</p>
                    <p>The <code>git rebase</code> command moves or combines a sequence of commits to a new base.</p>
                `,
    objectives: [
      "Understand rebase vs merge",
      "Rebase branches",
      "Clean up commit history"
    ],
    expectedCommands: ["git rebase"],
    hint: "Try 'git rebase main' while on a feature branch to rebase onto main!"
  }
};
