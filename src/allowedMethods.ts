export type AllowedMethod = "get" | "post" | "patch" | "put" | "delete";

export function isAllowedMethod(arg: any): arg is AllowedMethod {
  return arg === "get" || arg === "post" || arg === "patch" || arg === "put" || arg === "delete";
}
