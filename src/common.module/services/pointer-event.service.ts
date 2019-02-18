import { Observable, fromEvent, race } from "rxjs"


export type PointerEvent =
    (MouseEvent & { type: "mousedown" | "mouseup" | "mousemove" }) |
    (TouchEvent & { type: "touchstart" | "touchend" | "touchcancel" | "touchmove" })


export class PointerEventService {
    // public click(el: HTMLElement): Observable<MouseEvent | TouchEvent> {
    //     return this.watch(el, "")
    // }

    public down(el: HTMLElement): Observable<(MouseEvent & { type: "mousedown" }) | (TouchEvent & { type: "touchstart" })> {
        return this.watch(el, "mousedown touchstart") as any;
    }

    public up(el: HTMLElement): Observable<(MouseEvent & { type: "mouseup" }) | (TouchEvent & { type: "touchend" | "touchcancel" })> {
        return this.watch(el, "mouseup touchend touchcancel") as any;
    }

    public move(el: HTMLElement): Observable<(MouseEvent & { type: "mousedown" }) | (TouchEvent & { type: "touchstart" })> {
        return this.watch(el, "mousemove touchmove") as any;
    }

    public watch(el: HTMLElement, events: string): Observable<PointerEvent> {
        let observables = events.split(/\s+/).map(evtName => fromEvent(el, evtName))
        return race(observables) as any
    }
}
