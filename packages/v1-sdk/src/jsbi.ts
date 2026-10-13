import jsbi from "jsbi";

// JSBI has bad types :(
// @ts-ignore
export const JSBI = jsbi as unknown as typeof jsbi.default;
// @ts-ignore
export type JSBI = jsbi.default;
