import * as isPlainObjectModule from "is-plain-object"

type IsPlainObjectFn = (o: unknown) => boolean

console.log("isPlainObjectModule", isPlainObjectModule)

const mod = isPlainObjectModule as { default?: IsPlainObjectFn; isPlainObject?: IsPlainObjectFn }
export const isPlainObject: IsPlainObjectFn = (mod.isPlainObject || mod.default)!
console.log("isPlainObject", isPlainObject({}))
