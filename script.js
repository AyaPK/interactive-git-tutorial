class GitTutorial {
    constructor() {
        this.currentLesson = 1;
        this.totalLessons = 8;
        this.terminalHistory = [];
        this.gitState = {
            initialized: false,
            workingDirectory: ['README.md', 'app.js'],
            stagedFiles: [],
            commits: [],
            currentBranch: 'main',
            remoteConnected: false
        };
        
        this.lessons = {
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
                expectedCommands: ['help', 'clear'],
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
                expectedCommands: ['git init', 'git status'],
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
                expectedCommands: ['git add'],
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
                expectedCommands: ['git commit'],
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
                expectedCommands: ['git push', 'git pull'],
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
                expectedCommands: ['git branch', 'git checkout'],
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
                expectedCommands: ['git merge'],
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
                expectedCommands: ['git rebase'],
                hint: "Try 'git rebase main' while on a feature branch to rebase onto main!"
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLesson(1);
        this.updateVisualPanel();
    }
    
    setupEventListeners() {
        const terminalInput = document.getElementById('terminalInput');
        const helpBtn = document.getElementById('helpBtn');
        const closeHelp = document.getElementById('closeHelp');
        const helpModal = document.getElementById('helpModal');
        const lessonItems = document.querySelectorAll('.lesson-item');
        
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleCommand(terminalInput.value);
                terminalInput.value = '';
            }
        });
        
        helpBtn.addEventListener('click', () => {
            helpModal.classList.add('active');
        });
        
        closeHelp.addEventListener('click', () => {
            helpModal.classList.remove('active');
        });
        
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('active');
            }
        });
        
        lessonItems.forEach(item => {
            item.addEventListener('click', () => {
                const lessonNum = parseInt(item.dataset.lesson);
                if (lessonNum <= this.currentLesson || this.currentLesson === this.totalLessons) {
                    this.loadLesson(lessonNum);
                }
            });
        });
    }
    
    loadLesson(lessonNum) {
        this.currentLesson = lessonNum;
        const lesson = this.lessons[lessonNum];
        
        document.getElementById('lessonTitle').textContent = lesson.title;
        document.getElementById('lessonDescription').innerHTML = lesson.description;
        
        const objectivesList = document.getElementById('objectives').querySelector('ul');
        objectivesList.innerHTML = lesson.objectives.map(obj => `<li>${obj}</li>`).join('');
        
        this.updateProgress();
        this.updateLessonNav();
        
        if (lesson.hint) {
            this.addTerminalOutput(`💡 Hint: ${lesson.hint}`, 'hint');
        }
    }
    
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        const progress = (this.currentLesson / this.totalLessons) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Lesson ${this.currentLesson} of ${this.totalLessons}`;
    }
    
    updateLessonNav() {
        const lessonItems = document.querySelectorAll('.lesson-item');
        lessonItems.forEach((item, index) => {
            const lessonNum = index + 1;
            if (lessonNum === this.currentLesson) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    handleCommand(input) {
        const command = input.trim();
        if (!command) return;
        
        this.addTerminalOutput(`$ ${command}`, 'input');
        this.terminalHistory.push(command);
        
        const parts = command.split(' ');
        const mainCommand = parts[0];
        const args = parts.slice(1);
        
        let output = '';
        let success = false;
        
        switch (mainCommand) {
            case 'help':
                output = this.showHelp();
                success = true;
                break;
                
            case 'clear':
                this.clearTerminal();
                return;
                
            case 'git':
                if (args.length === 0) {
                    output = 'git: missing command\nUsage: git <command> [<args>]';
                } else {
                    const result = this.handleGitCommand(args[0], args.slice(1));
                    output = result.output;
                    success = result.success;
                }
                break;
                
            default:
                output = `Command not found: ${mainCommand}. Type 'help' for available commands.`;
        }
        
        this.addTerminalOutput(output, success ? 'success' : 'error');
        this.updateVisualPanel();
        this.checkLessonProgress(command);
    }
    
    handleGitCommand(subcommand, args) {
        let output = '';
        let success = false;
        
        switch (subcommand) {
            case 'init':
                if (this.gitState.initialized) {
                    output = 'Initialized Git repository already exists.';
                } else {
                    this.gitState.initialized = true;
                    output = 'Initialized empty Git repository in /tutorial/.git/';
                }
                success = true;
                break;
                
            case 'status':
                output = this.getGitStatus();
                success = true;
                break;
                
            case 'add':
                if (!this.gitState.initialized) {
                    output = 'fatal: not a git repository (or any of the parent directories): .git';
                } else {
                    output = this.handleGitAdd(args);
                    success = true;
                }
                break;
                
            case 'commit':
                if (!this.gitState.initialized) {
                    output = 'fatal: not a git repository (or any of the parent directories): .git';
                } else if (this.gitState.stagedFiles.length === 0) {
                    output = 'nothing to commit, working tree clean';
                } else {
                    output = this.handleGitCommit(args);
                    success = true;
                }
                break;
                
            case 'push':
                if (!this.gitState.initialized) {
                    output = 'fatal: not a git repository (or any of the parent directories): .git';
                } else if (!this.gitState.remoteConnected) {
                    output = 'fatal: No configured push destination.\nPlease specify the remote repository with git remote add';
                } else {
                    output = 'Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nWriting objects: 100% (3/3), done.\nTotal 3 (delta 0), reused 0 (delta 0)\nTo https://github.com/tutorial/repo.git\n   abc1234..def5678  main -> main';
                    success = true;
                }
                break;
                
            case 'pull':
                if (!this.gitState.initialized) {
                    output = 'fatal: not a git repository (or any of the parent directories): .git';
                } else if (!this.gitState.remoteConnected) {
                    output = 'fatal: No configured pull destination.\nPlease specify the remote repository with git remote add';
                } else {
                    output = 'remote: Counting objects: 5, done.\nremote: Compressing objects: 100% (3/3), done.\nremote: Total 5 (delta 2), reused 5 (delta 2)\nUnpacking objects: 100% (5/5), done.\nFrom https://github.com/tutorial/repo.git\n   abc1234..def5678  main     -> origin/main\nUpdating abc1234..def5678\nFast-forward';
                    success = true;
                }
                break;
                
            case 'branch':
                output = this.handleGitBranch(args);
                success = true;
                break;
                
            case 'checkout':
                output = this.handleGitCheckout(args);
                success = true;
                break;
                
            case 'merge':
                output = this.handleGitMerge(args);
                success = true;
                break;
                
            case 'rebase':
                output = this.handleGitRebase(args);
                success = true;
                break;
                
            case 'remote':
                if (args[0] === 'add' && args[1] === 'origin') {
                    this.gitState.remoteConnected = true;
                    output = 'Remote repository added successfully.';
                    success = true;
                } else {
                    output = 'Usage: git remote add origin <url>';
                }
                break;
                
            default:
                output = `git: '${subcommand}' is not a git command. See 'git --help'.`;
        }
        
        return { output, success };
    }
    
    getGitStatus() {
        if (!this.gitState.initialized) {
            return 'fatal: not a git repository (or any of the parent directories): .git';
        }
        
        let output = `On branch ${this.gitState.currentBranch}\n`;
        
        if (this.gitState.stagedFiles.length > 0) {
            output += 'Changes to be committed:\n';
            output += '  (use "git restore --staged <file>..." to unstage)\n';
            output += '\tnew file:   ' + this.gitState.stagedFiles.join('\n\tnew file:   ') + '\n';
        }
        
        if (this.gitState.workingDirectory.length > 0) {
            if (this.gitState.stagedFiles.length > 0) output += '\n';
            output += 'Untracked files:\n';
            output += '  (use "git add <file>..." to include in what will be committed)\n';
            output += '\t' + this.gitState.workingDirectory.join('\n\t') + '\n';
        }
        
        if (this.gitState.stagedFiles.length === 0 && this.gitState.workingDirectory.length === 0) {
            output += 'nothing to commit, working tree clean';
        }
        
        return output;
    }
    
    handleGitAdd(args) {
        if (args.length === 0) {
            return 'Nothing specified, nothing added.';
        }
        
        const filesToAdd = args.join(' ');
        let addedFiles = [];
        
        if (filesToAdd === '.') {
            addedFiles = [...this.gitState.workingDirectory];
            this.gitState.workingDirectory = [];
        } else {
            for (const file of args) {
                const index = this.gitState.workingDirectory.indexOf(file);
                if (index !== -1) {
                    this.gitState.workingDirectory.splice(index, 1);
                    this.gitState.stagedFiles.push(file);
                    addedFiles.push(file);
                }
            }
        }
        
        if (addedFiles.length === 0) {
            return 'No files added to staging area.';
        }
        
        return `Added ${addedFiles.length} file(s) to staging area:\n  ${addedFiles.join('\n  ')}`;
    }
    
    handleGitCommit(args) {
        let message = '';
        
        const messageIndex = args.indexOf('-m');
        if (messageIndex !== -1 && args[messageIndex + 1]) {
            message = args[messageIndex + 1].replace(/['"]/g, '');
        } else {
            return 'Aborting commit due to empty commit message.\nUse: git commit -m "Your commit message"';
        }
        
        const commit = {
            hash: this.generateCommitHash(),
            message: message,
            author: 'Tutorial User',
            files: [...this.gitState.stagedFiles],
            timestamp: new Date().toLocaleString()
        };
        
        this.gitState.commits.push(commit);
        this.gitState.stagedFiles = [];
        
        return `[${commit.hash}] ${message}\n ${this.gitState.commits.length} file(s) changed`;
    }
    
    handleGitBranch(args) {
        if (args.length === 0) {
            let output = `* ${this.gitState.currentBranch}\n`;
            return output;
        }
        
        const branchName = args[0];
        return `Created branch '${branchName}'`;
    }
    
    handleGitCheckout(args) {
        if (args.length === 0) {
            return 'Please specify a branch name to checkout';
        }
        
        const branchName = args[0];
        this.gitState.currentBranch = branchName;
        return `Switched to branch '${branchName}'`;
    }
    
    handleGitMerge(args) {
        if (args.length === 0) {
            return 'Please specify a branch to merge';
        }
        
        const branchName = args[0];
        return `Merge branch '${branchName}' into ${this.gitState.currentBranch}\n\nAuto-merging files\nMerge completed successfully`;
    }
    
    handleGitRebase(args) {
        if (args.length === 0) {
            return 'Please specify a branch to rebase onto';
        }
        
        const branchName = args[0];
        return `Rebasing ${this.gitState.currentBranch} onto ${branchName}\n\nSuccessfully rebased and updated refs/heads/${this.gitState.currentBranch}`;
    }
    
    generateCommitHash() {
        return Math.random().toString(36).substring(2, 9);
    }
    
    showHelp() {
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
    
    clearTerminal() {
        const terminalOutput = document.getElementById('terminalOutput');
        terminalOutput.innerHTML = '';
        this.addTerminalOutput('Terminal cleared. Type \'help\' to see available commands.', 'system');
    }
    
    addTerminalOutput(text, className = '') {
        const terminalOutput = document.getElementById('terminalOutput');
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.textContent = text;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
    
    updateVisualPanel() {
        const workingFiles = document.getElementById('workingFiles');
        const stagedFiles = document.getElementById('stagedFiles');
        const commits = document.getElementById('commits');

        if (this.gitState.workingDirectory.length > 0) {
            workingFiles.innerHTML = this.gitState.workingDirectory
                .map(file => `<div class="file-item">${file}</div>`)
                .join('');
        } else {
            workingFiles.innerHTML = '<div class="empty-state">No untracked files</div>';
        }

        if (this.gitState.stagedFiles.length > 0) {
            stagedFiles.innerHTML = this.gitState.stagedFiles
                .map(file => `<div class="file-item">${file}</div>`)
                .join('');
        } else {
            stagedFiles.innerHTML = '<div class="empty-state">No files staged</div>';
        }

        if (this.gitState.commits.length > 0) {
            commits.innerHTML = this.gitState.commits
                .slice().reverse()
                .map(commit => `
                    <div class="commit-item">
                        <div class="commit-hash">${commit.hash}</div>
                        <div class="commit-message">${commit.message}</div>
                        <div class="commit-author">${commit.author} • ${commit.timestamp}</div>
                    </div>
                `).join('');
        } else {
            commits.innerHTML = '<div class="empty-state">No commits yet</div>';
        }
    }
    
    checkLessonProgress(command) {
        const lesson = this.lessons[this.currentLesson];
        if (!lesson.expectedCommands) return;
        
        const commandMatch = lesson.expectedCommands.some(expected => 
            command.includes(expected)
        );
        
        if (commandMatch) {
            setTimeout(() => {
                if (this.currentLesson < this.totalLessons) {
                    this.addTerminalOutput('🎉 Great job! You can proceed to the next lesson.', 'success');
                    this.currentLesson++;
                    this.updateProgress();
                    this.updateLessonNav();
                } else {
                    this.addTerminalOutput('🎊 Congratulations! You\'ve completed all lessons!', 'success');
                }
            }, 1000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GitTutorial();
});
