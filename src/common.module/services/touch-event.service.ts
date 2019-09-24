import { Provider, InjectionToken, Inject, Optional, NgZone, PLATFORM_ID } from "@angular/core"
import { EventManager, ɵDomEventsPlugin, EVENT_MANAGER_PLUGINS, DOCUMENT } from "@angular/platform-browser"

import { Destructible } from "../../util"
import { Point } from "../../layout.module"



const Zone = (window as any).Zone
const __zone_symbol__ =
    (typeof Zone !== "undefined") && (Zone as any)["__symbol__"] || function (v: string): string {
        return "__zone_symbol__" + v;
    };
const ADD_EVENT_LISTENER: "addEventListener" = __zone_symbol__("addEventListener");
const REMOVE_EVENT_LISTENER: "removeEventListener" = __zone_symbol__("removeEventListener");

const LISTENERS = Symbol("anzar.touchListeners")
const REFCOUNT = Symbol("anzar.touchListeners.rc")

export type TouchRecognizers = { [key: string]: Recognizer }
export const TOUCH_RECOGNIZERS = new InjectionToken<TouchRecognizers>("TOUCH_RECOGNIZERS")


export type PointerEvent =
    (MouseEvent & { type: "mousedown" | "mouseup" | "mousemove" }) |
    (TouchEvent & { type: "touchstart" | "touchend" | "touchcancel" | "touchmove" });


export interface TapEvent extends Event {
    readonly detail: {
        readonly clientX: number
        readonly clientY: number
    }
}


export abstract class Recognizer extends Destructible {

}


export class TapRecognizer extends Recognizer {

}



export const DEFAULT_RECOGNIZERS: TouchRecognizers = {
    "tap": new TapRecognizer()
    // "tap": TapRecognizer.factory,
    // "longtap": TapRecognizer.factory,
    // "tapbegin": TapRecognizer.factory,
    // "tapend": TapRecognizer.factory,
}


// type Listeners = Array<{ handler: any, recognizer: Recognizer, rc: number }>

class Listeners {
    public readonly handlers: Map<Recognizer, Array<{ rc: number, handler: Function }>> = new Map()

    public beginTime: number
    public beginCoords: Point[]
    public isMoving = false

    public add(recognizer: Recognizer, handler: any) {
        let target = this.handlers.get(recognizer)
        if (!target) {
            target = []
            this.handlers.set(recognizer, target)
        }

        for (const h of target) {
            if (h.handler === handler) {
                h.rc++
                return
            }
        }

        target.push({ rc: 1, handler })
    }

    public del(recognizer: Recognizer, handler: any) {

    }
}


export class TouchEventService extends ɵDomEventsPlugin {
    public readonly longtapInterval = 300
    public readonly moveDistance = 10

    protected recognizers: TouchRecognizers

    private _activeElement: HTMLElement
    private _matchedRecognizer: Recognizer


    public constructor(
        @Inject(DOCUMENT) private doc: HTMLDocument,
        @Inject(NgZone) zone: NgZone,
        @Inject(PLATFORM_ID) @Optional() platformId: {} | null,
        @Inject(TOUCH_RECOGNIZERS) @Optional() recognizers: TouchRecognizers) {
        super(doc, zone, platformId)
        this.recognizers = recognizers || DEFAULT_RECOGNIZERS

        doc[ADD_EVENT_LISTENER]("mousemove", this._mousemove)
        doc[ADD_EVENT_LISTENER]("mouseup", this._mouseup)
        doc[ADD_EVENT_LISTENER]("touchcancel", this._touchcancel)
        doc[ADD_EVENT_LISTENER]("touchend", this._touchend)
        doc[ADD_EVENT_LISTENER]("touchmove", this._touchmove)
    }

    public supports(eventName: string): boolean {
        return eventName in this.recognizers
    }

    public addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
        const recognizer = this.recognizers[eventName]
        let listeners = (element as any)[LISTENERS] as Listeners

        if (!listeners) {
            (element as any)[LISTENERS] = listeners = new Listeners();
            (element as any)[REFCOUNT] = 1
            this.install(element)
        } else {
            (element as any)[REFCOUNT]++
        }

        listeners.add(recognizer, handler)
        element.addEventListener(eventName as any, handler as any)

        return this.removeEventListener.bind(this, element, eventName, handler)
        // let zone: NgZone = (this as any).ngZone

        // return zone.runOutsideAngular(() => {
        //     this.install(element, eventName)

        //     const cb = (event?: Event) => {
        //         zone.run(() => {
        //             handler(event)
        //         })
        //     }
        //     element.addEventListener(eventName, cb)

        //     return () => {
        //         element.removeEventListener(eventName, cb)
        //         this.uninstall(element, eventName)
        //     }
        // })
    }

    public removeEventListener(target: any, eventName: string, callback: Function): void {
        console.log("TODO: removeEventListener")
    }

    // protected install(element: HTMLElement, eventName: string) {

    // }

    // protected uninstall(element: HTMLElement, eventName: string) {
    // }

    protected install(element: HTMLElement) {
        element[ADD_EVENT_LISTENER]("mousedown", this._begin)
        element[ADD_EVENT_LISTENER]("touchstart", this._begin)
    }

    private _begin = (event: PointerEvent) => {
        const el = event.currentTarget as HTMLElement
        const listeners = (el as any)[LISTENERS] as Listeners

        if (listeners) {
            listeners.beginTime = new Date().getTime()
            listeners.isMoving = false

            if (event.type === "touchstart") {
                event.preventDefault() // stop firing mouse events
                listeners.beginCoords = this._touchCoords(event)
            } else if (event.type === "mousedown") {
                // handle only primary button click
                if (event.button !== 0) {
                    return
                }
                listeners.beginCoords = this._mouseCoords(event)
            }

            this._activeElement = el
        }
    }

    private _end = () => {
        // const el = this._activeElement
        // const recognizer = this._matchedRecognizer
        delete this._activeElement
        delete this._matchedRecognizer

        // if (el && recognizer) {
        //     console.log({ el, recognizer })
        // }
    }

    private _docEvtHandler(handler: (event: PointerEvent, el: HTMLElement, listeners: Listeners) => void) {
        return (event: PointerEvent) => {
            if (this._activeElement) {
                const el = this._activeElement as HTMLElement
                const listeners = (el as any)[LISTENERS] as Listeners
                if (listeners) {
                    handler(event, el, listeners)
                }
            }
        }
    }

    private _mousemove = this._docEvtHandler((event, el, listeners) => {

    })

    private _mouseup = this._docEvtHandler((event, el, listeners) => {
        if (!listeners.isMoving && this._inActiveElement(event.target)) {
            this._fireTap(event)
        }
        this._end()
    })

    private _touchcancel = this._docEvtHandler((event, el, listeners) => {
        this._end()
    })

    private _touchend = this._docEvtHandler((event, el, listeners) => {
        if (!listeners.isMoving && this._inActiveElement(event.target)) {
            const end = new Date().getTime()
            if (end - listeners.beginTime >= this.longtapInterval) {
                this._fireLongtap(event)
            } else {
                this._fireTap(event)
            }
        }
        this._end()
    })

    private _touchmove = this._docEvtHandler((event, el, listeners) => {

    })

    private _touchCoords(event: TouchEvent): Point[] {
        let res: Point[] = []

        for (let i = 0, l = event.touches.length; i < l; i++) {
            const t = event.touches[i]
            res.push(new Point(t.clientX, t.clientY))
        }

        return res
    }

    private _mouseCoords(event: MouseEvent): Point[] {
        return [new Point(event.clientX, event.clientY)]
    }

    private _inActiveElement(el: any) {
        return this._activeElement && (el === this._activeElement || this._activeElement.contains(el))
    }

    private _fireTap(event: PointerEvent) {
        this._fire(event, "tap", {})
    }

    private _fireLongtap(event: PointerEvent) {
        this._fire(event, "longtap", {})
    }

    private _fire(original: Event, type: string, options: { [key: string]: any }) {
        if (this._activeElement) {
            this._activeElement.dispatchEvent(this._createEvent(original, type, options))
        }
    }

    private _createEvent(original: Event, type: string, options: { [key: string]: any }) {
        if (!("bubbles" in options)) {
            options.bubbles = true
            options.cancelable = true
        }
        options.originalEvent = original

        const event = new CustomEvent(type, options)

        return event
    }

    // private _mouseup = (event: MouseEvent) => {
    //     this._end()
    // }

    // private _mousemove = (event: MouseEvent) => {

    // }

    // private _touchend = (event: TouchEvent) => {
    //     this._end()
    // }

    // private _touchcancel = (event: TouchEvent) => {
    //     this._end()
    // }

    // private _touchmove = (event: TouchEvent) => {

    // }
}


// tap, longtap, doubletap, swipe, swipeh, swipev


export const TOUCH_EVENT_PLUGIN: Provider = {
    provide: EVENT_MANAGER_PLUGINS,
    useClass: TouchEventService,
    multi: true
}
