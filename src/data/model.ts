import "reflect-metadata"
import { InjectionToken } from "@angular/core"

export type Converter<V=any, M=any> = (value: V, model: M) => V
export type ModelClass<M extends Model = Model> = { new(...args: any[]): M }
export type ModelFactory<M=any> = { new(value: any): M } | ((value: any) => M)
export type RawData<T> = Partial<T>

export const MODEL_ID = new InjectionToken<ID>("MODEL_ID")
export const EQ = Symbol("@eq")
const RAW = Symbol("@raw")
const CACHE = Symbol("@cache")
const FIELDS = Symbol("@fields")


export type Type = { new(value: any): any }
export type BasicOptions = { name?: string, save?: boolean, load?: boolean, map?: ModelFactory }
export type TypeOptions = { type: Type | Type[] } & BasicOptions
export type ListOfOptions = { listOf: Type | Type[] } & BasicOptions
export type MapOfOptions = { mapOf: Type | Type[] } & BasicOptions
export type ID = string | number


export type FieldOptions = BasicOptions | ListOfOptions | MapOfOptions | TypeOptions
export type FieldType = { listOf: Type[] } | { mapOf: Type[] } | { single: Type[] }

export interface FieldMeta {
    sourceName: string
    targetName: string
    save: boolean
    load: boolean
    type: FieldType
    fields?: Fields[]
    initEarly: boolean
}


export type Fields = FieldMeta[]

const builtinTypes: any = {} as any
builtinTypes[String as any] = String
builtinTypes[Number as any] = Number
builtinTypes[Boolean as any] = Boolean
builtinTypes[Date as any] = (value: any): any => { return value instanceof Date ? value : (value != null ? new Date(value) : value) }
builtinTypes[Function as any] = (value: any): any => { throw new Error("Function type is not supported") }
builtinTypes[Object as any] = (value: any): any => { throw new Error("Please provide better type information") }

function isPrimitiveType(t: any): boolean {
    return t === String || t === Number || t === Boolean || t === Date
}

function isClass(t: any): boolean {
    return typeof t === "function" && t.__proto__ !== Function.prototype
}


function createProperty(modelName: string, inpName: string, altName: string, converter: Converter): PropertyDescriptor {
    return {
        get() {
            let data = this[CACHE]
            if (inpName in data) {
                return data[inpName]
            }
            let rawData = (this[RAW] || {})
            let raw = inpName in rawData
                ? rawData[inpName]
                : altName in rawData
                    ? rawData[altName]
                    : null

            // TODO: only development
            try {
                return data[inpName] = raw == null ? raw : converter(raw, this)
            } catch (e) {
                throw new Error(`Cannot convert '${modelName}.${inpName}' filed beacuse: ${e.message}`)
            }
        },
        set(val) {
            this[CACHE][inpName] = val
        },
        enumerable: true,
        configurable: false
    }
}


function listFactory(itemConverter: (value: any) => any): ModelFactory {
    return (value: Array<any>): Array<any> => {
        if (Array.isArray(value)) {
            return value.map(itemConverter)
        } else {
            throw new Error("Value must be an array")
        }
    }
}


function mapFactory(itemConverter: (value: any) => any): ModelFactory {
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


function typeFactory(type: { new(val: any): any }): ModelFactory {
    return (value: any) => {
        return !(value instanceof type) ? new type(value) : value
    }
}

function typeOrConverterFactory(t: any): ModelFactory {
    const builtin = builtinTypes[t]
    if (builtin) {
        return builtin
    } else if (isClass(t)) {
        return typeFactory(t)
    } else {
        return t
    }
}


export function Field(name: string | FieldOptions = {}) {
    let options: FieldOptions = typeof name === "string" ? { name } : name || {}

    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const type = Reflect.getMetadata("design:type", target, propertyKey)
        if (type === Function) {
            throw new Error("Cannot decorate function with 'Field' decorator")
        }

        // let converter = typeOrConverterFactory(options.map || type)
        let converter
        let meta = {} as FieldMeta
        let typeList
        meta.targetName = propertyKey
        meta.sourceName = options.name || propertyKey

        if ("listOf" in options) {
            typeList = Array.isArray(options.listOf) ? options.listOf : [options.listOf]
            if (typeList.length === 1) {
                converter = listFactory(typeOrConverterFactory(typeList[0]) as any)
            } else if (!options.map && typeList.length > 1) {
                throw new Error("Multiple types is not supperted withput map function")
            }
            meta.type = { listOf: typeList }
        } else if ("mapOf" in options) {
            typeList = Array.isArray(options.mapOf) ? options.mapOf : [options.mapOf]
            if (typeList.length === 1) {
                converter = mapFactory(typeOrConverterFactory(typeList[0]) as any)
            } else if (!options.map && typeList.length > 1) {
                throw new Error("Multiple types is not supperted withput map function")
            }
            meta.type = { mapOf: typeList }
        } else if ("type" in options) {
            typeList = Array.isArray(options.type) ? options.type : [options.type]
            if (typeList.length === 1) {
                converter = typeOrConverterFactory(typeList[0])
            } else if (!options.map && typeList.length > 1) {
                throw new Error("Multiple types is not supperted withput map function")
            }
            meta.type = { single: typeList }
        } else {
            typeList = [type]
            if (typeList.length === 1) {
                converter = typeOrConverterFactory(typeList[0])
            } else if (!options.map && typeList.length > 1) {
                throw new Error("Multiple types is not supperted withput map function")
            }
            meta.type = { single: typeList }
        }

        converter = converter || typeOrConverterFactory(options.map || type)
        meta.save = options.save == null
            ? typeList.length === typeList.filter(isPrimitiveType).length
            : options.save !== false
        meta.load = options.load !== false
        meta.fields = typeList.map(t => Model.getFields(t)).filter(v => !!v)

        if (!descriptor) {
            meta.initEarly = false
            Object.defineProperty(target, propertyKey,
                createProperty(target.constructor.name, meta.sourceName, meta.targetName, converter as any))
        } else {
            meta.initEarly = true
            if (converter) {
                throw new Error("'converter' options is not supperted for properties")
            }
        }

        let fields: Fields
        if (!target.hasOwnProperty(FIELDS)) {
            fields = target[FIELDS] = target[FIELDS] ? target[FIELDS].slice(0) : []

            target.toJSON = function () {
                return Model.toObject(this, true)
            }
        } else {
            fields = target[FIELDS]
        }

        fields[fields.length] = meta
    }
}


export function IDField(name?: string) {
    return Field({ name, type: [String, Number], map: parseId })
}


function parseId(value: any): any {
    if (typeof value !== "string" && typeof value !== "number") {
        return String(value)
    }
    return value
}


export class Model {
    public static isEq(modelA: Model, modelB: Model): boolean {
        return modelA instanceof Model && modelA[EQ](modelB)
    }

    public static rawData(model: Model): { [key: string]: any } {
        return model instanceof Model ? model[RAW] : {}
    }

    public static getFields(modelClass: { new(...args: any[]): Model }): Fields {
        return modelClass.prototype[FIELDS]
    }

    public static create<T=any>(factory: ModelFactory<T>, data: T): T {
        return data instanceof Model
            ? data
            : isClass(factory)
                ? new (factory as any)(data)
                : (factory as any)(data)
    }

    public static toObject(model: Model, forSave?: boolean): { [key: string]: any } {
        if (!(model instanceof Model)) {
            return model
        }

        const fields = (model as any)[FIELDS] as Fields
        const res = {} as any

        if (forSave) {
            for (const field of fields) {
                if (field.save) {
                    res[field.sourceName] = (model as any)[field.targetName]
                }
            }
        } else {


            // for (const field of fields) {
            //     const value = (model as any)[field.targetName]

            //     if (value == null) {
            //         res[field.targetName] = value
            //         continue
            //     }

            //     if (field.fields.length) {
            //         if ("listOf" in field.type) {
            //             res[field.targetName] = value.map(Model.toObject)
            //         } else if ("single" in field.type) {
            //             res[field.targetName] = Model.toObject(value)
            //         } else {
            //             throw new Error(`TODO: not implemented: ${JSON.stringify(field)}`)
            //         }
            //     } else {
            //         res[field.targetName] = value
            //     }
            // }

            for (const field of fields) {
                res[field.targetName] = (model as any)[field.targetName]
            }
        }
        return res
    }

    @IDField() public id: ID

    private [RAW]: { [key: string]: any }
    private [CACHE]: { [key: string]: any }
    private [FIELDS]: Fields

    public constructor(data?: { [key: string]: any }) {
        this[RAW] = data || {}
        this[CACHE] = {}

        if (data) {
            this.update(data)
        }

        return this
    }

    public [EQ](other: Model) {
        return this === other || (other instanceof Model && other.id === this.id)
    }

    public update(data: { [key: string]: any } = {}) {
        const fields = this[FIELDS]

        for (const field of fields) {
            const value = data.hasOwnProperty(field.sourceName)
                ? data[field.sourceName]
                : data.hasOwnProperty(field.targetName)
                    ? data[field.targetName]
                    : undefined
            if (value === undefined) {
                continue
            }

            this[RAW][field.sourceName] = value
            delete this[CACHE][field.sourceName]

            if (field.initEarly) {
                (this as any)[field.targetName] = value
            }
        }
    }
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