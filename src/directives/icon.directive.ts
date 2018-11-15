import { Directive, HostBinding, Input } from "@angular/core"


@Directive({ selector: ".nz-icon" })
export class IconDirective {
    @HostBinding("attr.color")
    @Input()
    public color: string
}
