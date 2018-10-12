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
export type BasicOptions = { name?: string, json?: false, map?: ModelFactory }
export type TypeOptions = { type: Type | Type[] } & BasicOptions
export type ListOfOptions = { listOf: Type | Type[] } & BasicOptions
export type MapOfOptions = { mapOf: Type | Type[] } & BasicOptions
export type ID = string | number


export type FieldOptions = BasicOptions | ListOfOptions | MapOfOptions | TypeOptions
export type FieldType = { listOf: Type[] } | { mapOf: Type[] } | { single: Type[] }

export interface FieldMeta {
    sourceName: string
    targetName: string
    json: boolean
    type: FieldType
    fields?: Fields[]
    initEarly: boolean
}


export type Fields = FieldMeta[]


function isPrimitiveType(t: any): boolean {
    return t === String || t === Number || t === Boolean || t === Date || t === Object
}


function isClass(t: any): boolean {
    return typeof t === "function" && t.__proto__ !== Function.prototype
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
    return isClass(t) || isPrimitiveType(t) ? typeFactory(t) : t
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
        meta.json = options.json !== false

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
        meta.fields = typeList.map(t => Model.getFields(t)).filter(v => !!v)
        // console.log(meta)

        if (!descriptor) {
            meta.initEarly = false
            Object.defineProperty(target, propertyKey, createProperty(meta.sourceName, converter as any))
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
                let res = {} as any
                for (const field of fields) {
                    if (field.json) {
                        res[field.sourceName] = this[field.targetName]
                    }
                }
                return res
            }
        } else {
            fields = target[FIELDS]
        }

        fields[fields.length] = meta
    }
}


function parseId(value: any): any {
    if (typeof value !== "string" && typeof value !== "number") {
        return String(value)
    }
    return value
}


export class Model {
    private [RAW]: any
    private [CACHE]: any

    @Field({ map: parseId, type: [String, Number] }) public id: ID

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

    public constructor(data?: any) {
        this[RAW] = data || {}
        this[CACHE] = {}
        const fields = (this as any)[FIELDS] as Fields
        for (const field of fields) {
            if (field.initEarly) {
                (this as any)[field.targetName] = data[field.sourceName]
            }
        }

        return this
    }

    public [EQ](other: Model) {
        return this === other || (other instanceof Model && other.id === this.id)
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
