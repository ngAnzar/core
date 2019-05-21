import { Inject, ElementRef } from "@angular/core"


export class LayerConstraint {
    public readonly el: HTMLElement

    public constructor(@Inject(ElementRef) el: ElementRef<HTMLElement>) {
        this.el = el.nativeElement
    }
}