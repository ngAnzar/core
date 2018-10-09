import "reflect-metadata"
import { Inject, Provider } from "@angular/core"
import { Observable, Observer } from "rxjs"
import { map } from "rxjs/operators"
import { DataSource, Model, Filter, ID, Sorter, Range, ModelClass } from "../data"
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
    transform?: (value: any) => any
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
                if (action.transform) {
                    res = res.pipe(map(v => action.transform(v)))
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

// export function Method(name?: string) {
//     return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {

//     }
// }


// export type RpcMethod<X extends Array<any>, Y> = (...args: X) => Y


export abstract class RpcSource<T extends Model> extends DataSource<T> implements IRpcService {
    public static useModel<T extends Model>(model: ModelClass<T>): Provider {
        let cls: any = this
        return {
            provide: this,
            deps: [RpcTransport],
            useFactory: (transport: RpcTransport) => {
                return new cls(model, transport)
            }
        }
    }

    public constructor(
        @Inject(Model) public readonly model: ModelClass<T>,
        @Inject(RpcTransport) public readonly transport: RpcTransport) {
        super()
    }

    public determinePosition(id: ID): Observable<number> {
        return
    }

    public save(model: T): Observable<boolean> {
        return
    }

    public delete(model: T): Observable<boolean> {
        return
    }

    protected _search(f?: Filter<T>, s?: Sorter<T>, r?: Range): Observable<any[]> {
        return
    }

    protected _getById(id: ID): Observable<T> {
        return
    }
}
