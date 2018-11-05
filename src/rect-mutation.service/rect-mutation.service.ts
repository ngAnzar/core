import { Injectable, ElementRef } from "@angular/core"
import { Observable, Observer, animationFrameScheduler, merge, fromEvent, Subject } from "rxjs"
import { debounceTime, finalize, share } from "rxjs/operators"
import * as resizeDetector from "element-resize-detector"

import { Rect } from "./rect"

export type Watchers<T> = Map<HTMLElement, { rc: number, watcher: T }>
export type Dimension = { width: number, height: number }
export type Position = { x: number, y: number }


@Injectable()
export class RectMutationService {
    protected resizeWatchers: Watchers<Observable<Dimension>> = new Map()
    protected positionWatchers: Watchers<Observable<Position>> = new Map()

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
                let next = lastEmit.copy()
                if ("x" in change) {
                    (next as any)._x = change.x;
                    (next as any)._y = change.y;
                } else {
                    (next as any)._width = change.width;
                    (next as any)._height = change.height
                }
                observer.next(lastEmit = next)
            })

            return () => {
                sub.unsubscribe()
            }
        })
    }

    protected createResizeWatcher(element: HTMLElement): Observable<Dimension> {
        return Observable.create((observer: Observer<Dimension>) => {
            const resizeObserver = (window as any).ResizeObserver as any
            if (resizeObserver) {
                const ro = new resizeObserver((entries: any) => {
                    for (const entry of entries) {
                        observer.next({ width: entry.contentRect.width, height: entry.contentRect.height })
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
        return Observable.create((observer: Observer<Position>) => {
            let rect = element.getBoundingClientRect()
            const rafId = requestAnimationFrame(() => {
                let current = element.getBoundingClientRect()
                if (current.top !== rect.top || current.left !== rect.left) {
                    rect = current
                    observer.next({ x: current.left, y: current.top })
                }
            })

            return () => {
                cancelAnimationFrame(rafId)
            }
        }).pipe(debounceTime(0, animationFrameScheduler), share())
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
