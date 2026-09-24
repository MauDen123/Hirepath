// Mock all dependencies first
jest.mock('next/server', () => {
  return {
    Request: class MockRequest {
      url: string;
      options: {
        method: string;
        headers: { [key: string]: string };
        body: string;
      };
      _jsonData: unknown;
      constructor(
        url: string,
        options: {
          method: string;
          headers: { [key: string]: string };
          body: string;
        }
      ) {
        this.url = url;
        this.options = options;
        // Parse body if it's a JSON string
        try {
          this._jsonData = JSON.parse(options.body);
        } catch {
          this._jsonData = options.body;
        }
      }
      json() {
        return Promise.resolve(this._jsonData);
      }
    },
    NextResponse: {
      json: (
        data: unknown,
        init?: { status?: number; headers?: HeadersInit }
      ) => {
        return {
          json: () => Promise.resolve(data),
          status: init?.status || 200,
          headers: init?.headers || new Headers(),
        };
      },
    },
  };
});

jest.mock('@/lib/prisma', () => {
  return {
    prisma: {
      vacancy: {
        findUnique: jest.fn(),
      },
      application: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      document: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
    },
  };
});

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Import after mocks are set up
import { prisma } from '@/lib/prisma';

describe('POST /api/applications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a mock request object
  const createMockRequest = (body: unknown) => {
    // Import the mocked Request class from jest.mock
    const { Request } = jest.requireMock('next/server');
    return new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as Request;
  };

  const mockUser = {
    id: 'user-123',
    email: 'applicant@example.com',
    name: 'Test Applicant',
    role: 'applicant',
  };

  const mockVacancy = {
    id: 'vacancy-123',
    status: 'published',
  };

  const mockApplication = {
    id: 'application-123',
    applicantId: 'user-123',
    vacancyId: 'vacancy-123',
    status: 'submitted',
  };

  const mockExistingDocuments = [
    {
      id: 'doc-1',
      type: 'pds',
      fileUrl: '/uploads/pds-user-123.pdf',
      applicationId: 'application-456', // Different application
    },
    {
      id: 'doc-2',
      type: 'transcript_of_records',
      fileUrl: '/uploads/transcript-user-123.pdf',
      applicationId: 'application-789', // Different application
    },
  ];

  it('should return 401 if user is not authenticated', async () => {
    // Mock no user (not authenticated)
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should return 403 if user is not an applicant', async () => {
    // Mock user as HR (not applicant)
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'hr',
    });

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'Forbidden: only applicants can apply',
    });
  });

  it('should return 400 if vacancyId is missing', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const request = createMockRequest({}); // Missing vacancyId

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Vacancy ID is required' });
  });

  it('should return 404 if vacancy does not exist', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    // Mock vacancy not found
    (prisma.vacancy.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Vacancy not found' });
  });

  it('should return 400 if vacancy is not published', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    // Mock vacancy exists but not published
    (prisma.vacancy.findUnique as jest.Mock).mockResolvedValue({
      ...mockVacancy,
      status: 'draft', // Not published
    });

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Cannot apply to vacancy that is not published',
    });
  });

  it('should create application successfully when no existing documents', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    // Mock vacancy exists and is published
    (prisma.vacancy.findUnique as jest.Mock).mockResolvedValue(mockVacancy);
    // Mock application creation
    (prisma.application.create as jest.Mock).mockResolvedValue(mockApplication);
    // Mock no existing documents
    (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(mockApplication);

    // Verify application was created with correct data
    expect(prisma.application.create).toHaveBeenCalledWith({
      data: {
        applicantId: 'user-123',
        vacancyId: 'vacancy-123',
        status: 'submitted',
      },
      include: {
        vacancy: {
          select: {
            id: true,
            positionTitle: true,
            college: { select: { name: true } },
          },
        },
      },
    });

    // Verify no documents were copied (since none existed)
    expect(prisma.document.findMany).toHaveBeenCalledWith({
      where: {
        application: {
          applicantId: 'user-123',
          id: {
            not: 'application-123'
          }
        }
      },
      select: {
        type: true,
        fileUrl: true,
      }
    });
    expect(prisma.document.createMany).not.toHaveBeenCalled();
  });

  it('should create application and copy existing documents when documents exist', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    // Mock vacancy exists and is published
    (prisma.vacancy.findUnique as jest.Mock).mockResolvedValue(mockVacancy);
    // Mock application creation
    (prisma.application.create as jest.Mock).mockResolvedValue(mockApplication);
    // Mock existing documents found
    (prisma.document.findMany as jest.Mock).mockResolvedValue(mockExistingDocuments);
    // Mock document creation
    (prisma.document.createMany as jest.Mock).mockResolvedValue({ count: 2 });

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(mockApplication);

    // Verify application was created with correct data
    expect(prisma.application.create).toHaveBeenCalledWith({
      data: {
        applicantId: 'user-123',
        vacancyId: 'vacancy-123',
        status: 'submitted',
      },
      include: {
        vacancy: {
          select: {
            id: true,
            positionTitle: true,
            college: { select: { name: true } },
          },
        },
      },
    });

    // Verify existing documents were fetched (excluding the new application)
    expect(prisma.document.findMany).toHaveBeenCalledWith({
      where: {
        application: {
          applicantId: 'user-123',
          id: {
            not: 'application-123'
          }
        }
      },
      select: {
        type: true,
        fileUrl: true,
      }
    });

    // Verify documents were copied to the new application
    expect(prisma.document.createMany).toHaveBeenCalledWith({
      data: [
        {
          type: 'pds',
          fileUrl: '/uploads/pds-user-123.pdf',
          applicationId: 'application-123',
        },
        {
          type: 'transcript_of_records',
          fileUrl: '/uploads/transcript-user-123.pdf',
          applicationId: 'application-123',
        },
      ]
    });
  });

  it('should handle database errors during application creation', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    // Mock vacancy exists and is published
    (prisma.vacancy.findUnique as jest.Mock).mockResolvedValue(mockVacancy);
    // Mock database error during application creation
    (prisma.application.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });

  it('should handle database errors during document copying', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    // Mock vacancy exists and is published
    (prisma.vacancy.findUnique as jest.Mock).mockResolvedValue(mockVacancy);
    // Mock application creation succeeds
    (prisma.application.create as jest.Mock).mockResolvedValue(mockApplication);
    // Mock existing documents found
    (prisma.document.findMany as jest.Mock).mockResolvedValue(mockExistingDocuments);
    // Mock database error during document copying
    (prisma.document.createMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });

  it('should prevent duplicate applications', async () => {
    // Mock authenticated applicant
    (require('@/lib/auth').getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    // Mock vacancy exists and is published
    (prisma.vacancy.findUnique as jest.Mock).mockResolvedValue(mockVacancy);
    // Mock unique constraint error (P2002) for duplicate application
    (prisma.application.create as jest.Mock).mockRejectedValue({
      code: 'P2002',
      clientVersion: '2.0.0',
      meta: {
        target: ['applicantId', 'vacancyId']
      }
    });

    const request = createMockRequest({ vacancyId: 'vacancy-123' });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/applications/route');
    const response = await POST(request);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'You have already applied to this vacancy',
    });
  });
});