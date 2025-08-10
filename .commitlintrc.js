module.exports = {
  extends: ['@commitlint/config-conventional'],
  
  rules: {
    // Enforce conventional commit format
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'chore',    // Maintenance tasks
        'ci',       // CI/CD changes
        'build',    // Build system changes
        'revert',   // Reverting changes
        'wip',      // Work in progress (for development branches)
        'hotfix',   // Critical bug fixes
        'release',  // Release commits
      ],
    ],
    
    // Subject case and length
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    'subject-max-length': [2, 'always', 72],
    'subject-min-length': [2, 'always', 10],
    'subject-empty': [2, 'never'],
    
    // Header length
    'header-max-length': [2, 'always', 100],
    
    // Body and footer
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    
    // Type and subject
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    
    // Scope (optional but if present, should be lowercase)
    'scope-case': [2, 'always', 'lower-case'],
  },
  
  // Custom parser options
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  
  // Custom plugins for additional rules
  plugins: [
    {
      rules: {
        // Custom rule to ensure ticket references in certain contexts
        'ticket-reference': ({ raw }) => {
          const hasTicketRef = /(?:refs?|fixes?|closes?)\s+#\d+|JIRA-\d+|TASK-\d+/i.test(raw);
          const isFeatureOrFix = /^(feat|fix)/.test(raw);
          
          // Require ticket reference for features and fixes on main branches
          if (isFeatureOrFix && !hasTicketRef) {
            return [
              false,
              'Feature and fix commits should reference a ticket (e.g., "refs #123", "fixes JIRA-456")',
            ];
          }
          
          return [true];
        },
        
        // Prevent certain words in commit messages
        'forbidden-words': ({ raw }) => {
          const forbiddenWords = ['password', 'secret', 'key', 'token', 'TODO', 'FIXME', 'HACK'];
          const found = forbiddenWords.find(word => 
            raw.toLowerCase().includes(word.toLowerCase())
          );
          
          if (found) {
            return [
              false,
              `Commit message contains forbidden word: "${found}". Please remove or rephrase.`,
            ];
          }
          
          return [true];
        },
      },
    },
  ],
  
  // Help URL for commit message format
  helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
  
  // Custom prompt (if using commitizen)
  prompt: {
    questions: {
      type: {
        description: "Select the type of change that you're committing:",
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: 'Changes that do not affect the meaning of the code',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨',
          },
          chore: {
            description: 'Other changes that don\'t modify src or test files',
            title: 'Chores',
            emoji: '♻️',
          },
          ci: {
            description: 'Changes to our CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          build: {
            description: 'Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '🛠',
          },
        },
      },
      scope: {
        description: 'What is the scope of this change (e.g. component or file name)',
      },
      subject: {
        description: 'Write a short, imperative tense description of the change',
      },
      body: {
        description: 'Provide a longer description of the change',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
      },
      issuesBody: {
        description: 'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself',
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123".)',
      },
    },
  },
};