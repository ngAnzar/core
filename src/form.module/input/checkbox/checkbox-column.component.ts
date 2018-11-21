import { Component, ViewChild, TemplateRef, Inject } from "@angular/core"

import { ColumnComponent } from "../../../list.module"
import { ID, SelectionModel } from "../../../data.module"


@Component({
    selector: ".nz-checkbox-column",
    host: {
        "class": "nz-column"
    },
    templateUrl: "./checkbox-column.template.pug",
    providers: [
        { provide: ColumnComponent, useExisting: CheckboxColumnComponent }
    ]
})
export class CheckboxColumnComponent extends ColumnComponent {
    @ViewChild("defaultContent") protected readonly defaultContent: TemplateRef<any>

    public constructor(
        @Inject(SelectionModel) protected readonly selection: SelectionModel) {
        super()
        console.log({ chk: selection })
        if (this._width.number === -1) {
            this._width = { number: 44, unit: "px" }
        }
    }

    public get content(): TemplateRef<any> {
        return this._content || this.defaultContent
    }
    public set content(val: TemplateRef<any>) {
        this._content = val
    }
    protected _content: TemplateRef<any>

    public setChecked(id: ID, checked: boolean) {
        this.selection.setSelected(id, checked)
    }

    public isChecked(id: ID) {
        return this.selection.isSelected(id)
    }
}
