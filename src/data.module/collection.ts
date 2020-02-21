import { Observable } from "rxjs"
import { switchMap } from "rxjs/operators"

import { NzRange, listDiff, ListDiff } from "../util"
import { Model, PrimaryKey } from "./model"


export class Items<T extends Model> extends Array<T> {
    public readonly range: NzRange
    public readonly total: number

    public constructor(items: T[], range: NzRange, total?: number) {
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

    public compare(other: Items<T>, isEq = Model.isEq): ListDiff<T> {
        let oldIndexBegin = other instanceof Items ? other.range.begin : this.range.begin
        return listDiff<T>(other, this, oldIndexBegin, this.range.begin, isEq)
    }

    public getRange(range: NzRange): Items<T> {
        if (!this.range) {
            return new Items(this, range, this.total)
        } else {
            let begin = Math.max(this.range.begin, range.begin)
            let end = Math.min(this.range.end, range.end)
            let s = this.range.begin > range.begin ? 0 : range.begin - this.range.begin
            let l = end - begin
            return new Items(this.slice(s, s + l), new NzRange(begin, end), this.total)
        }
    }
}


// export class ItemsWithChanges<T extends Model> extends Items<T> {
//     private _changes: ListDiff<T>
//     public get changes(): ListDiff<T> {
//         if (this._changes == null) {
//             // console.log("AAAAA", this._old, this._old ? this._old.range : "NO_RANGE")
//             // this._changes = diff(this._old, this, this._old.range.begin, this.range.begin)
//             this._changes = this.compare(this._old)
//             delete this._old
//         }
//         return this._changes
//     }

//     public constructor(items: T[], range: NzRange, total: number, private _old: Items<T>) {
//         super(items, range, total)
//     }
// }


export abstract class Collection<T extends Model> {
    // public readonly items: T[]
    // public readonly itemsChanged: Observable<ItemsWithChanges<T>> = new EventEmitter()

    public getRangeById(id: PrimaryKey, before: number, after: number): Observable<Items<T>> {
        return null
        // return this.getPosition(id)
        //     .pipe(switchMap(pos => this.getRange(
        //         new NzRange(Math.max(0, pos - before), pos + after)
        //     )))
    }

    public abstract loadRange(r: NzRange): void

    public abstract getRange(r: NzRange): Items<T>

    public abstract getPosition(id: PrimaryKey): Observable<number>

    // public abstract getIndex(id: ID): number


}
