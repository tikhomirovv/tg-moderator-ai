import { describe, expect, test } from "bun:test";
import {
  fetchBotProfilePhotoFileId,
  resolveProfilePhotoFileId,
} from "../../../server/core/bot-avatar";

describe("bot-avatar", () => {
  test("resolveProfilePhotoFileId picks biggest size from latest photo set", () => {
    const fileId = resolveProfilePhotoFileId({
      total_count: 1,
      photos: [
        [
          { file_id: "small", file_unique_id: "a", width: 160, height: 160 },
          { file_id: "big", file_unique_id: "b", width: 640, height: 640 },
        ],
      ],
    });

    expect(fileId).toBe("big");
  });

  test("resolveProfilePhotoFileId returns null when bot has no photos", () => {
    expect(
      resolveProfilePhotoFileId({
        total_count: 0,
        photos: [],
      })
    ).toBeNull();
  });

  test("fetchBotProfilePhotoFileId uses getUserProfilePhotos", async () => {
    const fetchFn = async (url: string, init?: RequestInit) => {
      expect(url).toContain("getUserProfilePhotos");
      const body = JSON.parse(String(init?.body));
      expect(body.user_id).toBe(42);
      expect(body.limit).toBe(1);

      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            total_count: 1,
            photos: [
              [
                {
                  file_id: "avatar-big",
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

    const fileId = await fetchBotProfilePhotoFileId(
      "token",
      42,
      fetchFn as typeof fetch
    );
    expect(fileId).toBe("avatar-big");
  });
});
