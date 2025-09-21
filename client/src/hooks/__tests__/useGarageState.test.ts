// Simple hook test without complex mocking
import { useGarageState } from "../useGarageState";

describe("useGarageState", () => {
  it("should be defined", () => {
    expect(useGarageState).toBeDefined();
    expect(typeof useGarageState).toBe("function");
  });
});
