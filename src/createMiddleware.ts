import type { App } from "astro/app";
import { AsyncLocalStorage } from "node:async_hooks";
import type { MiddlewareHandler } from "hono";
import { createEmitAndSemanticDiagnosticsBuilderProgram } from "typescript";


/**
 * 	Create a MiddlewareHandler that can be used with hono to render the Pages
 * @param app Astro App instance
 * @returns MiddlewareHandler that can be used with hono to render the Pages
 */
export function createMiddleware(app: App): MiddlewareHandler {
	const handler: MiddlewareHandler = createAppHandler(app);
	return async (ctx, next) => {
		try {
			await handler(ctx, next);
		} catch (error) {
			console.error(error);
			ctx.res = new Response("Internal Server Error", { status: 500 });
			await next();
		}
	}
}

function createAppHandler(app: App): MiddlewareHandler {
	const als = new AsyncLocalStorage();
	const logger = app.getAdapterLogger();
	process.on("unhandledRejection", (reason) => {
		const requestUrl = als.getStore();
		logger.error(`Unhandled rejection while rendering ${requestUrl}`);
		console.error(reason);
	});

	return async (ctx, next) => {
		const request: Request = ctx.req.raw;
		const routeData = app.match(request)
		// If the request matches a route in the astro app then render the page
		if (routeData) {
			const response = await als.run(
				request.url,
				() => app.render(request)
			);
			ctx.res = response;
		} else if (next) {
			// If the request does not match a route in the astro app render the 404 page
			const response = await app.render(request)
			ctx.res = response;
			await next();
		} else {
			return new Response("Not Found", { status: 404 });
		}
	}
}