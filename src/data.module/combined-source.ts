import { Observable, of, Subject, merge, race, forkJoin, concat, NEVER } from "rxjs"
import { filter, take, map, tap, combineAll, concatAll, combineLatest, switchMap } from "rxjs/operators"


import { NzRange } from "../util"
import { DataSource, Filter, FilterValue, Filter_Exp, Sorter, Meta } from "./data-source"
import { Model, PrimaryKey, ModelClass, RawData } from "./model"
import { Items } from "./collection"


export type CustomFilter<T extends Model = Model> = (record: T, filterValue: any) => boolean


export class CombinedSource<T extends Model> extends DataSource<T> {
    public readonly async: boolean = false


    public constructor(public readonly sources: Array<DataSource<T>>) {
        super()
        this.async = sources.findIndex(v => v.async) > -1;
        (this as { changed: any }).changed = merge(...sources.map(src => src.changed))
    }

    public getPosition(pk: PrimaryKey): Observable<number> {
        return of(-1)
    }

    protected _save(model: T): Observable<T> {
        throw new Error("CombinedSource not supports save")
    }

    protected _remove(id: PrimaryKey): Observable<boolean> {
        throw new Error("CombinedSource not supports delete")
    }

    protected _search(filter?: Filter<T>, sorter?: Sorter<T>, range?: NzRange, meta?: Meta<T>): Observable<any[]> {
        if (range) {
            let rr = new NzRange(range.begin, range.end)
            let count = this.sources.length
            let finalRes: any[] = []
            return concat(...this.sources.map(src => {
                return src.search(filter, sorter, range, meta)
                    .pipe(tap(res => {
                        rr = new NzRange(rr.begin + res.length, rr.end)
                    }), take(1))
            })
            ).pipe(
                switchMap(v => {
                    finalRes = finalRes.concat(v)
                    if (--count > 0) {
                        return NEVER
                    } else {
                        return of(finalRes)
                    }
                })
            )
        } else {
            return forkJoin(this.sources.map(src => src.search(filter, sorter, range, meta)))
                .pipe(map(values => {
                    return [].concat.apply([], values)
                }))
        }
    }

    protected _get(id: PrimaryKey): Observable<T> {
        return merge(...this.sources.map(src => src.get(id)))
            .pipe(filter(val => !!val), take(1))
    }
}
