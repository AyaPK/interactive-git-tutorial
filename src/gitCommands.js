import { generateCommitHash } from "./gitState.js";

export function showHelp() {
  return `Available Commands:
  help              - Show this help message
  clear             - Clear the terminal
  
Git Commands:
  git init          - Initialize a new Git repository
  git status        - Show the working tree status
  git add <file>    - Add files to the staging area
  git add .         - Add all files to staging area
  git commit -m "msg" - Commit staged changes
  git push          - Push changes to remote repository
  git pull          - Pull changes from remote repository
  git branch        - List, create, or delete branches
  git checkout <branch> - Switch to a branch
  git merge <branch> - Merge a branch into current branch
  git rebase <branch> - Rebase current branch onto another
  git remote add origin <url> - Add remote repository`;
}

export function getGitStatus(gitState) {
  if (!gitState.initialized) {
    return "fatal: not a git repository (or any of the parent directories): .git";
  }

  let output = `On branch ${gitState.currentBranch}\n`;

  if (gitState.stagedFiles.length > 0) {
    output += "Changes to be committed:\n";
    output += '  (use "git restore --staged <file>..." to unstage)\n';
    output += "\tnew file:   " + gitState.stagedFiles.join("\n\tnew file:   ") + "\n";
  }

  if (gitState.workingDirectory.length > 0) {
    if (gitState.stagedFiles.length > 0) output += "\n";
    output += "Untracked files:\n";
    output += '  (use "git add <file>..." to include in what will be committed)\n';
    output += "\t" + gitState.workingDirectory.join("\n\t") + "\n";
  }

  if (gitState.stagedFiles.length === 0 && gitState.workingDirectory.length === 0) {
    output += "nothing to commit, working tree clean";
  }

  return output;
}

function handleGitAdd(gitState, args) {
  if (args.length === 0) {
    return "Nothing specified, nothing added.";
  }

  const filesToAdd = args.join(" ");
  const addedFiles = [];

  if (filesToAdd === ".") {
    addedFiles.push(...gitState.workingDirectory);
    gitState.stagedFiles.push(...gitState.workingDirectory);
    gitState.workingDirectory = [];
  } else {
    for (const file of args) {
      const index = gitState.workingDirectory.indexOf(file);
      if (index !== -1) {
        gitState.workingDirectory.splice(index, 1);
        gitState.stagedFiles.push(file);
        addedFiles.push(file);
      }
    }
  }

  if (addedFiles.length === 0) {
    return "No files added to staging area.";
  }

  return `Added ${addedFiles.length} file(s) to staging area:\n  ${addedFiles.join("\n  ")}`;
}

function handleGitCommit(gitState, args) {
  let message = "";

  const messageIndex = args.indexOf("-m");
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    message = args[messageIndex + 1].replace(/['"]/g, "");
  } else {
    return "Aborting commit due to empty commit message.\nUse: git commit -m \"Your commit message\"";
  }

  const commit = {
    hash: generateCommitHash(),
    message,
    author: "Tutorial User",
    files: [...gitState.stagedFiles],
    timestamp: new Date().toLocaleString()
  };

  gitState.commits.push(commit);
  gitState.stagedFiles = [];

  return `[${commit.hash}] ${message}\n ${gitState.commits.length} file(s) changed`;
}

function handleGitBranch(gitState, args) {
  if (args.length === 0) {
    return `* ${gitState.currentBranch}\n`;
  }

  const branchName = args[0];
  return `Created branch '${branchName}'`;
}

function handleGitCheckout(gitState, args) {
  if (args.length === 0) {
    return "Please specify a branch name to checkout";
  }

  const branchName = args[0];
  gitState.currentBranch = branchName;
  return `Switched to branch '${branchName}'`;
}

function handleGitMerge(gitState, args) {
  if (args.length === 0) {
    return "Please specify a branch to merge";
  }

  const branchName = args[0];
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
        output = "Initialized Git repository already exists.";
      } else {
        gitState.initialized = true;
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
      } else if (gitState.stagedFiles.length === 0) {
        output = "nothing to commit, working tree clean";
      } else {
        output = handleGitCommit(gitState, args);
        success = true;
      }
      break;

    case "push":
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
      } else if (!gitState.remoteConnected) {
        output =
          "fatal: No configured push destination.\nPlease specify the remote repository with git remote add";
      } else {
        output =
          "Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nWriting objects: 100% (3/3), done.\nTotal 3 (delta 0), reused 0 (delta 0)\nTo https://github.com/tutorial/repo.git\n   abc1234..def5678  main -> main";
        success = true;
      }
      break;

    case "pull":
      if (!gitState.initialized) {
        output = "fatal: not a git repository (or any of the parent directories): .git";
      } else if (!gitState.remoteConnected) {
        output =
          "fatal: No configured pull destination.\nPlease specify the remote repository with git remote add";
      } else {
        output =
          "remote: Counting objects: 5, done.\nremote: Compressing objects: 100% (3/3), done.\nremote: Total 5 (delta 2), reused 5 (delta 2)\nUnpacking objects: 100% (5/5), done.\nFrom https://github.com/tutorial/repo.git\n   abc1234..def5678  main     -> origin/main\nUpdating abc1234..def5678\nFast-forward";
        success = true;
      }
      break;

    case "branch":
      output = handleGitBranch(gitState, args);
      success = true;
      break;

    case "checkout":
      output = handleGitCheckout(gitState, args);
      success = true;
      break;

    case "merge":
      output = handleGitMerge(gitState, args);
      success = true;
      break;

    case "rebase":
      output = handleGitRebase(gitState, args);
      success = true;
      break;

    case "remote":
      if (args[0] === "add" && args[1] === "origin") {
        gitState.remoteConnected = true;
        output = "Remote repository added successfully.";
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
