import { Provider, InjectionToken, Inject, Optional, NgZone, Injectable } from "@angular/core"
import { ɵDomEventsPlugin, EVENT_MANAGER_PLUGINS } from "@angular/platform-browser"
import { DOCUMENT } from "@angular/common"

import { __zone_symbol__ } from "../../util"


const ADD_EVENT_LISTENER: "addEventListener" = __zone_symbol__("addEventListener")
const REMOVE_EVENT_LISTENER: "removeEventListener" = __zone_symbol__("removeEventListener")
const SET_INTERVAL: "setInterval" = __zone_symbol__("setInterval")
const CLEAR_INTERVAL: "clearInterval" = __zone_symbol__("clearInterval")

const LISTENERS = Symbol("anzar.touchListeners")
// const REFCOUNT = Symbol("anzar.touchListeners.rc")

export type TouchEventHandler = (event: NzTouchEvent) => any
export type TouchEventFactory = [string, (handler: TouchEventHandler) => TouchEventHandler]
export type TouchEventFactories = { [key: string]: TouchEventFactory }
export const TOUCH_EVENTS = new InjectionToken<TouchEventFactories>("TOUCH_EVENTS")
export const TOUCH_RECOGNIZERS = new InjectionToken<Recognizer[]>("TOUCH_RECOGNIZERS")


export type PointerEvent =
    (MouseEvent & { type: "mousedown" | "mouseup" | "mousemove" }) |
    (TouchEvent & { type: "touchstart" | "touchend" | "touchcancel" | "touchmove" })


export type PointerType = "mouse" | "touch"
export type Direction = "left" | "top" | "right" | "bottom"


export interface TouchEventDetails {
    readonly clientX: number
    readonly clientY: number
    readonly direction?: Direction
    readonly orient?: "vertical" | "horizontal"
    readonly distanceX?: number
    readonly distanceY?: number
    readonly velocity?: number
    readonly velocityX?: number
    readonly velocityY?: number
    readonly angle?: number
}


export interface NzTouchEvent extends Event, TouchEventDetails {
    readonly originalEvent: PointerEvent
    readonly pointerType: PointerType
    readonly isFinal: boolean
}


export interface RecognizerOptions {
    name: string
    pointerTypes: PointerType[]
    maxPointer: number
    isMoving: boolean
    isTimed: boolean
    maxDistance?: number
    minDistance?: number
    maxDelay?: number
    minDelay?: number
    angleDispersion?: number
}


export abstract class Recognizer<O extends RecognizerOptions = RecognizerOptions> implements RecognizerOptions {
    public readonly name: string
    public readonly pointerTypes: PointerType[]
    public readonly maxPointer: number
    public readonly isMoving: boolean
    public readonly isTimed: boolean
    public readonly maxDistance: number
    public readonly minDistance: number
    public readonly maxDelay: number
    public readonly minDelay: number
    public readonly angleDispersion: number

    public match: (event: PointerEvent, state: TouchState) => boolean

    public constructor(public options: O) {
        Object.assign(this, options)
        this.match = this.buildMatcher()
    }

    public patchEvent(result: NzTouchEvent, source: PointerEvent, state: TouchState) {
        Object.assign(result, this._eventDetails(source, state, result.isFinal))
    }

    protected _eventDetails(event: PointerEvent, state: TouchState, final: boolean): TouchEventDetails {
        const lastPath = state.path[state.path.length - 1][0]
        return {
            clientX: lastPath.x,
            clientY: lastPath.y,
        }
    }

    protected buildMatcherBody(): string {
        let expr = [
            `state.maxPointer <= this.maxPointer`
        ]

        let ptExpr: string[] = []
        for (const pt of this.pointerTypes) {
            ptExpr.push(`state.pointerType === "${pt}"`)
        }
        expr.push(`(${ptExpr.join(" || ")})`)

        if (this.maxDistance != null
            || this.minDistance != null) {
            expr.push(
                `(pathBeg = state.path[0][0])`,
                `(pathEnd = state.path[state.path.length - 1][0])`
            )
        }

        if (this.maxDistance != null) {
            expr.push(
                `Math.abs(pathBeg.x - pathEnd.x) < ${this.maxDistance}`,
                `Math.abs(pathBeg.y - pathEnd.y) < ${this.maxDistance}`
            )
        }

        if (this.minDistance != null) {
            expr.push(
                `(Math.abs(pathBeg.x - pathEnd.x) >= ${this.minDistance} || Math.abs(pathBeg.y - pathEnd.y) >= ${this.minDistance})`
            )
        }

        if (this.maxDelay != null) {
            expr.push(
                `state.elapsedTime < ${this.maxDelay}`
            )
        }

        if (this.minDelay != null) {
            expr.push(
                `state.elapsedTime >= ${this.minDelay}`
            )
        }

        return `return ${expr.join(" && ")}`
    }

    protected buildMatcher(): (event: PointerEvent, state: TouchState) => boolean {
        return new Function("event", "state", this.buildMatcherBody()) as any
    }
}


export class TapRecognizer extends Recognizer<RecognizerOptions> {

}


export class MoveRecognizer extends Recognizer<RecognizerOptions> {
    protected _eventDetails(event: PointerEvent, state: TouchState, final: boolean): TouchEventDetails {
        const path = state.path
        const lastPath = path[path.length - 1][0]
        const clientX = lastPath.x
        const clientY = lastPath.y
        const firstPath = path[0][0]
        const angle = Math.atan2(clientY - firstPath.y, clientX - firstPath.x)
        const disp = this.angleDispersion * (Math.PI / 180)

        let direction: Direction
        let orient: "horizontal" | "vertical"

        if (angle >= -disp && angle <= disp) {
            orient = "horizontal"
            direction = "right"
        } else if (angle >= Math.PI - disp || angle <= -Math.PI + disp) {
            orient = "horizontal"
            direction = "left"
        } else if (angle >= Math.PI / 2 - disp && angle <= Math.PI / 2 + disp) {
            orient = "vertical"
            direction = "bottom"
        } else if (angle >= -Math.PI / 2 - disp && angle <= -Math.PI / 2 + disp) {
            orient = "vertical"
            direction = "top"
        }

        let velocityX: number = PAN_VELOCITY
        let velocityY: number = PAN_VELOCITY
        if (path.length >= 2) {
            const lpath = path[path.length - 2][0]
            const duration = lastPath.t - lpath.t
            velocityX = Math.abs(lpath.x - lastPath.x) / duration
            velocityY = Math.abs(lpath.y - lastPath.y) / duration
        }
        let velocity = Math.max(velocityX, velocityY)

        let distanceX: number = lastPath.x - firstPath.x
        let distanceY: number = lastPath.y - firstPath.y

        return {
            clientX,
            clientY,
            angle,
            orient,
            direction,
            velocity,
            velocityX,
            velocityY,
            distanceX,
            distanceY
        }
    }
}


const MAX_DISTANCE_TOLERANCE = 10
const LONG_TAP_INTERVAL = 300
const PAN_VELOCITY = 0.3


export const DEFAULT_RECOGNIZERS = [
    new TapRecognizer({
        name: "tap",
        isMoving: false,
        isTimed: false,
        // maxDelay: LONG_TAP_INTERVAL,
        maxDistance: MAX_DISTANCE_TOLERANCE,
        maxPointer: 1,
        pointerTypes: ["mouse", "touch"]
    }),
    new TapRecognizer({
        name: "longtap",
        isMoving: false,
        isTimed: true,
        minDelay: LONG_TAP_INTERVAL,
        maxDistance: MAX_DISTANCE_TOLERANCE,
        maxPointer: 1,
        pointerTypes: ["touch"]
    }),
    new MoveRecognizer({
        name: "pan",
        isMoving: true,
        isTimed: false,
        minDistance: MAX_DISTANCE_TOLERANCE,
        maxPointer: 1,
        angleDispersion: 45,
        pointerTypes: ["touch", "mouse"]
    }),
]


export const DEFAULT_EVENT_FACTORIES: TouchEventFactories = {
    "tap": ["tap", (handler: TouchEventHandler) => handler],
    "longtap": ["longtap", (handler: TouchEventHandler) => handler],
    "pan": ["pan", (handler: TouchEventHandler) => handler],
    "swipe": ["pan", (handler: TouchEventHandler) => handler],
    "drag": ["pan", (handler: TouchEventHandler) => handler],

}


// type Listeners = Array<{ handler: any, recognizer: Recognizer, rc: number }>

interface TouchPoint {
    x: number,
    y: number,
    t: number
}

type TouchState = {
    path: TouchPoint[][],
    pointerType: PointerType,
    maxPointer: number,
    startEvent: PointerEvent,
    lastEvent: PointerEvent,
    elapsedTime: number
}

class Listeners {
    public readonly handlers: { [key: string]: Array<{ rc: number, handler: Function, listener: Function }> } = {}

    public readonly state: TouchState = {} as any

    public activeRecognizer: Recognizer

    public add(name: string, handler: any, listener: any) {
        let target = this.handlers[name]
        if (!target) {
            this.handlers[name] = target = []
        }

        for (const h of target) {
            if (h.handler === handler) {
                h.rc++
                return
            }
        }

        target.push({ rc: 1, handler, listener })
    }

    public del(name: string, handler: any, cb: (listener: any) => void): number {
        let target = this.handlers[name]
        if (target) {
            let l = target.length
            while (--l >= 0) {
                const h = target[l]
                if (h.handler === handler) {
                    h.rc--
                    if (h.rc <= 0) {
                        target.splice(l, 1)
                        cb(h.listener)
                    }
                }
            }
            if (target.length === 0) {
                delete this.handlers[name]
            }
        }
        return Object.keys(this.handlers).length
    }
}


export const CUSTOM_EVENT_OPTIONS = {
    bubbles: true,
    cancelable: true
}


@Injectable()
export class TouchEventService extends ɵDomEventsPlugin {
    public readonly longtapInterval = 300
    public readonly moveDistance = 10

    protected recognizers: Recognizer[]
    protected eventFactories: TouchEventFactories
    protected eventNames: string[]

    private _activeElement: HTMLElement
    private _interval: any

    public constructor(
        @Inject(DOCUMENT) private doc: HTMLDocument,
        @Inject(NgZone) private readonly zone: NgZone,
        // @Inject(PLATFORM_ID) @Optional() platformId: {} | null,
        @Inject(TOUCH_RECOGNIZERS) @Optional() recognizers: Recognizer[],
        @Inject(TOUCH_EVENTS) @Optional() eventFactories: TouchEventFactories) {
        super(doc)

        this.recognizers = recognizers || DEFAULT_RECOGNIZERS
        this.eventFactories = eventFactories || DEFAULT_EVENT_FACTORIES

        doc[ADD_EVENT_LISTENER]("mousemove", this._mousemove)
        doc[ADD_EVENT_LISTENER]("mouseup", this._mouseup)
        doc[ADD_EVENT_LISTENER]("touchcancel", this._touchcancel)
        doc[ADD_EVENT_LISTENER]("touchend", this._touchend)
        doc[ADD_EVENT_LISTENER]("touchmove", this._touchmove)
    }

    public supports(eventName: string): boolean {
        return eventName in this.eventFactories
    }

    public addEventListener(element: HTMLElement, eventName: string, handler: TouchEventHandler, useCapture?: boolean): () => void {
        let listeners = (element as any)[LISTENERS] as Listeners

        if (!listeners) {
            (element as any)[LISTENERS] = listeners = new Listeners()
            this.install(element)
        }

        const [listenFor, factory] = this.eventFactories[eventName]
        const newHandler = factory(handler)
        listeners.add(eventName, handler, newHandler)
        element[ADD_EVENT_LISTENER](listenFor as any, newHandler as any, useCapture)

        return this.removeEventListener.bind(this, element, eventName, handler, useCapture)
    }

    public removeEventListener(element: HTMLElement, eventName: string, handler: TouchEventHandler, useCapture?: boolean): void {
        let listeners = (element as any)[LISTENERS] as Listeners
        if (listeners) {
            const remaining = listeners.del(eventName, handler, (listener) => {
                element[REMOVE_EVENT_LISTENER](eventName, listener as any, useCapture)
            })
            if (remaining === 0) {
                this.uninstall(element)
            }
        }
    }

    protected install(element: HTMLElement) {
        element[ADD_EVENT_LISTENER]("mousedown", this._begin)
        element[ADD_EVENT_LISTENER]("touchstart", this._begin)
    }

    protected uninstall(element: HTMLElement) {
        delete (element as any)[LISTENERS]

        element[REMOVE_EVENT_LISTENER]("mousedown", this._begin)
        element[REMOVE_EVENT_LISTENER]("touchstart", this._begin)
    }

    private _begin = (event: PointerEvent) => {
        const el = event.currentTarget as HTMLElement
        const listeners = (el as any)[LISTENERS] as Listeners

        if (listeners) {
            event.stopPropagation()
            const state = listeners.state
            state.path = []
            state.maxPointer = 0
            state.startEvent = state.lastEvent = event

            if (event.type === "touchstart") {
                state.pointerType = "touch"
                this._extendTouchPath(listeners, event)
            } else if (event.type === "mousedown") {
                if (state.pointerType === "touch") {
                    return
                }
                // handle only primary button click
                if (event.button !== 0) {
                    return
                }
                state.pointerType = "mouse"
                this._extendMousePath(listeners, event)
            }

            this._activeElement = el
            this._installPeriodic()
        }
    }

    private _end = (event: PointerEvent, listeners: Listeners) => {
        if (event.type === "mouseup") {
            if (listeners.state.pointerType === "touch") {
                return
            }
        } else if (!this._hasInput(event.target as any)) {
            event.cancelable && event.preventDefault() // disable upcomin mouse events after touch
        }

        listeners.state.lastEvent = event

        if (listeners.activeRecognizer?.name === "tap") {
            const focusable = this._findFocusable(event.target as any)
            focusable && focusable.focus()
        }

        this._uninstallPeriodic()
        this.zone.run(() => {
            this._fireEvent(event, listeners, true)

            delete listeners.activeRecognizer;
            (listeners as { state: any }).state = { pointerType: listeners.state.pointerType }

            delete this._activeElement
        })
    }

    private _hasInput(begin: HTMLElement) {
        const until = this._activeElement
        while (begin && begin !== until) {
            if (this._isInput(begin)) {
                return true
            }
            begin = begin.parentNode as any
        }

        return this._isInput(until)
    }

    private _isInput(el: HTMLElement) {
        const tagname = el.tagName.toLowerCase()
        return tagname === "input"
            || tagname === "textarea"
            || tagname === "select"
            || el.hasAttribute("contenteditable")
    }

    private _findFocusable(begin: HTMLElement) {
        const until = this._activeElement
        while (begin) {
            if (this._isFocusable(begin)) {
                return begin
            }
            if (begin === until) {
                return null
            }
            begin = begin.parentNode as any
        }

        return null
    }

    private _isFocusable(el: HTMLElement) {
        return el.tabIndex >= 0
    }

    private _installPeriodic() {
        this._uninstallPeriodic()
        this._interval = window[SET_INTERVAL](this._checkPeriodically, 50)
    }

    private _uninstallPeriodic() {
        if (this._interval) {
            window[CLEAR_INTERVAL](this._interval)
            delete this._interval
        }
    }

    private _checkPeriodically = () => {
        if (this._activeElement) {
            const listeners = (this._activeElement as any)[LISTENERS] as Listeners
            if (listeners) {
                const state = listeners.state
                if (listeners.activeRecognizer) {
                    this._uninstallPeriodic()
                    return
                } else if (this._inActiveElement(state.lastEvent.target)) {

                    state.elapsedTime = performance.now() - state.startEvent.timeStamp
                    const recognizer = this._findRecognizer(listeners.state.startEvent, listeners, false, true)
                    if (recognizer) {
                        listeners.activeRecognizer = recognizer
                        this._end(listeners.state.startEvent, listeners)
                    }
                }
            } else {
                this._uninstallPeriodic()
            }
        } else {
            this._uninstallPeriodic()
        }
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
        listeners.state.lastEvent = event
        this._extendMousePath(listeners, event as MouseEvent)

        let rec = listeners.activeRecognizer
        if (!rec) {
            rec = listeners.activeRecognizer = this._findRecognizer(event, listeners, true, false)
        }

        if (rec && rec.isMoving) {
            this._fireEvent(event, listeners, false)
        }
    })

    private _mouseup = this._docEvtHandler((event, el, listeners) => {
        this._extendMousePath(listeners, event as MouseEvent)
        if (!listeners.activeRecognizer && this._inActiveElement(event.target)) {
            listeners.activeRecognizer = this._findRecognizer(event, listeners, false, false)
        }
        this._end(event, listeners)
    })

    private _touchcancel = this._docEvtHandler((event, el, listeners) => {
        this._end(event, listeners)
    })

    private _touchend = this._docEvtHandler((event, el, listeners) => {
        this._extendTouchPath(listeners, event as TouchEvent)
        if (!listeners.activeRecognizer && this._inActiveElement(event.target)) {
            listeners.activeRecognizer = this._findRecognizer(event, listeners, false, false)
        }
        this._end(event, listeners)
    })

    private _touchmove = this._docEvtHandler((event, el, listeners) => {
        listeners.state.lastEvent = event
        this._extendTouchPath(listeners, event as TouchEvent)

        let rec = listeners.activeRecognizer
        if (!rec) {
            rec = listeners.activeRecognizer = this._findRecognizer(event, listeners, true, false)
        }

        if (rec && rec.isMoving) {
            this._fireEvent(event, listeners, false)
        }
    })

    private _findRecognizer(event: PointerEvent, listeners: Listeners, isMoving: boolean, isTimed: boolean): Recognizer {
        const state = listeners.state
        for (const r of this.recognizers) {
            if (r.isMoving === isMoving && r.isTimed === isTimed && r.match(event, state)) {
                return r
            }
        }
        return null
    }

    private _extendMousePath(listeners: Listeners, event: MouseEvent) {
        const state = listeners.state
        state.path.push(
            [{ x: event.clientX, y: event.clientY, t: event.timeStamp }]
        )
        state.maxPointer = 1
        state.elapsedTime = event.timeStamp - state.startEvent.timeStamp
    }

    private _extendTouchPath(listeners: Listeners, event: TouchEvent) {
        const state = listeners.state
        const touches = event.touches
        let points: TouchPoint[] = []

        if (touches.length > 0) {
            for (let i = 0, l = touches.length; i < l; i++) {
                const t = touches[i]
                points.push({ x: t.clientX, y: t.clientY, t: event.timeStamp })
            }
            state.path.push(points)
            state.maxPointer = Math.max(points.length, state.maxPointer)
            state.elapsedTime = event.timeStamp - state.startEvent.timeStamp
        }
    }

    private _inActiveElement(el: any) {
        return this._activeElement && (el === this._activeElement || this._activeElement.contains(el))
    }

    private _fireEvent(event: PointerEvent, listeners: Listeners, final: boolean) {
        if (this._activeElement) {
            const recognizer = listeners.activeRecognizer
            const state = listeners.state
            if (recognizer) {
                const evt = new CustomEvent(recognizer.name, CUSTOM_EVENT_OPTIONS) as any as { -readonly [P in keyof NzTouchEvent]: NzTouchEvent[P] }
                evt.originalEvent = event
                evt.pointerType = state.pointerType
                evt.isFinal = final
                recognizer.patchEvent(evt, event, listeners.state)
                this._activeElement.dispatchEvent(evt)
            }
        }
    }
}


// tap, longtap, doubletap, swipe, swipeh, swipev


export const TOUCH_EVENT_PLUGIN: Provider = {
    provide: EVENT_MANAGER_PLUGINS,
    // useClass: TouchEventService,
    useExisting: TouchEventService,
    multi: true
}
