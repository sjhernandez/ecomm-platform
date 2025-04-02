import { type RouteConfig } from "@react-router/dev/routes";

// Import flatRoutes function
import { flatRoutes } from "@react-router/fs-routes";

// Export the result of flatRoutes to enable the convention
export default flatRoutes() satisfies RouteConfig;
