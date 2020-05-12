import { Inject, Injectable } from "@angular/core"
import { BreakPointRegistry, ɵMatchMedia as MatchMedia, MediaChange } from "@angular/flex-layout"
import { Observable, of } from "rxjs"
import { map, distinctUntilChanged, switchMap, startWith, shareReplay, finalize } from "rxjs/operators"


export type MQWatch = "xs" | "sm" | "md" | "lg" | "xl"
    | "lt-sm" | "lt-md" | "lt-lg" | "lt-xl"
    | "gt-xs" | "gt-sm" | "gt-md" | "gt-lg" | string


@Injectable()
export class MediaQueryService {
    private _watches: { [key: string]: Observable<MediaChange> } = {}

    public constructor(
        @Inject(MatchMedia) protected readonly match: MatchMedia,
        @Inject(BreakPointRegistry) protected readonly bpr: BreakPointRegistry) {
    }

    public watch(name: MQWatch): Observable<MediaChange> {
        const bp = this.bpr.items.filter(q => q.alias === name)[0]

        if (!bp) {
            throw new Error("Invalid media query alias")
        }

        if (this._watches[bp.mediaQuery]) {
            return this._watches[bp.mediaQuery]
        } else {
            return this._watches[bp.mediaQuery] = this.match.observe([bp.mediaQuery]).pipe(
                startWith(null),
                map(() => new MediaChange(this.match.isActive(bp.mediaQuery), bp.mediaQuery, name, bp.suffix)),
                switchMap(item => {
                    if (item.mediaQuery === bp.mediaQuery) {
                        return of(item)
                    } else {
                        return of(new MediaChange(this.match.isActive(bp.mediaQuery), bp.mediaQuery, name, bp.suffix))
                    }
                }),
                distinctUntilChanged((a, b) => {
                    return !a || !b || a.matches === b.matches
                }),
                finalize(() => {
                    delete this._watches[bp.mediaQuery]
                }),
                shareReplay(1)
            )
        }
    }
}
