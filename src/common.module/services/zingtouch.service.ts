import { Injectable, ElementRef, Inject, Optional, PLATFORM_ID, NgZone, Provider } from "@angular/core"
import { EventManager, ɵDomEventsPlugin, EVENT_MANAGER_PLUGINS, DOCUMENT } from "@angular/platform-browser"

const ZingTouch = require("zingtouch")


export const SUPPORTED_EVENTS: { [key: string]: boolean } = {
    tap: true
}


@Injectable({ providedIn: "root" })
export class ZingTouchRegion {
    public readonly instance: any

    public constructor(
        @Inject(ElementRef) @Optional() private el: ElementRef<HTMLElement>,
        @Inject(DOCUMENT) private doc: HTMLDocument) {
        if (el) {
            this.instance = ZingTouch.Region(el.nativeElement)
        } else {
            this.instance = ZingTouch.Region(doc.body)
        }
    }
}


@Injectable()
export class ZingTouchPlugin extends ɵDomEventsPlugin {
    public constructor(
        @Inject(DOCUMENT) doc: any,
        @Inject(NgZone) ngZone: NgZone,
        @Inject(PLATFORM_ID) @Optional() platformId: {} | null,
        @Inject(ZingTouchRegion) protected readonly region: ZingTouchRegion) {
        super(doc, ngZone, platformId)
    }

    public supports(eventName: string): boolean {
        return SUPPORTED_EVENTS[eventName] === true && SUPPORTED_EVENTS.hasOwnProperty(eventName)
    }

    public addEventListener(element: HTMLElement, eventName: string, handler: Function): Function {
        let zone: NgZone = (this as any).ngZone
        let region = this.region.instance
        return zone.runOutsideAngular(() => {
            function cb(event: any) {
                if (event.detail && event.detail.events && event.detail.events.length) {
                    let events: any[] = event.detail.events
                    for (let evt of events) {
                        if (evt.originalEvent && (
                            evt.originalEvent.target === element
                            || element.contains(evt.originalEvent.target))) {
                            handler(event)
                            break
                        }
                    }
                } else {
                    handler(event)
                }
            }

            region.bind(element, eventName, cb)
            return function () {
                region.unbind(element, eventName)
            }
        })
    }

    public removeEventListener(target: any, eventName: string, callback: Function): void {
        this.region.instance.unbind(target, eventName)
    }
}


export const ZING_TOUCH_PLUGIN: Provider = {
    provide: EVENT_MANAGER_PLUGINS,
    useClass: ZingTouchPlugin,
    multi: true
}
