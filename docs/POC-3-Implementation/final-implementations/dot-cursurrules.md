Execution Discipline:

- Treat every task as atomic.
- Perform only one logical change at a time.
- Never combine infra, code, and tests in a single change unless explicitly instructed.
- Never modify unrelated files, even if they appear “obviously broken”.
- Never optimize, refactor, or clean up code unless explicitly instructed.
- Never infer “next steps”.
- After implementing a task, provide a short summary and STOP.

File Safety:

- Only modify files explicitly mentioned in the task.
- If a required file does not exist, ask before creating it.
- Do not rename files or move directories unless instructed.

Verification:

- Execute only the verification steps listed in the task.
- If verification fails, report and STOP.
