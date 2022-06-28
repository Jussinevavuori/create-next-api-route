# Create Next.js API routes

[Read the article](https://jussinevavuori.com/blogs)

Create Next.js API routes with a simpler more beautiful syntax that allows the
following features:

- Local middleware (runs on single endpoint only)
- Global middleware (runs on all endpoints)
- Global error handling
- Global context object
- Define method handlers in their own functions
- Use express middleware
- Automatic typing

## Example:

```typescript
import { createApiRouteCreator } from "./createApiRouteCreator";
import { fakeDb } from "./fakeDb";
import initMiddleware from "./initMiddleware";
import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";

// Define new middleware (use express middleware with initMiddleware or define
// your own custom functions)
const corsMiddleware = initMiddleware(Cors());
const loggerMiddleware = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("Incoming", req.method, "request");
};

// Call the createApiRouteCreator to create a route creator with global
// properties.
export const createApiRoute = createApiRouteCreator({
  // Global middleware. These are called on all routes.
  middleware: [corsMiddleware, loggerMiddleware],

  // Unimplemented method handler, any time a route is called with a method
  // that does not exist, this will be called instead
  unimplementedMethod(req, res) {
    res.status(405).json({ message: "Unimplemented" });
  },

  // Global context object, will be provided to each handler and will be
  // constructed on every request
  createContext(req, res) {
    return {
      requestBodyString: JSON.stringify(req.body),
      db: fakeDb,
    };
  },

  // Global error handler, all thrown errors will end up here. Handle custom
  // errors as you wish, and handle all other unknown errors in some catch-all
  // way.
  handleError(req, res, error) {
    if (typeof error === "string") {
      return res.status(400).send({ message: error });
    }

    res.status(400).send({ message: "Something wen't wrong!" });
  },
});

// With the route creator, export its result as default in the api route file
// to construct the route.
export default createApiRoute({
  // Get request handler, fetches all todos for authenticated user
  async get(req, res, ctx) {
    const user = await requireUser(req); // Throws on unauthenticated
    const todos = await ctx.db.getTodosForUser(user.id);

    res.json({ todos });
  },

  // Post request handler, creates a todo for an authenticated user
  async post(req, res) {
    const user = await requireUser(req); // Throws on unauthenticated

    // Validate body, throw on invalid
    if (typeof req.body !== "string" || req.body === "") {
      throw "Request body not a string or empty string";
    }

    // Create
    const todo = await ctx.db.createTodo(req.body, user.id);

    res.status(201).json(todo);
  },
  // Local middleware, will only run for this endpoint
  middleware: [
    async (req, res) => {
      console.log("Called local middleware");
    },
  ],
});
```

# Documentation

## `createApiRouteCreator``

```typescript
type Req = NextApiRequest;
type Res = NextApiResponse;

/**
 * Creates a `createApiRoute` function. See next snippet for documentation on
 * createApiRoute.
 */
createApiRouteCreator<Context>({

	/**
	 * Create any global context object for requests to access
	 */
  createContext(req: Req, res: Res): Context;

	/**
	 * Create any handler to handle requests to unimplemented methods
	 */
  unimplementedMethod: (req: Req, res: Res, ctx: Context) => any;

	/**
	 * List all global middleware functions
	 */
  middleware?: Array<(req: Req, res: Res) => Promise<void>>;

	/**
	 * Create a handler to handle all thrown errors
	 */
  handleError?: (req: Req, res: Res, error: unknown) => void;
})
```

## `createApiRoute`

```typescript
type Req = NextApiRequest;
type Res = NextApiResponse;

/**
 * Create the `createApiRoute` function with a `createApiRouteCreator` function.
 * See previous snippet
 */
const createApiRoute = createApiRouteCreator({ /* ... */ })

/**
 * Returns the route handler function which should be exported as default
 */
export default createApiRoute<Context>({
	/**
	 * All handlers for different methods
	 */
  get?: (req: Req, res: Res, ctx: Context) => any;
  post?: (req: Req, res: Res, ctx: Context) => any;
  put?: (req: Req, res: Res, ctx: Context) => any;
  patch?: (req: Req, res: Res, ctx: Context) => any;
	delete?: (req: Req, res: Res, ctx: Context) => any;

	/**
	 * All local middleware which will run only on this route
	 */
  middleware?: Array<(req: Req, res: Res) => Promise<void>>;
})
```

## `initMiddleware``

````typescript

const someExpressMiddleware = (req: Request, res: Response: next: Function) => {
  // ...
	if (somethingWrong) next(new Error("Failed"))
  else next();
}

/**
 * `initMiddleware` turns an express middleware which takes three arguments:
 * `req`, `res` and `next` and turns it into an async function which returns
 * a promise or throws and can be called with simply a request and a response.
 * ```
 */
const usableMiddleware = initMiddleware(someExpressMiddleware);

/**
 * Init middleware return value can be called directly as follows
 */
await usableMiddleware(req as NextApiRequest, res as NextApiResponse);

/**
 * Or in `createApiRoute` and `createApiRouteCreator`
 */
export default createApiRoute({
	/* ... */,
	middleware: [usableMiddleware]
})
````
