import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let content = '';

    if (file.type === 'application/pdf') {
      const data = await pdf(buffer);
      content = data.text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else if (file.type === 'text/plain') {
      content = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
    }

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error parsing document:', error);
    return NextResponse.json({ error: 'Failed to parse document.' }, { status: 500 });
  }
}
