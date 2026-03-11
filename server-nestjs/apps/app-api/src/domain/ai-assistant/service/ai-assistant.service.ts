import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are an expert project management AI assistant integrated into a project management application. Your role is to help teams work more efficiently by providing actionable, practical advice for task management, sprint planning, and project organization.

When generating responses, always:
- Be specific and actionable
- Consider real-world software development workflows
- Provide structured output in valid JSON format
- Keep suggestions practical and relevant

Always respond with valid JSON only. Do not include any text outside the JSON object.`;

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly client: Groq;
  private readonly model = 'llama-3.3-70b-versatile';
  private readonly maxTokens = 1024;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY is not set. AI Assistant features will not work.');
    }
    this.client = new Groq({ apiKey: apiKey || '' });
  }

  async generateSubtasks(
    taskTitle: string,
    taskDescription: string,
  ): Promise<{ subtasks: { title: string; completed: boolean }[] }> {
    const prompt = `Given the following task, generate 3-7 relevant subtasks that break down the work into manageable pieces. Each subtask should be specific and actionable.

Task Title: ${taskTitle}
Task Description: ${taskDescription}

Respond with a JSON object in this exact format:
{
  "subtasks": [
    { "title": "Subtask description here", "completed": false }
  ]
}`;

    const response = await this.callGroq(prompt);
    return this.parseJsonResponse(response, { subtasks: [] });
  }

  async suggestPriority(
    taskTitle: string,
    taskDescription: string,
    projectContext?: string,
  ): Promise<{ priority: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string }> {
    const contextSection = projectContext
      ? `\nProject Context: ${projectContext}`
      : '';

    const prompt = `Analyze the following task and suggest an appropriate priority level (LOW, MEDIUM, or HIGH) with a brief explanation of your reasoning.

Task Title: ${taskTitle}
Task Description: ${taskDescription}${contextSection}

Consider these factors:
- Impact on users or the business
- Urgency and time sensitivity
- Dependencies that might block other work
- Complexity and risk

Respond with a JSON object in this exact format:
{
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "reason": "Brief explanation of why this priority was chosen"
}`;

    const response = await this.callGroq(prompt);
    return this.parseJsonResponse(response, { priority: 'MEDIUM', reason: 'Unable to determine priority.' });
  }

  async estimateTime(
    taskTitle: string,
    taskDescription: string,
    subtasks?: string[],
  ): Promise<{ estimated_hours: number; confidence: string; breakdown?: string }> {
    const subtasksSection = subtasks?.length
      ? `\nSubtasks:\n${subtasks.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`
      : '';

    const prompt = `Estimate the time required to complete the following task. Provide your estimate in hours, a confidence level, and optionally a breakdown.

Task Title: ${taskTitle}
Task Description: ${taskDescription}${subtasksSection}

Consider typical software development timelines including:
- Implementation time
- Testing and code review
- Potential for unexpected complexity

Respond with a JSON object in this exact format:
{
  "estimated_hours": 8,
  "confidence": "medium",
  "breakdown": "Optional breakdown of time allocation across subtasks or phases"
}

The confidence should be one of: "low", "medium", "high".`;

    const response = await this.callGroq(prompt);
    return this.parseJsonResponse(response, { estimated_hours: 0, confidence: 'low' });
  }

  async summarizeSprint(
    tasks: { title: string; status: string; assignee?: string }[],
  ): Promise<{
    summary: string;
    highlights: string[];
    blockers: string[];
    suggestions: string[];
  }> {
    const taskList = tasks
      .map(
        (t) =>
          `- "${t.title}" [Status: ${t.status}]${t.assignee ? ` (Assigned to: ${t.assignee})` : ''}`,
      )
      .join('\n');

    const prompt = `Analyze the following sprint tasks and provide a comprehensive summary.

Sprint Tasks:
${taskList}

Provide:
1. A brief overall summary of sprint progress
2. Key highlights and accomplishments
3. Potential blockers or concerns
4. Actionable suggestions for improvement

Respond with a JSON object in this exact format:
{
  "summary": "Overall sprint progress summary",
  "highlights": ["Highlight 1", "Highlight 2"],
  "blockers": ["Blocker 1", "Blocker 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

    const response = await this.callGroq(prompt);
    return this.parseJsonResponse(response, {
      summary: 'Unable to generate summary.',
      highlights: [],
      blockers: [],
      suggestions: [],
    });
  }

  async improveDescription(
    taskTitle: string,
    currentDescription?: string,
  ): Promise<{ improved_description: string }> {
    const descriptionSection = currentDescription
      ? `\nCurrent Description: ${currentDescription}`
      : '\nNo description provided yet.';

    const prompt = `Improve or create a task description for the following task. The description should be clear, actionable, and include acceptance criteria where appropriate.

Task Title: ${taskTitle}${descriptionSection}

Write an improved description that includes:
- A clear summary of what needs to be done
- Specific acceptance criteria or definition of done
- Any relevant technical considerations
- Edge cases to consider

Respond with a JSON object in this exact format:
{
  "improved_description": "The full improved description text here"
}`;

    const response = await this.callGroq(prompt);
    return this.parseJsonResponse(response, { improved_description: '' });
  }

  private async callGroq(userPrompt: string): Promise<string> {
    try {
      const chatCompletion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = chatCompletion.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in Groq response');
      }

      return content;
    } catch (error) {
      this.logger.error(`Groq API call failed: ${error.message}`, error.stack);

      if (error?.status === 401) {
        throw new HttpException(
          'AI service authentication failed. Please check the GROQ_API_KEY configuration.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error?.status === 429) {
        throw new HttpException(
          'AI service rate limit reached. Please try again in a moment.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'AI service is temporarily unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private parseJsonResponse<T>(response: string, fallback: T): T {
    try {
      // Try to extract JSON from the response, handling potential markdown code blocks
      let jsonStr = response.trim();

      // Remove markdown code block wrappers if present
      const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1].trim();
      }

      return JSON.parse(jsonStr) as T;
    } catch (error) {
      this.logger.warn(`Failed to parse Groq JSON response: ${error.message}`);
      this.logger.debug(`Raw response: ${response}`);
      return fallback;
    }
  }
}
