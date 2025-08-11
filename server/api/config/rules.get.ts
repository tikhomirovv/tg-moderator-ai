import { loadRulesConfig } from "../../core/config";

export default defineEventHandler(async (event) => {
  try {
    const rulesConfig = loadRulesConfig();

    return {
      success: true,
      data: {
        rules: rulesConfig.rules,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading rules configuration",
    });
  }
});
