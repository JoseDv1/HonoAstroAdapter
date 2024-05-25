import type { App } from "astro/app";
import { AsyncLocalStorage } from "node:async_hooks";
import type { MiddlewareHandler } from "hono";

export function createMiddleware(app: App): MiddlewareHandler {
	const handler: MiddlewareHandler = createAppHandler(app);
	return async (ctx, next) => {
		await handler(ctx, next);
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
		if (routeData) {
			// Renderizar la pagina usando Astro
			const response = await als.run(
				request.url,
				() => app.render(request)
			);

			ctx.res = response;
			await next();
		} else if (next) {
			await next();
		} else {
			const response = await app.render(request);
			ctx.res = response;
			return ctx.res;
		}
	}
}