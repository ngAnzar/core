import * as isPlainObjectModule from "is-plain-object"

type IsPlainObjectFn = (o: unknown) => boolean

const mod = isPlainObjectModule as { default?: IsPlainObjectFn; isPlainObject?: IsPlainObjectFn }
export const isPlainObject: IsPlainObjectFn = (mod.default || mod.isPlainObject)!
