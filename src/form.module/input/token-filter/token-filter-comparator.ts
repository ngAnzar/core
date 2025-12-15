import isPlainObject from "is-plain-object"

export interface TokenFilterComparatorOptions {
    readonly name: string
    readonly label: string
    readonly valueCount: number
    readonly delimiter?: string
    readonly description?: string
    readonly priority?: number
    readonly isDefault?: boolean
}

export abstract class TokenFilterComparator implements TokenFilterComparatorOptions {
    readonly name: string
    readonly label: string
    readonly valueCount: number
    readonly delimiter?: string
    readonly description?: string
    readonly priority: number = 0
    readonly isDefault: boolean = false

    public constructor(options: TokenFilterComparatorOptions) {
        Object.assign(this, options)
    }

    public abstract compose(values: any[]): any
    public abstract parse(value: any): any[] | undefined
    public abstract canHandle(value: any): boolean
}

export class TokenFilterComparatorBinary extends TokenFilterComparator {
    public compose(values: any[]): any {
        if (this.valueCount === Infinity) {
            return { [this.name]: values }
        } else if (this.valueCount === 1) {
            return { [this.name]: values[0] }
        } else {
            return { [this.name]: values.slice(0, this.valueCount) }
        }
    }

    public parse(value: any): any[] | undefined {
        if (isPlainObject(value)) {
            if (this.name in value) {
                if (this.valueCount === 1) {
                    return [value[this.name]]
                } else {
                    return value[this.name]
                }
            } else {
                return undefined
            }
        } else if (this.isDefault) {
            return [value]
        } else {
            return undefined
        }
    }

    public canHandle(value: any): boolean {
        return isPlainObject(value) && this.name in value
    }
}

export class TokenFilterComparatorBetween extends TokenFilterComparator {
    public compose(values: any[]): any {
        return { gte: values[0], lte: values[1] }
    }

    public parse(value: any): any[] | undefined {
        if ("gte" in value && "lte" in value) {
            return [value.gte, value.lte]
        } else if ("gte" in value) {
            return [value.gte, undefined]
        } else if ("lte" in value) {
            return [undefined, value.lte]
        } else {
            return undefined
        }
    }

    public canHandle(value: any): boolean {
        return isPlainObject(value) && "gte" in value && "lte" in value
    }
}
