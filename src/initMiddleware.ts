import type { NextApiRequest as Req, NextApiResponse as Res } from "next";

type Middleware = (req: any, res: any, next: (error?: any) => void) => void;

export function initMiddleware(middleware: Middleware): (req: Req, res: Res) => Promise<void> {
  return (req: Req, res: Res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}
