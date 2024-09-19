import type { AstroAdapter, AstroIntegration } from "astro";

const honoAstro: AstroIntegration = {
	name: "hono-astro-adapter",
	hooks: {
		"astro:config:setup": async ({ updateConfig }) => {
			updateConfig({
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
			setAdapter(astroAdapter);
		}
	},
}

const astroAdapter: AstroAdapter = {
	name: "hono-astro-adapter",
	supportedAstroFeatures: {
		serverOutput: "stable",
		staticOutput: "stable",
		hybridOutput: "stable",
		assets: {
			supportKind: "stable",
			isSharpCompatible: true,
			isSquooshCompatible: true,
		},
		i18nDomains: "experimental",
		envGetSecret: "experimental",
	},
	exports: ["handler"],
	serverEntrypoint: "hono-astro-adapter/server.js",
}

export default function createIntegration() {
	return honoAstro;
}
