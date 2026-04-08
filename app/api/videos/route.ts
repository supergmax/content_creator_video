import { NextResponse } from 'next/server'
import { listVideos } from '@/lib/videos'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(listVideos())
}
