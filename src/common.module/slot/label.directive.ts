import { Directive, HostBinding, Input, ElementRef, Inject, ChangeDetectorRef } from "@angular/core"
import { NzSlotContent } from "./abstract"


@Directive({
    selector: "[nzSlot='label'], label",
    host: {
        "[style.textAlign]": "'left'"
    },
    providers: [{ provide: NzSlotContent, useExisting: LabelDirective }]
})
export class LabelDirective extends NzSlotContent {
    // @Input()
    // @HostBinding("attr.for")
    public targetId: string

    @Input()
    public set targetEl(val: ElementRef<HTMLElement>) {
        if (!this._targetEl || !val || this._targetEl.nativeElement !== val.nativeElement) {
            this._targetEl = val
            this.targetId = val.nativeElement.id
        }
    }
    public get targetEl(): ElementRef<HTMLElement> { return this._targetEl }
    private _targetEl: ElementRef<HTMLElement>
}
