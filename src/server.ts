import { App } from "astro/app";
import { createMiddleware } from "./createMiddleware";
import type { SSRManifest } from "astro";


export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);
	const handler = createMiddleware(app);
	return { handler };
}

