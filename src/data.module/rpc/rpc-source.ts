import "reflect-metadata"
import { Inject, Optional, StaticProvider } from "@angular/core"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

import { DataSource, Model, ModelFactory, ModelClass, ID, Filter, Sorter, Range } from "../data.module"
import { RpcTransport, Action } from "./rpc-transport"


export type RpcMapper = (value: any) => any

export interface RpcOptions {
    name?: string
    group?: string
    map?: RpcMapper
}


const RPC_GROUP = Symbol("@rpc.group")


export function RpcGroup(group: string) {
    return (target: any) => {
        Reflect.defineMetadata(RPC_GROUP, group, target)
    }
}


export function RpcMethod(name?: string | RpcOptions, group?: string) {
    let options: RpcOptions
    if (typeof name === "string") {
        options = { name, group }
    } else if (name) {
        options = name
    } else {
        options = {} as any
    }

    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const type = Reflect.getMetadata("design:type", target, propertyKey)
        if (type !== Function) {
            throw new Error("RpcMethod must be function type")
        }

        const action_ = options.name || propertyKey
        const map_ = options.map
        if (map_ && typeof map_ !== "function") {
            throw new Error("'map' option must be a function")
        }

        function lf(src: any) {
            if (typeof src.getLoadFields === "function") {
                return src.getLoadFields()
            }
            return null
        }

        target[propertyKey] = map_
            ? function (this: IRpcDataSource, ...args: any[]): any {
                const group_ = options.group || Reflect.getMetadata(RPC_GROUP, target.constructor)
                return this.transport.send({ action: action_, group: group_ }, args, lf(this)).pipe(map(map_))
            }
            : function (this: IRpcDataSource, ...args: any[]): any {
                const group_ = options.group || Reflect.getMetadata(RPC_GROUP, target.constructor)
                return this.transport.send({ action: action_, group: group_ }, args, lf(this))
            }

    }
}


export interface IRpcDataSource {
    readonly transport: RpcTransport
}


export abstract class RpcDataSource<T extends Model = Model> extends DataSource<T> implements IRpcDataSource {
    public static withModel(modelCls: ModelClass): StaticProvider {
        const src = this as any
        return {
            provide: src,
            deps: [RpcTransport],
            useFactory(transport: RpcTransport) {
                return new src(modelCls, transport)
            }
        }
    }

    public readonly async = true

    public constructor(
        @Inject(Model) @Optional() public readonly model: ModelClass<T>,
        @Inject(RpcTransport) public readonly transport: RpcTransport) {
        super()
    }

    public getPosition(id: ID): Observable<number> {
        throw new Error(`Not implemented ${this.constructor.name}::getPosition`)
    }

    protected _save(model: T): Observable<T> {
        throw new Error(`Not implemented ${this.constructor.name}::_save`)
    }

    protected _delete(model: ID): Observable<boolean> {
        throw new Error(`Not implemented ${this.constructor.name}::_delete`)
    }

    protected _search(f?: Filter<T>, s?: Sorter<T>, r?: Range): Observable<any[]> {
        throw new Error(`Not implemented ${this.constructor.name}::_search`)
    }

    protected _get(id: ID): Observable<T> {
        throw new Error(`Not implemented ${this.constructor.name}::_get`)
    }
}


// class User extends Model {

// }


// @RpcGroup("User")
// class UserDataSource<T extends User = User> extends RpcDataSource<T> {
//     @RpcMethod("load_item") protected _get: (id: ID) => Observable<T>
//     @RpcMethod({ action: "sdsdsd", map(v) { return v } }) public valami: (s: any) => Observable<T>
// }

