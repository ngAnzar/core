import { Directive, Inject, TemplateRef } from "@angular/core"

import { FabmenuComponent } from "./fabmenu.component"


@Directive({
    selector: "[nzFabmenuTrigger]"
})
export class FabmenuTriggerDirective {
    public constructor(
        @Inject(TemplateRef) public readonly tpl: TemplateRef<any>) {
        // console.log("trigger", menu)
    }
}
