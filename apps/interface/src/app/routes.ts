import type { RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

// File-based routes from ./routes, see https://reactrouter.com/how-to/file-route-conventions
export default flatRoutes() satisfies RouteConfig;
