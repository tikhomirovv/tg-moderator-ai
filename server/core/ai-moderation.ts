import OpenAI from "openai";
import { AIModerationRequest, AIModerationResponse } from "../types/moderation";
import { Rule } from "../types/config";
import { logger } from "./logger";

// Инициализация OpenAI клиента
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Функция для анализа сообщения с помощью AI
export async function analyzeMessage(
  request: AIModerationRequest,
  rules: Rule[]
): Promise<AIModerationResponse> {
  try {
    // Получаем конфигурацию
    const config = useRuntimeConfig();

    // Формируем промпт для AI
    const prompt = buildAnalysisPrompt(request, rules);

    logger.debug(
      {
        messageLength: request.message.length,
        rulesCount: rules.length,
        model: config.openaiModel,
      },
      "Отправка запроса к OpenAI"
    );

    // Логируем итоговый промпт для отладки
    logger.info(
      {
        prompt: prompt,
        rulesCount: rules.length,
        rules: rules.map((r) => ({ name: r.name, severity: r.severity })),
      },
      "Итоговый промпт для AI"
    );

    // Отправляем запрос к OpenAI
    const completion = await openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: "system",
          content:
            "You are a chat moderator. Your task is to analyze messages for rule violations. Pay attention to user context, warning history, and conversation flow.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Низкая температура для более консистентных результатов
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("Пустой ответ от OpenAI");
    }

    // Парсим ответ AI
    const result = parseAIResponse(response);

    logger.info(
      {
        violation_detected: result.violation_detected,
        rule_violated: result.rule_violated,
        confidence: result.confidence,
        model: config.openaiModel,
        ai_response: response,
      },
      "AI анализ завершен"
    );

    return result;
  } catch (error) {
    logger.error({ error: error as Error }, "Ошибка AI анализа");
    throw new Error("Не удалось проанализировать сообщение");
  }
}

// Формирование промпта для AI
function buildAnalysisPrompt(
  request: AIModerationRequest,
  rules: Rule[]
): string {
  const rulesText = rules
    .map(
      (rule) =>
        `- ${rule.name}: ${rule.description}\n  Criteria: ${rule.ai_prompt}`
    )
    .join("\n");

  return `
You are a chat moderator. Your task is to analyze messages for rule violations.

IMPORTANT: Analyze the message ONLY based on the provided rules. DO NOT invent additional rules or use general moderation principles. If there are no rules or the message does not violate any of the provided rules - consider that there are no violations.

PAY SPECIAL ATTENTION TO:
- User's previous warnings count: ${request.context.user_warnings}
- Recent chat history context: ${request.context.chat_history
    .slice(-3)
    .join(", ")}
- User's behavior pattern and escalation of violations
- Context of the conversation and whether this is a repeated offense

CONTEXT ANALYSIS METHODOLOGY:
When analyzing messages, consider:
1. Is this user already showing problematic behavior in recent messages?
2. Does this message continue a pattern of rule-violating communication?
3. Given the user's warning history (${
    request.context.user_warnings
  } warnings), is this part of escalating problematic behavior?
4. Does the message meaning change when viewed in context of recent conversation?

RESPOND IN THE FOLLOWING FORMAT:
{
  "violation_detected": true/false,
  "rule_violated": "rule_name" (if violation exists),
  "confidence": 0.0-1.0,
  "reasoning": "explanation of decision including context consideration"
}

JSON response only, no additional text.

CHAT RULES (${rules.length} rules):
${rules.length > 0 ? rulesText : "No rules configured"}

MESSAGE TO ANALYZE:
"${request.message}"

REMEMBER: Analyze ONLY based on the provided rules. Consider the user's warning history and chat context when making decisions. Look for patterns that may not be obvious when viewing messages in isolation. If there are no rules or the message doesn't violate rules - violation_detected = false.
`;
}

// Парсинг ответа AI
function parseAIResponse(response: string): AIModerationResponse {
  try {
    // Извлекаем JSON из ответа
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON не найден в ответе");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      violation_detected: Boolean(parsed.violation_detected),
      rule_violated: parsed.rule_violated || undefined,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reasoning: parsed.reasoning || "Нет объяснения",
    };
  } catch (error) {
    logger.error(
      { error: error as Error, response },
      "Ошибка парсинга ответа AI"
    );

    // Возвращаем безопасный ответ
    return {
      violation_detected: false,
      confidence: 0,
      reasoning: "Ошибка парсинга ответа AI",
    };
  }
}
