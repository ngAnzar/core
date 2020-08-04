import { Injectable, Inject } from "@angular/core"
import { EventManager } from "@angular/platform-browser"
import { DOCUMENT } from "@angular/common"
import { Observable, Subject, Observer, timer, of } from "rxjs"
import { map, distinctUntilChanged, switchMap, mapTo } from "rxjs/operators"

// import { __zone_symbol__ } from "../../util"

// const _MutationObserver = window[__zone_symbol__("MutationObserver")]


@Injectable({ providedIn: "root" })
export class QtipManager {
    private installCount: number = 0
    private _mousemoveOff: any
    private _trigger = new Subject<MouseEvent>()

    public constructor(
        @Inject(DOCUMENT) private readonly doc: Document,
        @Inject(EventManager) protected readonly eventMgr: EventManager) {
    }

    public watch(el: HTMLElement, inInterval?: number, outInterval?: number): Observable<boolean> {
        return Observable.create((o: Observer<boolean>) => {
            this._install()

            const s = this._trigger
                .pipe(
                    map(v => {
                        const target = v.target as HTMLElement
                        return target === el || el.contains(target)
                    }),
                    distinctUntilChanged(),
                    switchMap(v => {
                        if (v) {
                            return inInterval ? timer(inInterval).pipe(mapTo(v)) : of(v)
                        } else {
                            return outInterval ? timer(outInterval).pipe(mapTo(v)) : of(v)
                        }
                    })
                )
                .subscribe(o)

            return () => {
                this._uninstall()
                s.unsubscribe()
            }
        })
    }

    private _install() {
        this.installCount++
        if (this.installCount > 1) {
            return
        }
        this._mousemoveOff = this.eventMgr.addEventListener(this.doc as any, "mousemove", this._onMouseMove)
    }

    private _uninstall() {
        this.installCount--
        if (this.installCount <= 0) {
            this.installCount = 0
            this._mousemoveOff()
        }
    }

    private _onMouseMove = (event: MouseEvent) => {
        this._trigger.next(event)
    }

    // private _watchRemove(el: HTMLElement): Observable<boolean> {
    //     return Observable.create((observer: Observer<boolean>) => {
    //         const mutation = new _MutationObserver(mutations => {
    //             for (const mutation of mutations) {
    //                 console.log(mutation)
    //                 if (mutation.type === "childList") {

    //                 }
    //             }
    //         })
    //         if (el.parentNode) {
    //             console.log("watch parent Node", el.parentNode)
    //             mutation.observe(document, { childList: true, subtree: true })
    //             observer.next(true)
    //         } else {
    //             observer.next(false)
    //         }
    //         return () => {
    //             mutation.disconnect()
    //         }
    //     })
    // }
}
