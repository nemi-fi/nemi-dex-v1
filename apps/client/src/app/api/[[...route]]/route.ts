import { createLib } from "@/lib/sdk";
import { swaggerUI } from "@hono/swagger-ui";
import { interfaceSdk } from "@nemi-fi/interface-sdk";
import { sutils } from "@nemi-fi/utils";
import { Hono } from "hono";
import { describeRoute, openAPIRouteHandler, validator } from "hono-openapi";
import { handle } from "hono/vercel";
import { assert } from "ts-essentials";
import { SwapApiInputSchema } from "../../../../../../packages/interface-sdk/src/dex/server/SwapApiService"; // idc that this is ugly

const backendLibs = new sutils.DefaultMap(
  (chainId: sutils.SupportedAvmChains["id"]) => {
    const chain = Object.values(sutils.supportedAvmChains).find(
      (chain) => chain.id === chainId,
    );
    assert(chain, `Chain with ID ${chainId} is not supported`);
    return interfaceSdk.createBackend(createLib({ chain }));
  },
);

const v1 = new Hono().get(
  "/getQuote",
  describeRoute({
    description: "Get a quote for a swap",
  }),
  validator("query", SwapApiInputSchema),
  async (c) => {
    const input = c.req.valid("query");
    const quote = await backendLibs
      .get(input.chainId)
      .swapApi.getApiQuote(input);
    return c.json(quote);
  },
);

const app = new Hono()
  .basePath("/api") // because the file structure is app/api/...
  .route("/v1", v1)
  .get("/health", describeRoute({ description: "Health check" }), (c) =>
    c.text("OK"),
  );

// can't be chained because references to itself
app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: `Nemi API`,
        version: "4.0.0-devnet.2-patch.1",
        description: "Nemi API",
      },
    },
  }),
);
app.get("/ui", swaggerUI({ url: "/api/openapi" }));

export const GET = handle(app);
export const POST = handle(app);
