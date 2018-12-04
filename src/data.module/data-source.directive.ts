import { Directive, Input, Inject, OnDestroy } from "@angular/core"
import { Observable } from "rxjs"


import { NzRange } from "../util"
import { Model, ID } from "./model"
import { DataSource, Filter, Sorter } from "./data-source"
import { DataStorage } from "./data-storage"


@Directive({
    selector: "[dataSource]"
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
            }
        } else if (val instanceof DataStorage) {
            if (this._disposeStroage && this._storage && this._storage !== val) {
                this._storage.dispose()
            }
            this._disposeStroage = false
            this._storage = val
        } else if (val instanceof DataSourceDirective) {
            this._dsd = val
        } else if (val === null) {
            if (this._disposeStroage && this._storage) {
                this._storage.dispose()
            }
            this._disposeStroage = false
        } else {
            throw new Error(`Unexpected value: ${val}`)
        }
    }

    public get storage(): DataStorage<T> {
        return this._dsd ? this._dsd.storage : this._storage
    }
    private _storage: DataStorage<T>
    private _source: DataSource<T>
    private _disposeStroage: boolean
    private _dsd: DataSourceDirective<T>

    // public baseFilter: Filter<T>
    public set baseFilter(val: Filter<T>) {
        this._baseFilter = val
        this._updateFilter()
    }
    private _baseFilter: Filter<T>

    public set filter(f: Filter<T>) {
        this._filter = f
        this._updateFilter()
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

    public getRange(r: NzRange) {
        this._updateFilter()
        return this.storage.getRange(r)
    }

    public get(id: ID): Observable<T> {
        return this.storage.source.get(id)
    }

    protected _updateFilter(silent?: boolean) {
        let f = {} as Filter<T>
        if (this._baseFilter) {
            f = Object.assign(f, this._baseFilter)
        }
        if (this._filter) {
            f = Object.assign(f, this._filter)
        }
        this.storage.filter.set(f, silent)
    }

    public ngOnDestroy() {
        this.dataSource = null
        delete this._dsd
    }
}


@Directive({
    selector: "[filter]"
})
export class FilterDirective {
    @Input()
    public set filter(val: Filter<any>) {
        this.src.baseFilter = val
    }

    public constructor(@Inject(DataSourceDirective) protected readonly src: DataSourceDirective) { }
}


@Directive({
    selector: "[sorter]"
})
export class SorterDirective {
    @Input()
    public set sorter(val: Sorter<any>) {
        this.src.sort = val
    }

    public constructor(@Inject(DataSourceDirective) protected readonly src: DataSourceDirective) { }
}
