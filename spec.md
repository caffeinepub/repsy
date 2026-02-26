# REPSY

## Current State
- Live workout page (WorkoutPage.tsx) with exercise cards, set rows with weight/reps inputs
- AddExerciseModal with two scrollable filter chip rows (muscle group + category)
- Backend `updateWorkoutSession` in main.mo has a critical bug: `setCount` is always `0`, so no sets are ever persisted; all weight/reps are lost on save
- No ability to remove an individual exercise from an active session
- No ability to cancel (discard) a workout session
- Finish button is always clickable regardless of set completion status
- Sets can be marked complete even if weight/reps are empty

## Requested Changes (Diff)

### Add
- Two `<select>` dropdowns in AddExerciseModal (replacing scrollable chip rows): one for muscle group, one for category
- "Remove exercise" button (trash icon) on each ExerciseCard header
- "Cancel Workout" button on WorkoutPage (in header or bottom area) that discards the session and navigates back
- Finish validation: "Finish" button disabled unless all sets across all exercises are marked completed
- Set completion validation: the complete (checkmark) button for a set should only work if both weight and reps fields are non-empty (or for reps-only exercises, just reps)
- `removeExercise` action in workoutStore
- `useCancelWorkoutSession` mutation hook (calls `deleteWorkoutSession`)

### Modify
- Backend `updateWorkoutSession`: fix the loop to iterate over `input.sets` directly instead of the broken `setCount` calculation -- all sets with their weight/reps/completed/isPR should be stored faithfully
- `finishWorkoutSession` backend: before marking finished, accept and save the final exercise/set state (or frontend always calls updateSession before finishSession -- this is already done in handleFinish, so ensure it works end-to-end after the save fix)
- WorkoutPage `handleFinish`: add guard that all sets are completed before allowing finish modal to open
- ExerciseCard: add remove button in header, wire to `removeExercise` store action

### Remove
- Scrollable filter chip rows (FilterChip component usage for muscle/category filters) -- replaced by dropdowns
- FilterChip component can remain for potential future use but is no longer rendered in the filter area

## Implementation Plan
1. Fix `updateWorkoutSession` in main.mo to iterate directly over `input.sets` array
2. Add `removeExercise(exIdx: number)` to workoutStore
3. Add `useCancelWorkoutSession` in useQueries (wraps deleteWorkoutSession)
4. Update AddExerciseModal: replace two chip-row filter UIs with two `<select>` dropdowns
5. Update ExerciseCard: add trash/remove button in header
6. Update WorkoutPage: add cancel button, disable Finish when not all sets completed
7. Update SetRow / completeSet logic: only allow completing a set when weight+reps are non-empty

## UX Notes
- Cancel should show a confirmation (simple confirm dialog or inline alert) before deleting the session
- Remove exercise should be instant (no confirmation needed -- the action is low-stakes during a live workout)
- Finish button should show a tooltip or subtle label explaining why it's disabled ("Complete all sets first")
- Dropdowns should match the existing dark zinc styling used in the custom exercise form selects
