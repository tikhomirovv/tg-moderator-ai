import { describe, expect, test } from "bun:test";
import { telegramGetUserProfilePhotos } from "../../../server/utils/telegram-bot-api";

describe("telegramGetUserProfilePhotos", () => {
  test("returns profile photos payload", async () => {
    const fetchFn = async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.user_id).toBe(99);
      expect(body.limit).toBe(1);

      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            total_count: 1,
            photos: [
              [
                {
                  file_id: "photo-1",
                  file_unique_id: "uniq",
                  width: 640,
                  height: 640,
                },
              ],
            ],
          },
        })
      );
    };

    const profile = await telegramGetUserProfilePhotos(
      "token",
      99,
      { limit: 1 },
      fetchFn as typeof fetch
    );

    expect(profile.total_count).toBe(1);
    expect(profile.photos[0]?.[0]?.file_id).toBe("photo-1");
  });
});
