import type { NextApiRequest as Req, NextApiResponse as Res } from "next";
import { initMiddleware } from "../src";

let hits = 0;

const expressMiddleware = (req: any, res: any, next: Function) => {
  hits++;
  if ("body" in req && req.body === "fail") {
    next(new Error("Failure"));
  }
  next();
};

function isPromise(p: any): p is Promise<any> {
  return typeof p === "object" && typeof p.then === "function" && typeof p.catch === "function";
}

function isFunction(p: any): p is Function {
  return typeof p === "function";
}

const middleware = initMiddleware(expressMiddleware);

beforeEach(() => {
  hits = 0;
});

describe("Init middleware", () => {
  it("Should return a function", () => {
    expect(isFunction(middleware)).toBe(true);
  });
  it("Should return a promise when called", () => {
    expect(isPromise(middleware({} as Req, {} as Res))).toBe(true);
  });
  it("Should run the function body", async () => {
    expect(hits).toBe(0);
    await middleware({} as Req, {} as Res);
    expect(hits).toBe(1);
    await middleware({} as Req, {} as Res);
    expect(hits).toBe(2);
  });
  it("Should throw on failure conditions", async () => {
    expect(middleware({ body: "fail" } as Req, {} as Res)).rejects.toMatchObject(new Error("Failure"));
  });
});
