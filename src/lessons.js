export const totalLessons = 9;

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
        reveals: ["rightSidebar"],
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
                    <p>Like real git, the command produces no output on success — check the Repository State panel to confirm the file moved to the staging area.</p>
                `,
        objectives: [
          {
            title: "Stage README.md",
            commandIncludes: "git add README.md",
            outputIncludes: ""
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
        reveals: ["timelinePanel"],
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
        title: "Connect a remote",
        description: `
                    <p>Before you can push, you need to tell git where to send your commits.</p>
                    <p><code>git remote add origin &lt;url&gt;</code> registers a remote named <code>origin</code>.</p>
                    <p>In this tutorial the URL doesn't need to be real — just run the command to register it.</p>
                `,
        objectives: [
          {
            title: "Add a remote named origin",
            commandIncludes: "git remote add origin",
            outputIncludes: "Remote repository added"
          }
        ],
        hint: "Try: git remote add origin https://github.com/you/repo.git"
      },
      {
        title: "Push changes",
        description: `
                    <p><code>git push</code> uploads your local commits to the remote repository.</p>
                    <p>After pushing, <code>origin/main</code> will point to the same commit as your local <code>main</code>.</p>
                `,
        objectives: [
          {
            title: "Run git push",
            commandIncludes: "git push",
            outputIncludes: "origin/main"
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
        title: "Create a branch",
        description: `
                    <p>Branches let you work on changes without affecting your main line of development.</p>
                    <p><code>git branch &lt;name&gt;</code> creates a new branch. Like real git, it produces no output on success.</p>
                    <p>You can also use <code>git checkout -b &lt;name&gt;</code> to create <em>and</em> switch in one step.</p>
                `,
        objectives: [
          {
            title: "Create a branch named 'feature'",
            commandIncludes: "git branch feature",
            outputIncludes: ""
          }
        ],
        hint: "Try: git branch feature"
      },
      {
        title: "Switch branches",
        description: `
                    <p>Use <code>git checkout &lt;branch&gt;</code> to switch to an existing branch.</p>
                    <p>Tip: <code>git checkout -b &lt;name&gt;</code> creates and switches in one command.</p>
                `,
        objectives: [
          {
            title: "Switch to the 'feature' branch",
            commandIncludes: "git checkout feature",
            outputIncludes: "Switched to branch"
          }
        ],
        hint: "Try: git checkout feature"
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
  ,
  9: {
    title: "Local vs Remote (origin)",
    subLessons: [
      {
        title: "Understand origin/main",
        description: `
                    <p>Git usually has a <em>local</em> branch (like <code>main</code>) and a <em>remote-tracking</em> branch (like <code>origin/main</code>).</p>
                    <p>Your local branch moves forward when you commit. The remote-tracking branch only moves when you <code>git push</code> or <code>git pull</code>.</p>
                    <p>Check the Timeline panel to see both lanes.</p>
                `,
        objectives: [
          {
            title: "List remotes",
            commandIncludes: "git remote -v",
            outputIncludes: "origin"
          },
          {
            title: "Push so origin/main updates",
            commandIncludes: "git push",
            outputIncludes: "origin/main"
          }
        ],
        hint: "Try: git remote -v then git push"
      }
    ]
  }
};
