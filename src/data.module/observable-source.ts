import { Observable } from "rxjs"
import { map, shareReplay } from "rxjs/operators"

import { NzRange } from "../util"
import { DataSource, Filter, Meta, Sorter } from "./data-source"
import { Model, PrimaryKey } from "./model"
import { Items } from "./collection"
import { reduceValues } from "./static-source"


export class ObservableSource<T extends Model> extends DataSource<T> {
    public async: boolean = true
    public readonly observable: Observable<T[]>

    public constructor(observable: Observable<T[]>) {
        super()
        this.observable = observable.pipe(shareReplay(1))
    }

    public getPosition(id: PrimaryKey, f?: Filter<T> | undefined, s?: Sorter<T> | undefined): Observable<number> {
        throw new Error("Method not implemented.")
    }

    protected _search(f?: Filter<T> | undefined, s?: Sorter<T> | undefined, r?: NzRange | undefined, m?: Meta<T> | undefined): Observable<any[]> {
        return this.observable.pipe(
            map(items => {
                if (!items || items.length === 0) {
                    return new Items([], new NzRange(0, 0), 0)
                }

                const { values, total } = reduceValues(items, f, s, r)
                return new Items(values, r || new NzRange(0, total), total)
            }),
            shareReplay(1)
        )
    }

    protected _get(id: PrimaryKey, m?: Meta<T> | undefined): Observable<T> {
        const pkstr = `${id}`
        return this.observable.pipe(
            map(items => {
                for (const item of items) {
                    if (item.pk === pkstr) {
                        return item
                    }
                }
                return null as any
            }),
            shareReplay(1)
        )
    }

    protected _save(model: T, m?: Meta<T> | undefined): Observable<T> {
        throw new Error("ObservableSource not supports save")
    }

    protected _remove(id: PrimaryKey, m?: Meta<T> | undefined): Observable<boolean> {
        throw new Error("ObservableSource not supports delete")
    }

}
