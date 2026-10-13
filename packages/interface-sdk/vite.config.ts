import ms from "ms";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    hookTimeout: ms("10 min"), // the e2e beforeAll deploys everything + funds an account, which is slow on CI
    testTimeout: ms("3 min"),
  },
});
