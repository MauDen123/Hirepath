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
      user: {
        findUnique: jest.fn(),
      },
    },
  };
});

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn(),
  })),
}));

// Import after mocks are set up
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create a mock request object
  const createMockRequest = (body: unknown) => {
    // Import the mocked Request class from jest.mock
    const { Request } = jest.requireMock('next/server');
    return new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as Request;
  };

  it('should return 400 if email or password is missing', async () => {
    const request = createMockRequest({ email: '', password: 'password123' }); // Missing email

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/auth/login/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Email and password are required',
    });
  });

  it('should return 401 if user does not exist', async () => {
    // Mock no existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/auth/login/route');
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid credentials' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'nonexistent@example.com' },
    });
  });

  it('should return 401 if password is invalid', async () => {
    // Mock existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user-id',
      email: 'test@example.com',
      passwordHash: 'hashed-password-123',
      name: 'Test User',
      role: 'hr',
    });

    // Mock bcrypt compare to return false (invalid password)
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/auth/login/route');
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid credentials' });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'wrongpassword',
      'hashed-password-123'
    );
  });

  it('should return success with user data if credentials are valid', async () => {
    // Mock existing user
    const mockUser = {
      id: 'existing-user-id',
      email: 'test@example.com',
      passwordHash: 'hashed-password-123',
      name: 'Test User',
      role: 'hr',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    // Mock bcrypt compare to return true (valid password)
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Mock cookies - we already mocked next/headers above
    const cookiesMock = { set: jest.fn() };
    (cookies as jest.Mock).mockImplementation(() => cookiesMock);

    const request = createMockRequest({
      email: 'test@example.com',
      password: 'correctpassword',
    });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/auth/login/route');
    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.user).toEqual({
      id: 'existing-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'hr',
      createdAt: mockUser.createdAt,
      updatedAt: mockUser.updatedAt,
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'correctpassword',
      'hashed-password-123'
    );
    expect(cookiesMock.set).toHaveBeenCalled();
  });
});
