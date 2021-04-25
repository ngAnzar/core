import { Observable, EMPTY, of } from "rxjs"
import { Subject } from "rxjs"
import { map, finalize, switchMap, take, shareReplay } from "rxjs/operators"

import { NzRange, __zone_symbol__ } from "../../util"


const RAF = __zone_symbol__("requestAnimationFrame")


export function skipWhenRangeIsEq(ranges: [NzRange, NzRange]): Observable<NzRange> {
    const [a, b] = ranges
    if (a && b && a.isEq(b)) {
        return EMPTY
    } else {
        return of(b)
    }
}


export function withPrevious<T>(reset?: Observable<any>): (src: Observable<T>) => Observable<[T, T]> {
    let lastValue: any = null
    let resetSub = reset ? reset.subscribe(() => lastValue = null) : null

    return (src: Observable<T>) => src.pipe(
        map((val: T) => {
            let tmp = lastValue
            lastValue = val
            return [tmp as T, val as T]
        }),
        finalize<[T, T]>(resetSub ? resetSub.unsubscribe.bind(resetSub) : () => null)
    )
}


export function buffer<T>(): (src: Observable<T>) => Observable<T> {
    let lastValue: any
    let lastValueSet: boolean = false
    let rafId: any
    let result = new Subject<T>()

    function emit() {
        let v = lastValue
        let vs = lastValueSet
        lastValueSet = false
        lastValue = null
        rafId = null
        if (vs) {
            result.next(v)
        }
    }

    return (src) => {
        return src.pipe(
            switchMap(inpValue => {
                if (!rafId) {
                    rafId = window[RAF](emit)
                }
                lastValue = inpValue
                lastValueSet = true
                return result.pipe(take(1))
            })
        )
    }
}


export class ItemIndexes {
    public readonly items: Set<number> = new Set()
    public readonly min: number
    public readonly max: number

    public constructor() {

    }

    public add(value: number) {
        this.items.add(value)
        this._updateMinMax()
    }

    public del(value: number) {
        this.items.delete(value)
        this._updateMinMax()
    }

    public reset() {
        this.items.clear();
        (this as { min: number }).min = null;
        (this as { max: number }).max = null
    }

    private _updateMinMax() {
        let min = null
        let max = null

        for (const value of this.items) {
            if (min === null) {
                min = max = value
            } else {
                min = Math.min(min, value)
                max = Math.max(max, value)
            }
        }

        (this as { min: number }).min = min;
        (this as { max: number }).max = max
    }
}
