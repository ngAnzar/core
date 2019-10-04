import { Provider, InjectionToken, Inject, Optional, NgZone, PLATFORM_ID } from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { EventManager, ɵDomEventsPlugin, EVENT_MANAGER_PLUGINS } from "@angular/platform-browser"

import { Observable, fromEvent, race } from "rxjs"

import { Destruct, IDisposable } from "../../util"


export type RecognizerFactory = (svc: TouchEventService, target: HTMLElement) => Recognizer


export type PointerEvent =
    (MouseEvent & { type: "mousedown" | "mouseup" | "mousemove" }) |
    (TouchEvent & { type: "touchstart" | "touchend" | "touchcancel" | "touchmove" });


export interface TapEvent extends Event {
    readonly detail: {
        readonly clientX: number
        readonly clientY: number
    }
}


// export type TouchEvent = (TapEvent & { type: "tap" | "longtap" | "tapbegin" | "tapend" })


export abstract class Recognizer implements IDisposable {
    public readonly destruct = new Destruct()

    public constructor(
        public readonly svc: TouchEventService,
        public readonly target: HTMLElement) { }

    public abstract init(): void

    protected on(event: string, handler: (event?: Event) => void) {
        return this._on(this.target, event, handler)
    }

    protected _on(target: HTMLElement | HTMLDocument, event: string, handler: (event?: Event) => void): () => void {
        target.addEventListener(event, handler)
        return () => {
            target.removeEventListener(event, handler)
        }
    }

    protected isTargetEvent(evtTarget: any): boolean {
        return evtTarget === this.target || this.target.contains(evtTarget)
    }

    protected createEvent(type: string, options: { [key: string]: any } = {}, originalEvent: Event): CustomEvent {
        if (!("bubbles" in options)) {
            options.bubbles = true
            options.cancelable = true
        }
        options.originalEvent = originalEvent
        const event = new CustomEvent(type, options)
        const preventDefault = event.preventDefault

        // if (originalEvent.defaultPrevented) {
        //     event.preventDefault()
        // }

        event.preventDefault = () => {
            preventDefault.call(event)
            originalEvent.preventDefault()
        }
        return event
    }

    protected fireEvent(type: string, options: { [key: string]: any } = {}, originalEvent: Event) {
        this.target.dispatchEvent(this.createEvent(type, options, originalEvent))
    }

    public dispose(): void {
        this.destruct.run()
    }
}


export class TapRecognizer extends Recognizer {
    static readonly factory: RecognizerFactory = (svc: TouchEventService, target: HTMLElement) => {
        return new TapRecognizer(svc, target)
    }

    public readonly longTapDuration = 300

    public init() {
        this.destruct.any(this.on("mousedown", this.begin))
        this.destruct.any(this.on("touchstart", this.begin))
    }

    protected begin = (event: PointerEvent) => {
        if (event.defaultPrevented) {
            return
        }
        event.stopPropagation()

        if (event.type === "touchstart") {
            event.preventDefault()
        }

        this._fireEvent("tapbegin", event)

        let beginTime = new Date().getTime()
        if (event.type === "mousedown") {
            if (event.button === 0) {
                let off = this._on(document, "mouseup", (mouseup: PointerEvent) => {
                    off()
                    if (this.isTargetEvent(mouseup.target)) {
                        this.end(event, beginTime)
                    }
                    this._fireEvent("tapend", mouseup)
                })
            }
        } else {
            let off1 = this._on(document, "touchend", (touchend: PointerEvent) => {
                off1()
                off2()
                if (this.isTargetEvent(touchend.target)) {
                    this.end(event, beginTime)
                }
                this._fireEvent("tapend", touchend)
            })

            let off2 = this._on(document, "touchcancel", (touchcancel: PointerEvent) => {
                off1()
                off2()
                this._fireEvent("tapend", touchcancel)
            })

            let off3 = this._on(document, "touchmove", (touchmove: PointerEvent) => {
                console.log(touchmove)
            })
        }
    }

    protected end = (event: PointerEvent, beginTime: number) => {
        let elapsed = new Date().getTime() - beginTime
        let type = elapsed >= this.longTapDuration ? "longtap" : "tap"
        this._fireEvent(type, event)
    }

    private _fireEvent(type: string, originalEvent: PointerEvent) {
        let detail = {} as any

        switch (originalEvent.type) {
            case "mousedown":
            case "mouseup":
                detail.clientX = originalEvent.clientX
                detail.clientY = originalEvent.clientY
                break

            case "touchstart":
            case "touchend":
            case "touchcancel":
                const touches = originalEvent.changedTouches
                detail.clientX = touches[0].clientX
                detail.clientY = touches[0].clientY
                break
        }

        this.fireEvent(type, { detail: detail }, originalEvent)
    }
}

export type TouchRecognizers = { [key: string]: RecognizerFactory }

export const TOUCH_RECOGNIZERS = new InjectionToken<TouchRecognizers>("TOUCH_RECOGNIZERS")

const RECOGNIZERS: TouchRecognizers = {
    "tap": TapRecognizer.factory,
    "longtap": TapRecognizer.factory,
    "tapbegin": TapRecognizer.factory,
    "tapend": TapRecognizer.factory,
}




export class TouchEventService extends ɵDomEventsPlugin {
    protected recognizers: TouchRecognizers

    private _installed: Map<HTMLElement, Map<RecognizerFactory, { ref: number, inst: Recognizer }>> = new Map()

    public constructor(
        @Inject(DOCUMENT) doc: HTMLDocument,
        @Inject(NgZone) zone: NgZone,
        @Inject(PLATFORM_ID) @Optional() platformId: {} | null,
        @Inject(TOUCH_RECOGNIZERS) @Optional() recognizers: TouchRecognizers) {
        super(doc, zone, platformId)
        this.recognizers = recognizers || RECOGNIZERS
    }

    public supports(eventName: string): boolean {
        return eventName in this.recognizers
    }

    public addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
        let zone: NgZone = (this as any).ngZone

        return zone.runOutsideAngular(() => {
            this.install(element, eventName)

            const cb = (event?: Event) => {
                zone.run(() => {
                    handler(event)
                })
            }
            element.addEventListener(eventName, cb)

            return () => {
                element.removeEventListener(eventName, cb)
                this.uninstall(element, eventName)
            }
        })
    }

    public removeEventListener(target: any, eventName: string, callback: Function): void {
        console.log("TODO: removeEventListener")
    }

    protected install(element: HTMLElement, eventName: string) {
        let factory = this.recognizers[eventName]
        let exists = this._installed.get(element)

        if (exists) {
            let e2 = exists.get(factory)
            if (e2) {
                e2.ref++
            } else {
                let inst = factory(this, element)
                exists.set(factory, { ref: 1, inst })
                inst.init()
            }
        } else {
            let x = new Map()
            let inst = factory(this, element)
            x.set(factory, { ref: 1, inst })
            this._installed.set(element, x)
            inst.init()
        }
    }

    protected uninstall(element: HTMLElement, eventName: string) {
        let exists = this._installed.get(element)

        if (exists) {
            let factory = this.recognizers[eventName]

            let e2 = exists.get(factory)
            if (e2) {
                e2.ref--
                if (e2.ref <= 0) {
                    e2.inst.dispose()
                    exists.delete(factory)
                }
            }
        }
    }

    // public click(el: HTMLElement): Observable<MouseEvent | TouchEvent> {
    //     return this.watch(el, "")
    // }

    // public down(el: HTMLElement): Observable<(MouseEvent & { type: "mousedown" }) | (TouchEvent & { type: "touchstart" })> {
    //     return this.watch(el, "mousedown touchstart") as any;
    // }

    // public up(el: HTMLElement): Observable<(MouseEvent & { type: "mouseup" }) | (TouchEvent & { type: "touchend" | "touchcancel" })> {
    //     return this.watch(el, "mouseup touchend touchcancel") as any;
    // }

    // public move(el: HTMLElement): Observable<(MouseEvent & { type: "mousedown" }) | (TouchEvent & { type: "touchstart" })> {
    //     return this.watch(el, "mousemove touchmove") as any;
    // }

    // public watch(el: HTMLElement, events: string): Observable<PointerEvent> {
    //     let observables = events.split(/\s+/).map(evtName => fromEvent(el, evtName))
    //     return race(observables) as any
    // }


}


// tap, longtap, doubletap, swipe, swipeh, swipev


export const TOUCH_EVENT_PLUGIN: Provider = {
    provide: EVENT_MANAGER_PLUGINS,
    useClass: TouchEventService,
    multi: true
}
