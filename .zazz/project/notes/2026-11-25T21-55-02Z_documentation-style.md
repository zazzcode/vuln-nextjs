# Documentation style: a training course

Date-time: 2026-11-25T21:55:02Z (16:55:02, UTC-5).

`docs/vulnerabilities/` is a training course with one anchored section per scenario. The rules:

- Be concise. Each entry-point document owns one fact, and the others link to it.
- Define jargon for the student: in the glossary of [docs/README.md](../../../docs/README.md#glossary), and in plain words at first use in a student guide.
- A scenario's sections are self-contained on purpose. The explanation of why a control works repeats from scenario to scenario, because the anchor contract lets a reader land on a single section. Do not deduplicate it. The contract itself is in [AGENTS.md](../../../AGENTS.md).
- Every safe-control section shows the vulnerable and the protected route side by side: the difference, and why it defeats the attack.
- An exploit lab gives Burp Suite, Postman and curl, and only commands that were run.

**Why:** two audiences read the same pages. Agents need compact, linkable expected findings. Students need taught material without undefined jargon.

Working notes in this directory are not part of that course.
