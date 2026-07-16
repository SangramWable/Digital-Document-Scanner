import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { imageData, mimeType, docType } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const prompt = `You are an expert OCR system specialized in Indian government documents. Analyze this ${docType || 'government document'} image and extract all relevant information.

Extract the following fields if present:
- Full Name (fullName)
- Date of Birth in DD/MM/YYYY format (dob)
- Gender (gender)
- Father's Name (fatherName)
- Mother's Name (motherName)
- Address (address)
- Aadhaar Number (aadhaarNumber)
- PAN Number (panNumber)
- Passport Number (passportNumber)
- Mobile Number (mobileNumber)
- Email (email)
- Document Number (documentNumber)
- Issue Date in DD/MM/YYYY format (issueDate)
- Expiry Date in DD/MM/YYYY format (expiryDate)

IMPORTANT: Return ONLY a valid JSON object with the extracted fields. Use null for fields that cannot be found. Do not include any explanation or markdown formatting.

Example format:
{
  "fullName": "RAJESH KUMAR SHARMA",
  "dob": "15/05/1990",
  "gender": "Male",
  "fatherName": "SURESH SHARMA",
  "motherName": null,
  "address": "123, MG Road, Mumbai, Maharashtra - 400001",
  "aadhaarNumber": "1234-5678-9012",
  "panNumber": null,
  "passportNumber": null,
  "mobileNumber": "9876543210",
  "email": null,
  "documentNumber": null,
  "issueDate": null,
  "expiryDate": null
}`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageData}`,
              },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const content = response.choices[0]?.message?.content || '';

    let extractedData: Record<string, string | null> = {};
    try {
      extractedData = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[1]);
      } else {
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          extractedData = JSON.parse(objectMatch[0]);
        }
      }
    }

    const cleanedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(extractedData)) {
      cleanedData[key] = value || '';
    }

    return NextResponse.json({ success: true, extractedData: cleanedData });
  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Failed to process document', details: (error as Error).message },
      { status: 500 }
    );
  }
}
