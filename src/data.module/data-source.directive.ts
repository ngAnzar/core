import { Directive, Input, Inject, OnDestroy, EventEmitter } from "@angular/core"
import { Observable, Subscription } from "rxjs"


import { NzRange } from "../util"
import { Model, PrimaryKey } from "./model"
import { DataSource, Filter, Sorter, LoadFields } from "./data-source"
import { DataStorage, MappingChangedEvent } from "./data-storage"
import { Items } from "./collection"


@Directive({
    selector: "[dataSource]",
    exportAs: "dataSource"
})
export class DataSourceDirective<T extends Model = Model> implements OnDestroy {
    @Input()
    public set dataSource(val: DataSource<T> | DataStorage<T> | DataSourceDirective<T>) {
        if (val instanceof DataSource) {
            if (this._source !== val) {
                this._source = val
                if (this._disposeStroage && this._storage) {
                    this._storage.dispose()
                }
                this._disposeStroage = true
                this._storage = new DataStorage(val)
                this._onStorageChange()
            }
        } else if (val instanceof DataStorage) {
            if (this._storage !== val) {
                if (this._disposeStroage && this._storage) {
                    this._storage.dispose()
                }
                this._storage = val
                this._onStorageChange()
            }
            this._disposeStroage = false
        } else if (val instanceof DataSourceDirective) {
            this._dsd = val
        } else if (val === null) {
            if (this._disposeStroage && this._storage) {
                this._storage.dispose()
            }
            this._disposeStroage = false
            if (this._storage != null) {
                this._storage = null
                this._onStorageChange()
            }
        } else {
            console.log(val)
            throw new Error(`Unexpected value: ${val}`)
        }

        if (this._pendingFields) {
            let pf = this._pendingFields
            delete this._pendingFields
            this.storage.loadFields(pf)
        }
    }

    public get storage(): DataStorage<T> {
        return this._dsd ? this._dsd.storage : this._storage
    }

    public get filterChanges(): Observable<MappingChangedEvent<Filter<T>>> {
        return this._dsd ? this._dsd.filterChanges : this._filterChanges
    }

    public get sorterChanges(): Observable<MappingChangedEvent<Sorter<T>>> {
        return this._dsd ? this._dsd.sorterChanges : this._sorterChanges
    }

    public get isEmpty() {
        return this.storage && this.storage.isEmpty
    }

    public get isBusy() {
        return this.storage && this.storage.isBusy
    }

    private _storage: DataStorage<T>
    private _source: DataSource<T>
    private _disposeStroage: boolean
    private _dsd: DataSourceDirective<T>
    private _filterSubscription: Subscription
    private _filterChanges: Observable<MappingChangedEvent<Filter<T>>> = new EventEmitter()
    private _sorterSubscription: Subscription
    private _sorterChanges: Observable<MappingChangedEvent<Sorter<T>>> = new EventEmitter()
    private _pendingFields: any

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
        return this.storage.filter.get() || {}
    }
    private _filter: Filter<T>

    public set sort(s: Sorter<T>) {
        this.storage.sorter.set(s)
    }
    public get sort(): Sorter<T> {
        return this.storage.sorter.get()
    }

    public get async(): boolean {
        return this.storage.source.async
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
        this.storage.reload()
    }

    public loadFields(f: LoadFields<T>) {
        let s = this.storage
        if (s) {
            s.loadFields(f)
        } else {
            this._pendingFields = f
        }
    }

    protected _updateFilter(silent?: boolean) {
        let f = {}
        if (this._filter) {
            f = { ...f, ...this._filter as any }
        }
        if (this._baseFilter) {
            f = { ...f, ...this._baseFilter as any }
        }
        this.storage.filter.set(f, silent)
    }

    protected _onStorageChange() {
        if (this._filterSubscription) {
            this._filterSubscription.unsubscribe()
            delete this._filterSubscription
        }

        if (this._sorterSubscription) {
            this._sorterSubscription.unsubscribe()
            delete this._sorterSubscription
        }

        if (this._storage) {
            this._storage.filter.changed
                .subscribe((this._filterChanges as EventEmitter<MappingChangedEvent<Filter<T>>>))
            this.storage.sorter.changed
                .subscribe((this._sorterChanges as EventEmitter<MappingChangedEvent<Sorter<T>>>))
        }
    }

    public ngOnDestroy() {
        this.dataSource = null
        delete this._dsd
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
