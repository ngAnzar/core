import "reflect-metadata"
import { Inject } from "@angular/core"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

import { DataSource, Model, ModelFactory, ID, Filter, Sorter, Range } from "../data.module"
import { RpcTransport, Action } from "./rpc-transport"


export type RpcMapper = (value: any) => any

export interface RpcOptions {
    action: string
    group?: string
    map?: RpcMapper
}


const RPC_GROUP = Symbol("@rpc.group")


export function RpcGroup(group: string) {
    return (target: any) => {
        Reflect.defineMetadata(RPC_GROUP, group, target)
    }
}


export function RpcMethod(action: string | RpcOptions, group?: string) {
    let options: RpcOptions
    if (typeof action === "string") {
        options = { action, group }
    } else if (action) {
        options = action
    }

    return (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => {
        const type = Reflect.getMetadata("design:type", target, propertyKey)
        if (type !== Function) {
            throw new Error("RpcMethod must be function type")
        }

        const action_ = options.action || propertyKey
        const group_ = options.group || Reflect.getMetadata(RPC_GROUP, target)
        const map_ = options.map
        if (!group_) {
            throw new Error("Missing RpcGroup")
        }
        const action: Action = { action: action_, group: group_ }

        target.prototype[propertyKey] = map_
            ? function (this: IRpcDataSource, ...args: any[]): any {
                return this.transport.send(action, args)
            }
            : function (this: IRpcDataSource, ...args: any[]): any {
                return this.transport.send(action, args).pipe(map(map_))
            }

    }
}


export interface IRpcDataSource {
    readonly transport: RpcTransport
}


export abstract class RpcDataSource<T extends Model = Model> extends DataSource<T> implements IRpcDataSource {
    public constructor(
        @Inject(Model) public readonly model: ModelFactory<T>,
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

