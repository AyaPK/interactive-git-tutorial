export const totalLessons = 8;

export const lessons = {
  1: {
    title: "Introduction to Git",
    subLessons: [
      {
        title: "Using the tutorial terminal",
        description: `
                    <p>Welcome to the interactive Git tutorial! You'll learn Git through commands in the terminal below.</p>
                    <p>Type commands and observe the output + the repository state on the right.</p>
                `,
        objectives: [
          {
            title: "Open the built-in help",
            commandIncludes: "help",
            outputIncludes: "Available Commands:"
          }
        ],
        hint: "Try typing 'help' to see available commands."
      }
    ]
  },
  2: {
    title: "git init & git status",
    subLessons: [
      {
        title: "Initialize a repository",
        description: `
                    <p>Before you can track changes, you need to initialize a Git repository.</p>
                `,
        objectives: [
          {
            title: "Run git init",
            commandIncludes: "git init",
            outputIncludes: "Initialized empty Git repository"
          }
        ],
        hint: "Type 'git init'"
      },
      {
        title: "Inspect repository status",
        description: `
                    <p><code>git status</code> tells you what's staged, what isn't, and what branch you're on.</p>
                `,
        objectives: [
          {
            title: "Run git status",
            commandIncludes: "git status",
            outputIncludes: "On branch"
          },
          {
            title: "See untracked files",
            commandIncludes: "git status",
            outputIncludes: "Untracked files:"
          }
        ],
        hint: "Type 'git status'"
      }
    ]
  },
  3: {
    title: "git add",
    subLessons: [
      {
        title: "Stage a file",
        description: `
                    <p><code>git add</code> moves changes into the staging area so they can be committed.</p>
                `,
        objectives: [
          {
            title: "Stage README.md",
            commandIncludes: "git add README.md",
            outputIncludes: "Added"
          }
        ],
        hint: "Type 'git add README.md'"
      }
    ]
  },
  4: {
    title: "git commit",
    subLessons: [
      {
        title: "Create a commit",
        description: `
                    <p>A commit records a snapshot of your staged changes with a message.</p>
                `,
        objectives: [
          {
            title: "Commit with a message",
            commandIncludes: "git commit -m",
            outputIncludes: "]"
          }
        ],
        hint: "Try: git commit -m \"my first commit\""
      }
    ]
  },
  5: {
    title: "git push & git pull",
    subLessons: [
      {
        title: "Push changes",
        description: `
                    <p><code>git push</code> uploads your commits to a remote repository.</p>
                    <p>In real projects, you usually need to set up a remote like <code>origin</code> first. In this tutorial, pushing works automatically so you can focus on the workflow.</p>
                `,
        objectives: [
          {
            title: "Run git push",
            commandIncludes: "git push",
            outputIncludes: "main -> main"
          }
        ],
        hint: "Type 'git push'"
      },
      {
        title: "Pull changes",
        description: `
                    <p><code>git pull</code> downloads and integrates changes from the remote.</p>
                    <p>If you want to learn how remotes are set up on GitHub, use the Further reading button.</p>
                `,
        objectives: [
          {
            title: "Run git pull",
            commandIncludes: "git pull",
            outputIncludes: "Fast-forward"
          }
        ],
        hint: "Type 'git pull'"
      }
    ]
  },
  6: {
    title: "Branching Basics",
    subLessons: [
      {
        title: "Create and switch branches",
        description: `
                    <p>Branches let you work on changes without affecting your main line of development.</p>
                `,
        objectives: [
          {
            title: "Create a branch",
            commandIncludes: "git branch",
            outputIncludes: "Created branch"
          },
          {
            title: "Switch branches",
            commandIncludes: "git checkout",
            outputIncludes: "Switched to branch"
          }
        ],
        hint: "Try: git branch feature then git checkout feature"
      }
    ]
  },
  7: {
    title: "Merging",
    subLessons: [
      {
        title: "Merge a branch",
        description: `
                    <p>Merging combines changes from one branch into another.</p>
                `,
        objectives: [
          {
            title: "Run git merge",
            commandIncludes: "git merge",
            outputIncludes: "Merge completed successfully"
          }
        ],
        hint: "Try: git merge feature"
      }
    ]
  },
  8: {
    title: "Git Rebase",
    subLessons: [
      {
        title: "Rebase onto another branch",
        description: `
                    <p>Rebase reapplies commits on top of another base commit, creating a linear history.</p>
                `,
        objectives: [
          {
            title: "Run git rebase",
            commandIncludes: "git rebase",
            outputIncludes: "Successfully rebased"
          }
        ],
        hint: "Try: git rebase main"
      }
    ]
  }
};
