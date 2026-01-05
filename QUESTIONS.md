    "Identify any areas my sources disagree on and any contradictions between them." (2:58)
    "Identify gaps in my sources. What's missing that would be necessary to understand the topic fully?" (3:20)
    "Are there any contrarian, alternative, or lesser-known viewpoints that are not covered in these sources?" (3:42)

Policy note: The project now keeps per-level filesystem policies (such as
allowed-delete paths used by exam levels) in the Level definitions. If you are
looking at old branches or docs that reference a `levelPolicies.ts` file or an
external allowlist, update them to use the `allowedDeletePaths` field on the
corresponding Level in `src/constants.tsx`.
