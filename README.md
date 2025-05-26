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

## Compatibility

While examples may use Bun, this adapter is designed to work with Hono in various JavaScript runtimes (Node.js, Deno, Bun, Cloudflare Workers) wherever Hono itself is supported. The core adapter logic is runtime-agnostic.

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
bun run <your-server-file>.js # e.g., bun run server.js
```
(Note: `<your-server-file>.js` is the file created in step 3 of the "Usage" section where you set up your Hono server.)

Alternatively, for Node.js:
```bash
node <your-server-file>.js # e.g., node server.js
```

### Render your custom 404 page

To render a custom 404 page, you can create a `404.astro` file in your project and the adapter will render it when a route is not found. To render your Astro-defined custom 404 page (e.g., `src/pages/404.astro`), ensure that the SSR handler is the last middleware in the chain for requests that should fall through to the Astro app's 404 handling. If you are passing the `next` function to the handler, not calling `next()` or ensuring it's `undefined` for unhandled routes will allow Astro's 404 page to be rendered.

```javascript
app.use((ctx) => ssrHandler(ctx)); // Use the SSR handler 
```

### Locals 
you can pass locals to the SSR handler by passing an object to the handler function.

```javascript
app.use((ctx, next) => ssrHandler(ctx, next, { title: "Hello World" })); // Use the SSR handler 
```

And you can access the locals in your astro pages or API routes with the `locals` object.

```astro
const locals = Astro.locals;
```



