import { BotRepository } from "../../database/repositories/bot-repository";
import { CreateBotRequest } from "../../database/models/bot";

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as CreateBotRequest;
    const botRepo = new BotRepository();

    const bot = await botRepo.create(body);

    return {
      success: true,
      data: bot,
      message: "Bot created successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating bot",
    });
  }
});
