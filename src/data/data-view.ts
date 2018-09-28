import { EventEmitter } from "@angular/core"
import { Observable } from "rxjs"
import { take } from "rxjs/operators"

import { DataSource, RangeQuery } from "./data-source"
import { Collection, CollectionItemId } from "./collection"
import { Subscriptions } from "../util"
import { Range, RangeList } from "./range"


export class DataView<T> extends Collection<T> {
    public get idField(): string | string[] {
        return this.source.idField
    }
    public set idField(val: string | string[]) {
        if (this._idFieldLocked) {
            throw new Error("Can't set idField valou on DataView")
        }
    }
    private _idFieldLocked: boolean

    public get lastIndex(): number { return this._ranges.length ? this._ranges[this._ranges.length - 1].end : 0 }
    public get maxIndex(): number { return Infinity }

    public get range(): Range { return this._requestedRange }

    public get items(): T[] { return this._requestedItems }
    protected _requestedItems: T[] = []

    protected _ranges: RangeList = new RangeList()
    protected _data: { [key: number]: T } = {}
    protected _requestedRange: Range
    protected _pendingRequest: Range
    protected _resetRequired: boolean = false
    protected _subscriptions: Subscriptions = new Subscriptions()

    public constructor(protected source: DataSource<T>) {
        super()
        if (!source) {
            throw new Error("Missing source while creating a DataView")
        }
        this._idFieldLocked = true

        this._subscriptions.add(source.filter.changed).subscribe(event => {
            this._resetRequired = true
        })

        this._subscriptions.add(source.sorter.changed).subscribe(event => {
            this._resetRequired = true
        })

        this._subscriptions.add(source.itemsChanged).subscribe(event => {
            this._setData(source.range, event.items)
        })
    }

    public requestRange(r: Range): void {
        this._pendingRequest = r

        if (!this._ranges.contains(r)) {
            let qr = this._ranges.merge(r).diff(this._ranges).span()
            this.source.position.set({ kind: "range", begin: qr.begin, end: qr.end })
        } else {
            this._setData(new Range(0, 0), [])
        }
    }

    public get(index: number): T | null {
        return this._data[index]
    }

    protected _applyRequest(oldItems: T[], oldRange: Range) {
        if (this._pendingRequest) {
            let pr = this._pendingRequest
            this._pendingRequest = null

            let items = []
            for (let i = pr.begin; i < pr.end; i++) {
                if (this._data[i]) {
                    items.push(this._data[i])
                }
            }

            this._requestedRange = new Range(pr.begin, pr.begin + items.length)
            this._ranges = this._ranges.merge(this._requestedRange)

            this.emitChanged(
                oldItems,
                this._requestedItems = items,
                oldRange.begin,
                this._requestedRange.begin)
        }
    }

    protected _setData(range: Range, items: T[]) {
        if (this._resetRequired) {
            this._reset()
            this._resetRequired = false
        }

        let k = 0
        for (let i = range.begin; i < range.end; i++) {
            this._data[i] = items[k++]
        }

        this._applyRequest(
            this._requestedItems,
            this._requestedRange ? this._requestedRange : new Range(0, this._requestedItems.length))
    }

    protected _reset() {
        this._data = {}
        this._ranges.length = 0
        this._requestedRange = null
    }

    public dispose() {
        this._subscriptions.unsubscribe()
        this._reset()
    }

    // protected rangeBegin: number = -1
    // protected rangeEnd: number = -1

    // protected _viewBegin: number = 0
    // protected _view: T[] = []

    // protected subscriptions: Subscriptions = new Subscriptions()

    // public get items(): T[] { return this._view }
    // public get range(): RangeQuery {
    //     return {
    //         kind: "range",
    //         begin: this._viewBegin,
    //         end: this._viewBegin + this._view.length
    //     }
    // }

    // public get maxItemCount(): number { return this._maxItemCount }
    // protected _maxItemCount: number = 0

    // public get idField(): string | string[] {
    //     return this.source.idField
    // }
    // public set idField(val: string | string[]) {
    //     if (this._idFieldLocked) {
    //         throw new Error("Can't set idField valou on DataView")
    //     }
    // }
    // private _idFieldLocked: boolean

    // public constructor(protected source: DataSource<T>) {
    //     super()
    //     if (!source) {
    //         throw new Error("Missing source while creating a DataView")
    //     }
    //     this._idFieldLocked = true
    // }

    // public setRange(begin: number, end: number) {
    //     if (begin > end) {
    //         throw new Error("Begin must be smaller than end")
    //     }

    //     if (this.rangeBegin !== begin || this.rangeEnd !== end) {
    //         if (begin >= this.rangeBegin && begin <= this.rangeEnd) {
    //             begin = this.rangeEnd
    //         }

    //         if (end >= this.rangeBegin && end <= this.rangeEnd) {
    //             end = this.rangeBegin
    //         }

    //         if (begin < end) {
    //             let range: RangeQuery = { kind: "range", begin, end }
    //             this.rangeBegin = begin
    //             this.rangeEnd = end
    //             if (this.source.range.isEq(range) && !this.source.isBusy) {
    //                 this.appendData(range, this.source.items)
    //             } else {
    //                 this.subscriptions.add(this.source.itemsChanged).pipe(take(1)).subscribe((data) => {
    //                     this.appendData(range, data.items)
    //                 })
    //                 this.source.range.set(range)
    //             }
    //         } else {
    //             // request the subset of this current range
    //         }
    //     }
    // }

    // protected appendData(range: RangeQuery, data: T[]) {
    //     let old = this._view
    //     let oldBegin = this._viewBegin

    //     this._view = data.slice(0)
    //     this._viewBegin = range.begin
    //     this._maxItemCount = Math.max(this._maxItemCount, this._viewBegin + this._view.length)
    //     let changed = this.emitChanged(old, this._view, oldBegin, this._viewBegin)
    //     console.log("view changed", changed)
    // }

    // public getIndex(id: CollectionItemId): number {
    //     let i = super.getIndex(id)
    //     return i === -1 ? i : i + this._viewBegin
    // }

    // public forEach(cb: (item: T, index: number) => void) {
    //     for (let i = 0, items = this._view, l = items.length; i < l; i++) {
    //         cb(items[i], i + this._viewBegin)
    //     }
    // }

    // public dispose() {
    //     this.subscriptions.unsubscribe()
    // }
}
