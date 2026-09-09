#!/bin/bash
echo 'import { prisma} from "@/lib/prisma";' > F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo 'export default async function VacanciesPage() {' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '  const vacancies = await prisma.vacancy.findMany({' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '    include: {' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '      college: true,' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '      qsTemplate: true,' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '    },' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '    orderBy: {' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '      createdAt: "desc",' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '    },' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '  });' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '  return (' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '    <div className="p-6">' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '      <h1 className="text-2xl font-bold mb-4">Vacancy Management</h1>' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '      <div className="space-y-4">' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '        {vacancies.map((vacancy) => (' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '          <div key={vacancy.id} className="border rounded-lg p-4">' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '            <h2 className="font-semibold">{vacancy.positionTitle}</h2>' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '            <p className="text-sm text-gray-600">' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '              {vacancy.placeOfAssignment} • {vacancy.salaryGrade}' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '            </p>' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '            <p className="text-sm">{vacancy.status}</p>' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '          </div>' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '        ))}' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '      </div>' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '    </div>' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '  );' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
echo '}' >> F:/Coding/hirepath/hirepath/src/app/vacancies/page.tsx
