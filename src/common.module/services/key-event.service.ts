import { NgZone, Inject } from "@angular/core"
import { DOCUMENT } from "@angular/platform-browser"
import { ESCAPE } from "@angular/cdk/keycodes"

import { Observable, fromEvent, race, Subscription } from "rxjs"
import { filter, share, finalize } from "rxjs/operators"


import { IDisposable } from "../../util"


export enum SpecialKey {
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

export type KeyWatchDef = KeyWatch | KeyWatch[] | Key | Key[]


export class KeyEventService {
    public constructor(
        @Inject(NgZone) protected readonly zone: NgZone,
        @Inject(DOCUMENT) protected readonly doc: Document) {

    }

    public newWatcher(el: Node, def: KeyWatchDef, cb: (event: KeyboardEvent) => boolean): KeyWatcher<KeyboardEvent>;
    public newWatcher(def: KeyWatchDef, cb: (event: KeyboardEvent) => boolean): KeyWatcher<KeyboardEvent>;

    public newWatcher(arg1: any, arg2: any, arg3?: any): any {
        const cb = typeof arg3 === "function" ? arg3 : arg2
        const observable = this.watch(arg1, typeof arg3 === "function" ? arg2 : null)
        return new KeyWatcher(observable, cb)
    }

    public watch(el: Node, def: KeyWatchDef): Observable<KeyboardEvent>
    public watch(def: KeyWatchDef): Observable<KeyboardEvent>

    public watch(arg1: any, arg2?: any): Observable<KeyboardEvent> {
        const target = arg1 instanceof Node ? arg1 : this.doc
        const items = normalizeKeyWatchDef(arg1 instanceof Node ? arg2 : arg1)

        return race(items.map(item => {
            if (item.special) {
                return (this as any)[`_get${item.special}Watcher`]() as Observable<KeyboardEvent>
            } else {
                return fromEvent<KeyboardEvent>(target, item.kw.type === "up" ? "keyup" : "keydown")
                    .pipe(filter(item.match))
            }
        }))
    }

    private _backButtonWatcher: Observable<any>
    protected _getBackButtonWatcher(): Observable<any> {
        if (!this._backButtonWatcher) {
            if (typeof (window as any).cordova !== "undefined") {
                this._backButtonWatcher = fromEvent(this.doc, "backbutton")
            } else {
                this._backButtonWatcher = this.watch(this.doc, { shift: false, alt: false, ctrl: false, key: ESCAPE, type: "up" })
            }
            this._backButtonWatcher = this._backButtonWatcher
                .pipe(finalize(() => delete this._backButtonWatcher))
                .pipe(share())
        }
        return this._backButtonWatcher
    }
}


type _KeyWatch = {
    kw: KeyWatch,
    special: string | null,
    match: (event: KeyboardEvent) => boolean
}


function normalizeKeyWatchDef(def: KeyWatchDef, allowArray: boolean = true): _KeyWatch[] {
    let result: _KeyWatch[] = []

    if (typeof def === "number" || typeof def === "string") {
        result.push({
            kw: { type: "up", key: def },
            special: SpecialKey[def as any] || null,
            match: null
        })
    } else if (allowArray && Array.isArray(def)) {
        return (def as any).map((x: any) => normalizeKeyWatchDef(x, false)[0])
    } else if (def) {
        result.push({ kw: def as any, special: null, match: null })
    }

    for (const res of result) {
        if (!res.special) {
            res.match = (event: KeyboardEvent) => {
                const kw = res.kw
                return (kw.alt == null || event.altKey === kw.alt)
                    && (kw.shift == null || event.shiftKey === kw.shift)
                    && (kw.ctrl == null || event.ctrlKey === kw.ctrl)
                    && ((typeof kw.key === "number" && event.keyCode === kw.key)
                        || (typeof kw.key === "string" && event.key === kw.key))
            }
        }
    }

    return result
}



export class KeyWatcher<T extends Event = KeyboardEvent> implements IDisposable {

    private s: Subscription

    public constructor(
        private readonly o: Observable<T>,
        private readonly cb: (event: T) => boolean) {
    }

    public on() {
        if (!this.s) {
            this.s = this.o.subscribe((arg: T) => {
                this.cb(arg) && this.off()
            })
        }
    }

    public off() {
        if (this.s) {
            this.s.unsubscribe()
            delete this.s
        }
    }

    public dispose() {
        this.off()
        delete (this as any).observable
        delete (this as any).cb
        delete (this as any)._s
    }
}
