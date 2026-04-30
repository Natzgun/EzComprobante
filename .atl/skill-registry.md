# Skill Registry

**Delegator use only.** Resolve compact rules here, then inject them into sub-agent prompts. Sub-agents do not read individual SKILL.md files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| PR creation workflow / opening a PR | branch-pr | /home/natzgun/.config/opencode/skills/branch-pr/SKILL.md |
| Issue creation workflow / bug report / feature request | issue-creation | /home/natzgun/.config/opencode/skills/issue-creation/SKILL.md |
| Go tests / teatest / coverage | go-testing | /home/natzgun/.config/opencode/skills/go-testing/SKILL.md |
| adversarial review / dual review / judgment day | judgment-day | /home/natzgun/.config/opencode/skills/judgment-day/SKILL.md |
| create a new skill / agent instructions | skill-creator | /home/natzgun/.config/opencode/skills/skill-creator/SKILL.md |
| improve .org class notes / org-roam notes | org-notes-polish | /home/natzgun/.config/opencode/skills/org-notes-polish/SKILL.md |
| lean canvas / startup canvas / business hypothesis | lean-canvas | /home/natzgun/.agents/skills/lean-canvas/SKILL.md |
| find or install an agent skill | find-skills | /home/natzgun/.agents/skills/find-skills/SKILL.md |

## Compact Rules

### branch-pr
- Every PR must link exactly one approved issue; blank PRs are blocked.
- Add exactly one `type:*` label.
- Branch names must match `type/description` with lowercase `a-z0-9._-`.
- PR body must include linked issue, summary, changes table, test plan, checklist.
- Use conventional commits; no `Co-Authored-By` trailers.

### issue-creation
- Use a template; blank issues are disabled.
- New issues get `status:needs-review` automatically.
- A maintainer must add `status:approved` before PRs can open.
- Questions belong in Discussions, not issues.
- Search duplicates before filing.

### go-testing
- Prefer table-driven tests for Go logic.
- Test Bubbletea models by calling `Update` directly.
- Use `teatest` for end-to-end TUI flows.
- Use golden files for `View()` output when visual stability matters.
- Use `t.TempDir()` for filesystem tests.

### judgment-day
- Only use when the user explicitly asks for adversarial review or high-confidence review.
- Resolve skills first via registry, then inject identical project standards into both judges.
- Launch two blind judges in parallel; never sequentially.
- Classify warnings as real vs theoretical; theoretical warnings become INFO.
- Fix confirmed real issues, then re-judge until clean or escalated after two iterations.

### skill-creator
- Create skills for repeated, non-trivial patterns that AI must apply consistently.
- Use `skills/{skill-name}/SKILL.md`; keep frontmatter complete and trigger text explicit.
- Put reusable patterns in `assets/`; use `references/` for local docs only.
- Start with critical patterns; keep examples minimal.
- Register the new skill in AGENTS.md.

### org-notes-polish
- Preserve heading structure and org-roam metadata; do not delete user text.
- Expand terse sections with definition, formula, and small example, in that order.
- Prefer Org-native math; keep MathJax config if needed.
- Match the user’s language.
- Fix only obvious structure problems.

### lean-canvas
- Focus on Problem, Solution, UVP, Unfair Advantage, Segments, Channels, Revenue, Costs, Metrics.
- Treat it as a fast hypothesis tool, not a complete strategy document.
- Make assumptions explicit and measurable.
- Surface validation experiments for the riskiest assumptions.
- Consider Startup Canvas when strategic coherence matters more than speed.

### find-skills
- Use it when the user asks how to do a specialized task that may already have a skill.
- Prefer popular, reputable skills; verify installs/stars before recommending.
- Search specific keywords, not vague ones.
- Offer install commands only after checking fit and quality.
- If nothing exists, say so and offer direct help or skill creation.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | /home/natzgun/DEV/projects/personal/ezcomprobante/AGENTS.md | Project convention index; says to read Next.js docs before code changes. |
| CLAUDE.md | /home/natzgun/DEV/projects/personal/ezcomprobante/CLAUDE.md | References AGENTS.md via `@AGENTS.md`. |
