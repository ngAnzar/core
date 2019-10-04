import { Inject, ElementRef } from "@angular/core"
import { EventManager } from "@angular/platform-browser"

import { Destructible } from "../../../../util"

import { Caret } from "./caret"
import { RangyService } from "./rangy"


export interface StateQuery {
    isMatch(caret: Caret): boolean
}


export class RichtextElement implements StateQuery {
    public readonly selector: string

    public constructor(public readonly type: string) {
        this.selector = type
    }

    public create(): HTMLElement {
        return document.createElement(this.type)
    }

    public isMatch(caret: Caret): boolean {
        return false
        // return el.nodeType === 1 && ((el as HTMLElement).tagName.toLowerCase() === this.type)
    }
}


export class RichtextStream2 extends Destructible {
    public readonly el: HTMLElement

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(EventManager) protected readonly evtManager: EventManager,
        @Inject(RangyService) protected readonly rangy: RangyService) {
        super()
        this.el = el.nativeElement

        this.destruct.any(evtManager.addEventListener(this.el, "keyup", this.onCursorMove) as any)
        this.destruct.any(evtManager.addEventListener(this.el, "pointerup", this.onCursorMove) as any)
    }

    public isState(query: StateQuery): boolean {
        return false
    }

    private onCursorMove = (event: Event) => {
        console.log(this.rangy.getSelection())
    }
}
