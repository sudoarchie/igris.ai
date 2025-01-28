import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { imageUrl, query, relevant } = await req.json();
  
  // Store feedback in database
  await prisma.imageFeedback.create({
    data: {
      imageUrl,
      query,
      relevant,
      timestamp: new Date()
    }
  });
  
  return NextResponse.json({ success: true });
}