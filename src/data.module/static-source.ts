import { Observable, of } from "rxjs"
import { map } from "rxjs/operators"

import { NzRange, getPath } from "../util"
import { DataSource, Filter, FilterValue, Filter_Exp, Sorter } from "./data-source"
import { Model, PrimaryKey, ModelClass, RawData } from "./model"
import { Items } from "./collection"


export type CustomFilter<T extends Model = Model> = (record: T, filterValue: any) => boolean
export type CustomSorter<T extends Model = Model> = (a: T, b: T, dir: "asc" | "desc") => number


export class StaticSource<T extends Model> extends DataSource<T> {
    public readonly async = false
    public readonly data: Readonly<Array<Readonly<T>>>

    protected readonly _customFilter: { [key: string]: CustomFilter<T> } = {}
    protected readonly _customSorter: { [key: string]: CustomSorter<T> } = {}

    public get total(): number {
        return this.data.length
    }

    public get isEmpty(): boolean {
        return this.data.length === 0
    }

    public constructor(
        model: ModelClass<T>,
        data: Array<Readonly<RawData<T>>>) {
        super()
        this.data = data.map(item => item instanceof model ? item : new model(item))
    }

    public addCustomFilter(name: string, filter: CustomFilter<T>): void {
        this._customFilter[name] = filter
    }

    public addCustomSorter(name: string, sorter: CustomSorter<T>): void {
        this._customSorter[name] = sorter
    }

    public getPosition(pk: PrimaryKey, filter?: Filter<T>, sorter?: Sorter<T>): Observable<number> {
        return this._search(filter, sorter).pipe(
            map(items => {
                return items.findIndex(item => item.pk === pk)
            })
        )
    }

    protected _save(model: T): Observable<T> {
        throw new Error("StaticSource not supports save")
    }

    protected _remove(id: PrimaryKey): Observable<boolean> {
        throw new Error("StaticSource not supports delete")
    }

    protected _search(filter?: Filter<T>, sorter?: Sorter<T>, range?: NzRange): Observable<any[]> {
        let result: any[] = this.data.slice(0)

        if (filter) {
            result = result.filter(v => this._testFilters(filter, v))
        }

        let total = result.length

        if (sorter) {
            result = result.sort((a: any, b: any) => {
                let idx = 0
                for (let field in sorter) {
                    const custom = this._customSorter[field]
                    if (custom) {
                        idx = custom(a, b, sorter[field])
                    } else if (typeof a[field] === "string") {
                        let r = a[field].localeCompare(b[field])
                        if (r !== 0) {
                            idx = r === -1 && sorter[field] === "asc" ? -1 : 1
                        }
                    } else {
                        if (a[field] < b[field]) {
                            idx = sorter[field] === "asc" ? -1 : 1
                        } else if (a[field] > b[field]) {
                            idx = sorter[field] === "asc" ? 1 : -1
                        }
                    }

                    if (idx !== 0) {
                        return idx
                    }
                }
                return 0
            })
        }

        if (range) {
            result = result.slice(range.begin, range.end)
        }

        // console.log("result...", result, { filter, sorter, range, total })
        return of(new Items(result, range, total))
    }

    protected _get(id: PrimaryKey): Observable<T> {
        return of(this.getSync(id))
    }

    protected _testFilters(filter: Filter<T>, value: { [key: string]: any }) {
        for (const k in filter) {
            if (this._customFilter.hasOwnProperty(k)) {
                if (!this._customFilter[k](value as T, filter[k])) {
                    return false
                }
            } else if (!this._testFilter(filter[k], getPath(value, k))) {
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
        } else if ("contains" in filter) {
            return typeof value === "string" && value.toLocaleLowerCase().indexOf(filter.contains.toLocaleLowerCase()) > -1
        } else if ("startsWith" in filter) {
            return typeof value === "string" && value.startsWith(filter.startsWith)
        } else if ("endsWith" in filter) {
            return typeof value === "string" && value.endsWith(filter.endsWith)
        } else {
            throw new Error("Unexpected filter: " + filter)
        }
    }

    public getSync(pk: PrimaryKey): T {
        for (let item of this.data) {
            if (item.pk === `${pk}`) {
                return item
            }
        }
        return null
    }

    public replace(data: T[]) {
        (this as any).data = data
        this.invalidate(true)
    }

    public add(model: T, index?: number) {
        if (index != null) {
            (this.data as any).splice(index, 0, model)
        } else {
            (this.data as any).push(model)
        }
        this.invalidate()
    }

    public move(model: T, index: number) {
        let oldIndex = (this.data as T[]).indexOf(model)
        if (oldIndex === -1) {
            this.add(model, index)
        } else if (oldIndex !== index) {
            (this.data as T[]).splice(oldIndex, 1);
            (this.data as T[]).splice(index, 0, model)
            this.invalidate()
        }
    }

    public del(model: T) {
        let idx = this.data.indexOf(model)
        if (idx !== -1) {
            this.removeAt(idx)
        }
    }

    public removeAt(idx: number) {
        const removed = (this.data as any).splice(idx, 1)
        if (removed && removed.length > 0) {
            this.invalidate()
        }
    }
}
