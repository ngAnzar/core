import { Component, Input, Output, EventEmitter, Inject, Optional, HostListener } from "@angular/core"
import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { Observable } from "rxjs"

import { SelectableDirective, PropagateSelection } from "../../data.module"
import { AnzarComponent } from "../abstract-component"


@Component({
    selector: ".nz-chip",
    templateUrl: "./chip.component.pug"
})
export class ChipComponent extends AnzarComponent {
    @Input()
    public set removable(val: boolean) {
        val = coerceBooleanProperty(val)
        if (this._removable !== val) {
            this._removable = val
        }
    }
    public get removable(): boolean { return this._removable }
    private _removable: boolean

    @Output("remove") public onRemove: Observable<any> = new EventEmitter()

    public constructor(
        @Inject(SelectableDirective) @Optional() public readonly selectable: SelectableDirective,
        @Inject(PropagateSelection) @Optional() public readonly selection: PropagateSelection) {
        super()
        this._color = "dark-base"
        this._variant = "filled"
    }

    public remove(event: any) {
        console.log("remove")
        if (this.selectable) {
            this.selection.setSelected(this.selectable.model.id, null)
        } else {
            (this.onRemove as EventEmitter<any>).emit(event)
        }
        event.srcEvent.preventDefault()
    }

    @HostListener("tap", ["$event"])
    public onTap(event: any) {
        if (this.selectable) {
            if (!event.srcEvent.defaultPrevented) {
                if (this.selectable) {
                    this.selection.setSelected(this.selectable.model.id, "mouse")
                }
                event.srcEvent.preventDefault()
            }
        }
    }
}
