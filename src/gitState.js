export function createInitialGitState() {
  return {
    initialized: false,
    workingDirectory: ["README.md", "app.js"],
    stagedFiles: [],
    commits: [],
    currentBranch: "main",
    branches: ["main"],
    branchHeads: { main: null },
    branchBases: { main: null },
    branchParents: { main: null },
    remotes: ["origin"],
    remoteBranches: ["origin/main"],
    remoteBranchHeads: { "origin/main": null },
    remoteConnected: false,
    fileContents: {
      "README.md": "# My Project\n\nA short description of this project.",
      "app.js": "// Entry point\nconsole.log('Hello, world!');"
    },
    modifiedFiles: []
  };
}

export function generateCommitHash() {
  return Math.random().toString(36).substring(2, 9);
}
