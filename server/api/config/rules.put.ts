import { writeFileSync } from "fs";
import { stringify } from "yaml";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { rules } = body;

    // TODO: Validate rules structure
    const configContent = stringify({ rules });
    writeFileSync("./config/rules.yaml", configContent, "utf8");

    return {
      success: true,
      message: "Rules updated successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error updating rules configuration",
    });
  }
});
