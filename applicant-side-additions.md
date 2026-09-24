# PLM-HirePath — Applicant-Side Gaps & Additions (for Claude Code)

Context: reviewed against the current schema.prisma, the code already
pulled from github.com/MauDen123/Hirepath, and confirmed findings from
the PLM HRMO key informant interview. Work in the order listed — items
1-3 are blocking (the app doesn't functionally work without them), the
rest are real improvements but not launch-blockers.

---

## 1. [CRITICAL] No page to browse open vacancies

There is currently no applicant-facing page listing published vacancies.
An applicant can see their own existing application status, but has no
way to discover what's open to apply to in the first place — this is
the actual entry point of the whole system and it doesn't exist yet.

**Build:** `src/app/applicant/vacancies/page.tsx` (Server Component)
- Query: `prisma.vacancy.findMany({ where: { status: 'published' } })`
- Show: position title, salary grade, place of assignment, track
  (faculty/administrative), slots remaining
- Each listing should surface `closingDate` prominently — per the HRMO
  interview, administrative vacancies have a hard 15-day application
  window and late applications are rejected outright or excluded from
  assessment. Do not treat this as a soft/cosmetic date — style it as a
  real deadline (e.g. "Closes in 4 days" using the existing stamp/badge
  visual language, colored red/amber as it approaches).
- Each listing links to an "Apply" flow that creates a new `Application`
  row for the logged-in applicant against that `Vacancy`.

**Verify:** log in as a seeded applicant, confirm the seeded published
vacancy (Physical Therapist II) appears in this list with a visible
closing date, and that clicking through creates a real `Application`
record.

---

## 2. [CRITICAL] No real document upload

`react-dropzone` is already an installed dependency and the `Document`
model already exists in schema.prisma, but no actual upload flow is
wired up. This is the feature the entire NLP/QS-matching pipeline
depends on — without it nothing downstream can be tested with real data.

**Build:**
- `src/app/applicant/documents/page.tsx` — upload UI using
  `react-dropzone`, one drop zone per `DocumentType` (pds,
  work_experience_sheet, transcript_of_records, certification,
  eligibility)
- `src/app/api/documents/route.ts` — POST handler that:
  - confirms the caller is the applicant who owns the target
    `Application` (do not trust a client-supplied applicantId — derive
    it from the session via `getCurrentUser()`)
  - saves the file to local disk (matches the thesis's documented
    self-hosted Windows Server + IIS deployment — do not reach for
    cloud blob storage)
  - creates a `Document` row with `verificationStatus: 'pending'`
- Show upload progress and post-upload status (pending/verified/
  flagged) using the existing badge component styling, not ad-hoc
  markup

**Verify:** upload a real PDF as a seeded applicant, confirm a new
`Document` row appears with a working `fileUrl`, and that it renders on
the applicant's own documents page afterward.

---

## 3. [CRITICAL] Deadline not visible on the applicant's own application

Related to item 1 but distinct: once an applicant HAS applied, their own
dashboard/application view should also surface the vacancy's closing
date prominently, not just the vacancy listing page.

**Fix:** on the applicant dashboard / application detail view, add a
visible countdown or closing-date badge pulled from
`application.vacancy.closingDate`.

**Verify:** seeded application shows its vacancy's closing date clearly
on the applicant's own dashboard, not only on the vacancy browse page.

---

## 4. Application history — support multiple applications per applicant

schema.prisma already allows this (`@@unique([applicantId, vacancyId])`
permits many rows per applicant across different vacancies), but current
pages only show a single "my application" view.

**Build:** `src/app/applicant/applications/page.tsx` — list ALL of the
logged-in applicant's applications across every vacancy they've applied
to, each showing status, vacancy title, and submitted date. Link each
row to its own detail view (existing
`src/app/applicant/applications/[id]/page.tsx` if already present per
earlier folder listing — confirm and wire up if it's currently empty).

**Verify:** seed a second application for the same applicant against a
different vacancy; confirm both appear correctly scoped to that
applicant only (not other applicants' data — re-check this against the
same scoping bug pattern already flagged for the Dean/CRRC page).

---

## 5. Status-change email notifications

`nodemailer` is already an installed dependency, unused so far.

**Build:** a `sendStatusChangeEmail(applicationId, newStatus)` helper in
`src/lib/email.ts`, triggered wherever `Application.status` is updated
(HR review actions, CRRC scoring, etc.). Use PLM's institutional SMTP
once credentials are available; use a dev SMTP (Mailtrap/Ethereal) or
console-log fallback for local testing in the meantime — do not block
this feature on having real SMTP credentials yet.

**Verify:** trigger a status change on the seeded application, confirm
an email attempt fires (console log or dev SMTP inbox, whichever is
wired up).

---

## 6. Withdraw an application

No current way for an applicant to withdraw. This also matters for HR's
own tracking — schema.prisma's `PscOutcome` enum already includes
`withdrew` as a value, per the HRMO interview's confirmation that PSC
records why an applicant didn't proceed.

**Build:** a "Withdraw application" action on the applicant's own
application detail view. On confirm, update `Application.status` to
`not_selected` and set `pscOutcome: 'withdrew'` if applicable at that
stage. Require a confirmation step (not a single misclick action).

**Verify:** withdraw a seeded application, confirm status updates
correctly and the action is not reversible by the applicant themselves
(only visible/re-openable by HR, if that's the intended design —
confirm this assumption before building).

---

## 7. Surface the Master's-degree completion deadline to appointed faculty

schema.prisma already has `mastersDeadline` and `mastersCompleted` on
`Application`, matching the HRMO interview finding: faculty hired
without a completed Master's degree get a temporary appointment with a
5-year window to complete it, renewed annually, not renewed past year 6.

**Build:** once an application reaches `status: 'appointed'` with
`appointmentType: 'temporary'` on the linked vacancy, surface the
`mastersDeadline` prominently on the applicant's dashboard — e.g. "X
years remaining to complete your Master's degree" — using the same
stamp/badge visual language as the rest of the app, not a plain text
line.

**Verify:** manually set a seeded application to this state, confirm
the deadline displays correctly and calculates remaining time
accurately from `mastersDeadline`.

---

## 8. Profile page that pre-fills future applications

Not urgent, but high value: a persistent applicant profile (education,
work experience, training, eligibility) that pre-populates new
applications instead of requiring re-entry each time.

**Build:** `src/app/applicant/profile/page.tsx` (confirm whether this
already exists per earlier folder listing — it may be a placeholder).
Store reusable applicant data either as fields on `User` or a related
`ApplicantProfile` model (add to schema.prisma if the latter — do not
overload the `User` model with PDS-specific fields if it starts to grow
large).

**Verify:** fill out the profile once, start a new application, confirm
relevant fields are pre-populated rather than blank.

---

## 9. Explainer panel on PLM's actual hiring process

Low effort, good value: PLM's process has real specifics an applicant
wouldn't otherwise know (two-stage PSC/PSB scoring for admin roles,
teaching demonstrations for faculty, no resumes accepted — PDS/WES only,
15-day application windows). A short "How hiring works at PLM" panel or
modal on the applicant dashboard, sourced directly from the HRMO
interview findings, would set correct expectations.

**Build:** static content panel, no new data model needed. Content
source: the "Findings from Key Informant Interview" section already
drafted for the thesis document (Chapter 3, Section 3.1.1) — reuse that
language rather than rewriting it from scratch.

---

## 10. Inclusion/accessibility messaging on vacancy listings

PLM's actual CS Form No. 9 postings include a standard statement:
"This Office highly encourages all interested and qualified applicants
to apply, which include persons with disability (PWD) and members of
the indigenous communities... does not discriminate... pursuant to
Equal Opportunities for Employment Principle (EOP)."

**Build:** add this (or a close paraphrase) as standard footer text on
the vacancy listing/detail page (item 1). Small, low-effort, and ties
the UI directly back to PLM's real published documents rather than
generic boilerplate.

---

## Definition of done for this list

1. An applicant can browse published vacancies and see real closing
   dates before applying
2. An applicant can upload a real document and see it persist with a
   verification status
3. An applicant can view every application they've made, not just one
4. Status changes trigger a real (or dev-logged) email
5. An applicant can withdraw an application with confirmation
6. Appointed temporary faculty see their Master's-completion deadline
7. A profile page exists and pre-fills new applications
8. The hiring-process explainer and EOP messaging are visible on the
   applicant side

Do not report any item complete without running its verify step and
showing the actual output.
