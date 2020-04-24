

const RX_NUMBER = /^[1-9][0-9]*$/


function parsePath(path: string) {
    return path.split(".")
}


export function getPath<T = any>(object: any, path: string): T {
    const parsed = parsePath(path)
    let pi = 0
    let result: any = object

    while (result && pi < parsed.length) {
        const key = parsed[pi++] as any
        if (Array.isArray(result)) {
            if (RX_NUMBER.test(key)) {
                result = result[Number(key)]
            } else {
                throw new Error(`Invalid path segment '${key}' at: ${pi - 1} in '${path}'`)
            }
        } else {
            result = result[key]
        }
    }

    return result
}

export function setPath(object: any, path: string, value: any) {
    const parsed = parsePath(path)
    const last = parsed.pop()
    let target = object

    for (const part of parsed) {
        if (target[part] == null) {
            target[part] = {}
        }
        target = target[part]
    }

    target[last] = value
}
