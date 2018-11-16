import { Input, HostBinding } from "@angular/core"


export abstract class NzSlotContent {
    @Input("nzSlot")
    @HostBinding("attr.nz-slot")
    public readonly slot: string
}
