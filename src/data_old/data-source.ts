import { EventEmitter } from "@angular/core"
import { Observable, Subject } from "rxjs"
import * as DeepDiff from "deep-diff"

import { Collection, CollectionItemId } from "./collection"
import { Range } from "./range"


export interface DiffKindNew {
    kind: "N"
    // path: string[]
    rhs: any
}


export interface DiffKindDelete {
    kind: "D"
    path: string[]
}


export interface DiffKindEdit {
    kind: "E"
    path: string[]
    lhs: any
    rhs: any
}


export interface DiffKindAdd {
    kind: "A"
    path: string[]
    index: number
    item: DiffKind
}


export type DiffKind = DiffKindNew | DiffKindDelete | DiffKindEdit | DiffKindAdd
export type Diff = Array<DiffKind>


export interface MappingChangedEvent<F> {
    diff: Diff
    value: F
}


export interface MappingChangingEvent<F> {
    diff: Diff
    old: F
    pending: F
}


export type Filter_Literal = string | number | boolean | null
export type Filter_MinMax = { min: number, max: number }
export type Filter_Eq = { eq: Filter_Literal }
export type Filter_Neq = { neq: Filter_Literal }
export type Filter_Gt = { gt: Filter_Literal }
export type Filter_Gte = { gte: Filter_Literal }
export type Filter_Lt = { lt: Filter_Literal }
export type Filter_Lte = { lte: Filter_Literal }
export type Filter_Or = { or: FilterValue[] }
export type Filter_And = { and: FilterValue[] }
export type FilterValue = Filter_Literal | Filter_MinMax |
    Filter_Eq | Filter_Neq |
    Filter_Gt | Filter_Gte |
    Filter_Lt | Filter_Lte |
    Filter_Or | Filter_And

export type Filter = {
    [key: string]: FilterValue
}
export type Sorter = { [key: string]: "asc" | "desc" }
export type RangeQuery = { kind: "range", begin: number, end: number }
export type PositionQuery = { kind: "position", elementId: CollectionItemId, before: number, after: number }
export type Position = RangeQuery | PositionQuery


export class MappingField<E> {
    public readonly changed: Observable<MappingChangedEvent<E>> = new EventEmitter()
    public readonly changing: Observable<MappingChangingEvent<E>> = new EventEmitter()

    public get(): E {
        return deepClone(this._value)
    }
    public set(value: E) {
        this._tryChanging(this._value, value)
    }
    private _value: E

    public isEq(other: E): boolean {
        let diff = DeepDiff.diff(this._value, other)
        return !diff || diff.length === 0
    }

    private _tryChanging(current: E, pending: E, recursion: number = 0) {
        if (recursion >= 10) {
            throw new Error("Filter changing is not possible (max recursion reached)")
        }
        let diff: Diff = DeepDiff.diff(current, pending) as any

        if (diff && diff.length) {
            let pendingRequest = deepClone(pending)
            let event: MappingChangingEvent<E> = {
                old: deepClone(current),
                pending: pendingRequest,
                diff: diff
            };

            (this.changing as EventEmitter<MappingChangingEvent<E>>).emit(event)

            let changing = this._tryChanging(pending, event.pending, recursion + 1)
            if (changing !== true) {
                let d: Diff = recursion === 0 ? diff : DeepDiff.diff(this._value, pendingRequest) as any
                this._value = pendingRequest;
                (this.changed as EventEmitter<MappingChangedEvent<E>>).emit({
                    diff: d,
                    value: this.get()
                })
            }

            return true
        }

        return false
    }
}


export abstract class DataSource<T extends Object, F extends Filter = Filter> extends Collection<T> {
    public readonly filter = new MappingField<F>()
    public readonly sorter = new MappingField<Sorter>()
    public readonly position = new MappingField<Position>()
    public abstract readonly range: Range

    public abstract readonly isRemote: boolean
    public abstract readonly isBusy: boolean
}


function deepClone<T>(any: T): T {
    if (any !== undefined) {
        let s = JSON.stringify(any)
        return JSON.parse(s)
    } else {
        return undefined
    }
}
