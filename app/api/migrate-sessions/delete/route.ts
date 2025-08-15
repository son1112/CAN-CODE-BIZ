import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { MongoClient } from 'mongodb';

// DELETE /api/migrate-sessions/delete - Delete CLI sessions
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionName, sessionNames } = body;

    if (!sessionName && !sessionNames?.length) {
      return NextResponse.json(
        { error: 'No session specified for deletion' },
        { status: 400 }
      );
    }

    // Connect to MongoDB directly to access CLI database
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not configured');
    }

    const client = new MongoClient(MONGODB_URI);
    
    try {
      await client.connect();
      
      const cliDb = client.db('rubber-ducky');
      const cliSessionsCollection = cliDb.collection('sessions');
      
      let deleteResult;
      let deletedCount = 0;
      
      if (sessionName) {
        // Delete single session
        deleteResult = await cliSessionsCollection.deleteOne({ name: sessionName });
        deletedCount = deleteResult.deletedCount;
      } else if (sessionNames?.length) {
        // Delete multiple sessions
        deleteResult = await cliSessionsCollection.deleteMany({ 
          name: { $in: sessionNames } 
        });
        deletedCount = deleteResult.deletedCount;
      }

      if (deletedCount === 0) {
        return NextResponse.json(
          { error: 'No sessions found to delete' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} session${deletedCount !== 1 ? 's' : ''}`
      });

    } finally {
      await client.close();
    }

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete session(s)', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}