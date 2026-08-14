import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { documents } = await request.json();

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const docSummary = documents.map((doc: Record<string, unknown>) => ({
      type: doc.docType,
      name: doc.docName,
      extractedData: doc.extractedData,
      expiryDate: doc.expiryDate,
    }));

    const prompt = `You are an expert AI system that analyzes Indian government documents for inconsistencies and issues. Analyze the following documents and identify any problems.

Documents:
${JSON.stringify(docSummary, null, 2)}

Check for the following issues:
1. DOB mismatch - Date of birth differs across documents
2. Name mismatch - Name differs across documents (even minor spelling differences)
3. Address mismatch - Address differs across documents
4. Gender mismatch - Gender differs across documents
5. Father's Name mismatch - Father's name differs across documents
6. Mother's Name mismatch - Mother's name differs across documents
7. Expired documents - Any document past its expiry date
8. Missing critical documents - If someone has Aadhaar but no PAN, etc.
9. Invalid formats - Aadhaar should be 12 digits, PAN should be 10 chars, etc.
10. Possible OCR errors - Unlikely values that might be extraction errors

Return a JSON array of issues found. Each issue should have:
- severity: "low" | "medium" | "high" | "critical"
- category: string (e.g., "dob_mismatch", "name_mismatch", "address_mismatch", "expired", "missing", "invalid_format", "ocr_error")
- title: string (short descriptive title)
- description: string (detailed description of the issue)
- impact: array of strings (possible consequences)
- fixGuidance: object with { requiredDocs: string[], method: "online"|"offline"|"both", fees: string, processingTime: string, department: string, steps: string[], portalUrl: string, portalName: string }

IMPORTANT: Return ONLY a valid JSON array. No explanation or markdown.

Example:
[
  {
    "severity": "critical",
    "category": "dob_mismatch",
    "title": "Date of Birth Mismatch",
    "description": "DOB in Aadhaar (15/05/2007) does not match DOB in PAN (15/05/2008)",
    "impact": ["Scholarship rejection", "Bank KYC failure", "Passport delay", "Government scheme rejection"],
    "fixGuidance": {
      "requiredDocs": ["Aadhaar Card", "Birth Certificate", "School Certificate"],
      "method": "both",
      "fees": "₹0-50",
      "processingTime": "7-30 days",
      "department": "NSDL / UTIITSL",
      "steps": ["Visit NSDL portal", "Fill correction form", "Upload supporting documents", "Pay fee if applicable", "Track application status"],
      "portalUrl": "https://www.tin-nsdl.com",
      "portalName": "NSDL PAN Services"
    }
  }
]`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are an expert at analyzing Indian government documents for inconsistencies. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    });

    const content = completion.choices[0]?.message?.content || '[]';

    let issues = [];
    try {
      issues = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        issues = JSON.parse(jsonMatch[0]);
      }
    }

    // Add unique IDs to each issue
    const issuesWithIds = issues.map((issue: Record<string, unknown>) => ({
      ...issue,
      id: crypto.randomUUID(),
      status: 'open',
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, issues: issuesWithIds });
  } catch (error) {
    console.error('Analyze Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze documents', details: (error as Error).message },
      { status: 500 }
    );
  }
}
