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
        create: jest.fn(),
      },
    },
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: () => ({
    set: jest.fn(),
  }),
}));

// Import after mocks are set up
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

describe('POST /api/auth/register (mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call prisma.user.findUnique to check existing user', async () => {
    // Arrange
    const mockRequestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const { Request } = jest.requireMock('next/server');
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRequestBody),
    });

    // Import the route handler after mocks
    const { POST } = await import('@/app/api/auth/register/route');
    // Act
    await POST(request);

    // Assert
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });

  it('should call prisma.user.create when creating new user', async () => {
    // Arrange
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    const mockRequestBody = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };
    const { Request } = jest.requireMock('next/server');
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRequestBody),
    });
    const { POST } = await import('@/app/api/auth/register/route');

    // Act
    await POST(request);

    // Assert
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'hr',
      },
    });
  });
});
