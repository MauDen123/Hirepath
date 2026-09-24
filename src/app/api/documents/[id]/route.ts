import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// GET a single document by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const documentId = params.id;

    // Fetch document and verify ownership via application
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
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
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update document (supports updating type and/or re-uploading file)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const documentId = params.id;

    // Find document and ensure it belongs to the user via application
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        application: {
          applicantId: user.id,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let updateData: any = {};
    let newFileUrl: string | null = null;

    if (isMultipart) {
      // Parse form data
      const formData = await request.formData();
      const type = formData.get('type') as string | null;
      const file = formData.get('file') as File | null;

      // Update type if provided
      if (type) {
        updateData.type = type;
      }

      // Handle file upload if provided
      if (file) {
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

        // Verify the application belongs to the current user (for folder path)
        const application = await prisma.application.findFirst({
          where: {
            id: document.applicationId,
            applicantId: user.id,
          },
        });

        if (!application) {
          return NextResponse.json({ error: 'Application not found or access denied' }, { status: 403 });
        }

        // Prepare file storage
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', application.id.toString());
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
        newFileUrl = `/uploads/${application.id}/${filename}`;

        // Delete old file if exists
        if (document.fileUrl) {
          const oldPathPart = document.fileUrl.startsWith('/')
            ? document.fileUrl.slice(1)
            : document.fileUrl;
          const oldFilePath = path.join(process.cwd(), 'public', oldPathPart);
          try {
            await fs.unlink(oldFilePath);
          } catch (fileError) {
            console.error('Failed to delete old file:', fileError);
            // Continue anyway, we'll still update the DB
          }
        }

        // Update fileUrl in the database
        updateData.fileUrl = newFileUrl;
      }
    } else {
      // Handle JSON update (for backward compatibility, though we are now using multipart)
      const body = await request.json();
      const { type } = body;

      if (type) {
        updateData.type = type;
      }
    }

    // If there's nothing to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      );
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    // In development, return the error message for debugging
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE document
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const documentId = params.id;

    // Find document and ensure it belongs to the user via application
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        application: {
          applicantId: user.id,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Delete file from filesystem if fileUrl exists
    if (document.fileUrl) {
      // fileUrl is like '/uploads/applicationId/filename'
      // Need to convert to local path
      const pathPart = document.fileUrl.startsWith('/')
        ? document.fileUrl.slice(1)
        : document.fileUrl;
      const filePath = path.join(process.cwd(), 'public', pathPart);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        // If file deletion fails, we still want to delete DB record but log error
        console.error('Failed to delete file:', fileError);
      }
    }

    // Delete document record
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    // In development, return the error message for debugging
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}