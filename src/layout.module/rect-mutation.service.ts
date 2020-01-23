import { Injectable, ElementRef, NgZone, Inject } from "@angular/core"
import { Observable, Observer, animationFrameScheduler, merge, fromEvent } from "rxjs"
import { debounceTime, finalize, share } from "rxjs/operators"
import * as resizeDetector from "element-resize-detector"

import { Rect } from "./geometry/rect"

export type Watchers<T> = Map<HTMLElement, { rc: number, watcher: T }>
export type Dimension = { width: number, height: number }
export type Position = { x: number, y: number }

import { __zone_symbol__ } from "../util/zone"

const REQUEST_ANIMATION_FRAME: "requestAnimationFrame" = __zone_symbol__("requestAnimationFrame")
const CANCEL_ANIMATION_FRAME: "cancelAnimationFrame" = __zone_symbol__("cancelAnimationFrame")


@Injectable()
export class RectMutationService {
    protected resizeWatchers: Watchers<Observable<Dimension>> = new Map()
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
                const resizeObserver = (window as any).ResizeObserver as any
                if (resizeObserver) {
                    const ro = new resizeObserver((entries: any) => {
                        for (const entry of entries) {
                            observer.next({
                                width: entry.contentRect.left + entry.contentRect.right,
                                height: entry.contentRect.top + entry.contentRect.bottom
                            })
                        }

                    })
                    ro.observe(element)

                    return () => {
                        ro.disconnect()
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
            }).pipe(debounceTime(0, animationFrameScheduler), share())
        })
    }

    protected getResizeWatcher(element: HTMLElement): Observable<Dimension> {
        if (!this.resizeWatchers.has(element)) {
            this.resizeWatchers.set(element, { rc: 0, watcher: this.createResizeWatcher(element) })
        }
        const def = this.resizeWatchers.get(element)
        def.rc += 1


        return def.watcher.pipe(finalize(() => {
            def.rc -= 1
            if (def.rc <= 0) {
                this.resizeWatchers.delete(element)
            }
        }))
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
                    rafId = window[REQUEST_ANIMATION_FRAME](watcher)
                }

                rafId = window[REQUEST_ANIMATION_FRAME](watcher)

                return () => {
                    window[CANCEL_ANIMATION_FRAME](rafId)
                }
            }).pipe(share())
        })
    }

    protected getPositonWatcher(element: HTMLElement): Observable<Position> {
        if (!this.positionWatchers.has(element)) {
            this.positionWatchers.set(element, { rc: 0, watcher: this.createPositionWatcher(element) })
        }
        const def = this.positionWatchers.get(element)
        def.rc += 1

        return def.watcher.pipe(finalize(() => {
            def.rc -= 1
            if (def.rc <= 0) {
                this.positionWatchers.delete(element)
            }
        }))
    }
}
