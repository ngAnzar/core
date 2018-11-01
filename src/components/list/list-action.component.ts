import { Component, Input, Output, TemplateRef, ViewChild, EventEmitter } from "@angular/core"

import { Model, Field } from "../../data.module"


export class ListActionModel extends Model {

}


@Component({
    selector: "nz-list-action",
    template: "<ng-template #tpl><ng-content></ng-content></ng-template>"
})
export class ListActionComponent {
    @Input() public readonly position: "first" | "last"
    @ViewChild("tpl", { read: TemplateRef }) public readonly tpl: TemplateRef<any>

    @Output("action") public readonly onAction: EventEmitter<ListActionComponent> = new EventEmitter()

    public readonly model = new ListActionModel({ id: Math.random().toString(36) })
}
