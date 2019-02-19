import { Observable, fromEvent, race, NEVER } from "rxjs"
import { map, filter, share } from "rxjs/operators"


export const enum SpecialKey {
    BackButton = 0xE001
}


export type Key = number | string | SpecialKey

export type KeyWatch = {
    ctrl?: boolean,
    shift?: boolean,
    alt?: boolean,
    key: Key,
    type: "up" | "down"
}


export class KeyEventService {
    public constructor() {

    }

    public watch(el: HTMLElement, def: KeyWatch | KeyWatch[]): Observable<KeyWatch> {
        let items: KeyWatch[] = Array.isArray(def) ? def : [def]
        let observables: Array<Observable<KeyWatch>> = []

        for (let item of items) {
            if (item.key === SpecialKey.BackButton) {
                observables.push(this._getBackButtonWatcher().pipe(filter(this._isFocusedFilter(el))))
            } else {
                observables.push(fromEvent(el, item.type === "up" ? "keyup" : "keydown")
                    .pipe(
                        filter(this._isFocusedFilter(el)),
                        map(v => item)
                    )
                )
            }
        }

        return race(observables)
    }


    private _backButtonWatcher: Observable<any>
    private _getBackButtonWatcher(): Observable<any> {
        if (typeof (window as any).cordova !== "undefined") {
            if (!this._backButtonWatcher) {
                return this._backButtonWatcher = fromEvent(document, "backbutton").pipe(share())
            }
            return this._backButtonWatcher
        }
        return NEVER
    }

    private _isFocusedFilter(el: HTMLElement) {
        return () => {
            const active = document.activeElement
            return active && (active === el || active.contains(el))
        }
    }
}
