import { Injectable, ElementRef, NgZone, Inject } from "@angular/core"
import { Observable, Observer, merge, fromEvent } from "rxjs"
import { finalize, share, distinctUntilChanged } from "rxjs/operators"
import * as resizeDetector from "element-resize-detector"

import { __zone_symbol__, Rect } from "../util"

export type Watchers<T> = Map<HTMLElement, { rc: number, watcher: T }>
export type Dimension = { width: number, height: number }
export type Position = { x: number, y: number }


const REQUEST_ANIMATION_FRAME = __zone_symbol__("requestAnimationFrame")
const CANCEL_ANIMATION_FRAME = __zone_symbol__("cancelAnimationFrame")
const MUTATION_OBSERVER = __zone_symbol__("MutationObserver")
const RESIZE_OBSERVER = __zone_symbol__("ResizeObserver")
const MUTATION_CONFIG: MutationObserverInit = {
    attributes: true,
    attributeFilter: ["style", "class"]
}


@Injectable()
export class RectMutationService {
    protected resizeWatchers: Watchers<Observable<Dimension>> = new Map()
    protected swWatchers: Watchers<Observable<Dimension>> = new Map()
    protected positionWatchers: Watchers<Observable<Position>> = new Map()

    public constructor(@Inject(NgZone) protected readonly zone: NgZone) {
    }

    public watch(element: HTMLElement | ElementRef<HTMLElement>): Observable<Rect> {
        if ("nativeElement" in element) {
            element = element.nativeElement
        }
        return this.getWatcher(element)
    }

    public watchDimension(element: HTMLElement | ElementRef<HTMLElement>): Observable<Dimension> {
        if ("nativeElement" in element) {
            element = element.nativeElement
        }
        return this.getResizeWatcher(element)
    }

    public watchScrollDimension(element: HTMLElement | ElementRef<HTMLElement>): Observable<Dimension> {
        if ("nativeElement" in element) {
            element = element.nativeElement
        }
        return this.getSwWatcher(element)
    }

    public watchPosition(element: HTMLElement | ElementRef<HTMLElement>): Observable<Position> {
        if ("nativeElement" in element) {
            element = element.nativeElement
        }
        return this.getPositonWatcher(element)
    }

    public watchViewport(): Observable<Rect> {
        return Observable.create((observer: Observer<Rect>) => {
            let lastEmit = Rect.viewport()
            observer.next(lastEmit)

            let s = merge(
                fromEvent(document.body, "scroll"),
                fromEvent(document.documentElement, "scroll"),
                fromEvent(window, "resize")
            ).subscribe(event => {
                let current = Rect.viewport()
                if (!current.isEq(lastEmit)) {
                    observer.next(lastEmit = current)
                }
            })
            return () => {
                s.unsubscribe()
            }
        })
    }

    protected getWatcher(element: HTMLElement): Observable<Rect> {
        return Observable.create((observer: Observer<Rect>) => {
            let lastEmit = Rect.fromElement(element)
            observer.next(lastEmit)

            let sub = merge(this.getResizeWatcher(element), this.getPositonWatcher(element)).subscribe((change) => {
                if ("x" in change) {
                    observer.next(lastEmit = new Rect(change.x, change.y, lastEmit.width, lastEmit.height))
                } else {
                    observer.next(lastEmit = new Rect(lastEmit.left, lastEmit.top, change.width, change.height))
                }
            })

            return () => {
                sub.unsubscribe()
            }
        })
    }

    protected createResizeWatcher(element: HTMLElement): Observable<Dimension> {
        return this.zone.runOutsideAngular(() => {
            return Observable.create((observer: Observer<Dimension>) => {
                const resizeObserver = (window as any)[RESIZE_OBSERVER] as any
                const mutationObserver = (window as any)[MUTATION_OBSERVER] as any
                if (resizeObserver) {
                    const ro = new resizeObserver((entries: any) => {
                        for (const entry of entries) {
                            if (entry.borderBoxSize) {
                                if (entry.borderBoxSize.length > 0) {
                                    observer.next({
                                        width: entry.borderBoxSize[0].inlineSize,
                                        height: entry.borderBoxSize[0].blockSize
                                    })
                                } else {
                                    observer.next({
                                        width: entry.borderBoxSize.inlineSize,
                                        height: entry.borderBoxSize.blockSize
                                    })
                                }
                            } else {
                                observer.next({
                                    width: element.offsetWidth,
                                    height: element.offsetHeight
                                })
                            }
                        }

                    })
                    ro.observe(element, { box: "border-box" })

                    let lastPadding: string = ""
                    let lastClass = element.getAttribute("class")
                    const mo = new mutationObserver((mutations: MutationRecord[]) => {
                        let changed = false

                        for (const mutation of mutations) {
                            if (mutation.attributeName === "style") {
                                let re = /(padding(?:-(?:top|right|bottom|left))?):[^;]+;?\s*/gi
                                let currentPadding = ""
                                let style = element.getAttribute("style")
                                let match: any = null
                                while (match = re.exec(style)) {
                                    currentPadding += match[0]
                                }

                                changed = currentPadding !== lastPadding
                                lastPadding = currentPadding
                            } else if (mutation.attributeName === "class") {
                                let currClass = element.getAttribute("class")
                                if (lastClass !== currClass) {
                                    changed = true
                                    lastClass = currClass
                                }
                            }

                            if (changed) {
                                observer.next({ width: element.offsetWidth, height: element.offsetHeight })
                                break
                            }
                        }
                    })
                    mo.observe(element, MUTATION_CONFIG)

                    return () => {
                        ro.disconnect()
                        mo.disconnect()
                    }
                } else {
                    const detector = resizeDetector({ strategy: "scroll" })
                    const listener = (v: any) => {
                        observer.next({ width: element.offsetWidth, height: element.offsetHeight })
                    }
                    detector.listenTo(element, listener)

                    return () => {
                        detector.uninstall(element)
                    }
                }
            }).pipe(
                distinctUntilChanged((a: any, b: any) => {
                    return a && b && a.width === b.width && a.height === b.height
                }),
                share()
            )
        })
    }

    protected getResizeWatcher(element: HTMLElement): Observable<Dimension> {
        return this._getOrCreateWatcher(this.resizeWatchers, element, "createResizeWatcher")
    }

    protected createPositionWatcher(element: HTMLElement): Observable<Position> {
        return this.zone.runOutsideAngular(() => {
            return Observable.create((observer: Observer<Position>) => {
                let rect = element.getBoundingClientRect()
                let rafId: any

                const watcher = () => {
                    let current = element.getBoundingClientRect()
                    if (current.top !== rect.top || current.left !== rect.left) {
                        rect = current
                        observer.next({ x: current.left, y: current.top })
                    }

                    if (!observer.closed) {
                        rafId = window[REQUEST_ANIMATION_FRAME](watcher)
                    }
                }

                watcher()

                return () => {
                    window[CANCEL_ANIMATION_FRAME](rafId)
                }
            }).pipe(share())
        })
    }

    protected getPositonWatcher(element: HTMLElement): Observable<Position> {
        return this._getOrCreateWatcher(this.positionWatchers, element, "createPositionWatcher")
    }

    protected createSwWatcher(element: HTMLElement): Observable<Dimension> {
        return this.zone.runOutsideAngular(() => {
            return Observable.create((observer: Observer<Dimension>) => {
                let lastSw: number = 0
                let lastSh: number = 0

                const emit = () => {
                    let sw = element.scrollWidth
                    let sh = element.scrollHeight
                    if (lastSw !== sw || lastSh !== sh) {
                        lastSw = sw
                        lastSh = sh
                        observer.next({ width: lastSw, height: lastSh })
                    }
                }

                const dimSub = this.watchDimension(element).subscribe(emit)
                const mutationObserver = (window as any)[MUTATION_OBSERVER] as any
                const mutation = new mutationObserver(emit)
                mutation.observe(element, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    characterData: true
                })

                return () => {
                    mutation.disconnect()
                    dimSub.unsubscribe()
                }
            })
        })
    }

    // protected createSwWatcher_(element: HTMLElement): Observable<Dimension> {
    //     return this.zone.runOutsideAngular(() => {
    //         return Observable.create((observer: Observer<Dimension>) => {
    //             let lastSw: number = 0
    //             let lastSh: number = 0
    //             let rafId: any

    //             const check = () => {
    //                 if (lastSw !== element.scrollWidth || lastSh !== element.scrollHeight) {
    //                     lastSw = element.scrollWidth
    //                     lastSh = element.scrollHeight
    //                     observer.next({ width: lastSw, height: lastSh })
    //                 }
    //                 if (!observer.closed) {
    //                     rafId = window[REQUEST_ANIMATION_FRAME](check)
    //                 }
    //             }

    //             check()
    //             return () => {
    //                 rafId && window[CANCEL_ANIMATION_FRAME](rafId)
    //             }
    //         })
    //     })

    // }

    protected getSwWatcher(element: HTMLElement): Observable<Dimension> {
        return this._getOrCreateWatcher(this.swWatchers, element, "createSwWatcher")
    }

    protected _getOrCreateWatcher<T>(container: Watchers<Observable<T>>, element: HTMLElement, fn: string): Observable<T> {
        if (!container.has(element)) {
            container.set(element, { rc: 0, watcher: (this as any)[fn](element) })
        }
        const def = container.get(element)
        def.rc += 1

        return def.watcher.pipe(finalize(() => {
            def.rc -= 1
            if (def.rc <= 0) {
                container.delete(element)
            }
        }))
    }
}
