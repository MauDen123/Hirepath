import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sort parameter from query string
    const { searchParams } = new URL(request.url);
    const sortParam = searchParams.get('sort') || 'date_desc';

    // Determine orderBy clause based on sortParam
    let orderBy: any = { uploadedAt: 'desc' }; // default
    if (sortParam === 'date_asc') {
      orderBy = { uploadedAt: 'asc' };
    } else if (sortParam === 'type_asc') {
      orderBy = { type: 'asc' };
    } else if (sortParam === 'type_desc') {
      orderBy = { type: 'desc' };
    }
    // date_desc is already default

    // Fetch user's documents with sorting
    const documents = await prisma.document.findMany({
      where: {
        application: {
          applicantId: user.id,
        },
      },
      include: {
        application: {
          include: {
            vacancy: true,
          },
        },
      },
      orderBy: orderBy,
    });

    // Fetch user's applications
    const applications = await prisma.application.findMany({
      where: {
        applicantId: user.id,
      },
      include: {
        vacancy: true,
      },
    });

    // Return user data (without sensitive info)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return NextResponse.json({
      user: userData,
      applications,
      documents,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const applicationId = formData.get('applicationId') as string;
    const type = formData.get('type') as string; // DocumentType enum value

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // Validate file type
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'File type not allowed. Please upload PDF, JPG, PNG, DOC, or DOCX files.' },
        { status: 400 }
      );
    }

    // Verify the application belongs to the current user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        applicantId: user.id,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found or access denied' }, { status: 403 });
    }

    // Validate document type (optional, but we can check against enum)
    // We'll trust the client for now; could validate against prisma enum values.

    // Prepare file storage
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', applicationId);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate a unique filename to avoid collisions
    const timestamp = Date.now();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${timestamp}_${sanitizedOriginalName}`;
    const filePath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Construct the URL path (relative to public)
    const fileUrl = `/uploads/${applicationId}/${filename}`;

    // Create document record
    const document = await prisma.document.create({
      data: {
        applicationId,
        type,
        fileUrl,
        verificationStatus: 'pending', // default
        parsedData: null,
        parsingConfidence: null,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.type,
        fileUrl: document.fileUrl,
        uploadedAt: document.uploadedAt,
        verificationStatus: document.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
