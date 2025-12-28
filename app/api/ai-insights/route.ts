// app/api/ai-insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    const result = await aiService.callAI(prompt, {
      temperature: 0.7,
      maxTokens: 300,
      systemInstruction: 'You are an API testing expert. Analyze API responses and provide concise, actionable insights. Be direct and helpful.'
    });

    if (result.success) {
      return NextResponse.json({ success: true, content: result.data?.content });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}