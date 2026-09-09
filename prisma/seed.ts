// ============================================================================
// PLM-HirePath — seed script
// ----------------------------------------------------------------------------
// Populates the database with realistic starting data, pulled from the
// actual CS Form No. 9 sample, the COA Qualification Standards table, and
// PLM HR's own interview — not generic "foo"/"bar" placeholders. Running
// this gives you something that actually LOOKS like PLM the moment you
// open Prisma Studio or your dashboards, instead of empty tables.
//
// Run it with:  npx prisma db seed
// ============================================================================

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding PLM-HirePath...\n');

  // --------------------------------------------------------------------
  // 1. COLLEGES
  // --------------------------------------------------------------------
  // 🔧 EDIT ME: this is the fastest, highest-value edit in this whole file.
  // Add every college PLM actually has, and your Dean-scoping logic (career
  // path, vacancy drafts, applicant lists) instantly becomes realistic
  // across the whole app instead of just one example college.
  // --------------------------------------------------------------------
  const cistm = await prisma.college.upsert({
    where: { name: 'College of Information Systems and Technology Management' },
    update: {},
    create: {
      name: 'College of Information Systems and Technology Management',
    },
  });

  const cas = await prisma.college.upsert({
    where: { name: 'College of Arts and Sciences' },
    update: {},
    create: { name: 'College of Arts and Sciences' },
  });

  const cpt = await prisma.college.upsert({
    where: { name: 'College of Physical Therapy' },
    update: {},
    create: { name: 'College of Physical Therapy' },
  });

  console.log('Colleges seeded.');

  // --------------------------------------------------------------------
  // 2. USERS — one of each role, so every dashboard has someone to log
  //    in as immediately.
  // --------------------------------------------------------------------
  // 🔧 EDIT ME: swap these emails/names for your real thesis defense demo
  // accounts. Institutional-looking @plm.edu.ph emails are used here on
  // purpose — this is exactly the identification pattern your role table
  // calls for (Admin-provisioned, institutional email, no self-registration
  // for staff roles).
  //
  // ⚠️  The password below is "changeme123" for every seeded account —
  // obviously change this before you ever demo this near real people.
  // --------------------------------------------------------------------
  const defaultPasswordHash = await bcrypt.hash('changeme123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@plm.edu.ph' },
    update: {},
    create: {
      email: 'admin@plm.edu.ph',
      passwordHash: defaultPasswordHash,
      name: 'System Administrator',
      role: 'admin',
    },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hrmo@plm.edu.ph' },
    update: {},
    create: {
      email: 'hrmo@plm.edu.ph',
      passwordHash: defaultPasswordHash,
      name: 'Reynaldo J. Villegas',
      role: 'hr',
    },
  });

  const vpaa = await prisma.user.upsert({
    where: { email: 'vpaa@plm.edu.ph' },
    update: {},
    create: {
      email: 'vpaa@plm.edu.ph',
      passwordHash: defaultPasswordHash,
      name: 'Vice President for Academic Affairs',
      role: 'vpaa',
    },
  });

  const dean = await prisma.user.upsert({
    where: { email: 'dean.cistm@plm.edu.ph' },
    update: {},
    create: {
      email: 'dean.cistm@plm.edu.ph',
      passwordHash: defaultPasswordHash,
      name: 'Ariel Antwaun Rolando C. Sison',
      role: 'dean',
      collegeId: cistm.id,
    },
  });

  // 🔧 EDIT ME: add more applicants here as you test — every one you add
  // shows up instantly in the HR dashboard's applicant table.
  const applicant1 = await prisma.user.upsert({
    where: { email: 'juana.cruz@example.com' },
    update: {},
    create: {
      email: 'juana.cruz@example.com',
      passwordHash: defaultPasswordHash,
      name: 'Juana D. Cruz',
      role: 'applicant',
    },
  });

  const applicant2 = await prisma.user.upsert({
    where: { email: 'rafael.santos@example.com' },
    update: {},
    create: {
      email: 'rafael.santos@example.com',
      passwordHash: defaultPasswordHash,
      name: 'Rafael M. Santos',
      role: 'applicant',
    },
  });

  console.log(
    'Users seeded (all passwords: changeme123 — change before demoing!).'
  );

  // --------------------------------------------------------------------
  // 3. QS TEMPLATES
  // --------------------------------------------------------------------
  // These come straight from real sources you already pulled: the CS Form
  // No. 9 sample (Physical Therapist II), the COA Qualification Standards
  // table (admin positions), and the faculty rank ladder from your Career
  // Path mockup.
  //
  // 🔧 EDIT ME — this is the single best place to spend extra time: every
  // real QS row you add here becomes something your NLP-matching logic can
  // actually test against later. Pull more rows straight from the COA PDF
  // or new CSC Job Portal postings for PLM and paste them in below — each
  // one takes about 30 seconds and makes your whole screening demo more
  // convincing.
  // --------------------------------------------------------------------

  // --- Administrative track (from CS Form No. 9 + COA QS table) ---
  const ptII = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Physical Therapist II',
        salaryGrade: 15,
      },
    },
    update: {},
    create: {
      positionTitle: 'Physical Therapist II',
      salaryGrade: 15,
      track: 'administrative',
      education: "Bachelor's degree in Physical Therapy",
      experience: '1 year of relevant experience',
      training: '4 hours of relevant training',
      eligibility: 'RA 1080 (Registered Physical Therapist)',
    },
  });

  const adminAsst3 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Administrative Assistant III',
        salaryGrade: 9,
      },
    },
    update: {},
    create: {
      positionTitle: 'Administrative Assistant III',
      salaryGrade: 9,
      track: 'administrative',
      education: 'Completion of two-year studies in college',
      experience: '1 year of relevant experience',
      training: '4 hours of relevant training',
      eligibility: 'CS Sub-professional / First Level Eligibility',
    },
  });

  const adminOfficer2 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Administrative Officer II',
        salaryGrade: 11,
      },
    },
    update: {},
    create: {
      positionTitle: 'Administrative Officer II',
      salaryGrade: 11,
      track: 'administrative',
      education: "Bachelor's degree relevant to the job",
      experience: 'None required',
      training: 'None required',
      eligibility: 'CS Professional / Second Level Eligibility',
    },
  });

  const adminOfficer4 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Administrative Officer IV',
        salaryGrade: 15,
      },
    },
    update: {},
    create: {
      positionTitle: 'Administrative Officer IV',
      salaryGrade: 15,
      track: 'administrative',
      education: "Bachelor's degree relevant to the job",
      experience: '1 year of relevant experience',
      training: '4 hours of relevant training',
      eligibility: 'CS Professional / Second Level Eligibility',
    },
  });

  const adminOfficer5 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Administrative Officer V',
        salaryGrade: 18,
      },
    },
    update: {},
    create: {
      positionTitle: 'Administrative Officer V',
      salaryGrade: 18,
      track: 'administrative',
      education: "Bachelor's degree relevant to the job",
      experience: '2 years of relevant experience',
      training: '8 hours of relevant training',
      eligibility: 'CS Professional / Second Level Eligibility',
    },
  });

  const supervisingAO = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Supervising Administrative Officer',
        salaryGrade: 22,
      },
    },
    update: {},
    create: {
      positionTitle: 'Supervising Administrative Officer',
      salaryGrade: 22,
      track: 'administrative',
      education: "Bachelor's degree relevant to the job",
      experience: '3 years of relevant experience',
      training: '16 hours of relevant training',
      eligibility: 'CS Professional / Second Level Eligibility',
    },
  });

  const itOfficer1 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Information Technology Officer I',
        salaryGrade: 19,
      },
    },
    update: {},
    create: {
      positionTitle: 'Information Technology Officer I',
      salaryGrade: 19,
      track: 'administrative',
      education: "Bachelor's degree relevant to the job",
      experience: '2 years of relevant experience',
      training: '8 hours of relevant training',
      eligibility: 'CS Professional / Second Level Eligibility',
    },
  });

  // --- Faculty track (matches your Career Path mockup ladder) ---
  const instructor1 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Instructor I',
        salaryGrade: 12,
      },
    },
    update: {},
    create: {
      positionTitle: 'Instructor I',
      salaryGrade: 12,
      track: 'faculty',
      education: "Master's degree units",
      experience: 'None required',
      training: 'None required',
      eligibility: 'N/A',
    },
  });

  const instructor3 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Instructor III',
        salaryGrade: 15,
      },
    },
    update: {},
    create: {
      positionTitle: 'Instructor III',
      salaryGrade: 15,
      track: 'faculty',
      education: "Master's degree",
      experience: '1 year relevant',
      training: '8 hours relevant',
      eligibility: 'N/A',
    },
  });

  const asstProf2 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Assistant Professor II',
        salaryGrade: 19,
      },
    },
    update: {},
    create: {
      positionTitle: 'Assistant Professor II',
      salaryGrade: 19,
      track: 'faculty',
      education: 'Doctoral units',
      experience: '2 years relevant',
      training: '16 hours relevant',
      eligibility: 'N/A',
    },
  });

  const assocProf1 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Associate Professor I',
        salaryGrade: 22,
      },
    },
    update: {},
    create: {
      positionTitle: 'Associate Professor I',
      salaryGrade: 22,
      track: 'faculty',
      education: 'Doctoral degree',
      experience: '3 years relevant',
      training: '16 hours relevant',
      eligibility: 'N/A',
    },
  });

  const professor6 = await prisma.qSTemplate.upsert({
    where: {
      positionTitle_salaryGrade: {
        positionTitle: 'Professor VI',
        salaryGrade: 29,
      },
    },
    update: {},
    create: {
      positionTitle: 'Professor VI',
      salaryGrade: 29,
      track: 'faculty',
      education: 'Doctoral degree',
      experience: '5 years relevant',
      training: '32 hours relevant',
      eligibility: 'N/A',
    },
  });

  console.log('QS templates seeded.');

  // --------------------------------------------------------------------
  // 4. CAREER RANKS — links QS templates into the ladder your Career Path
  //    page visualizes.
  // --------------------------------------------------------------------
  // 🔧 EDIT ME: remember the interview finding — faculty ranks are a real,
  // strict ladder (sequenceNo matters), but admin promotion is NOT
  // sequential at PLM. The sequenceNo values below still give the UI a
  // sensible display order, but don't treat the admin numbers as "you must
  // go 1 → 2 → 3" the way faculty ranks actually work.
  // --------------------------------------------------------------------
  const facultyRanks = [
    instructor1,
    instructor3,
    asstProf2,
    assocProf1,
    professor6,
  ];
  for (let i = 0; i < facultyRanks.length; i++) {
    await prisma.careerRank.upsert({
      where: { qsTemplateId: facultyRanks[i].id },
      update: {},
      create: {
        track: 'faculty',
        sequenceNo: i + 1,
        qsTemplateId: facultyRanks[i].id,
      },
    });
  }

  const adminRanks = [
    adminAsst3,
    adminOfficer2,
    adminOfficer4,
    adminOfficer5,
    supervisingAO,
  ];
  for (let i = 0; i < adminRanks.length; i++) {
    await prisma.careerRank.upsert({
      where: { qsTemplateId: adminRanks[i].id },
      update: {},
      create: {
        track: 'administrative',
        sequenceNo: i + 1,
        qsTemplateId: adminRanks[i].id,
      },
    });
  }

  console.log('Career ranks seeded.');

  // --------------------------------------------------------------------
  // 5. VACANCIES — one at each interesting stage of the approval pipeline,
  //    so you can demo the whole Dean → HR → VPAA workflow immediately.
  // --------------------------------------------------------------------
  // 🔧 EDIT ME: this is where your thesis defense demo actually comes
  // alive. Add a vacancy at "returned" status with real reviewNotes text
  // to show off the revision loop, or one at
  // "awaiting_board_confirmation" with a fake approvalDocumentRef to show
  // the external-checkpoint tracking in action.
  // --------------------------------------------------------------------
  const vacancyPT = await prisma.vacancy.upsert({
    where: { id: 'seed-vacancy-pt2' },
    update: {},
    create: {
      id: 'seed-vacancy-pt2',
      positionTitle: 'Physical Therapist II',
      plantillaItemNo: '356',
      salaryGrade: 15,
      placeOfAssignment: 'College of Physical Therapy',
      track: 'administrative',
      slots: 1,
      qsTemplateId: ptII.id,
      status: 'published',
      createdByRole: 'hr',
      createdById: hr.id,
      publicationChannels: ['CSC Job Portal', 'HR Bulletin Board'],
      postingDate: new Date('2026-08-11'),
      closingDate: new Date('2026-08-26'),
      validityMonths: 9,
    },
  });

  const vacancyInstructor = await prisma.vacancy.upsert({
    where: { id: 'seed-vacancy-instructor1' },
    update: {},
    create: {
      id: 'seed-vacancy-instructor1',
      positionTitle: 'Instructor I',
      plantillaItemNo: '214',
      salaryGrade: 12,
      placeOfAssignment:
        'College of Information Systems and Technology Management',
      track: 'faculty',
      slots: 2,
      qsTemplateId: instructor1.id,
      collegeId: cistm.id,
      status: 'pending_hr_review', // 👈 demo the Dean → HR approval loop with this one
      createdByRole: 'dean',
      createdById: dean.id,
    },
  });

  const vacancyAO = await prisma.vacancy.upsert({
    where: { id: 'seed-vacancy-ao2' },
    update: {},
    create: {
      id: 'seed-vacancy-ao2',
      positionTitle: 'Administrative Officer II',
      plantillaItemNo: '402',
      salaryGrade: 11,
      placeOfAssignment: 'Human Resource Management Office',
      track: 'administrative',
      slots: 1,
      qsTemplateId: adminOfficer2.id,
      status: 'draft',
      createdByRole: 'hr',
      createdById: hr.id,
    },
  });

  console.log('Vacancies seeded.');

  // --------------------------------------------------------------------
  // 6. APPLICATIONS & DOCUMENTS
  // --------------------------------------------------------------------
  // 🔧 EDIT ME: change qsMatchScore / pscScore / status here to rehearse
  // different demo scenarios — a low-match "deficient" applicant, a
  // shortlisted top-5 candidate, or someone mid-CRRC evaluation. This is
  // the fastest way to make your HR dashboard demo look alive.
  // --------------------------------------------------------------------
  const application1 = await prisma.application.upsert({
    where: {
      applicantId_vacancyId: {
        applicantId: applicant1.id,
        vacancyId: vacancyPT.id,
      },
    },
    update: {},
    create: {
      applicantId: applicant1.id,
      vacancyId: vacancyPT.id,
      status: 'under_review',
      qsMatchScore: 82,
      pscScore: 4.2,
      pscOutcome: 'attended',
    },
  });

  await prisma.document.createMany({
    skipDuplicates: true,
    data: [
      {
        applicationId: application1.id,
        type: 'pds',
        fileUrl: '/uploads/seed/juana-cruz-pds.pdf',
        verificationStatus: 'verified',
        parsingConfidence: 0.94,
      },
      {
        applicationId: application1.id,
        type: 'work_experience_sheet',
        fileUrl: '/uploads/seed/juana-cruz-wes.pdf',
        verificationStatus: 'verified',
        parsingConfidence: 0.91,
      },
      {
        applicationId: application1.id,
        type: 'transcript_of_records',
        fileUrl: '/uploads/seed/juana-cruz-tor.pdf',
        verificationStatus: 'pending',
      },
    ],
  });

  console.log('Applications and documents seeded.');

  console.log(
    "\nDone. Log in with any seeded account — password is 'changeme123'."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
