import { Directive, Inject, Optional, Host } from "@angular/core"

import { SelectionModel } from "../../selection.module"
import { ListItemComponent } from "./list-item.component"


@Directive({
    selector: ".nz-list"
})
export class ListDirective {
    public constructor(
        @Inject(SelectionModel) @Optional() @Host() public readonly selection?: SelectionModel<any>) {
    }
}
