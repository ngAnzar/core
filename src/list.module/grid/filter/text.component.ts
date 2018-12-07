import { Component, Inject } from "@angular/core"

import { GridFilterDirective } from "./grid-filter.directive"


@Component({
    selector: "nz-grid-filter[type='text']",
    templateUrl: "./text.template.pug"
})
export class GridFilterText {
    public constructor(@Inject(GridFilterDirective) protected readonly filter: GridFilterDirective) {

    }
}
