import { EventEmitter } from "@angular/core"
import { Observable } from "rxjs"
import { switchMap } from "rxjs/operators"

import { Model, ID } from "./model"
import { Range } from "./range"
import { DataSource } from "./data-source"


export class Items<T extends Model> extends Array<T> {
    public readonly range: Range
    public readonly total: number

    public constructor(items: T[], range: Range, total?: number) {
        switch (items.length) {
            case 0:
                super()
                break
            case 1:
                super(1)
                this[0] = items[0]
                break
            default:
                super(...items)
        }
        this.range = range
        this.total = total
    }

    public compare(other: Items<T>): ListDiff<T> {
        let oldIndexBegin = other instanceof Items ? other.range.begin : this.range.begin
        // console.log(this.range, "<=>", other && other.range)
        return listDiff(other, this, oldIndexBegin, this.range.begin)
    }
}


export class ItemsWithChanges<T extends Model> extends Items<T> {
    private _changes: ListDiff<T>
    public get changes(): ListDiff<T> {
        if (this._changes == null) {
            // console.log("AAAAA", this._old, this._old ? this._old.range : "NO_RANGE")
            // this._changes = diff(this._old, this, this._old.range.begin, this.range.begin)
            this._changes = this.compare(this._old)
            delete this._old
        }
        return this._changes
    }

    public constructor(items: T[], range: Range, private _old: Items<T>) {
        super(items, range)
    }
}


export abstract class Collection<T extends Model> {
    // public readonly items: T[]
    // public readonly itemsChanged: Observable<ItemsWithChanges<T>> = new EventEmitter()

    public getRangeById(id: ID, before: number, after: number): Observable<ItemsWithChanges<T>> {
        return this.getPosition(id)
            .pipe(switchMap(pos => this.getRange(
                new Range(Math.max(0, pos - before), pos + after)
            )))
    }

    public abstract getRange(r: Range): Observable<ItemsWithChanges<T>>

    public abstract getPosition(id: ID): Observable<number>

    // public abstract getIndex(id: ID): number


}


export const enum ListDiffKind {
    DELETE = 1,
    UPDATE = 2,
    CREATE = 3
}

export interface ListDiffItem<T> {
    kind: ListDiffKind
    item: T
    index: number
}

export type ListDiff<T> = Array<ListDiffItem<T>>

export function listDiff<T extends Model>(oldList: T[], newList: T[], oldIndexBegin: number = 0, newIndexBegin: number = 0): ListDiff<T> {
    let result: ListDiff<T> = []
    let begin = Math.min(oldIndexBegin, newIndexBegin)
    let end = Math.max(oldIndexBegin + oldList.length, newIndexBegin + newList.length)

    let offsetOld = 0, offsetNew = 0
    if (oldIndexBegin < newIndexBegin) {
        offsetNew = oldIndexBegin - newIndexBegin
    } else {
        offsetOld = newIndexBegin - oldIndexBegin
    }

    for (let i = begin; i < end; i++) {
        let oldItem = oldList[i - begin + offsetOld]
        let newItem = newList[i - begin + offsetNew]

        if (newItem === undefined) {
            result[result.length] = { kind: ListDiffKind.DELETE, item: oldItem, index: i }
        } else if (oldItem === undefined) {
            result[result.length] = { kind: ListDiffKind.CREATE, item: newItem, index: i }
        } else if (!Model.isEq(oldItem, newItem)) {
            result[result.length] = { kind: ListDiffKind.UPDATE, item: newItem, index: i }
        }
    }

    return result.sort((a, b) => {
        return a.kind - b.kind
    })
}
