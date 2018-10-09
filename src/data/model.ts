

import "reflect-metadata"

type _IsDataType<T, V> = T extends (string | number) ? V : never
// type _DataKeys<E> = Extract<keyof E, string | number>
type _RawData<E> = { [P in keyof E]: _IsDataType<E[P], E[P]> }
export type RawData<E> = _RawData<(Partial<Model> | E) & { id: ID }>

export type Converter<V, R> = (value: V, record: R) => V
export type Converters<E> = {
    [P in keyof E]?: _IsDataType<E[P], Converter<E[P], E>>
}


export type ID = string | number
export const REFLECT_ENTITY_FIELDS = Symbol("REFLECT_ENTITY_FIELD")
export const REFLECT_ENTITY_FIELD_META = Symbol("REFLECT_ENTITY_FIELD_META")

const RAW_PROPERTY = Symbol("@raw")
const DATA_PROPERTY = Symbol("@data")
const INIT_PROPERTIES = Symbol("@init")
const EQ_METHOD = Symbol("@eq")


export function Field(alias?: string, converter?: Converter<any, any>) {
    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {
        let fields: Fields = Reflect.getOwnMetadata(REFLECT_ENTITY_FIELDS, target) || {}
        let fd: FieldDesc = {
            name: propertyKey, alias,
            converter: converter,
            type: Reflect.getMetadata("design:type", target, propertyKey)
        }
        if (alias) {
            fields[alias] = fd
        } else {
            fields[propertyKey] = fd
        }
        Reflect.defineMetadata(REFLECT_ENTITY_FIELDS, fields, target)

        // return Reflect.metadata(REFLECT_ENTITY_FIELD_META, { alias })
    }
}


export abstract class Model<T = any> {
    protected [RAW_PROPERTY]: Readonly<RawData<T>>
    protected [DATA_PROPERTY]: RawData<T>

    public id: ID

    public static isEq(modelA: Model, modelB: Model): boolean {
        return modelA === modelB || (modelA instanceof Model && modelA[EQ_METHOD](modelB))
    }

    constructor(raw: Readonly<RawData<T>>) {
        this[RAW_PROPERTY] = raw
        // tslint:disable-next-line:prefer-object-spread
        this[DATA_PROPERTY] = Object.assign({}, raw)
        initModel(this)
    }

    public [EQ_METHOD](idOrModel: ID | Model): boolean {
        return (typeof idOrModel === "string" || typeof idOrModel === "number")
            ? this.id === idOrModel
            : idOrModel && idOrModel.id === this.id
    }
}


export interface ModelClass<T> {
    new(raw: Readonly<RawData<T>>): T
}


function initModel(obj: Model) {
    let proto: any = (obj as any).constructor.prototype
    if (!proto.hasOwnProperty(INIT_PROPERTIES)) {
        proto[INIT_PROPERTIES] = initPropertiesFactory(proto, Reflect.getMetadata(REFLECT_ENTITY_FIELDS, proto))
    }
    proto[INIT_PROPERTIES](obj)
}


interface FieldDesc {
    name: string
    alias?: string
    type: { new(value: any): any },
    converter?: Converter<any, any>
}
type Fields = { [key: string]: FieldDesc }

function initPropertiesFactory(cls: { new(): Model }, fields: Fields): (obj: Model) => void {
    return (obj: any) => {
        let rawData: any = obj[RAW_PROPERTY]
        if (rawData) {
            for (let k in rawData) {
                let field = fields[k]
                if (field) {
                    obj[field.name] = field.type ? new field.type(rawData[k]) : rawData[k]
                }
            }
        }
    }
}
