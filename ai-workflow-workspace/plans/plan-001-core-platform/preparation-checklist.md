---
type: "checklist"
purpose: "preparation_phase_verification"
category: "Verification"
version: "1.0"
status: "Active"
description: "Verifies completion of the Preparation phase requirements."
ruleRefs: ["100-implementation-process", "105-checklist-system", "400-checklist-enforcement"]
planId: "plan-001-core-platform"
dateCreated: "2024-07-30"
lastUpdated: "2024-07-30"
---

# Preparation Checklist

## Purpose

Verify that all requirements for the PREPARATION phase (Phase 3) of the Implementation Process (Rule 100) have been met before proceeding to IMPLEMENTATION.

## Application Requirements

- **When to use**: At the end of the Preparation phase.
- **Required modes**: `@mode:manual`, `@mode:semi`, `@mode:auto`
- **Verification requirement**: Manual verification of each item.
- **Completion documentation**: Update `status.md` with results and link to this checklist.

## Critical Checklist Items

### Directory & Artifacts

- [ ] **PREP.1.1.** Dedicated Plan Directory Created? (`ai-workflow-workspace/plans/[plan-id]/`) [MANDATORY]
    - PREP.1.1.1. Directory exists.
    - PREP.1.1.2. Path is correct relative to workspace root.
- [ ] **PREP.1.2.** Core Plan Artifacts Created? [MANDATORY]
    - PREP.1.2.1. `README.md` exists in plan directory.
    - PREP.1.2.2. `plan.md` exists in plan directory.
    - PREP.1.2.3. `status.md` exists in plan directory.
    - PREP.1.2.4. `_handover-template.md` exists in plan directory.
- [ ] **PREP.1.3.** Plan Artifacts Populated? [MANDATORY]
    - PREP.1.3.1. `plan.md` contains the detailed tasks from Phase 2.
    - PREP.1.3.2. `status.md` initialized with current phase/step.
- [ ] **PREP.1.4.** Path Correctness Verified? (Using Path Correctness Checklist) [MANDATORY]

### Configuration & Setup

- [ ] **PREP.2.1.** Central Plan Registry Updated? (If applicable) [RECOMMENDED]
- [ ] **PREP.2.2.** Planned Verification Mechanisms Setup? (e.g., Test framework installed if planned for immediate use) [OPTIONAL]
- [ ] **PREP.2.3.** Component Registry/Snapshots Initialized? (If applicable per Rule 275) [OPTIONAL]

## Mode-Specific Requirements

Apply relevant mode standards as defined in Rule 125 (Mode Implementation Standards).
*   **@mode:manual**: Verify all items exhaustively. Document evidence for each check.
*   **@mode:semi**: Verify all items. Document key evidence.
*   **@mode:auto**: Verify [MANDATORY] items. Document essential evidence.

## Verification Statement

Use Verification Statement Template: `STANDARD_VERIFICATION_STATEMENT` (Rule 100)

## Completion Documentation

Update `status.md`:

```markdown
- **Checklist Item**: PREP.X.Y
- **Verification Status**: [PASS/FAIL/NA]
- **Verification Date**: [DATE]
- **Verified By**: [AI]
- **Evidence**: [e.g., File exists check, Content verified, Link to Path Correctness Checklist results]
- **Notes**: [Optional]
```

Final Verification Statement for Preparation Phase to be logged in `status.md`. 