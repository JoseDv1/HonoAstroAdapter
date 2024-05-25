import type { AstroAdapter, AstroIntegration } from "astro";

const honoAstro: AstroIntegration = {
	name: "hono-astro-adapter",
	hooks: {
		'astro:config:setup': ({ updateConfig, config }) => {
			updateConfig({
				image: {
					endpoint: config.image.endpoint ?? 'astro/assets/endpoint/node',
				},
				vite: {
					ssr: {
						noExternal: ['hono-astro-adapter'],
					},
				},
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
	},
	exports: ["handler"],
	serverEntrypoint: "hono-astro-adapter/server.js",
}

export default function createIntegration() {
	return honoAstro;
}
