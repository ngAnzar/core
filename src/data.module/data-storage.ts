import { EventEmitter } from "@angular/core"
import { Observable, of, Subject } from "rxjs"
import { map, startWith, debounceTime, tap, shareReplay } from "rxjs/operators"
const DeepDiff = require("deep-diff")


import { Destruct, IDisposable, NzRange, NzRangeList } from "../util"
import { DataSource, Filter, Sorter } from "./data-source"
import { Model, ID } from "./model"
import { Collection, Items } from "./collection"


export class DataStorage<T extends Model, F = Filter<T>> extends Collection<T> implements IDisposable {
    public readonly filter = new DictField<F>()
    public readonly sorter = new DictField<Sorter<T>>()
    public readonly range: NzRange = new NzRange(0, 0)
    public readonly lastIndex: number = 0
    public readonly endReached: boolean = false
    public readonly destruct = new Destruct(() => {
        delete this.cache
        this.cachedRanges.length = 0
    })


    public get items(): Observable<Items<T>> {
        return this._itemsStream.pipe(startWith(this._collectRange(this.range)))
    }

    // public get all(): Observable<Items<T>> {
    //     return this.getRange(new Range(0, 1000))
    //     // if (this.endReached) {

    //     // }

    //     // return this.source.search(this.filter.get(), this.sorter.get())
    //     //     .pipe(map(items => {
    //     //         (this as any).range = new Range(0, items.length);
    //     //         (this as any).endReached = true;
    //     //         (this as any).lastIndex = items.length;
    //     //         (this as any).total = items.length

    //     //         this._cacheItems(items, this.range, [] as any)
    //     //         return this._collectRange(this.range, [] as any)
    //     //     }))
    // }

    public readonly reseted: Observable<void> = new EventEmitter()

    public get invalidated(): Observable<void> {
        return Observable.create((observer: any) => {
            let s1 = this.filter.changed.subscribe(observer)
            let s2 = this.sorter.changed.subscribe(observer)
            let s3 = this.reseted.subscribe(observer)
            return () => {
                s1.unsubscribe()
                s2.unsubscribe()
                s3.unsubscribe()
            }
        }).pipe(debounceTime(15))
    }

    protected cache: { [key: number]: T } = {}
    protected cachedRanges: NzRangeList = new NzRangeList()
    protected cancel = new Subject()
    protected readonly _itemsStream: Observable<Items<T>> = new EventEmitter()
    protected total: number
    protected pendingRanges: Array<[NzRange, Observable<any>]> = []

    public constructor(public readonly source: DataSource<T>, filter?: F, sorter?: Sorter<T>) {
        super()

        if (filter) {
            this.filter.set(filter)
        }
        if (sorter) {
            this.sorter.set(sorter)
        }

        this.destruct.subscription(this.invalidated).subscribe(x => {
            this.reset(true)
        })
    }

    public getRange(r: NzRange): Observable<Items<T>> {
        if (this.total) {
            r = new NzRange(Math.min(this.total, r.begin), Math.min(this.total, r.end))
        }

        if (!this.cachedRanges.contains(r) && !this.endReached) {
            let rrange = this.cachedRanges.merge(r).diff(this.cachedRanges).span()

            let pending = this._getPending(rrange)
            if (pending) {
                return pending
            }

            return this._setPending(
                rrange,
                this.destruct.subscription(this.source.search(this.filter.get(), this.sorter.get(), rrange))
                    // .pipe(take(1))
                    .pipe(map(items => {
                        (this as any).range = items.range || r
                        if (items.total != null) {
                            (this as any).lastIndex = items.total;
                            (this as any).endReached = items.total <= this.range.end
                            this.total = items.total
                        } else {
                            (this as any).endReached = r.length !== items.length
                        }
                        this._cacheItems(items, this.range)
                        return this._collectRange(this.range)
                    }))
            )
        } else {
            (this as any).range = r
            let items = this._collectRange(r)
            return this.destruct.subscription(of(items))
        }
    }

    public getPosition(id: ID): Observable<number> {
        return this.source.getPosition(id)
    }

    public reload() {
        this.reset(false)
    }

    protected reset(skipEvent?: boolean) {
        this.cache = {}
        this.cachedRanges = new NzRangeList();
        this.pendingRanges = []

        this.total = 0;
        (this as any).lastIndex = 0;
        (this as any).endReached = false;
        if (skipEvent !== true) {
            (this.reseted as EventEmitter<void>).emit()
        }
    }

    protected _cacheItems(items: T[], r: NzRange): Items<T> {
        for (let k = 0, l = items.length; k < l; k++) {
            this.cache[r.begin + k] = items[k]
        }
        this.cachedRanges = this.cachedRanges.merge(r);
        (this as any).range = this.cachedRanges.span();
        (this as any).lastIndex = Math.max(this.lastIndex, r.begin + items.length);
        // (this as any).endReached = this.endReached || items.length === 0 || items.length !== r.length
        let newItems = this._collectRange(r);
        (this._itemsStream as EventEmitter<Items<T>>).emit(newItems)

        return newItems
    }

    protected _collectRange(r: NzRange): Items<T> {
        let items: Items<T> = new Items([], r, this.total)
        for (let i = r.begin; i < r.end; i++) {
            if (this.cache[i]) {
                items.push(this.cache[i])
            }
        }
        return items
    }

    protected _getPending(r: NzRange): Observable<Items<T>> {
        for (const item of this.pendingRanges) {
            if (item[0].contains(r.begin) && item[0].contains(r.end)) {
                return item[1]
            }
        }
    }

    protected _setPending(r: NzRange, s: Observable<Items<T>>): Observable<Items<T>> {
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
        this.destruct.run()
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
