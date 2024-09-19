import type { App } from "astro/app";
import type { Context, Next } from "hono";
import { AsyncLocalStorage } from "node:async_hooks";


/**
 * 	Create a MiddlewareHandler that can be used with hono to render the Pages
 * @param app Astro App instance
 * @returns MiddlewareHandler that can be used with hono to render the Pages
 */
export function createMiddleware(app: App) {
	// Create a new AsyncLocalStorage instance
	const als = new AsyncLocalStorage();

	// Create a new logger instance
	const logger = app.getAdapterLogger();

	// Handle unhandled rejections
	process.on("unhandledRejection", (reason) => {
		const requestUrl = als.getStore();
		logger.error(`Unhandled rejection while rendering ${requestUrl}`);
		console.error(reason);
	});

	// The middleware function
	return async (ctx: Context, next: Next, locals: Object) => {

		// Get the request object
		const request = ctx.req.raw;

		// Get the route data from the app instance
		const routeData = app.match(request);

		if (routeData) {
			// Run the app.render method inside the AsyncLocalStorage context
			const pageRes = await als.run(request.url, () => app.render(request, {
				locals,
				addCookieHeader: true,
				routeData,
			}));
			// Finish the response
			return pageRes;
		} else if (next) {
			// If the route doesn't match with any route on the app instance then we render call next middleware
			await next();
		} else {
			// If no route matches and there is no next middleware then render the 404 page
			const notfoundpage = await app.render(request);
			return notfoundpage;
		}
	};
}