import { Injectable, ElementRef, Inject, Optional, PLATFORM_ID, NgZone } from "@angular/core"
import { EventManager, ɵDomEventsPlugin, EVENT_MANAGER_PLUGINS, DOCUMENT } from "@angular/platform-browser"

const ZingTouch = require("zingtouch")


export const SUPPORTED_EVENTS: { [key: string]: boolean } = {
    tap: true
}


@Injectable({ providedIn: "root" })
export class ZingTouchRegion {
    public readonly instance: any

    public constructor(
        @Inject(ElementRef) @Optional() el: ElementRef<HTMLElement>,
        @Inject(DOCUMENT) doc: HTMLDocument) {
        console.log("ZingTouchRegion", el)
        if (el) {
            this.instance = ZingTouch.Region(el.nativeElement)
        } else {
            this.instance = ZingTouch.Region(document.body)
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
            region.bind(element, eventName, handler)
            return function () {
                region.unbind(element, eventName)
            }
        })
    }

    public removeEventListener(target: any, eventName: string, callback: Function): void {
        this.region.instance.unbind(target, eventName)
    }
}
