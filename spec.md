# REPSY

## Current State

REPSY is a workout tracking app with a Motoko backend and React frontend. It has:
- Exercise database (80+ exercises, custom exercise creation)
- Workout session logging (create, update, finish, cancel, add/remove exercises)
- Workout templates
- Body weight and body measurement tracking
- History, reports, and profile pages
- A single hardcoded `DEMO_USER_ID = "demo-user-1"` used everywhere — no authentication, no multi-user support

The authorization component is already installed (`caffeine.lock.json` includes `authorization: 4.0.1`), and the authorization mixin files exist in `src/backend/authorization/`, but they are not yet wired into `main.mo`.

The frontend has `useInternetIdentity.ts` already present (Internet Identity auth client hook) and `InternetIdentityProvider` is available but not used in `App.tsx`.

## Requested Changes (Diff)

### Add
- Backend: Wire the authorization mixin into the actor. All data-mutating functions (`createTemplate`, `deleteTemplate`, `createWorkoutSession`, `updateWorkoutSession`, `finishWorkoutSession`, `deleteWorkoutSession`, `addBodyWeightEntry`, `addBodyMeasurement`, `updateUser`, `addExerciseToSession`, `createCustomExercise`) must check that the caller is registered (not anonymous/guest) before proceeding.
- Backend: Add a `register()` function that calls `_initializeAccessControlWithSecret` internally and creates a `User` record for the caller's principal. The user's ID will be the caller's principal text. This lets new users self-register on first login.
- Backend: All user-scoped data queries and mutations must use `caller.toText()` as the userId instead of accepting it as a parameter (to prevent users from accessing each other's data).
- Backend: `getUser()` should return the user for the caller (no userId param needed).
- Backend: `updateUser()` should update the caller's own user record.
- Frontend: Wrap app in `InternetIdentityProvider`.
- Frontend: Add a login/landing screen that is shown when the user is not authenticated. It should have an "Sign in with Internet Identity" button.
- Frontend: After login, call `register()` on the backend. If registration succeeds, proceed to the app. Show a loading state while registering.
- Frontend: Replace hardcoded `DEMO_USER_ID` usage everywhere with the authenticated caller's identity (the backend now derives userId from `caller` so the frontend just calls functions without passing userId).
- Frontend: Add a logout button in the Profile page.
- Frontend: All queries should be gated on authentication being ready.

### Modify
- Backend: `getTemplates`, `getWorkoutSessions`, `getBodyWeightEntries`, `getBodyMeasurements` — remove `userId` parameter, derive userId from `caller.toText()` internally.
- Backend: `createTemplate`, `createWorkoutSession`, `addBodyWeightEntry`, `addBodyMeasurement`, `createCustomExercise` — remove `userId` parameter, use `caller.toText()` internally.
- Backend: `seed()` — keep as-is for exercise seeding only. Remove user seeding (no more demo-user-1).
- Frontend: `useQueries.ts` — remove `DEMO_USER_ID`, update all hooks to remove userId arguments (backend now infers from caller).
- Frontend: App routing — wrap protected routes so unauthenticated users see the login screen.

### Remove
- Backend: `getUser(id: Text)` replaced by `getUser()` (no param, uses caller).
- Backend: `updateUser(id, ...)` replaced by `updateUser(...)` (no id param, uses caller).
- Frontend: All references to `DEMO_USER_ID` passed as arguments to actor calls.
- Frontend: `SeedInitializer` seeding of user data (exercises still seeded, user auto-created on register).

## Implementation Plan

1. **Backend**: Rewrite `main.mo` to:
   - Include the AccessControl state and mixin
   - Add `register()` function — initializes access control for caller and upserts a User record keyed by `caller.toText()`
   - Remove userId parameters from all query/mutation functions; use `caller.toText()` as the user scope
   - Guard all mutating functions: trap if caller is anonymous
   - Keep `seed()` for exercises only
   - Keep `getUser()` / `updateUser()` scoped to caller

2. **Frontend**: 
   - Wrap `main.tsx` / `App.tsx` with `InternetIdentityProvider`
   - Add `LoginPage` component — shown when `identity` is undefined
   - After login, call `register()` mutation, then proceed to app
   - Remove `DEMO_USER_ID` from `useQueries.ts`; all hooks no longer pass userId to actor calls
   - Add logout button to ProfilePage
   - Gate all queries on `!!identity`
