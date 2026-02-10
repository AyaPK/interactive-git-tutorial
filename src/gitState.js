export function createInitialGitState() {
  return {
    initialized: false,
    workingDirectory: ["README.md", "app.js"],
    stagedFiles: [],
    commits: [],
    currentBranch: "main",
    branches: ["main"],
    branchHeads: { main: null },
    remotes: ["origin"],
    remoteBranches: ["origin/main"],
    remoteBranchHeads: { "origin/main": null },
    remoteConnected: false
  };
}

export function generateCommitHash() {
  return Math.random().toString(36).substring(2, 9);
}
