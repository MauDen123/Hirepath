# PLM-HirePath — CRRC Scoring Engine & Position/QS Data (for Claude Code)

Built from two source documents:
1. `COA_AS_Memo10062016_updated_QS.pdf` — administrative position titles,
   salary grades, and QS (Education/Experience/Training/Eligibility)
2. `DBM-JC-No-3-s-2022-9th-cycle-NBC-461-with-Annexes.pdf` — the actual
   national CRRC-equivalent faculty evaluation framework (DBM–CHED Joint
   Circular No. 3, s. 2022, 9th Cycle NBC 461), which is the real rubric
   PLM's own CRRC process is built on. Annex I = scoring criteria,
   Annex II = implementing guidelines, Annex III = review/approval chain.

Work in the order listed.

---

## PART A — Seed administrative QS positions into the database

The following positions, salary grades, and qualification standards are
sourced directly from the COA memo (page references noted). Add any not
already present in `prisma/seed.ts`'s QSTemplate section. Use `track:
'administrative'` for all of these.

| Position Title | SG | Education | Experience | Training | Eligibility |
|---|---|---|---|---|---|
| Accountant II | 16 | BS Accountancy/BSC-Accounting/BSBA-Accounting | 1 yr relevant | 4 hrs relevant | RA 1080 (CPA) |
| Accountant III | 19 | BS Accountancy/BSC-Accounting/BSBA-Accounting | 2 yrs relevant | 8 hrs relevant | RA 1080 (CPA) |
| Accountant IV | 22 | BS Accountancy/BSC-Accounting/BSBA-Accounting | 3 yrs relevant | 16 hrs relevant | RA 1080 (CPA) |
| Administrative Officer II | 11 | Bachelor's degree relevant to the job | None required | None required | CS Professional/Second Level |
| Administrative Officer IV | 15 | Bachelor's degree relevant to the job | 1 yr relevant | 4 hrs relevant | CS Professional/Second Level |
| Administrative Officer V | 18 | Bachelor's degree relevant to the job | 2 yrs relevant | 8 hrs relevant | CS Professional/Second Level |
| Architect I | 12 | Bachelor's degree in Architecture | None required | None required | RA 1080 |
| Architect II | 16 | Bachelor's degree in Architecture | None required | None required | RA 1080 |
| Attorney IV | 23 | Bachelor of Laws | 2 yrs relevant | 8 hrs relevant | RA 1080 (BAR) |
| Attorney V | 25 | Bachelor of Laws | 3 yrs relevant | 16 hrs relevant | RA 1080 (BAR) |
| Computer Maintenance Technologist I | 11 | Bachelor's degree relevant to the job | None required | None required | CS Professional/Second Level |
| Computer Maintenance Technologist II | 15 | Bachelor's degree relevant to the job | 1 yr relevant | 4 hrs relevant | CS Professional/Second Level |
| Computer Programmer I | 11 | Bachelor's degree relevant to the job | None required | None required | CS Professional/Second Level |
| Engineer I | 12 | Bachelor's degree in Engineering | None required | None required | RA 1080 |
| Engineer II | 16 | Bachelor's degree in Engineering | 1 yr relevant | 4 hrs relevant | RA 1080 |
| Engineer III | 19 | Bachelor's degree in Engineering | 2 yrs relevant | 8 hrs relevant | RA 1080 |
| Information Systems Analyst I | 12 | Bachelor's degree relevant to the job | None required | None required | CS Professional/Second Level |
| Information Systems Analyst II | 16 | Bachelor's degree relevant to the job | 1 yr relevant | 4 hrs relevant | CS Professional/Second Level |
| Information Systems Analyst III | 19 | Bachelor's degree relevant to the job | 2 yrs relevant | 8 hrs relevant | CS Professional/Second Level |
| Information Technology Officer I | 19 | Bachelor's degree relevant to the job | 2 yrs relevant | 8 hrs relevant | CS Professional/Second Level |
| Information Technology Officer II | 22 | Bachelor's degree relevant to the job | 3 yrs relevant | 16 hrs relevant | CS Professional/Second Level |
| Medical Technologist I | 11 | BS Medical Technology or BS Public Health | None required | None required | RA 1080 |
| Medical Technologist II | 15 | BS Medical Technology or BS Public Health | 1 yr relevant | 4 hrs relevant | RA 1080 |
| Medical Technologist III | 18 | BS Medical Technology or BS Public Health | 2 yrs relevant | 8 hrs relevant | RA 1080 |
| Nurse II | 15 | BS Nursing | 1 yr relevant | 4 hrs relevant | RA 1080 |
| Nurse III | 17 | BS Nursing | 1 yr relevant | 4 hrs relevant | RA 1080 |
| Special Investigator I | 11 | Bachelor's degree relevant to the job | None required | None required | CS Professional/Second Level |
| Special Investigator II | 15 | Bachelor's degree relevant to the job | 1 yr relevant | 4 hrs relevant | CS Professional/Second Level |
| Supervising Administrative Officer | 22 | Bachelor's degree relevant to the job | 3 yrs relevant | 16 hrs relevant | CS Professional/Second Level |
| Training Specialist I | 11 | Bachelor's degree relevant to the job | None required | None required | CS Professional/Second Level |
| Training Specialist II | 15 | Bachelor's degree relevant to the job | 1 yr relevant | 4 hrs relevant | CS Professional/Second Level |
| Training Specialist III | 18 | Bachelor's degree relevant to the job | 2 yrs relevant | 8 hrs relevant | CS Professional/Second Level |
| Training Specialist IV | 22 | Bachelor's degree relevant to the job | 3 yrs relevant | 16 hrs relevant | CS Professional/Second Level |

**Deliberately excluded** — COA-specific titles that will never appear in
PLM's plantilla (do not seed these): State Auditor I–V, State Auditing
Examiner II, Technical Audit Specialist I/II, Senior/Supervising Technical
Audit Specialist, Board Secretary II–VI, Chief Technical Audit Specialist,
Director II–IV. These exist only within COA's own organizational structure.

**Positions with branching/conditional QS** (Attorney VI, Chief
Administrative Officer, Special Investigator V, Training Specialist V) —
each offers two alternate qualification paths (RA 1080 + experience, OR
CS Professional Eligibility + an advanced degree/CSC leadership cert).
The current `QSTemplate` schema stores education/experience/training/
eligibility as single strings, which cannot cleanly represent an "OR"
branch. For these positions, store the primary (RA 1080) path as the
template's main fields, and put the alternate path in the `competencies`
text field prefixed "Alternate path: ...". Flag this as a schema
limitation worth addressing later if PLM's plantilla actually includes
any of these branching positions — check with real PLM postings before
spending time on a fuller conditional-QS data model.

**Verify:** after seeding, `npx prisma studio` shows all of the above
under `qs_templates` with `track: administrative`, and none of the
excluded COA-only titles are present.

---

## PART B — Build the real CRRC scoring engine (faculty track)

The current schema has a single `Application.crrcScore Float?` field.
This does not reflect how CRRC scoring actually works. Per DBM–CHED
Joint Circular No. 3, s. 2022 (Annex I), faculty are scored across
**four Key Result Areas (KRAs)**, each worth up to 100 points, with
detailed sub-criteria:

### KRA I — Instruction (100 points)
- Criterion A – Teaching Effectiveness (max 60 pts)
  - Student Evaluation (60% of Criterion A, i.e. up to 36 pts)
  - Supervisor's Evaluation (40% of Criterion A, i.e. up to 24 pts)
- Criterion B – Curriculum and Instructional Materials Developed (max 30 pts)
  - Sole author of a textbook: 30 pts / co-author: % contribution
  - Sole author of a textbook chapter: 10 pts
  - Sole author of a manual/module: 16 pts
  - Multimedia teaching materials: 16 pts
  - Testing materials: 10 pts
  - Academic programs developed/revised — Lead: 10 pts, Contributor: 5 pts
- Criterion C – Special Projects, Capstone Projects, Thesis and
  Dissertation Supervision, and Mentorship (max 10 pts)

### KRA II — Research, Innovation, and/or Creative Work (100 points)
- Criterion A – Research Outputs Published (max 100 pts)
- Criterion B – Inventions (max 100 pts)
- Criterion C – Creative Works (max 100 pts)
(Note: sub-scoring detail for KRA II's exact point breakdown per
publication tier runs several pages in the source document — pull the
full breakdown directly from Annex I pages covering lines ~90-212 of
the extracted text before finalizing the UI's input form, rather than
guessing point values not summarized here.)

### KRA III — Extension Services (100 points)
- Criterion A – Service to the Institution (max 30 pts)
- Criterion B – Service to the Community (max 50 pts)
- Criterion C – Quality of Extension Services (max 20 pts)
- Criterion D – Bonus Criterion (max 20 pts, additive)

### KRA IV — Professional Development (100 points)
- Criterion A – Involvement in Professional Organizations (max 20 pts)
- Criterion B – Continuing Development (max 60 pts)
- Criterion C – Awards and Recognition (max 20 pts)
- Criterion D – Bonus Indicators for Newly Hired Faculty only (max 20 pts)
  - Includes credit for prior academic service (President: 5 pts/yr,
    VP/Dean/Director: 4 pts/yr, Dept Head: 3 pts/yr, Faculty: 2 pts/yr)
    and prior industry experience (Managerial: 4 pts/yr, Technical/
    Skilled: 3 pts/yr, Support/Admin: 2 pts/yr)

### Critical rule from Annex II — points are weighted by current rank
> "The point/s received by the faculty in each KRA will be computed
> based on the weight/s assigned to the current rank of the faculty.
> The final score will determine the number of sub-ranks that will be
> granted to the faculty."

This means the same raw KRA scores produce a different final weighted
result depending on the applicant's current faculty rank (e.g. Instructor
vs. Professor likely weight KRA I Instruction vs. KRA II Research
differently). **The exact rank-to-weight percentage table was not fully
captured in this extraction** — before building the final score
calculation, pull Annex II's specific weight table directly from the
source PDF (search for the section immediately following "the weight/s
assigned to the current rank" — it is a table, and pdftotext's layout
mode can mangle table structure, so verify by rasterizing that page if
the extracted text looks incomplete).

**Do not hardcode a guessed weighting formula.** If the exact weight
table cannot be confirmed before the defense deadline, implement the
raw, unweighted KRA I-IV point entry and total as the v1 feature, and
document rank-based weighting as a known follow-up — this is an honest,
defensible scope cut, not a shortcut to hide.

---

## PART C — Schema changes needed

Replace the single `crrcScore` field with a proper normalized structure.
Add to `schema.prisma`:

```prisma
model CrrcEvaluation {
  id            String      @id @default(cuid())
  applicationId String      @unique
  application   Application @relation(fields: [applicationId], references: [id])

  // KRA I - Instruction
  kra1TeachingEffectiveness   Float?  // max 60
  kra1CurriculumMaterials     Float?  // max 30
  kra1SpecialProjects         Float?  // max 10
  kra1Total                   Float?  // computed: sum, max 100

  // KRA II - Research, Innovation, Creative Work
  kra2ResearchOutputs         Float?  // max 100
  kra2Inventions              Float?  // max 100
  kra2CreativeWorks           Float?  // max 100
  kra2Total                   Float?  // per Annex I rules, NOT a simple sum —
                                       // confirm combination rule before implementing

  // KRA III - Extension Services
  kra3ServiceToInstitution    Float?  // max 30
  kra3ServiceToCommunity      Float?  // max 50
  kra3QualityOfService        Float?  // max 20
  kra3Bonus                   Float?  // max 20, additive
  kra3Total                   Float?

  // KRA IV - Professional Development
  kra4ProfessionalOrgs        Float?  // max 20
  kra4ContinuingDevelopment   Float?  // max 60
  kra4AwardsRecognition       Float?  // max 20
  kra4NewHireBonus            Float?  // max 20, newly hired faculty only
  kra4Total                   Float?

  finalWeightedScore          Float?  // after rank-based weighting is applied
  recommendedSubRanks         Int?    // number of sub-ranks earned

  evaluatedById  String
  evaluatedBy    User     @relation(fields: [evaluatedById], references: [id])
  notes          String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("crrc_evaluations")
}
```

Add the inverse relation to `Application`:
```prisma
crrcEvaluation CrrcEvaluation?
```

Keep `Application.crrcScore` for now as a denormalized copy of
`finalWeightedScore` (simpler for existing dashboard code that already
reads it), updated whenever `CrrcEvaluation` is saved — do not remove
it outright without checking what currently reads it.

**Verify:** `npx prisma migrate dev --name add_crrc_evaluation`, then
`npx prisma studio` shows the new `crrc_evaluations` table correctly
related to `applications`.

---

## PART D — Rebuild the CRRC evaluation UI around real KRA structure

The current `crrc-evaluations/page.tsx` has a single score input (and
per the earlier code review, it's also broken — mixing Client/Server
incorrectly, with a non-functional input). Rebuild it as a real,
sectioned form:

- One collapsible section per KRA (I–IV), each showing its criteria
  and point sub-fields as defined in Part B
- Running totals per KRA, and an overall total, computed client-side as
  the Dean fills in values (do not require a page reload to see the
  running total)
- Respect the existing Server/Client Component fix from the earlier
  code-review-findings.md — the form itself is a Client Component, data
  fetching stays in the parent Server Component, saving goes through a
  real Server Action
- Continue enforcing the college-scoping fix from that same file — a
  Dean only sees/scores applicants from their own college

**Verify:** as a seeded Dean, open a CRRC evaluation, fill in values
across multiple KRA sections, confirm the running total updates live,
save, and confirm all sub-scores persist correctly to the new
`CrrcEvaluation` table on reload.

---

## PART E — Context worth knowing, not necessarily building now

Annex III of the DBM–CHED circular describes the real evaluation body
structure: the **Institutional Evaluation Committee (IEC)** is chaired
by the **VPAA**, with members including a Dean (nominated by the
Council of Deans), two faculty representatives from different ranks,
and an HRMO/HRMD representative. Results then move through a Regional
Evaluation Committee (REC) or Executive/Central Committee (EAC/CC)
depending on rank tier, then Governing Board resolution, then
submission to DBM (by Dec 15) and CSC.

This confirms the VPAA role we already built has a real, substantive
basis in faculty evaluation, not just vacancy endorsement. **Do not
attempt to model the full multi-member committee structure (IEC/REC/
EAC/CC) in the system right now** — that is a significant scope
expansion this close to a defense deadline. The current design (Dean
scores, VPAA endorses at the vacancy-approval level) is a defensible
simplification of this real process. If asked in a defense why the
system doesn't model the full committee structure, the honest answer
is: it represents the process at the level of individual actors
required for a functional prototype, with the full multi-committee
review chain acknowledged as a documented scope limitation.

---

## Definition of done for this file

1. All administrative positions from Part A are seeded with correct SG
2. `CrrcEvaluation` model exists and migrates cleanly
3. A Dean can score a faculty applicant across all four KRAs with
   correct point maximums enforced per sub-criterion
4. Running totals compute correctly client-side
5. KRA II's detailed sub-point breakdown and the rank-based weighting
   table have been pulled from the source PDF directly (not guessed)
   before being presented as "final" scoring logic — if not confirmed
   in time, the raw unweighted total is used and documented as a known
   limitation, not silently guessed at

Do not report any item complete without running its verify step and
showing the actual output.
