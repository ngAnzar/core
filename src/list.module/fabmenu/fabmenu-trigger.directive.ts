import { Directive, Inject, HostListener } from "@angular/core"

import { FabmenuComponent } from "./fabmenu.component"


@Directive({
    selector: "[nzFabmenuTrigger]"
})
export class FabmenuTriggerDirective {
    public constructor(
        @Inject(FabmenuComponent) public readonly menu: FabmenuComponent) {
    }

    @HostListener("tap", ["$event"])
    public onTap(event: Event) {
        event.preventDefault()
        this.menu.toggle()
    }
}
