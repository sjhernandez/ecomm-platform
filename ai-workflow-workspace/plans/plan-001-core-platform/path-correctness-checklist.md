---
type: "checklist"
purpose: "path_correctness_verification"
category: "Verification"
version: "1.0"
status: "Active"
description: "Verifies the correctness of file paths before operations."
ruleRefs: ["100-implementation-process", "105-checklist-system", "400-checklist-enforcement"]
planId: "plan-001-core-platform"
dateCreated: "2024-07-30"
lastUpdated: "2024-07-30"
---

# Path Correctness Checklist

## Purpose

To prevent errors caused by incorrect file or directory paths before performing operations like file creation, modification, deletion, or directory creation.

## Application Requirements

- **When to use**: Before creating/modifying/deleting files or creating directories, especially when paths are constructed or complex.
- **Required modes**: `@mode:manual`, `@mode:semi`, `@mode:auto`
- **Verification requirement**: Manual or tool-assisted verification.
- **Completion documentation**: Record verification in `status.md` or relevant pre-flight check log.

## Critical Checklist Items

### Path Validation

- [ ] **PATH.1.1.** Path Syntax Correct? [MANDATORY]
    - PATH.1.1.1. Uses correct separators for the target OS (or consistently uses `/`).
    - PATH.1.1.2. No invalid characters in path components.
- [ ] **PATH.1.2.** Path Reference Correct? [MANDATORY]
    - PATH.1.2.1. Relative paths are based on the correct working directory (usually workspace root).
    - PATH.1.2.2. Absolute paths are valid on the target system (use with caution).
- [ ] **PATH.1.3.** Path Existence Correct? (As required by operation) [MANDATORY]
    - PATH.1.3.1. For **read/modify/delete**: Does the target file/directory exist? (Check if expected)
    - PATH.1.3.2. For **create**: Does the parent directory exist? (Check if required)
    - PATH.1.3.3. For **create**: Does the target path already exist? (Check if overwrite/error intended)
- [ ] **PATH.1.4.** Path Permissions Adequate? (If known/checkable) [RECOMMENDED]
    - PATH.1.4.1. Does the process have read/write/execute permissions as needed for the operation?

## Mode-Specific Requirements

Apply relevant mode standards as defined in Rule 125 (Mode Implementation Standards).
*   **@mode:manual**: Manually verify all checks. Use `ls` or file explorer if needed.
*   **@mode:semi**: Manually verify critical checks (1.1, 1.2, 1.3). Use tools if available.
*   **@mode:auto**: Perform automated checks if possible. Manually verify 1.3 for critical operations.

## Verification Statement

Use Verification Statement Template: `STANDARD_VERIFICATION_STATEMENT` (Rule 100), adapted for path context.
Example: `"I have applied the Path Correctness Checklist requirements following the @mode:manual standards for path '[path]', verified all necessary elements, and ensured compliance with the framework before proceeding with the [operation] operation."`

## Completion Documentation

Log in `status.md` or pre-flight check:

```markdown
- **Checklist Item**: PATH.X.Y ([path])
- **Verification Status**: [PASS/FAIL/NA]
- **Verification Date**: [DATE]
- **Verified By**: [AI]
- **Evidence**: [e.g., `ls` output, Path confirmed valid, Parent directory exists]
- **Notes**: [Optional]
``` 