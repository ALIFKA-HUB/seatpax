# Seatpax workspace instructions

Read `docs/seatpax/00_INDEX.md` first. Use its task map to select relevant Seatpax specifications.

## User model and delegation preferences

- For future Seatpax task execution, the user requests the primary orchestrator to use **GPT-6.1 Sol** (`gpt-6.1-sol`) with **medium** reasoning effort.
- All spawned subagents, including any nested subagents or reviewers, must use **GPT-6 Luna** (`gpt-6-luna`) with **medium** reasoning effort. Set both overrides explicitly at spawn time; use a focused task context rather than a full-history fork when the tool requires it for model overrides.
- Delegate when useful for an authorized task; this preference does not start any work or require subagents for every small task.
- These instructions record the requested settings; they do not change the primary chat's actual model selection. If the runtime cannot apply a requested model/effort, state the limitation instead of silently substituting another setting.

## Specification rules

- Use `02_MVP_SCOPE.md` for scope and `19_DECISION_LEDGER.md` for final product decisions.
- Use the latest design direction in `13_UI_UX_DESIGN.md` for interface work.
- Treat `99_ARCHIVE_MASTER_SPEC.md` as historical context, not an override of the modular documents.
- Read `docs/analysis/SEATPAX_SPEC_REVIEW.md` before designing schema, inventory transactions, payment, guest claims, or crew authorization. Its recommendations are pending, not approved product changes.
- Record unresolved conflicts explicitly; do not invent missing policies or silently expand MVP scope.
- Keep business logic in domain modules/services as described in `11_API_PROJECT_STRUCTURE.md`.
- Update related specifications and the decision ledger when an authorized product decision changes.
