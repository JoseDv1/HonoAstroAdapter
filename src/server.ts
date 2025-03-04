import { App } from "astro/app";
import { createMiddleware } from "./createMiddleware";
import type { SSRManifest } from "astro";
import { setGetEnv } from "astro/env/setup";

setGetEnv((key: string) => process.env[key]);

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);
	const handler = createMiddleware(app);
	return { handler };
}

