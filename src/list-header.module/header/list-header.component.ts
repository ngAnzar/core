import { Component, Inject } from "@angular/core"

import { ListFilterService } from "../filter/list-filter.service"


@Component({
    selector: ".nz-list-header",
    templateUrl: "./list-header.component.pug"
})
export class ListHeaderComponent {
    public constructor(@Inject(ListFilterService) public readonly filterSvc: ListFilterService) { }
}
