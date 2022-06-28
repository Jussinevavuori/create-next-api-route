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

Example:

```typescript
import { createApiRouteCreator } from "./createApiRouteCreator";
import { fakeDb } from "./fakeDb";
import initMiddleware from "./initMiddleware";
import Cors from "cors";
import { NextApiRequest } from "next";

// Define new middleware
const corsMiddleware = initMiddleware(Cors());
const loggerMiddleware = async (req: NextApiRequest) => {
  console.log("Incoming", req.method, "request");
};

export const createApiRoute = createApiRouteCreator({
  // Global middleware
  middleware: [corsMiddleware, loggerMiddleware],

  // Unimplemented method handler
  unimplementedMethod(req, res) {
    res.status(405).json({ message: "Unimplemented" });
  },

  // Global context object
  createContext() {
    return {
      db: fakeDb,
    };
  },

  // Global error handler
  handleError(req, res, error) {
    if (typeof error === "string") {
      return res.status(400).send({ message: error });
    }

    res.status(400).send({ message: "Something wen't wrong!" });
  },
});

export default createApiRoute({
  async get(req, res, ctx) {
    const user = await requireUser(req);
    const todos = await ctx.db.getTodosForUser(user.id);

    res.json({ todos });
  },
  async post(req, res) {
    if (typeof req.body !== "string" || req.body === "") {
      throw "Request body not a string or empty string";
    }

    res.status(201).json({ message: "Thank you!" });
  },
  middleware: [
    async (req, res) => {
      console.log("Called local middleware");
    },
  ],
});
```
