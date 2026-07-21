import * as isPlainObjectModule from "is-plain-object"

type IsPlainObjectFn = (o: unknown) => boolean

const mod = isPlainObjectModule as any
export const isPlainObject: IsPlainObjectFn = (typeof mod === "function" ? mod : mod.isPlainObject || mod.default)!
