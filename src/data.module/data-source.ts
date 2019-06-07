import { EventEmitter } from "@angular/core"
import { Observable, of } from "rxjs"
import { map } from "rxjs/operators"

import { NzRange } from "../util"
import { Model, ID, ModelClass, Fields } from "./model"
import { Items } from "./collection"


export type Filter_MinMax = { min: number, max: number }
export type Filter_Eq<T> = { eq: T }
export type Filter_Neq<T> = { neq: T }
export type Filter_Gt<T> = { gt: T }
export type Filter_Gte<T> = { gte: T }
export type Filter_Lt<T> = { lt: T }
export type Filter_Lte<T> = { lte: T }
export type Filter_In<T> = { in: T[] }
export type Filter_Contains<T> = { contains: T }
export type Filter_StartsWith<T> = { startsWith: T }
export type Filter_EndsWith<T> = { endsWith: T }
export type Filter_Or<T> = { or: Filter_Exp<T>[] }
export type Filter_And<T> = { and: Filter_Exp<T>[] }
export type Filter_Exp<T> = Filter_MinMax | Filter_In<T> |
    Filter_Eq<T> | Filter_Neq<T> |
    Filter_Gt<T> | Filter_Gte<T> |
    Filter_Lt<T> | Filter_Lte<T> |
    Filter_Or<T> | Filter_And<T> |
    Filter_Contains<T> | Filter_StartsWith<T> | Filter_EndsWith<T>
export type FilterValue<T> = T | Filter_Exp<T>

export type Filter<T> = {
    [K in keyof T]?: FilterValue<T[K]>
}
export type Sorter<T> = { [K in keyof T]?: "asc" | "desc" }


export type _LoadRelated<T> = { [K in keyof T]?: LoadFields<T[K]> } | { "*": LoadFields<any> }
export type LoadFields<T> = Array<Exclude<keyof T, "update"> | _LoadRelated<T> | "*">
export type Meta<T = any> = { loadFields?: LoadFields<T> } & { [key: string]: any }


export abstract class DataSource<T extends Model> {
    public readonly busy: boolean = false
    public readonly busyChanged: Observable<boolean> = new EventEmitter()
    public abstract readonly async: boolean
    // public abstract readonly model: ModelClass<T>

    public search(f?: Filter<T>, s?: Sorter<T>, r?: NzRange, m?: Meta<T>): Observable<Items<T>> {
        if (r && r.end - r.begin <= 0) {
            return of(new Items([], r))
        }
        return this._search(f, s, r, m).pipe(map(items => {
            let total = items ? (items as any).total : null
            let range = r ? new NzRange(r.begin, r.begin + items.length) : new NzRange(0, items.length)
            return new Items(items, range, total)
        })) as any
    }

    public get(id: ID, m?: Meta<T>): Observable<T> {
        return this._get(id, m) as any
    }

    public save(model: T, m?: Meta<T>): Observable<T> {
        return this._save(model, m)
    }

    public remove(model: T | ID, m?: Meta<T>): Observable<boolean> {
        return this._remove(model instanceof Model ? model.id : model, m)
    }

    public abstract getPosition(id: ID): Observable<number>

    protected abstract _search(f?: Filter<T>, s?: Sorter<T>, r?: NzRange, m?: Meta<T>): Observable<any[]>

    protected abstract _get(id: ID, m?: Meta<T>): Observable<T>

    protected abstract _save(model: T, m?: Meta<T>): Observable<T>

    protected abstract _remove(id: ID, m?: Meta<T>): Observable<boolean>

    protected setBusy(busy: boolean) {
        if (this.busy !== busy) {
            (this as any).busy = busy;
            (this.busyChanged as EventEmitter<boolean>).emit(busy)
        }
    }

    // public makeModel(item: any): T {
    //     return this.model ? Model.create(this.model, item) : item
    // }

    // protected makeModels(items: any[], range?: NzRange): T[] {
    //     let total = items ? (items as any).total : null
    //     range = range ? new NzRange(range.begin, range.begin + items.length) : new NzRange(0, items.length)
    //     return new Items(items.map(this.makeModel.bind(this)), range, total)
    // }

    // protected getLoadFields(l?: LoadFieldsArg) {
    //     if (Array.isArray(l)) {
    //         return l
    //     } else {
    //         let model = l || this.model
    //         if (model) {
    //             let fields = Model.getFields(model)
    //             let r: any[] = []
    //             let f = {}
    //             this._makeLoadFields(fields, f, r)
    //             return this._flattenLoadFields(f)
    //         }
    //     }
    // }

    // private _makeLoadFields(fields: Fields, target: { [key: string]: any }, recursive: any[]) {
    //     if (recursive.indexOf(fields) !== -1) {
    //         return
    //     }
    //     recursive.push(fields)

    //     for (const field of fields) {
    //         if (field.fields.length) {
    //             target[field.sourceName] = {}
    //             for (const subF of field.fields) {
    //                 this._makeLoadFields(subF, target[field.sourceName], recursive)
    //             }
    //         } else {
    //             target[field.sourceName] = true
    //         }
    //     }

    //     recursive.pop()
    // }

    // private _flattenLoadFields(f: { [key: string]: any }): LoadFields {
    //     let result: LoadFields = []

    //     for (const k in f) {
    //         if (f[k] === true) {
    //             result.push(k)
    //         } else {
    //             result.push({ [k]: this._flattenLoadFields(f[k]) })
    //         }
    //     }

    //     return result
    // }
}


