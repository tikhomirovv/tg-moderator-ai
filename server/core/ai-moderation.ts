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
    // Формируем промпт для AI
    const prompt = buildAnalysisPrompt(request, rules);

    logger.debug(
      {
        messageLength: request.message.length,
        rulesCount: rules.length,
      },
      "Отправка запроса к OpenAI"
    );

    // Отправляем запрос к OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Ты - модератор чата. Твоя задача - анализировать сообщения на предмет нарушений правил.",
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
        `- ${rule.name}: ${rule.description}\n  Критерии: ${rule.ai_prompt}`
    )
    .join("\n");

  return `
Анализируй следующее сообщение на предмет нарушений правил чата.

ПРАВИЛА ЧАТА:
${rulesText}

КОНТЕКСТ:
- Пользователь ID: ${request.user_id}
- Чат ID: ${request.chat_id}
- Предыдущие предупреждения: ${request.context.user_warnings}
- История чата: ${request.context.chat_history.slice(-3).join(", ")}

СООБЩЕНИЕ ДЛЯ АНАЛИЗА:
"${request.message}"

ОТВЕТЬ В СЛЕДУЮЩЕМ ФОРМАТЕ:
{
  "violation_detected": true/false,
  "rule_violated": "название_правила" (если есть нарушение),
  "confidence": 0.0-1.0,
  "reasoning": "объяснение решения"
}

Только JSON ответ, без дополнительного текста.
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
