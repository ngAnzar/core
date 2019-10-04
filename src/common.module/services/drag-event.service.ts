import { Inject, NgZone } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { Observable, Observer } from "rxjs"

import { Point } from "../../layout.module"
import { PreventableEvent } from "../../util"

export type DragEventType = "begin" | "end" | "drag"

export class DragEvent extends PreventableEvent {
    public type: DragEventType
    public begin: Point
    public current: Point
}


export class DragEventService {
    public constructor(
        @Inject(DOCUMENT) protected readonly doc: Document,
        @Inject(NgZone) protected readonly zone: NgZone) {

    }

    public watch(el: HTMLElement): Observable<DragEvent> {
        return this.zone.runOutsideAngular(() => {
            return Observable.create((observer: Observer<DragEvent>) => {
                let beginPosition: Point
                let lastPosition: Point

                const onMouseDown = (event: MouseEvent) => {
                    this.doc.addEventListener("mousemove", onMouseMove)
                    this.doc.addEventListener("mouseup", onMouseUp)
                    event.preventDefault()
                    event.stopImmediatePropagation()
                }

                const onMouseUp = (event: MouseEvent) => {
                    lastPosition = new Point(event.clientX, event.clientY)
                    cleanup()
                }

                const onMouseMove = (event: MouseEvent) => {
                    lastPosition = new Point(event.clientX, event.clientY)
                    if (!beginPosition) {
                        beginPosition = lastPosition
                        emit("begin")
                    }
                    emit("drag")
                }

                const emit = (type: DragEventType): boolean => {
                    let evt = new DragEvent()
                    evt.type = type
                    evt.begin = beginPosition
                    evt.current = lastPosition
                    observer.next(evt)
                    return evt.isDefaultPrevented()
                }

                const cleanup = () => {
                    if (beginPosition) {
                        emit("end")
                    }
                    beginPosition = null
                    lastPosition = null
                    this.doc.removeEventListener("mousemove", onMouseMove)
                    this.doc.removeEventListener("mouseup", onMouseUp)
                }

                el.addEventListener("mousedown", onMouseDown)

                return () => {
                    el.removeEventListener("mousedown", onMouseDown)
                    cleanup()
                }
            })
        })
    }
}
