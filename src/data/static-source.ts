import { Observable, of } from "rxjs"
// import { of } from "rxjs/operators"

import { DataSource, Filter, FilterValue, Filter_Exp, Sorter } from "./data-source"
import { Model, ID, ModelClass, RawData } from "./model"
import { Range } from "./range"


export class StaticSource<T extends Model> extends DataSource<T> {
    public readonly async = false
    public readonly data: Array<Readonly<T>>

    public constructor(
        public readonly model: ModelClass<T>,
        data: Array<Readonly<RawData<T>>>) {
        super()
        this.data = data.map(this.makeModel.bind(this))
    }

    public getPosition(id: ID): Observable<number> {
        let pos = -1
        for (let i = 0, l = this.data.length; i < l; i++) {
            if (this.data[i].id === id) {
                return of(i)
            }
        }
        return of(pos)
    }

    protected _save(model: T): Observable<T> {
        throw new Error("StaticSource not supports save")
    }

    protected _delete(id: ID): Observable<boolean> {
        throw new Error("StaticSource not supports delete")
    }

    protected _search(filter?: Filter<T>, sorter?: Sorter<T>, range?: Range): Observable<any[]> {
        let result: any[] = this.data.slice(0)

        if (filter) {
            result = result.filter(v => this._testFilters(filter, v))
        }

        if (sorter) {
            result = result.sort((a: any, b: any) => {
                for (let field in sorter) {
                    if (typeof a[field] === "string") {
                        let r = a[field].localeCompare(b[field])
                        if (r !== 0) {
                            return r === -1 && sorter[field] === "asc" ? -1 : 1
                        }
                    } else {
                        if (a[field] < b[field]) {
                            return sorter[field] === "asc" ? -1 : 1
                        } else if (a[field] > b[field]) {
                            return sorter[field] === "asc" ? 1 : -1
                        }
                    }
                }
                return 0
            })
        }

        if (range) {
            result = result.slice(range.begin, range.end)
        }

        // console.log("result...", result, { filter, sorter, range })
        return of(result)
    }

    protected _get(id: ID): Observable<T> {
        return of(this.getSync(id))
    }

    protected _testFilters(filter: Filter<T>, value: { [key: string]: any }) {
        for (const k in filter) {
            if (!this._testFilter(filter[k], value[k])) {
                return false
            }
        }
        return true
    }

    protected _testFilter(filter: FilterValue<any>, value: any): boolean {
        if (filter === null) {
            return value === null
        } else if (typeof filter === "boolean") {
            return value === filter
        } else if (typeof filter === "string") {
            return value === filter
        } else if (typeof filter === "number") {
            return value === filter
        } else if ("min" in filter) {
            if ("max" in filter) {
                return filter.min <= value && filter.max >= value
            } else {
                throw new Error("Missing max value from min-max filter")
            }
        } else if ("max" in filter) {
            throw new Error("Missing min value from min-max filter")
        } else if ("eq" in filter) {
            return filter.eq === value
        } else if ("neq" in filter) {
            return filter.neq !== value
        } else if ("gt" in filter) {
            return filter.gt > value
        } else if ("gte" in filter) {
            return filter.gte >= value
        } else if ("lt" in filter) {
            return filter.lt < value
        } else if ("lte" in filter) {
            return filter.lte <= value
        } else if ("or" in filter && filter.or.length > 0) {
            return filter.or.filter((f: Filter_Exp<any>) => this._testFilter(f, value)).length > 0
        } else if ("and" in filter && filter.and.length > 0) {
            return filter.and.filter((f: Filter_Exp<any>) => this._testFilter(f, value)).length === filter.and.length
        } else {
            throw new Error("Unexpected filter: " + filter)
        }
    }

    public getSync(id: ID): T {
        for (let item of this.data) {
            if (item.id === id) {
                return item
            }
        }
        return null
    }
}
