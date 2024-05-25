# Hono Astro Adapter

This is a simple adapter that allows you to use a Middleware to handle the SSR of your Astro project.

## Installation

Use your favorite package manager to install the adapter.

```bash
bun add hono-astro-adapter
```

```bash
npm install hono-astro-adapter
```

```bash
yarn add hono-astro-adapter
```

```bash
pnpm add hono-astro-adapter
```

## Usage

### 1. Set up the Adapter

Add the adapter to your `astro.config.mjs` file.

```javascript
import { defineConfig } from "astro/config";
import honoAstro from "hono-astro-adapter";

// https://astro.build/config
export default defineConfig({
	output: "server", // or hybrid if you want to use SSR and SSG
	adapter: honoAstro(),
});
```

### 2. Build your project

Build your project using the `astro build` command.

```bash
bun | npm | yarn | pnpm run build
```

### 3. Import and set up your hono server

```javascript
import { Hono } from "hono";
import { serveStatic } from "hono/bun"; // Import the serveStatic from your favorite runtime
import { handler as ssrHandler } from "./dist/server/entry.mjs"; // Import the handler from the built project

const app = new Hono();
app.use("/*", serveStatic({ root: "./dist/client/" })); // Serve the static files
app.use(ssrHandler); // Use the SSR handler

// Start the server as inidicated by the runtime in the hono documentation
console.log("Server is running on http://localhost:3000");
export default {
	fetch: app.fetch,
	port: process.env.PORT ?? 3000,
};
```

### 4. Run your server and enjoy

Run your server and enjoy the SSR capabilities of your Astro project.

```bash
	bun src/index.js
```
