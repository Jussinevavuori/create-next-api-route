import type { NextApiRequest as Req, NextApiResponse, NextApiResponse as Res } from "next";
import { createApiRouteCreator, initMiddleware } from "../src";

let middlewareCalls: string[] = [];

const createMiddleware = (s: string, failOn: string = "fail") => {
  const expressMiddleware = (req: any, res: any, next: Function) => {
    middlewareCalls.push(s);
    if (req.body === failOn) next(new Error("Failure"));
    else next();
  };
  return initMiddleware(expressMiddleware);
};

function isFunction(p: any): p is Function {
  return typeof p === "function";
}

const unimplementedMethod = (req: Req, res: Res) => {
  res.status(405).json({ message: "Unimplemented" });
};

const createContext = (req: Req, res: Res) => {
  return {
    value: 1,
  };
};

beforeEach(() => {
  middlewareCalls = [];
});

const simple = createApiRouteCreator({ unimplementedMethod, createContext });

const fakeResponse = (): NextApiResponse & { getData(): any; getStatus(): number } => {
  const state: { data: any; status: number } = {
    data: undefined,
    status: 200,
  };
  return {
    getData: () => state.data,
    getStatus: () => state.status,
    json(_data: any) {
      state.data = _data;
      return;
    },
    status(_status: number) {
      state.status = _status;
      return this;
    },
  } as unknown as NextApiResponse & { getData(): any; getStatus(): number };
};

describe("CreateApiRouteCreator", () => {
  it("Should return a function", () => {
    expect(isFunction(simple)).toBe(true);
  });

  it("Should return a function that returns a function", () => {
    expect(isFunction(simple({}))).toBe(true);
  });

  it("Creates an accessible context", async () => {
    const route = simple({
      get: (req, res, ctx) => res.status(200).json({ value: ctx.value }),
    });
    const getResponse = fakeResponse();
    await route({ method: "GET" } as Req, getResponse);
    expect(getResponse.getData()).toEqual({ value: 1 });
  });

  it("Should run correct methods", async () => {
    const route = simple({
      get: (req, res) => res.status(200).json({ value: "get" }),
      post: (req, res) => res.status(201).json({ value: "post" }),
      patch: (req, res) => res.status(202).json({ value: "patch" }),
      put: (req, res) => res.status(203).json({ value: "put" }),
      delete: (req, res) => res.status(204).json({ value: "delete" }),
    });
    const getResponse = fakeResponse();
    await route({ method: "GET" } as Req, getResponse);
    expect(getResponse.getData()).toEqual({ value: "get" });
    expect(getResponse.getStatus()).toBe(200);

    const postResponse = fakeResponse();
    await route({ method: "POST" } as Req, postResponse);
    expect(postResponse.getData()).toEqual({ value: "post" });
    expect(postResponse.getStatus()).toBe(201);

    const patchResponse = fakeResponse();
    await route({ method: "PATCH" } as Req, patchResponse);
    expect(patchResponse.getData()).toEqual({ value: "patch" });
    expect(patchResponse.getStatus()).toBe(202);

    const putResponse = fakeResponse();
    await route({ method: "PUT" } as Req, putResponse);
    expect(putResponse.getData()).toEqual({ value: "put" });
    expect(putResponse.getStatus()).toBe(203);

    const deleteResponse = fakeResponse();
    await route({ method: "DELETE" } as Req, deleteResponse);
    expect(deleteResponse.getData()).toEqual({ value: "delete" });
    expect(deleteResponse.getStatus()).toBe(204);
  });

  it("Should run unimplemented methods", async () => {
    const route = simple({
      get: (req, res) => res.status(200).json({ value: "got" }),
    });

    const postResponse = fakeResponse();
    await route({ method: "POST" } as Req, postResponse);
    expect(postResponse.getData()).toEqual({ message: "Unimplemented" });
    expect(postResponse.getStatus()).toBe(405);

    const unallowedMethodResponse = fakeResponse();
    await route({ method: "OTHER" } as Req, unallowedMethodResponse);
    expect(postResponse.getData()).toEqual({ message: "Unimplemented" });
    expect(postResponse.getStatus()).toBe(405);
  });

  it("Should run local and global middleware, in order", async () => {
    const createApiRoute = createApiRouteCreator({
      unimplementedMethod,
      createContext,
      middleware: [createMiddleware("global1"), createMiddleware("global2")],
    });
    const route = createApiRoute({
      get: (req, res) => res.status(200).json({ value: "got" }),
      middleware: [createMiddleware("local1"), createMiddleware("local2")],
    });
    const getResponse = fakeResponse();
    await route({ method: "GET" } as Req, getResponse);
    expect(middlewareCalls).toEqual(["global1", "global2", "local1", "local2"]);
  });

  it("Should handle errors as expected", async () => {
    const createApiRoute = createApiRouteCreator({
      unimplementedMethod,
      createContext,
      middleware: [createMiddleware("global", "fail-mw")],
      handleError(req, res, err) {
        if (err instanceof Error) {
          res.json({ message: err.message });
        } else if (typeof err === "string") {
          res.json({ message: err });
        } else {
          res.json({ message: "Unknown error" });
        }
      },
    });
    const route = createApiRoute({
      async get(req, res) {
        if (req.body === "fail-body") throw "Body failed";
        if (req.body === "fail-unknown") throw 1;
        res.json("Success");
      },
    });

    const mwFailureResponse = fakeResponse();
    await route({ method: "GET", body: "fail-mw" } as Req, mwFailureResponse);
    expect(mwFailureResponse.getData()).toEqual({ message: "Failure" });

    const bodyFailureResponse = fakeResponse();
    await route({ method: "GET", body: "fail-body" } as Req, bodyFailureResponse);
    expect(bodyFailureResponse.getData()).toEqual({ message: "Body failed" });

    const unknownFailureResponse = fakeResponse();
    await route({ method: "GET", body: "fail-unknown" } as Req, unknownFailureResponse);
    expect(unknownFailureResponse.getData()).toEqual({ message: "Unknown error" });
  });
});
