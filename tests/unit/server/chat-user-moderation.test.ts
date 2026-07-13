import { describe, expect, test } from "bun:test";
import { parseUsersPaginationQuery } from "../../../server/utils/chat-user-moderation";

describe("parseUsersPaginationQuery", () => {
  test("defaults to page 1 and limit 25", () => {
    expect(parseUsersPaginationQuery({})).toEqual({ page: 1, limit: 25 });
  });

  test("clamps invalid and oversized values", () => {
    expect(parseUsersPaginationQuery({ page: "0", limit: "999" })).toEqual({
      page: 1,
      limit: 50,
    });
  });

  test("parses valid page and limit", () => {
    expect(parseUsersPaginationQuery({ page: "3", limit: "10" })).toEqual({
      page: 3,
      limit: 10,
    });
  });
});
