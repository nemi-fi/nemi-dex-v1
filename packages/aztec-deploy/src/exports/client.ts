export async function readDeploymentJsonFiles<
  T extends Record<number, unknown>,
  U,
>(dynamicContent: T, staticContent: U): Promise<U> {
  if (process.env.NODE_ENV !== "production") {
    // override static content with dynamic content in non-production environments
    return {
      ...staticContent,
      ...dynamicContent, // dynamic content overrides static content
    };
  }
  return staticContent;
}
