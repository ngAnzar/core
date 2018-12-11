import { Component, Input, Output, EventEmitter } from "@angular/core"
import { Observable } from "rxjs"


@Component({
    selector: ".nz-grid-filter-chip",
    templateUrl: "./grid-filter-chip.template.pug"
})
export class GridFilterChipComponent {
    @Input() public title: string
    @Input() public titleSeparator: string = ":"
    @Output() public readonly remove: Observable<void> = new EventEmitter()

    public onRemoveClick(event: Event) {
        event.preventDefault()
        event.stopImmediatePropagation();
        (this.remove as EventEmitter<void>).emit()
    }
}
