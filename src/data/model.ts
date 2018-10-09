import "reflect-metadata"

export type Converter<V=any, M=any> = (value: V, model: M) => V
export type Factory = (value: any) => any
export type RawData<T> = Partial<T>

export const EQ = Symbol("@eq")
const RAW = Symbol("@raw")
const CACHE = Symbol("@cache")
const PROPERTY_FIELDS = Symbol("@propertyFields")
const FIELDS = Symbol("@fields")


export type BasicOptions = { rawName?: string }
export type ConverterOptions = { converter?: Converter }
export type ListOfOptions = { listOf?: { new(value: any): any } | Factory }
export type MapOfOptions = { mapOf?: { new(value: any): any } | Factory }


export type FieldOptions = BasicOptions & (ConverterOptions | ListOfOptions | MapOfOptions)


function isPrimitiveType(t: any): boolean {
    return t === String || t === Number || t === Boolean || t === Date
}


function isClass(t: any): boolean {
    return typeof t === "function" && /^class\s/.test(t.toString())
}


function createProperty(inpName: string, converter: Converter): PropertyDescriptor {
    return {
        get() {
            let data = this[CACHE]
            if (inpName in data) {
                return data[inpName]
            }
            let raw = (this[RAW] || {})[inpName]
            return data[inpName] = raw == null ? raw : converter(raw, this)
        },
        set(val) {
            this[CACHE][inpName] = val
        },
        enumerable: true,
        configurable: false
    }
}


function listFactory(itemConverter: Factory): Factory {
    return (value: Array<any>): Array<any> => {
        if (Array.isArray(value)) {
            return value.map(itemConverter)
        } else {
            throw new Error("Value must be an array")
        }
    }
}


function mapFactory(itemConverter: Factory): Factory {
    return (value: any) => {
        if (value && value.hasOwnProperty) {
            let res = {} as any
            for (const k in value) {
                if (value.hasOwnProperty(k)) {
                    res[k] = itemConverter(value[k])
                }
            }
            return res
        }
        return null
    }
}


function typeFactory(type: { new(val: any): any }): Factory {
    return (value: any) => {
        return isPrimitiveType(type) || !(value instanceof type) ? new type(value) : value
    }
}


function typeOrConverterFactory(t: any): Factory {
    return isClass(t) || isPrimitiveType(t) ? typeFactory(t) : t
}


export function Field(rawName: string | FieldOptions = {}) {
    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const type = Reflect.getMetadata("design:type", target, propertyKey)
        if (type === Function) {
            throw new Error("Cannot decorate function with 'Field' decorator")
        }

        let converter
        let listOf
        let mapOf
        if (typeof rawName !== "string") {
            converter = (rawName as any).converter
            listOf = (rawName as any).listOf
            mapOf = (rawName as any).mapOf
            rawName = rawName.rawName
        }

        if (!descriptor) {
            if (!converter) {
                if (listOf) {
                    converter = listFactory(typeOrConverterFactory(listOf))
                } else if (mapOf) {
                    converter = mapFactory(typeOrConverterFactory(mapOf))
                } else {
                    converter = typeOrConverterFactory(type)
                }
            }
            Object.defineProperty(target, propertyKey, createProperty(rawName || propertyKey, converter))
        } else {
            if (converter) {
                throw new Error("'converter' options is not supperted for properties")
            }
            if (listOf) {
                throw new Error("'listOf' parameter is not supperted for properties")
            }
            if (mapOf) {
                throw new Error("'mapOf' parameter is not supperted for properties")
            }
            let props = Reflect.getMetadata(PROPERTY_FIELDS, target) || {}
            props[propertyKey] = rawName || propertyKey
            Reflect.defineMetadata(PROPERTY_FIELDS, props, target)
        }

        let fields = Reflect.getMetadata(FIELDS, target) || {}
        fields[propertyKey] = rawName || propertyKey
        Reflect.defineMetadata(FIELDS, fields, target)

        if (!("toJSON" in target)) {
            target.toJSON = function () {
                let fields = Reflect.getMetadata(FIELDS, target) || {}
                let res = {} as any
                for (const k in fields) {
                    res[fields[k]] = this[k]
                }
                return res
            }
        }
    }
}


export class Model {
    private [RAW]: any
    private [CACHE]: any

    @Field() public id: number

    public static isEq(modelA: Model, modelB: Model): boolean {
        return modelA instanceof Model && modelA[EQ](modelB)
    }

    public static rawData(model: Model): { [key: string]: any } {
        return model instanceof Model ? model[RAW] : {}
    }

    public static getFields(modelClass: { new(...args: any[]): Model }): { [key: string]: string } {
        return Reflect.getMetadata(FIELDS, modelClass.prototype)
    }

    public constructor(data?: any) {
        this[RAW] = data
        this[CACHE] = {}
        const initProps = Reflect.getMetadata(PROPERTY_FIELDS, this.constructor.prototype)
        for (const key in initProps) {
            (this as any)[key] = data[initProps[key]]
        }

        return this
    }

    public [EQ](other: Model) {
        return this === other || (other instanceof Model && other.id === this.id)
    }
}

export namespace Model {
    (data?: any) => Model
}


export class Location extends Model {
    @Field()
    public city: string
}


function factoryTest(v: any) {
    return `__Factoried(${v})__`
}


export class User extends Model {
    @Field("inp_almafa")
    public set almafa(value: number) {
        this._almafa = value
    }
    public get almafa(): number {
        return this._almafa
    }
    private _almafa: number

    @Field({ listOf: String, rawName: "instituion_names" })
    public instituionNames: string[]

    @Field({ mapOf: Number })
    public mapping: { [key: string]: number }

    @Field()
    public location: Location

    @Field({ listOf: factoryTest })
    public f: string[]

    @Field()
    public created_time: Date
}


/*
let u = new User({
    id: "12",
    inp_almafa: 23,
    instituion_names: ["hello", "world"],
    mapping: { a: "1", b: "2" },
    location: { city: "Szarvas" },
    f: [1, 2, 3],
    created_time: "2018-01-01T12:23:34Z"
})
console.log(u.id)
console.log(u.instituionNames)
console.log(u.mapping)
console.log(u.location)
console.log(u.f)
console.log(typeof u.created_time)
console.log(JSON.stringify(u))
console.log(Model.getFields(User))
*/
