import { EventEmitter } from "@angular/core"
import { Observable, of, Subject } from "rxjs"
import { map, takeUntil, take, startWith, debounceTime, tap, shareReplay } from "rxjs/operators"
// import * as DeepDiff from "deep-diff"
const DeepDiff = require("deep-diff")

import { Subscriptions } from "../util"
import { DataSource, Filter, Sorter, Diff, MappingChangingEvent, MappingChangedEvent } from "./data-source"
import { Model, ID } from "./model"
import { Collection, ItemsWithChanges, Items } from "./collection"
import { Range, RangeList } from "./range"
import { StaticSource } from "./static-source"


export class DataStorage<T extends Model, F = Filter<T>> extends Collection<T> {
    public readonly filter = new DictField<F>()
    public readonly sorter = new DictField<Sorter<T>>()
    public readonly range: Range = new Range(0, 0)
    public readonly lastIndex: number = 0
    public itemsPerRequest = 30

    public get items(): Observable<ItemsWithChanges<T>> {
        return this._itemsStream.pipe(startWith(this._collectRange(this.range)))
    }

    public readonly reseted: Observable<void> = new EventEmitter()

    public get invalidated(): Observable<void> {
        return Observable.create((observer: any) => {
            let s1 = this.filter.changed.subscribe(observer)
            let s2 = this.sorter.changed.subscribe(observer)
            // let s3 = this.reseted.subscribe(observer)
            return () => {
                s1.unsubscribe()
                s2.unsubscribe()
                // s3.unsubscribe()
            }
        }).pipe(debounceTime(15))
    }

    protected cache: { [key: number]: T } = {}
    protected cachedRanges: RangeList = new RangeList()
    protected s = new Subscriptions()
    protected cancel = new Subject()
    protected readonly _itemsStream: Observable<ItemsWithChanges<T>> = new EventEmitter()
    protected total: number
    protected pendingRanges: Array<[Range, Observable<any>]> = []

    public constructor(protected readonly source: DataSource<T>) {
        super()

        this.s.add(this.invalidated).subscribe(x => {
            this.reset()
        })
    }

    public getRange(r: Range): Observable<ItemsWithChanges<T>> {
        if (this.total) {
            r = new Range(Math.min(this.total, r.begin), Math.min(this.total, r.end))
        }

        if (!this.cachedRanges.contains(r)) {
            let oldValues = this._collectRange(r)
            let rrange = this.cachedRanges.merge(r).diff(this.cachedRanges).span()

            if (rrange.begin + this.itemsPerRequest >= rrange.end) {
                rrange = new Range(rrange.begin, rrange.begin + this.itemsPerRequest)
            }

            let pending = this._getPending(rrange)
            if (pending) {
                return pending
            }

            return this._setPending(
                rrange,
                this.s.add(this.source.search(this.filter.get(), this.sorter.get(), rrange))
                    // .pipe(take(1))
                    .pipe(map(items => {
                        (this as any).range = items.range || r
                        if (items.total != null) {
                            (this as any).lastIndex = items.total
                            this.total = items.total
                        }
                        this._cacheItems(items, this.range, oldValues)
                        return this._collectRange(this.range, oldValues)
                    }))
            )
        } else {
            (this as any).range = r
            let items = this._collectRange(r)
            return this.s.add(of(items))
        }
    }

    public getPosition(id: ID): Observable<number> {
        return this.source.getPosition(id)
    }

    public reset() {
        this.cache = {}
        this.cachedRanges = new RangeList();
        this.pendingRanges = []

        this.total = 0;
        (this as any).lastIndex = 0;
        (this.reseted as EventEmitter<void>).emit()
    }

    protected _cacheItems(items: T[], r: Range, oldValues: ItemsWithChanges<T>): ItemsWithChanges<T> {
        for (let k = 0, l = items.length; k < l; k++) {
            this.cache[r.begin + k] = items[k]
        }
        this.cachedRanges = this.cachedRanges.merge(r);
        (this as any).range = this.cachedRanges.span();
        (this as any).lastIndex = Math.max(this.lastIndex, r.begin + items.length)
        let newItems = this._collectRange(r, oldValues);
        (this._itemsStream as EventEmitter<ItemsWithChanges<T>>).emit(newItems)

        return newItems
    }

    protected _collectRange(r: Range, o: Items<T> = [] as any): ItemsWithChanges<T> {
        let items: ItemsWithChanges<T> = new ItemsWithChanges([], r, this.total, o)
        for (let i = r.begin; i < r.end; i++) {
            if (this.cache[i]) {
                items.push(this.cache[i])
            }
        }
        return items
    }

    protected _getPending(r: Range): Observable<ItemsWithChanges<T>> {
        for (const item of this.pendingRanges) {
            if (item[0].contains(r.begin) && item[0].contains(r.end)) {
                return item[1]
            }
        }
    }

    protected _setPending(r: Range, s: Observable<ItemsWithChanges<T>>): Observable<ItemsWithChanges<T>> {
        s = s.pipe(tap(() => {
            let idx = this.pendingRanges.findIndex((v) => v[0] === r)
            if (idx !== -1) {
                this.pendingRanges.splice(idx, 1)
            }
        }), shareReplay())

        this.pendingRanges.push([r, s])
        return s
    }

    public dispose() {
        this.s.unsubscribe()
    }
}


export class DictField<E> {
    public readonly changed: Observable<MappingChangedEvent<E>> = new EventEmitter()
    public readonly changing: Observable<MappingChangingEvent<E>> = new EventEmitter()

    public get(): E {
        return deepClone(this._value)
    }
    public set(value: E) {
        this._tryChanging(this._value, value)
    }
    public update(value: E) {
        let val = deepClone(this._value) || {}
        this.set({ ...val, ...value as any })
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


function deepClone<T>(any: T): T {
    if (any !== undefined) {
        let s = JSON.stringify(any)
        return JSON.parse(s)
    } else {
        return undefined
    }
}
