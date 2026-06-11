# .claude/agents — Nichols Photo Lab

Subagent definitions for the Nichols Photo Lab Next.js project. Drop this
`.claude/` folder into the project root (same level as `app/` and `public/`).

These agents are pre-loaded with knowledge of the project's stack and token
system so you don't have to re-explain it every session.

---

## Agents

| Agent | Role | Writes? |
|-------|------|---------|
| `design-auditor` | Scans for hardcoded values, token drift, brand violations | No |
| `component-mapper` | Inventories components, flags missing routes and files | No |
| `component-builder` | Builds a single .tsx + .module.css component from a spec | Yes |
| `animation-builder` | Adds motion to an existing component | Yes |
| `token-enforcer` | Replaces hardcoded values with CSS variables | Yes |
| `accessibility-reviewer` | WCAG 2.1 AA audit, knows the brand palette contrast values | No |
| `responsive-checker` | Layout and type audit, knows the 700px breakpoint system | No |

---

## Recommended session workflows

### Starting a session
```
Run design-auditor on app/components before we start
```

### Returning after time away
```
Run component-mapper so I can see what exists and what's still missing
```

### Building a new page section
```
Use component-builder to build a [component name]. Spec: [describe it].
```
Then after it's built:
```
Run accessibility-reviewer and responsive-checker on app/components/[Name].module.css
```

### Adding motion to an existing component
```
Use animation-builder to add [describe the motion] to [ComponentName]
```

### Cleanup after fast prototyping
```
Run token-enforcer on app/components/[Name].module.css
```

### Parallel review (run both at once)
```
Run accessibility-reviewer and responsive-checker on [file] in parallel
```

---

## What's pre-loaded in every agent

- The full token map from `globals.css` (colours, easing, spacing, font)
- The brand brief from `.impeccable.md` (light mode only, Inter Variable,
  darkroom-red as single accent, editorial layout, no glassmorphism etc.)
- The CSS Module convention (paired .tsx + .module.css per component)
- The 700px breakpoint and `--page-pad` responsive pattern
- The `reveal-arrow` / `reveal-on-hover` motion utility
- Known contrast issues with `--darkroom-red` and `--bw-400`

---

## One thing to keep updated

If you add new tokens to `globals.css`, update the token map in:
- `design-auditor.md`
- `token-enforcer.md`
- `component-builder.md`

The agents read these files — keeping them in sync means they'll always
build with your actual token system.
