import { Component, Inject, Input, HostListener, TemplateRef } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"

import { SelectionModel, SelectableDirective } from "../../selection.module"
import { SelectComponent } from "./select.component"


@Component({
    selector: ".nz-chip",
    templateUrl: "./chip.template.pug"
})
export class ChipComponent {
    public get selection(): SelectionModel { return this.selectable.selection }

    public constructor(
        @Inject(SelectableDirective) public readonly selectable: SelectableDirective,
        @Inject(SelectComponent) protected readonly select: SelectComponent<any>) {
        console.log("SelectionModel", this.selection)
    }

    @HostListener("mousedown", ["$event"])
    protected onClick(event: MouseEvent) {
        if (!event.defaultPrevented) {
            this.selection.setSelected(this.selectable.model.id, true)
        }
        event.preventDefault()
        event.stopImmediatePropagation()
    }

    protected removeItem(event: MouseEvent) {
        event.preventDefault()
        this.select.selection.setSelected(this.selectable.model.id, false)
        this.selection.setSelected(this.selectable.model.id, false)
    }
}
