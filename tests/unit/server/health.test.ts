import { describe, expect, test } from "bun:test";
import { getHealthPayload } from "../../../server/utils/health";

describe("health endpoint payload", () => {
  test("returns ok true", () => {
    expect(getHealthPayload()).toEqual({ ok: true });
  });
});
