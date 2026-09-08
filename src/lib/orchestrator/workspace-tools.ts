import { ToolDefinition } from '../providers/adapter';

export const WORKSPACE_TOOLS: ToolDefinition[] = [
  {
    name: 'update_task_list',
    description: 'Update the shared task list for the project. Both agents and the human director can see and track these tasks.',
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: 'The updated list of tasks',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Unique task identifier, e.g. "task-1"' },
              title: { type: 'string', description: 'Short summary of the task' },
              status: {
                type: 'string',
                enum: ['todo', 'in_progress', 'done'],
                description: 'Current status of the task',
              },
              assignedTo: { type: 'string', description: 'Agent or person responsible for this task' },
            },
            required: ['id', 'title', 'status'],
          },
        },
      },
      required: ['tasks'],
    },
  },
  {
    name: 'write_scratchpad',
    description: 'Write or update a shared scratchpad artifact (e.g. code snippet, technical specification, or meeting notes).',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Unique key for artifact, e.g. "code_draft" or "architecture_spec"' },
        title: { type: 'string', description: 'Human-readable title' },
        content: { type: 'string', description: 'Markdown or code content' },
        itemType: {
          type: 'string',
          enum: ['scratchpad', 'code_snippet', 'decision_log'],
          description: 'Type of artifact',
        },
      },
      required: ['key', 'title', 'content'],
    },
  },
  {
    name: 'record_decision',
    description: 'Record an agreed decision or consensus between agents in the project log.',
    parameters: {
      type: 'object',
      properties: {
        decisionTitle: { type: 'string', description: 'What was decided' },
        rationale: { type: 'string', description: 'Why this decision was made and agreed upon' },
      },
      required: ['decisionTitle', 'rationale'],
    },
  },
  {
    name: 'create_file',
    description: 'Create a new code or configuration file in the virtual project directory (e.g. "src/server.ts", "package.json", "tests/auth.test.ts").',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the file, e.g. "src/index.ts"' },
        content: { type: 'string', description: 'Full source code or file contents' },
        language: { type: 'string', description: 'Language identifier e.g. "typescript", "json", "markdown", "python"' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'update_file',
    description: 'Update the contents of an existing file in the virtual project directory.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path of the file to update' },
        content: { type: 'string', description: 'New source code content' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'execute_terminal_command',
    description: 'Execute a command in the interactive web terminal (e.g. "npm test", "ls -la", "cat package.json", "git status", "node dist/index.js").',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command string to execute in virtual terminal' },
      },
      required: ['command'],
    },
  },
  {
    name: 'request_human_checkpoint',
    description: 'Pause the automated loop and request human director review/approval before proceeding with a critical action.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why human approval is required' },
        proposal: { type: 'string', description: 'The specific proposed action or choice to approve' },
      },
      required: ['reason', 'proposal'],
    },
  },
];
