import { describe, expect, test } from "bun:test";
import {
  buildDecisionsPagination,
  parseDecisionsQuery,
} from "../../../server/utils/decisions-query";

describe("decisions query", () => {
  test("parseDecisionsQuery defaults to page 1 and limit 100", () => {
    expect(parseDecisionsQuery({})).toEqual({ page: 1, limit: 100 });
  });

  test("parseDecisionsQuery caps limit at 100", () => {
    expect(parseDecisionsQuery({ page: "2", limit: "500" })).toEqual({
      page: 2,
      limit: 100,
    });
  });

  test("buildDecisionsPagination computes total pages", () => {
    expect(buildDecisionsPagination(2, 100, 250)).toEqual({
      page: 2,
      limit: 100,
      total: 250,
      total_pages: 3,
    });
  });
});
