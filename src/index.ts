import type { AstroAdapter, AstroIntegration } from "astro";
import { passthroughImageService } from "astro/config";

export default function createIntegration(): AstroIntegration {
	return {
		name: "hono-astro-adapter",
		hooks: {
			"astro:config:setup": async ({ updateConfig }) => {
				updateConfig({
					image: {
						service: passthroughImageService(),
					},
					adapter: {
						name: "hono-astro-adapter",
					},
					vite: {
						ssr: {
							noExternal: ["hono-astro-adapter"],
						},
						build: {
							rollupOptions: {
								external: ["hono-astro-adapter"],
							},
						},
					}
				});
			},
			"astro:config:done": async ({ setAdapter }) => {
				setAdapter({
					name: "hono-astro-adapter",
					supportedAstroFeatures: {
						serverOutput: "stable",
						staticOutput: "stable",
						envGetSecret: "stable",
					},
					serverEntrypoint: "hono-astro-adapter/server.js",
					exports: ["handler"],
				});
			}
		},
	}
}
