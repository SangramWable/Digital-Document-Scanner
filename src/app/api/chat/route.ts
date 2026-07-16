import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { message, history, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const systemPrompt = `You are DocSync India AI Assistant, a helpful chatbot specialized in Indian government documents, verification, and correction processes. You help Indian citizens with:

1. Document verification and correction queries
2. Government portal information (UIDAI, NSDL, Passport Seva, DigiLocker, etc.)
3. How to update/correct documents (Aadhaar, PAN, Passport, etc.)
4. Scholarship and government scheme information
5. Finding nearest service centers (CSC, Tehsil, Passport Seva Kendra)
6. Document requirements for various services

Important guidelines:
- Be helpful, accurate, and specific to Indian government processes
- Always mention official government portals when relevant
- If you don't know something, say so honestly
- Provide step-by-step guidance when explaining correction processes
- Mention fees and processing times when known
- Support ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'} responses
- Keep responses concise but informative
- Always prioritize official government sources
- Remind users about privacy: "Your Documents. Your Device. Your Privacy."

Key government portals:
- UIDAI (Aadhaar): https://uidai.gov.in
- NSDL PAN: https://www.tin-nsdl.com
- Passport Seva: https://www.passportindia.gov.in
- DigiLocker: https://www.digilocker.gov.in
- Income Certificate: State-specific portals
- Scholarship Portal: https://scholarships.gov.in`;

    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, I could not process your request. Please try again.';

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: (error as Error).message },
      { status: 500 }
    );
  }
}
