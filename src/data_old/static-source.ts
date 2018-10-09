import { DataSource, Filter, FilterValue, PositionQuery } from "./data-source"
import { Range } from "./range"
import { Subscriptions } from "../util"


export class StaticSource<T extends Object, F extends Filter = Filter> extends DataSource<T, F> {
    public readonly isRemote: boolean = false
    public readonly isBusy: boolean = false

    public get range(): Range { return this._range }
    protected _range: Range

    protected subscriptions: Subscriptions = new Subscriptions()

    public set items(val: T[]) {
        this._data = val
        this._applyModifications()
        this.emitChanged(this._data, this._modifiedData)
    }

    public get items(): T[] {
        return this._data
    }

    private _modifiedData: T[]

    public constructor(protected _data: T[]) {
        super()
        this._modifiedData = _data.slice(0)
        this._range = new Range(0, _data.length)

        this.subscriptions.add(this.filter.changed).subscribe(() => {
            this._applyModifications()
        })

        this.subscriptions.add(this.position.changed).subscribe(() => {
            this._applyModifications()
        })
    }

    protected _applyModifications() {
        let filter = this.filter.get()
        let oldData: T[] = this._modifiedData
        let data: T[] = this._data

        if (filter) {
            data = data.filter(v => this._applyFilter(filter, v))
            this._range = new Range(0, data.length)
        }

        let sorter = this.sorter.get()
        if (sorter) {
            data = data.sort((a: any, b: any) => {
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

        let range = this.position.get()
        if (range) {
            if (range.kind === "range") {
                this._range = new Range(Math.max(0, range.begin), Math.min(data.length, range.end))
            } else if (range.kind === "position") {
                let pos = this.getIndex(range.elementId)
                this._range = pos !== -1
                    ? new Range(Math.max(0, pos - range.before), Math.min(data.length, pos + range.after))
                    : new Range(0, Math.min(data.length, range.before + range.after))
            }

            data = data.slice(this._range.begin, this._range.end)
        }

        this.emitChanged(oldData, this._modifiedData = data)
    }

    protected _applyFilter(filter: Filter, value: { [key: string]: any }) {
        for (const k in filter) {
            if (!this._testFilter(filter[k], value[k])) {
                return false
            }
        }
        return true
    }

    protected _testFilter(filter: FilterValue, value: any): boolean {
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
            return filter.or.filter(f => this._testFilter(f, value)).length > 0
        } else if ("and" in filter && filter.and.length > 0) {
            return filter.and.filter(f => this._testFilter(f, value)).length === filter.and.length
        } else {
            throw new Error("Unexpected filter: " + filter)
        }
    }

    public dispose() {
        this.subscriptions.unsubscribe()
        delete this._data
        delete this._modifiedData
    }
}
