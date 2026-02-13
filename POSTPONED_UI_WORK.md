# Postponed UI Work

## Status
These items were explicitly postponed and not yet implemented.

## Readwise-like Layout Proposal (requested, not implemented)
Goal: align the app layout closer to the provided Readwise screenshot while preserving current functionality.

### Proposed structure
- Left rail:
  - branded nav, sections, and filters.
- Main pane:
  - list-style cards with thumbnail, title, source/author/time row, and right-aligned saved date.
- Top action bar:
  - selection actions (`Open`, `Delete`, `Archive`) and date/search controls.

### Proposed styling direction
- Denser row-based list with tighter vertical rhythm.
- More subtle borders and separators; less card-heavy blocks.
- Thumbnails fixed-size, left aligned; metadata line below title.
- Paging controls pinned to bottom of list pane (already required and mostly done).

### Proposed interaction refinements
- Keep swipe gestures, but ensure discoverability with visible affordances.
- Keep all-selection semantics tied to filtered set.
- Preserve route-backed tabs for back/forward support.

## Potential Next Iteration Tasks
1. Add per-batch progress text in cleanup UI (e.g., `Batch 2/3`, processed count live).
2. Show compact result summary after cleanup:
- selected / attempted / processed / failed.
3. Add optional retry-failed-items button after partial cleanup.
4. Optional: feature flag for batch size (default 20) in settings for tuning.
5. Tighten accessibility labels for swipe affordances and action buttons.
