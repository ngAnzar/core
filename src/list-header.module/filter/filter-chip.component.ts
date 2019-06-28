import { Component, Input, Output, EventEmitter } from "@angular/core"
import { Observable } from "rxjs"


@Component({
    selector: ".nz-list-filter-chip",
    templateUrl: "./filter-chip.template.pug"
})
export class ListFilterChipComponent {
    @Input() public title: string
    @Input() public titleSeparator: string = ":"
    @Output() public readonly remove: Observable<void> = new EventEmitter()

    public onRemoveClick(event: Event) {
        event.preventDefault()
        event.stopImmediatePropagation();
        (this.remove as EventEmitter<void>).emit()
    }
}
