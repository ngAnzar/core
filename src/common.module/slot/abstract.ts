import { Input, HostBinding, Directive } from "@angular/core"


@Directive()
export abstract class NzSlotContent {
    @Input("nzSlot")
    @HostBinding("attr.nz-slot")
    public readonly slot: string
}
