import { Component, Inject, Optional, ChangeDetectorRef } from "@angular/core"

import { Destructible } from "../../util"
import { ListFilterService } from "../filter/list-filter.service"


@Component({
    selector: ".nz-list-header",
    templateUrl: "./list-header.component.pug"
})
export class ListHeaderComponent extends Destructible {
    public constructor(
        @Inject(ListFilterService) @Optional() public readonly filterSvc: ListFilterService,
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef) {
        super()

        if (filterSvc) {
            this.destruct.subscription(filterSvc.changes).subscribe(cdr.markForCheck.bind(cdr))
        }
    }
}
