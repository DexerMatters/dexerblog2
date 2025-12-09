import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cookie': 'MAID=ey/sK4P9jZXmUw6lSxnCrg==; CookieConsent={stamp:%27qXsfj3zpfcMRzk/4a8PHDYixKNWAre860osEVPJNAuBaR+cSGOierA==%27%2Cnecessary:true%2Cpreferences:true%2Cstatistics:true%2Cmarketing:true%2Cmethod:%27explicit%27%2Cver:1%2Cutc:1765191788220%2Cregion:%27us-06%27}; _ga=GA1.2.1989281932.1765191869; _hjSessionUser_1290436=eyJpZCI6Ijc2NWI5ZTcxLThhOTAtNTkxNC1iZmM5LWNhNzBiMTg4MTY5MSIsImNyZWF0ZWQiOjE3NjUxOTE3ODEyODQsImV4aXN0aW5nIjp0cnVlfQ==; _gid=GA1.2.1005820227.1765286304; MACHINE_LAST_SEEN=2025-12-09T06%3A20%3A34.936-08%3A00; __cf_bm=pCsZtKRR6iuPapCZsPg2ouUrGUls08.qQK1qmfEWqqI-1765290035-1.0.1.1-N7W1RCU0lhOu0tFhbOXRMpuXImJAKA0733hP33o59c0MEEfflvLHZ748nB6xxfjSnCcFd0OHxJoYnaMdDdf7UUsbxSoEnBqw3JX8v4EC7IY; _hjSession_1290436=eyJpZCI6Ijk2OWM5ODJlLTY5MWEtNGZhYi04MmY1LWRkOGZkYjdhOTdjMCIsImMiOjE3NjUyOTAwMzg3ODcsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MX0=; _cfuvid=kVZ5hqK8aUdGJqA.hCOr7ieurQM6pGdSPcn60xFKRkw-1765290325840-0.0.1.1-604800000; _ga_JPDX9GZR59=GS2.2.s1765290039$o2$g1$t1765290327$j60$l0$h0; JSESSIONID=81E5D1826C15D1BC8FD0F2431097244B'
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch PDF: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Content-Disposition': `inline; filename="document.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
