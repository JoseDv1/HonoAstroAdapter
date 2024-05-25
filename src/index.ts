import type { AstroAdapter, AstroIntegration } from "astro";

const honoAstro: AstroIntegration = {
	name: "HonoAstroAdapter",
	hooks: {
		'astro:config:setup': ({ updateConfig, config }) => {
			updateConfig({
				image: {
					endpoint: config.image.endpoint ?? 'astro/assets/endpoint/node',
				},
				vite: {
					ssr: {
						noExternal: ['@astrojs/node'],
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
	name: "HonoAstroAdapter",
	supportedAstroFeatures: {
		serverOutput: "stable",
		staticOutput: "stable",
		hybridOutput: "stable",
		i18nDomains: "experimental",
		assets: {
			supportKind: "experimental",
		}
	},
	exports: ["handler"],
	serverEntrypoint: "./server",
}

export default function createIntegration() {
	return honoAstro;
}
