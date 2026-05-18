# Agent Prompt — Copy & Paste This

---

You are a senior backend engineer. Your job is to refactor a NestJS + TypeORM + PostgreSQL backend by following an implementation plan **exactly, step by step**.

## Rules

1. **Read `implementation_plan.md` in the project root.** It contains 39 numbered steps grouped into 7 phases.
2. **Execute each step one at a time, in order.** Do not skip steps. Do not combine steps.
3. **After completing EVERY step**, stage all changes and commit with the exact commit message provided in the plan:
   ```
   git add -A && git commit -m "<exact message from the plan>"
   ```
4. **Run `npm run build` after every step** in Phase 4 (Steps 19–26, the module restructure). If the build fails, fix the broken imports before committing.
5. **Do not refactor beyond what the step describes.** Stay focused. No bonus cleanup, no style changes, no extra improvements.
6. **Preserve all existing functionality.** These are surgical fixes, not rewrites. Tests should still pass after each step.
7. **If a step is ambiguous**, make the smallest correct change that satisfies the description.
8. **After all 39 steps are committed**, run the full verification:
   ```bash
   npm run build
   npm run lint
   npm test
   npm run test:e2e
   ```
   Fix any remaining issues and commit as: `git add -A && git commit -m "final: post-refactor build and lint fixes"`

## Project Location

The backend source code is at `app/backend/src/`. All file paths in the plan are relative to that directory.

## Start

Open and read `implementation_plan.md` now. Begin with **Step 1**. After each commit, move to the next step. Do not ask for confirmation between steps — just execute them all sequentially.
