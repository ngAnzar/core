import "reflect-metadata"
import { Inject, Provider } from "@angular/core"
import { Observable, Observer } from "rxjs"
import { map } from "rxjs/operators"
import { DataSource, Model, Filter, ID, Sorter, Range, ModelFactory } from "../data"
import { RpcTransport } from "./rpc-transport"


export const RPC_META_NAMESPACE = Symbol("rpc.ns")
export const RPC_META_METHODS = Symbol("rpc.methods")


export const enum RpcFlags {
    None = 0,
    FORM_HANDLER = 1,
    HAS_ACCESS = 2,
    IS_EVENT = 4
}


export interface Definition {
    name: string
    actions: ActionDef[]
}

export interface ActionDef {
    name: string
    callable?: string
    flags: RpcFlags
    argc?: number
    map?: (value: any) => any
}


export interface Request {

}


export interface Response {

}


export function Rpc(def: Definition) {
    return (constructor: Function) => {
        for (let action of def.actions) {
            constructor.prototype[action.callable || action.name] = function (...args: any[]) {
                let res = this.transport.send(def.name, action, args)
                if (action.map) {
                    res = res.pipe(map(action.map))
                }
                return res
            }
        }
    }
}


export type RpcMethod<A extends any[], R> = (...args: A) => Observable<R>


export interface IRpcService {
    readonly transport: RpcTransport
}


export interface MethodMapping<T> {
    save?: keyof T
    delete?: keyof T
    search?: keyof T
    getById?: keyof T
}

// export function Method(name?: string) {
//     return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {

//     }
// }


// export type RpcMethod<X extends Array<any>, Y> = (...args: X) => Y


export abstract class RpcSource<T extends Model> extends DataSource<T> implements IRpcService {
    public static useModel<T extends Model>(model: ModelFactory<T>): Provider {
        let cls: any = this
        return {
            provide: this,
            deps: [RpcTransport],
            useFactory: (transport: RpcTransport) => {
                return new cls(model, transport)
            }
        }
    }

    protected readonly mm: Readonly<MethodMapping<this>>

    public constructor(
        @Inject(Model) public readonly model: ModelFactory<T>,
        @Inject(RpcTransport) public readonly transport: RpcTransport) {
        super()
    }

    public determinePosition(id: ID): Observable<number> {
        return
    }

    public reconfigure(mm: MethodMapping<this>): RpcSource<T> {
        let source = new (RpcSource as any)(this.model, this.transport)
        source.mm = { ...source.mm, ...mm }
        return source
    }

    protected _save(model: T): Observable<T> {
        console.log(this)
        return (this as any)[this.mm.save](model)
    }

    protected _delete(model: T): Observable<boolean> {

        return (this as any)[this.mm.delete](model)
    }

    protected _search(f?: Filter<T>, s?: Sorter<T>, r?: Range): Observable<any[]> {
        return (this as any)[this.mm.delete](f, s, r)
    }

    protected _getById(id: ID): Observable<T> {
        return (this as any)[this.mm.getById](id)
    }

    // protected _reconfigure(source: this, mm: MethodMapping<this>): this {
    //     for (let k in mm) {
    //         (source as any)[`_${k}`] = (source as any)[(mm as any)[k]].bind(source)
    //     }
    // }
}
