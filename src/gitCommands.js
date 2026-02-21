import { generateCommitHash } from "./gitState.js";

export function showHelp() {
  return `Available Commands:
  help              - Show this help message
  clear             - Clear the terminal
  cls               - Clear the terminal
  ls                - List files
  touch <file>      - Create a new file
  mv <old> <new>    - Rename a file
  edit <file>       - Open the file editor
  
Git Commands:
  git init          - Initialize a new Git repository
  git status        - Show the working tree status
  git add <file>    - Add files to the staging area
  git add .         - Add all files to staging area
  git commit -m "msg" - Commit staged changes
  git push          - Push changes to remote repository
  git pull          - Pull changes from remote repository
  git branch        - List branches
  git branch <name> - Create a new branch
  git checkout <branch> - Switch to an existing branch
  git checkout -b <branch> - Create and switch to a new branch
  git merge <branch> - Merge a branch into current branch
  git rebase <branch> - Rebase current branch onto another
  git log           - Show commit history
  git rm <file>     - Remove a tracked file
  git remote add origin <url> - Add remote repository`;
}

function isTrackedFile(gitState, file) {
  return gitState.commits.some((c) => c.files?.includes?.(file));
}

export function getGitStatus(gitState) {
  if (!gitState.initialized) {
    return "fatal: not a git repository (or any of the parent directories): .git";
  }

  const hasUpstream = gitState.branchHeads?.[gitState.currentBranch] != null;
  let output = `On branch ${gitState.currentBranch}\n`;
  if (!hasUpstream) {
    output += "\nNo commits yet\n";
  }

  if (gitState.stagedFiles.length > 0) {
    output += "\nChanges to be committed:\n";
    output += '  (use "git restore --staged <file>..." to unstage)\n';
    const lines = gitState.stagedFiles.map((f) => {
      const label = isTrackedFile(gitState, f) ? "modified:" : "new file:";
      return `\t${label.padEnd(12)} ${f}`;
    });
    output += lines.join("\n") + "\n";
  }

  const modified = Array.isArray(gitState.modifiedFiles) ? gitState.modifiedFiles : [];
  if (modified.length > 0) {
    if (gitState.stagedFiles.length > 0) output += "\n";
    output += "Changes not staged for commit:\n";
    output += '  (use "git add <file>..." to update what will be committed)\n';
    output += "\tmodified:   " + modified.join("\n\tmodified:   ") + "\n";
  }

  const untracked = gitState.workingDirectory.filter((f) => !modified.includes(f));
  if (untracked.length > 0) {
    if (gitState.stagedFiles.length > 0 || modified.length > 0) output += "\n";
    output += "Untracked files:\n";
    output += '  (use "git add <file>..." to include in what will be committed)\n';
    output += "\t" + untracked.join("\n\t") + "\n";
  }

  if (gitState.stagedFiles.length === 0 && gitState.workingDirectory.length === 0 && modified.length === 0) {
    output += "nothing to commit, working tree clean";
  } else if (gitState.stagedFiles.length === 0) {
    output += "\nno changes added to commit (use \"git add\" and/or \"git commit -a\")";
  }

  return output;
}

function ensureRemoteBranch(gitState, remoteName, branchName) {
  if (!gitState.remoteBranches) gitState.remoteBranches = [];
  if (!gitState.remoteBranchHeads) gitState.remoteBranchHeads = {};
  const ref = `${remoteName}/${branchName}`;
  if (!gitState.remoteBranches.includes(ref)) {
    gitState.remoteBranches.push(ref);
  }
  if (!(ref in gitState.remoteBranchHeads)) {
    gitState.remoteBranchHeads[ref] = null;
  }
  return ref;
}

function handleGitAdd(gitState, args) {
  if (args.length === 0) {
    return "Nothing specified, nothing added.";
  }

  const filesToAdd = args.join(" ");
  const addedFiles = [];
  const notFound = [];
  if (!Array.isArray(gitState.modifiedFiles)) gitState.modifiedFiles = [];

  if (filesToAdd === ".") {
    addedFiles.push(...gitState.workingDirectory);
    gitState.stagedFiles.push(...gitState.workingDirectory);
    gitState.workingDirectory = [];
    addedFiles.push(...gitState.modifiedFiles.filter((f) => !addedFiles.includes(f)));
    gitState.stagedFiles.push(...gitState.modifiedFiles.filter((f) => !gitState.stagedFiles.includes(f)));
    gitState.modifiedFiles = [];
  } else {
    for (const file of args) {
      const wdIdx = gitState.workingDirectory.indexOf(file);
      if (wdIdx !== -1) {
        gitState.workingDirectory.splice(wdIdx, 1);
        gitState.stagedFiles.push(file);
        addedFiles.push(file);
        continue;
      }
      const modIdx = gitState.modifiedFiles.indexOf(file);
      if (modIdx !== -1) {
        gitState.modifiedFiles.splice(modIdx, 1);
        if (!gitState.stagedFiles.includes(file)) gitState.stagedFiles.push(file);
        addedFiles.push(file);
        continue;
      }
      notFound.push(file);
    }
  }

  if (addedFiles.length === 0 && notFound.length > 0) {
    return notFound.map((f) => `fatal: pathspec '${f}' did not match any files`).join("\n");
  }

  return notFound.map((f) => `warning: pathspec '${f}' did not match any files`).join("\n");
}

function handleGitCommit(gitState, args) {
  let message = "";

  // Support -m and combined flags like -am or -ma (message is still the next arg)
  const messageIndex = args.findIndex((a) => a === "-m" || (a.startsWith("-") && a.includes("m") && a.length > 2));
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    message = String(args[messageIndex + 1]).replace(/['"]/g, "");
  } else {
    return "Aborting commit due to empty commit message.\nUse: git commit -m \"Your commit message\"";
  }

  const fileCount = gitState.stagedFiles.length;
  const isFirstCommit = !gitState.branchHeads?.[gitState.currentBranch];

  const commit = {
    hash: generateCommitHash(),
    message,
    author: "Tutorial User",
    files: [...gitState.stagedFiles],
    timestamp: new Date().toLocaleString(),
    branch: gitState.currentBranch,
    parents: gitState.branchHeads?.[gitState.currentBranch]
      ? [gitState.branchHeads[gitState.currentBranch]]
      : []
  };

  gitState.commits.push(commit);
  gitState.stagedFiles = [];
  if (!gitState.branchHeads) gitState.branchHeads = {};
  gitState.branchHeads[gitState.currentBranch] = commit.hash;

  const rootNote = isFirstCommit ? "(root-commit) " : "";
  return `[${gitState.currentBranch} ${rootNote}${commit.hash}] ${message}\n ${fileCount} file${fileCount !== 1 ? "s" : ""} changed`;
}

function handleGitBranch(gitState, args) {
  if (!gitState.branches) gitState.branches = [gitState.currentBranch];
  if (!gitState.branchHeads) gitState.branchHeads = { [gitState.currentBranch]: null };
  if (!gitState.branchBases) gitState.branchBases = { [gitState.currentBranch]: null };
  if (!gitState.branchParents) gitState.branchParents = { [gitState.currentBranch]: null };

  if (args.length === 0) {
    return gitState.branches
      .map((b) => (b === gitState.currentBranch ? `* ${b}` : `  ${b}`))
      .join("\n");
  }

  const branchName = args[0];
  if (gitState.branches.includes(branchName)) {
    return `fatal: A branch named '${branchName}' already exists.`;
  }
  gitState.branches.push(branchName);
  gitState.branchHeads[branchName] = gitState.branchHeads[gitState.currentBranch] ?? null;
  gitState.branchBases[branchName] = gitState.branchHeads[gitState.currentBranch] ?? null;
  gitState.branchParents[branchName] = gitState.currentBranch;
  return "";
}

function handleGitCheckout(gitState, args) {
  if (args.length === 0) {
    return "Please specify a branch name to checkout";
  }

  if (!gitState.branches) gitState.branches = [gitState.currentBranch];
  if (!gitState.branchHeads) gitState.branchHeads = { [gitState.currentBranch]: null };
  if (!gitState.branchBases) gitState.branchBases = { [gitState.currentBranch]: null };
  if (!gitState.branchParents) gitState.branchParents = { [gitState.currentBranch]: null };

  const createNew = args[0] === "-b";
  const branchName = createNew ? args[1] : args[0];

  if (!branchName) {
    return createNew
      ? "error: switch `b' requires a value"
      : "Please specify a branch name to checkout";
  }

  if (createNew) {
    if (gitState.branches.includes(branchName)) {
      return `fatal: A branch named '${branchName}' already exists.`;
    }
    gitState.branches.push(branchName);
    gitState.branchHeads[branchName] = gitState.branchHeads[gitState.currentBranch] ?? null;
    gitState.branchBases[branchName] = gitState.branchHeads[gitState.currentBranch] ?? null;
    gitState.branchParents[branchName] = gitState.currentBranch;
    gitState.currentBranch = branchName;
    return `Switched to a new branch '${branchName}'`;
  }

  if (!gitState.branches.includes(branchName)) {
    return `error: pathspec '${branchName}' did not match any file(s) known to git`;
  }

  gitState.currentBranch = branchName;
  return `Switched to branch '${branchName}'`;
}

function handleGitMerge(gitState, args) {
  if (args.length === 0) {
    return "Please specify a branch to merge";
  }

  const branchName = args[0];
  if (!gitState.branches) gitState.branches = [gitState.currentBranch];
  if (!gitState.branchHeads) gitState.branchHeads = { [gitState.currentBranch]: null };
  if (!gitState.branches.includes(branchName)) {
    return `merge: '${branchName}' - not something we can merge`;
  }
  const currentHead = gitState.branchHeads[gitState.currentBranch] ?? null;
  const otherHead = gitState.branchHeads[branchName] ?? null;
  const commit = {
    hash: generateCommitHash(),
    message: `Merge branch '${branchName}' into ${gitState.currentBranch}`,
    author: "Tutorial User",
    files: [],
    timestamp: new Date().toLocaleString(),
    branch: gitState.currentBranch,
    type: "merge",
    parents: [currentHead, otherHead].filter(Boolean)
  };
  gitState.commits.push(commit);
  gitState.branchHeads[gitState.currentBranch] = commit.hash;
  return `Merge branch '${branchName}' into ${gitState.currentBranch}\n\nAuto-merging files\nMerge completed successfully`;
}

function handleGitRebase(gitState, args) {
  if (args.length === 0) {
    return "Please specify a branch to rebase onto";
  }

  const branchName = args[0];
  return `Rebasing ${gitState.currentBranch} onto ${branchName}\n\nSuccessfully rebased and updated refs/heads/${gitState.currentBranch}`;
}

export function handleGitCommand(gitState, subcommand, args) {
  let output = "";
  let success = false;

  switch (subcommand) {
    case "init":
      if (gitState.initialized) {
        output = "Reinitialized existing Git repository in /tutorial/.git/";
      } else {
        gitState.initialized = true;
        if (!gitState.branches) gitState.branches = [gitState.currentBranch];
        if (!gitState.branchHeads) gitState.branchHeads = { [gitState.currentBranch]: null };
        output = "Initialized empty Git repository in /tutorial/.git/";
      }
      success = true;
      break;

    case "status":
      output = getGitStatus(gitState);
      success = true;
      break;

    case "add":
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
      } else {
        output = handleGitAdd(gitState, args);
        success = true;
      }
      break;

    case "commit":
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
      } else {
        // -a only auto-stages tracked modified files, NOT untracked files
        if (args.some((a) => a === "-a" || (a.startsWith("-") && a.includes("a") && a.length > 2))) {
          if (Array.isArray(gitState.modifiedFiles) && gitState.modifiedFiles.length > 0) {
            gitState.stagedFiles.push(...gitState.modifiedFiles.filter((f) => !gitState.stagedFiles.includes(f)));
            gitState.modifiedFiles = [];
          }
        }

        if (gitState.stagedFiles.length === 0) {
          output = "nothing to commit, working tree clean";
        } else {
          output = handleGitCommit(gitState, args);
          success = true;
        }
      }
      break;

    case "push":
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
      } else if (!gitState.remoteConnected) {
        output = `fatal: '${args[1] ?? "origin"}' does not appear to be a git repository\nfatal: Could not read from remote repository.\n\nPlease make sure you have the correct access rights\nand the repository exists.`;
      } else {
        const remoteRef = ensureRemoteBranch(gitState, "origin", gitState.currentBranch);
        const localHead = gitState.branchHeads?.[gitState.currentBranch] ?? null;
        const remoteHead = gitState.remoteBranchHeads?.[remoteRef] ?? null;
        if (localHead === remoteHead) {
          output = "Everything up-to-date";
          success = true;
          break;
        }
        if (localHead) {
          gitState.remoteBranchHeads[remoteRef] = localHead;
        }
        const branch = gitState.currentBranch;
        const prevHash = remoteHead ? remoteHead.slice(0, 7) : "0000000";
        const newHash = localHead ? localHead.slice(0, 7) : "0000000";
        output = `Enumerating objects: ${gitState.commits.length}, done.\nCounting objects: 100%, done.\nWriting objects: 100%, done.\nTo https://github.com/tutorial/repo.git\n   ${prevHash}..${newHash}  ${branch} -> origin/${branch}`;
        success = true;
      }
      break;

    case "pull":
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
      } else {
        const remoteRef = ensureRemoteBranch(gitState, "origin", gitState.currentBranch);
        const remoteHead = gitState.remoteBranchHeads?.[remoteRef] ?? null;
        if (remoteHead) {
          gitState.branchHeads[gitState.currentBranch] = remoteHead;
        }
        output =
          "remote: Counting objects: 5, done.\nremote: Compressing objects: 100% (3/3), done.\nremote: Total 5 (delta 2), reused 5 (delta 2)\nUnpacking objects: 100% (5/5), done.\nFrom https://github.com/tutorial/repo.git\n   abc1234..def5678  main     -> origin/main\nUpdating abc1234..def5678\nFast-forward";
        success = true;
      }
      break;

    case "branch":
      output = handleGitBranch(gitState, args);
      success = !output.startsWith("fatal:");
      break;

    case "checkout":
      output = handleGitCheckout(gitState, args);
      success = !output.startsWith("fatal:") && !output.startsWith("error:");
      break;

    case "merge":
      output = handleGitMerge(gitState, args);
      success = true;
      break;

    case "rebase":
      output = handleGitRebase(gitState, args);
      success = true;
      break;

    case "log": {
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
        break;
      }
      const logCommits = gitState.commits
        .slice()
        .reverse()
        .filter((c) => {
          const head = gitState.branchHeads?.[gitState.currentBranch];
          if (!head) return false;
          const reachable = new Set();
          const stack = [head];
          const byHash = new Map(gitState.commits.map((x) => [x.hash, x]));
          while (stack.length) {
            const h = stack.pop();
            if (!h || reachable.has(h)) continue;
            reachable.add(h);
            const cx = byHash.get(h);
            if (cx?.parents?.length) for (const p of cx.parents) stack.push(p);
          }
          return reachable.has(c.hash);
        });
      if (logCommits.length === 0) {
        output = "fatal: your current branch has no commits yet";
        break;
      }
      output = logCommits
        .map((c) => `commit ${c.hash}\nAuthor: ${c.author}\nDate:   ${c.timestamp}\n\n    ${c.message}`)
        .join("\n\n");
      success = true;
      break;
    }

    case "rm": {
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
        break;
      }
      const rmFile = args[0];
      if (!rmFile) {
        output = "fatal: No pathspec given. Which files should I remove?";
        break;
      }
      const rmTracked = isTrackedFile(gitState, rmFile);
      const rmInWd = gitState.workingDirectory.includes(rmFile);
      const rmInStage = gitState.stagedFiles.includes(rmFile);
      if (!rmTracked && !rmInWd && !rmInStage) {
        output = `fatal: pathspec '${rmFile}' did not match any files`;
        break;
      }
      if (!rmTracked) {
        output = `error: the following file has no changes:\n    ${rmFile}\n(use --cached to keep the file, or -f to force removal)`;
        break;
      }
      gitState.workingDirectory = gitState.workingDirectory.filter((f) => f !== rmFile);
      gitState.stagedFiles = gitState.stagedFiles.filter((f) => f !== rmFile);
      if (Array.isArray(gitState.modifiedFiles)) {
        gitState.modifiedFiles = gitState.modifiedFiles.filter((f) => f !== rmFile);
      }
      if (gitState.fileContents) delete gitState.fileContents[rmFile];
      output = `rm '${rmFile}'`;
      success = true;
      break;
    }

    case "remote":
      if (args[0] === "add" && args[1] === "origin") {
        gitState.remoteConnected = true;
        if (!gitState.remotes) gitState.remotes = ["origin"];
        ensureRemoteBranch(gitState, "origin", gitState.currentBranch);
        output = "Remote repository added successfully.";
        success = true;
      } else if (args[0] === "-v") {
        output =
          "origin  https://github.com/tutorial/repo.git (fetch)\norigin  https://github.com/tutorial/repo.git (push)";
        success = true;
      } else {
        output = "Usage: git remote add origin <url>";
      }
      break;

    default:
      output = `git: '${subcommand}' is not a git command. See 'git --help'.`;
  }

  return { output, success };
}
