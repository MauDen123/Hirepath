# PLM-HirePath — Plan Revisions for Claude Code

Paste this into a Claude Code session as the plan to execute. Work top to
bottom — each tier depends on the one before it. Do not mark an item done
without running the verification step and showing the output.

---

## TIER 0 — Verify before touching anything

- [ ] **0.1** Confirm whether `src/app/script.ts` is actually serving the
      `/hr` route. In Next.js App Router, a route only registers from a
      file literally named `page.tsx` inside a folder matching the URL
      path. `script.ts` does not qualify.
      **Verify:** run `npm run dev`, visit `localhost:3000/hr`, confirm
      whether it 404s.

- [ ] **0.2** Run `npm run build` and `npx tsc --noEmit` from a clean
      state. Report every error before making any other change, so we
      have a true baseline instead of debugging on top of unknown
      existing breakage.

---

## TIER 1 — Fix what's likely actively broken

- [ ] **1.1** If 0.1 confirms `/hr` is broken: move/rename
      `src/app/script.ts` → `src/app/hr/page.tsx`. Preserve all existing
      logic; only the file location/name changes.
      **Verify:** `/hr` loads and shows the applicant table.

- [ ] **1.2** Audit every `page.tsx` across the project — confirm none
      of them are misnamed the same way (check `applicant/`,
      `admin/`, `career-path/`, `crrc-evaluations/`, `vacancies/`).
      **Verify:** list every route folder and confirm each contains a
      correctly named `page.tsx`.

---

## TIER 2 — Authentication & data scoping
### (Directly required by thesis Statement of the Problem, item 1.2.3:
### "enforce secure, role-based access... safeguarding applicant data")

- [ ] **2.1** Session validation currently only checks that a
      `session-id` cookie *exists* — it is not validated against the
      database. Add real validation: look up the session/user record by
      the cookie value; if it doesn't resolve to a real, active user,
      treat the request as unauthenticated.
      **Verify:** manually set a garbage `session-id` cookie value and
      confirm protected routes now correctly reject it.

- [ ] **2.2** Add `/applicant/*` routes to the middleware's protected
      path list. They are currently NOT protected — this is a real data
      exposure risk since applicant data is personal information under
      the Data Privacy Act, which Chapter 3 already claims compliance
      with.
      **Verify:** log out, attempt to visit `/applicant` directly,
      confirm redirect to login.

- [ ] **2.3** Implement a `getCurrentUser()` utility (e.g., in
      `src/lib/auth.ts`) that resolves the logged-in user from the
      session cookie, server-side.

- [ ] **2.4** Replace every hardcoded `prisma.user.findFirst({ where: {
      role: 'applicant' } })`-style demo query with
      `getCurrentUser()`-scoped queries. Applicant pages must show
      **that specific logged-in applicant's** data — not "the first
      applicant in the table" regardless of who's logged in.
      **Verify:** log in as two different seeded applicants in two
      browser sessions; confirm each sees only their own applications
      and documents.

- [ ] **2.5** Add role-based route checks to middleware — not just
      "is logged in" but "is logged in as the correct role for this
      route." An applicant account must not be able to load `/hr` or
      `/admin` even with a valid session.
      **Verify:** log in as a seeded applicant account, attempt to
      visit `/hr` directly, confirm rejection (redirect or 403).

- [ ] **2.6** Create a `/api/me` route returning the current user's
      id/name/role/college from the session, for use in client
      components (e.g., the Sidebar) instead of hardcoded props.

---

## TIER 3 — Close the placeholder gaps tied to stated thesis objectives

- [ ] **3.1** `src/app/vacancies/page.tsx` is a placeholder. Build it
      into the real Dean → HR → VPAA approval workflow already defined
      in schema.prisma (`Vacancy.status` enum: draft →
      pending_hr_review → returned/awaiting_vpaa_endorsement →
      awaiting_president_approval → awaiting_board_confirmation →
      published). This directly implements thesis objective 1.3.2.3
      ("vacancy requests... compliance with hiring regulations").
      Minimum functionality: Dean can draft, HR can approve/return
      with notes, VPAA can endorse, status changes are visible.
      **Verify:** create a draft vacancy as the seeded Dean account,
      approve it as the seeded HR account, confirm status updates in
      the database and UI.

- [ ] **3.2** `src/app/crrc-evaluations/page.tsx` is a placeholder.
      Build the CRRC pre-fill and scoring view described in thesis
      objective 1.3.2.1. At minimum: display an applicant's parsed
      document data against the position's `QSTemplate`, allow a Dean
      to enter/submit a CRRC score, persist it to
      `Application.crrcScore`.
      **Verify:** submit a CRRC score for the seeded application,
      confirm it persists and displays correctly on reload.

- [ ] **3.3** No file upload exists despite documents being central to
      the whole system (thesis objective 1.3.2.1's entire premise —
      screening PDS/WES/certifications). Implement upload using
      `react-dropzone` (already installed):
      - Applicant-facing upload UI on the documents page
      - A `/api/documents` POST route that saves the file and creates
        a `Document` record with `verificationStatus: pending`
      - Store files on local disk for now (matches the thesis's
        self-hosted Windows Server + IIS architecture) — do NOT reach
        for cloud blob storage, it contradicts the documented
        deployment target
      **Verify:** upload a real PDF as a seeded applicant, confirm a
      new `Document` row appears in the database with a working
      `fileUrl`.

---

## TIER 4 — UI completeness (do after Tiers 1–3, not before)

- [ ] **4.1** Add a logout button/action to every authenticated page's
      Sidebar (currently only present on the HR page) — this should
      live in the shared `Sidebar` component, not be re-added per page.

- [ ] **4.2** Replace hardcoded user info in `Sidebar` props with data
      pulled from `getCurrentUser()` (depends on Tier 2.3/2.6).

- [ ] **4.3** Add user-facing error messages to the login form (the
      code currently has TODOs here) — e.g., "Invalid email or
      password," not a silent failure or console-only error.

---

## TIER 5 — Explicitly defer, do NOT implement now

Document these as stated Limitations in the thesis rather than building
them — they are legitimate scope cuts for a thesis-scale system, not
oversights:

- Database-backed session store / JWT (cookie + DB-validated session
  from Tier 2.1 is sufficient for this scope)
- React Query / SWR data-fetching layer
- Internationalization (i18n)
- Additional database indexes beyond primary keys/foreign keys, unless
  a specific query is measurably slow
- Any multi-agent or automated orchestration tooling

---

## Code quality — fix opportunistically, not as a separate pass

- [ ] Centralize role strings and status values (currently duplicated
      across files) into a single shared constants/enum import, rather
      than repeating string literals like `"hr"` or `"pending_hr_review"`.
- [ ] Confirm test setup isn't running both `ts-jest` and `babel-jest`
      unintentionally for the same files — pick one Jest transformer
      path and remove the other's config if redundant.
- [ ] Expand test coverage to at least: middleware auth checks (2.1,
      2.2, 2.5), the vacancy approval workflow (3.1), and document
      upload (3.3) — these are the highest-risk, most objective-critical
      pieces, so they're the ones most worth a regression safety net.

---

## Definition of done for this whole plan

The plan is complete when:
1. `npm run build` passes with zero errors
2. Every route in Tier 0.1/1.2's audit resolves correctly
3. Two different seeded applicant accounts, logged in separately, see
   only their own data
4. A vacancy can move through its full status lifecycle via the UI
5. A document can be uploaded and appears in the database
6. A CRRC score can be submitted and persisted

Do not report this plan as complete based on a summary — run the actual
verification step for each item and show the output.
