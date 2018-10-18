import { Directive, Input } from "@angular/core"


@Directive({
    selector: ".nz-data-grid-row",
    host: {
        "[style.grid-row]": "row + 1",
        "[style.grid-column]": "1",
    }
})
export class DataGridRowDirective {
    @Input() public row: number
}
