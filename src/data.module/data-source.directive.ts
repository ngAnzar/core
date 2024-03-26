import { Directive, Input, Inject, OnDestroy, EventEmitter } from "@angular/core"
import { Observable, ReplaySubject, Subscription, distinctUntilChanged, shareReplay,map, switchMap, of, tap, BehaviorSubject, take, combineLatest } from "rxjs"


import { NzRange } from "../util"
import { Model, PrimaryKey } from "./model"
import { DataSource, Filter, Sorter, LoadFields } from "./data-source"
import { DataStorage, MappingChangedEvent } from "./data-storage"
import { Items } from "./collection"

import { Destructible } from "../util"

type InputSource<T extends Model> = DataSource<T> | DataStorage<T> | DataSourceDirective<T>

@Directive({
    selector: "[dataSource]",
    exportAs: "dataSource"
})
export class DataSourceDirective<T extends Model = Model> extends Destructible {
    // @Input()
    // public set dataSource(val: InputSource<T>) {
    //     if (val instanceof DataSource) {
    //         if (this._source !== val) {
    //             this._source = val
    //             if (this._disposeStroage && this._storage) {
    //                 this._storage.dispose()
    //             }
    //             this._disposeStroage = true
    //             this._storage = new DataStorage(val)
    //             this._onStorageChange()
    //         }
    //     } else if (val instanceof DataStorage) {
    //         if (this._storage !== val) {
    //             if (this._disposeStroage && this._storage) {
    //                 this._storage.dispose()
    //             }
    //             this._storage = val
    //             this._onStorageChange()
    //         }
    //         this._disposeStroage = false
    //     } else if (val instanceof DataSourceDirective) {
    //         this._dsd = val
    //     } else if (val === null) {
    //         if (this._disposeStroage && this._storage) {
    //             this._storage.dispose()
    //         }
    //         this._disposeStroage = false
    //         if (this._storage != null) {
    //             this._storage = null
    //             this._onStorageChange()
    //         }
    //     } else {
    //         console.log(val)
    //         throw new Error(`Unexpected value: ${val}`)
    //     }

    //     if (this._pendingFields) {
    //         let pf = this._pendingFields
    //         delete this._pendingFields
    //         this.storage.loadFields(pf)
    //     }
    // }

    @Input()
    public set dataSource(val: InputSource<T>) {
        this._source = val
        this.src$.next(val)
    }

    public src$ = new ReplaySubject<InputSource<T>>(1)

    public storage$: Observable<DataStorage<T>> = this.src$.pipe(
        distinctUntilChanged((p, n) => p !== n),
        switchMap(src => {
            if (src instanceof DataSource) {
                return of(new DataStorage(src))
            } else if (src instanceof DataStorage) {
                return of(src)
            } else if (src instanceof DataSourceDirective) {
                // TODO: try to remove
                this._dsd = src
                return src.storage$
            }
        }),
        tap(storage => {
            (this as {storage: DataStorage<T>}).storage = storage
        }),
        shareReplay(1)
    )

    public readonly storage?: DataStorage<T>
    public readonly filterChanges = this.storage$.pipe(switchMap(storage => storage.filter.changed))
    public readonly sorterChanges = this.storage$.pipe(switchMap(storage => storage.sorter.changed))

    private readonly _loadFields = new BehaviorSubject<LoadFields<T> | undefined>(undefined)

    public get isEmpty() {
        return this.storage && this.storage.isEmpty
    }

    public get isBusy() {
        return this.storage && this.storage.isBusy
    }

    private _source: InputSource<T>
    private _dsd: DataSourceDirective<T>

    // public baseFilter: Filter<T>
    public set baseFilter(val: Filter<T>) {
        if (this._dsd) {
            this._dsd.baseFilter = val
        } else {
            this._baseFilter = val
            this._updateFilter()
        }
    }
    private _baseFilter: Filter<T>

    public set filter(f: Filter<T>) {
        if (this._dsd) {
            this._dsd.filter = f
        } else {
            this._filter = f
            this._updateFilter()
        }
    }
    public get filter(): Filter<T> {
        return this.storage?.filter.get() || {}
    }
    private _filter: Filter<T>

    public setFilterSilent(f: Filter<T>) {
        if (this._dsd) {
            this._dsd.setFilterSilent(f)
        } else {
            this._filter = f
            this._updateFilter(true)
        }
    }

    public set sort(s: Sorter<T>) {
        this.storage?.sorter.set(s)
    }
    public get sort(): Sorter<T> {
        return this.storage?.sorter.get()
    }

    public get async(): boolean {
        return this.storage.source.async
    }

    public constructor() {
        super()

        this.destruct.any(() => {
            delete this._dsd
        })

        this.destruct.subscription(combineLatest({
            storage: this.storage$,
            loadFields: this._loadFields
        })).subscribe(({ storage, loadFields }) => {
            if (storage) {
                storage.loadFields(loadFields)
            }
        })
    }

    public getPosition(id: PrimaryKey) {
        return this.storage.getPosition(id)
    }

    public getRange(r: NzRange): Items<T> {
        if (this._dsd) {
            return this._dsd.getRange(r)
        } else {
            this._updateFilter()
            return this.storage.getRange(r)
        }
    }

    public loadRange(r: NzRange): boolean {
        if (this._dsd) {
            return this._dsd.loadRange(r)
        } else {
            this._updateFilter()
            return this.storage.loadRange(r)
        }
    }

    public get(id: PrimaryKey): Observable<T> {
        return this.storage.source.get(id, this.storage.meta.get())
    }

    public reload() {
        this.storage?.reload()
    }

    public loadFields(f: LoadFields<T>) {
        this._loadFields.next(f || undefined)
    }

    protected _updateFilter(silent?: boolean) {
        let f = {}
        if (this._filter) {
            f = { ...this._filter as any }
        }
        if (this._baseFilter) {
            f = { ...f, ...this._baseFilter as any }
        }
        this.storage?.filter.set(f, silent)
    }

    public clone() {
        const result = new DataSourceDirective<T>()
        result.dataSource = this._source
        result.baseFilter = this._baseFilter
        result.filter = this._filter
        result.sort = this.sort
        const lf = this.storage.meta.get()?.loadFields
        if (lf) {
            result.loadFields(lf)
        }
        return result
    }
}


@Directive({
    selector: "[dsFilter]"
})
export class FilterDirective {
    @Input()
    public set dsFilter(val: Filter<any>) {
        this.src.baseFilter = val
    }

    public constructor(@Inject(DataSourceDirective) protected readonly src: DataSourceDirective) { }
}


@Directive({
    selector: "[dsSorter]"
})
export class SorterDirective {
    @Input()
    public set dsSorter(val: Sorter<any>) {
        this.src.sort = val
    }

    public constructor(@Inject(DataSourceDirective) protected readonly src: DataSourceDirective) { }
}


@Directive({
    selector: "[dsFields]"
})
export class FieldsDirective {
    @Input()
    public set dsFields(val: LoadFields<Model>) {
        this.src.loadFields(val)
    }

    public constructor(@Inject(DataSourceDirective) protected readonly src: DataSourceDirective) { }
}
