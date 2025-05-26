import { test, expect, mock, jest, describe, beforeEach, beforeAll, afterAll } from 'bun:test';
import { createMiddleware } from './createMiddleware';
import type { App, RouteData } from 'astro/app';
import type { Context, Next } from 'hono';
// import { AsyncLocalStorage as ActualAsyncLocalStorage } from 'node:async_hooks'; // Removed

// Mock a logger
const mockLogger = {
	error: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
};

// Mock AsyncLocalStorage
const mockAlsRun = jest.fn((_, callback) => callback()); // Immediately executes the callback
const mockAlsGetStore = jest.fn();

// Mock the actual AsyncLocalStorage constructor and its methods
// This is Bun's way of mocking. It replaces the module's exports.
// Note: This top-level mock should ideally be outside any describe/beforeEach for module-level mocking.
// However, Bun's `mock` function might have specific scoping rules.
// For robust module mocking, `jest.mock` equivalent at top level is usually preferred.
// Let's place it here for now as per typical Bun test structure if `mock` is used per-file.
// Mocking block for 'node:async_hooks' removed.


// Mock astro/app (as it's a peer dependency and not a real module in this isolated test)
const mockAppMatch = jest.fn();
const mockAppRender = jest.fn();
const mockAppGetAdapterLogger = jest.fn(() => mockLogger);

const mockAppInstance = {
	match: mockAppMatch,
	render: mockAppRender,
	getAdapterLogger: mockAppGetAdapterLogger,
	options: {}, // Astro app options
} as unknown as App;


describe('createMiddleware', () => {
	let middleware: (ctx: Context, next?: Next, locals?: Record<string, any>) => Promise<Response | void>;
	let mockCtx: Partial<Context>;
	let mockNextFn: Next;
	let mockRequest: Request;

	beforeEach(() => {
		// Reset mocks before each test
		mockAppMatch.mockReset();
		mockAppRender.mockReset();
		mockAppGetAdapterLogger.mockClear(); // Called once at middleware creation
		mockAlsRun.mockClear();
		mockAlsGetStore.mockClear();
		mockLogger.error.mockClear();
		mockLogger.info.mockClear();
		mockLogger.warn.mockClear();
		mockLogger.debug.mockClear();

		// Re-initialize middleware for each test to ensure fresh state and logger setup
		const mockAlsInstance = { run: mockAlsRun, getStore: mockAlsGetStore };
		middleware = createMiddleware(mockAppInstance, mockAlsInstance as any);

		mockRequest = new Request('http://localhost:3000/test') as Request;
		mockCtx = {
			req: {
				raw: mockRequest,
				// Hono specific request properties can be added if middleware uses them
			} as any,
			// Hono context properties can be added if middleware uses them
		};
		mockNextFn = jest.fn(); // Mock for the 'next' function in Hono
	});

	describe('Successful Page Rendering', () => {
		test('should render page when route matches', async () => {
			const mockRouteData = { type: 'page', component: 'SomeComponent.astro' } as unknown as RouteData;
			const mockResponse = new Response('Success', { status: 200 });
			const mockLocals = { userId: 123 };

			mockAppMatch.mockReturnValue(mockRouteData);
			mockAppRender.mockResolvedValue(mockResponse);

			const response = await middleware(mockCtx as Context, mockNextFn, mockLocals);

			expect(mockAppGetAdapterLogger).toHaveBeenCalledTimes(1); // Called during createMiddleware
			expect(mockAppMatch).toHaveBeenCalledTimes(1);
			expect(mockAppMatch).toHaveBeenCalledWith(mockRequest);
			
			expect(mockAlsRun).toHaveBeenCalledTimes(1);
			expect(mockAlsRun.mock.calls[0][0]).toBe(mockRequest.url); // ALS stores request.url

			expect(mockAppRender).toHaveBeenCalledTimes(1);
			expect(mockAppRender).toHaveBeenCalledWith(mockRequest, {
				locals: mockLocals,
				addCookieHeader: true,
				routeData: mockRouteData,
			});
			expect(response).toBe(mockResponse);
			expect(mockNextFn).not.toHaveBeenCalled();
		});
	});

	describe('next() Functionality', () => {
		test('should call next() when route does not match and next is provided', async () => {
			mockAppMatch.mockReturnValue(undefined); // No route match

			await middleware(mockCtx as Context, mockNextFn, {});

			expect(mockAppMatch).toHaveBeenCalledTimes(1);
			expect(mockAppMatch).toHaveBeenCalledWith(mockRequest);
			
			expect(mockAlsRun).not.toHaveBeenCalled(); 
			expect(mockAppRender).not.toHaveBeenCalled(); 
			expect(mockNextFn).toHaveBeenCalledTimes(1);
		});
	});

	describe('404 Not Found', () => {
		test('should render 404 when route does not match and next is not provided', async () => {
			const mock404Response = new Response('Not Found', { status: 404 });
			
			mockAppMatch.mockReturnValue(undefined); // No route match
			mockAppRender.mockResolvedValue(mock404Response); // Astro's render for 404

			// Pass undefined for next
			const response = await middleware(mockCtx as Context, undefined, {});

			expect(mockAppMatch).toHaveBeenCalledTimes(1);
			expect(mockAppMatch).toHaveBeenCalledWith(mockRequest);

			expect(mockAlsRun).not.toHaveBeenCalled(); 
			expect(mockAppRender).toHaveBeenCalledTimes(1);
			expect(mockAppRender).toHaveBeenCalledWith(mockRequest); // Astro 404 render
			expect(response).toBe(mock404Response);
		});
	});

	describe('Locals Passing', () => {
		test('should pass locals to app.render', async () => {
			const mockRouteData = { type: 'page', component: 'AnotherPage.astro' } as unknown as RouteData;
			const mockResponse = new Response('Page with locals', { status: 200 });
			const specificMockLocals = { testKey: 'testValue', anotherKey: 42 };

			mockAppMatch.mockReturnValue(mockRouteData);
			mockAppRender.mockResolvedValue(mockResponse);

			await middleware(mockCtx as Context, mockNextFn, specificMockLocals);

			expect(mockAppMatch).toHaveBeenCalledWith(mockRequest);
			expect(mockAlsRun).toHaveBeenCalledTimes(1);
			expect(mockAppRender).toHaveBeenCalledTimes(1);
			expect(mockAppRender).toHaveBeenCalledWith(mockRequest, {
				locals: specificMockLocals,
				addCookieHeader: true,
				routeData: mockRouteData,
			});
			expect(mockNextFn).not.toHaveBeenCalled();
		});
	});

	describe('Unhandled Rejection Handling', () => {
		// This is a simplified check. Testing actual process.on('unhandledRejection')
		// behavior is complex and often requires more integrated testing.
		test('middleware setup should involve getting a logger (used by unhandledRejection handler)', () => {
			// createMiddleware is called in beforeEach, which sets up the logger
			expect(mockAppGetAdapterLogger).toHaveBeenCalledTimes(1);
			// To further test: one would need to mock process.on, trigger a fake rejection,
			// and check if mockLogger.error was called with the expected arguments.
			// This is often outside the scope of pure unit tests for the middleware function itself.
		});

        // Example of more direct test if `process.on` was mockable and `als.getStore` was set up
        // This is illustrative and depends on robust mocking of `process` and `AsyncLocalStorage`
        // test('unhandledRejection handler should log an error with request URL if available', () => {
        //     const mockProcessOn = jest.spyOn(process, 'on');
        //     createMiddleware(mockAppInstance); // Re-create to attach listener with spy
        //     const unhandledRejectionCallback = mockProcessOn.mock.calls.find(call => call[0] === 'unhandledRejection')?.[1];
            
        //     if (typeof unhandledRejectionCallback === 'function') {
        //         const fakeReason = new Error('Test rejection');
        //         const fakeUrl = 'http://example.com/failed-route';
        //         mockAlsGetStore.mockReturnValue(fakeUrl); // Mock what ALS would return
                
        //         unhandledRejectionCallback(fakeReason);
                
        //         expect(mockLogger.error).toHaveBeenCalledWith(`Unhandled rejection while rendering ${fakeUrl}`);
        //         expect(mockLogger.error).toHaveBeenCalledWith(`Unhandled rejection: ${fakeReason}`);
        //     }
        //     mockProcessOn.mockRestore(); // Clean up spy
        // });
	});
});
