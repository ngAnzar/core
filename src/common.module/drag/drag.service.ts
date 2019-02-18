import { Injectable, Inject, EventEmitter } from "@angular/core"
import { Observable, Subscription } from "rxjs"

import { Point } from "../../layout.module"
import { DragEventService, DragEvent } from "../services/drag-event.service"


export interface DraggingEvent extends DragEvent {
    draggableBegin: Point
}


@Injectable()
export class DragService {
    public set handle(val: HTMLElement) {
        if (this._handle !== val) {
            if (this._handleDragEvent) {
                this._handleDragEvent.unsubscribe()
                delete this._handleDragEvent
            }
            if (this._handle = val) {
                this._handleDragEvent = this.dragEvent.watch(val).subscribe(this._onDrag)
            }
        }
    }
    public get handle(): HTMLElement { return this._handle }
    private _handle: HTMLElement
    private _handleDragEvent: Subscription

    public set draggable(val: HTMLElement) {
        if (this._draggable !== val) {
            this._draggable = val
        }
    }
    public get draggable(): HTMLElement { return this._draggable }
    private _draggable: HTMLElement
    private _draggableBegin: Point

    public readonly dragging: Observable<DraggingEvent> = new EventEmitter()

    public constructor(@Inject(DragEventService) protected readonly dragEvent: DragEventService) {

    }

    protected _onDrag = (event: DragEvent) => {
        if (!this.draggable) {
            return
        }

        let forward: DraggingEvent = event as any

        switch (event.type) {
            case "begin":
                let box = this.draggable.getBoundingClientRect()
                this._draggableBegin = new Point(box.left, box.top)
                break

            case "drag":
                let rect = this._draggableBegin
                let diff = event.current.sub(event.begin)
                this.draggable.style.left = `${rect.left + diff.x}px`
                this.draggable.style.top = `${rect.top + diff.y}px`
                break
        }

        forward.draggableBegin = this._draggableBegin;

        (this.dragging as EventEmitter<DraggingEvent>).emit(forward)
    }
}
