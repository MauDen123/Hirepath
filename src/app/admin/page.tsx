import Sidebar, { NavItem } from '@/components/Sidebar';
import TopLine from '@/components/TopLine';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    // Not authorized, return null to let middleware redirect
    return null;
  }

  // Get statistics from the database
  const [, publishedVacancies, , colleges] = await Promise.all([
    prisma.vacancy.count(),
    prisma.vacancy.count({ where: { status: 'published' } }),
    prisma.user.count(),
    prisma.college.findMany(),
  ]);

  // Get recent vacancies
  const recentVacancies = await prisma.vacancy.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      qsTemplate: true,
      createdBy: true,
    },
  });

  // Get HR and Dean accounts
  const hrAndDeanAccounts = await prisma.user.findMany({
    where: {
      role: {
        in: ['hr', 'vpaa', 'dean'],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      college: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <div className="app-shell">
      <Sidebar
        wordmarkSub={currentUser.role}
        navItems={[
          { index: '01', label: 'Vacancies', href: '/vacancies' },
          { index: '02', label: 'User Accounts', href: '/admin/accounts' },
          { index: '03', label: 'Plantilla Records', href: '/admin/plantilla' },
          { index: '04', label: 'QS Templates', href: '/admin/qs-templates' },
          { index: '05', label: 'System Logs', href: '/admin/logs' },
        ]}
        roleChip={
          currentUser.role
            .charAt(0)
            .toUpperCase() + currentUser.role.slice(1)
        }
        userName={currentUser.name || ''}
        userSub="System Administrator"
      />
      <main className="main">
        <TopLine
          title="Vacancy management"
          subtitle="Plantilla positions authorized for publication to the CSC Job Portal."
          action={
            <form method="POST" action="/api/auth/logout">
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          }
        />
        <div className="grid grid-3" style={{ marginBottom: 22 }}>
          <div className="stat">
            <div className="num">{colleges.length}</div>
            <div className="lbl">Colleges on file</div>
          </div>
          <div className="stat">
            <div className="num">{publishedVacancies}</div>
            <div className="lbl">Currently published</div>
          </div>
          <div className="stat">
            <div className="num">{hrAndDeanAccounts.length}</div>
            <div className="lbl">HR / Dean accounts</div>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Published & draft vacancies</h3>
            <button className="btn btn-primary btn-sm">+ New vacancy</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Position title</th>
                <th className="mono">Plantilla no.</th>
                <th className="mono">SG</th>
                <th className="mono">Slots</th>
                <th className="mono">Place of assignment</th>
                <th className="mono">Status</th>
                <th className="mono" />
              </tr>
            </thead>
            <tbody>
              {recentVacancies.map((vacancy) => (
                <tr key={vacancy.id} className="hover:bg-gray-50">
                  <td className="cell-primary">{vacancy.positionTitle}</td>
                  <td className="mono">{vacancy.plantillaItemNo}</td>
                  <td className="mono">{vacancy.salaryGrade}</td>
                  <td className="mono">{vacancy.slots}</td>
                  <td className="mono">
                    {vacancy.placeOfAssignment ||
                      (vacancy.collegeId
                        ? colleges.find((c) => c.id === vacancy.collegeId)?.name
                        : 'Not assigned')}
                  </td>
                  <td className="mono">
                    <span
                      className={`badge ${
                        vacancy.status === 'published'
                          ? 'approved'
                          : vacancy.status === 'draft'
                            ? 'pending'
                            : 'neutral'
                      }`}
                    >
                      {vacancy.status.charAt(0).toUpperCase() + vacancy.status.slice(1)}
                    </span>
                  </td>
                  <td className="mono">
                    <button className="btn btn-ghost btn-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>HR & Dean accounts</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Office / College</th>
                <th className="mono">Status</th>
              </tr>
            </thead>
            <tbody>
              {hrAndDeanAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td>
                    <span className="avatar-dot">
                      {account.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  </td>
                  <td className="cell-primary">{account.name}</td>
                  <td>
                    {account.role.charAt(0).toUpperCase() + account.role.slice(1)}
                  </td>
                  <td>
                    {account.college?.name || 'Central Office'}
                  </td>
                  <td className="mono">
                    <span className="badge approved">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}