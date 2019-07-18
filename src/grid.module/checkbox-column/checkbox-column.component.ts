import { Component, ViewChild, TemplateRef, OnInit } from "@angular/core"

import { ColumnComponent } from "../../list-header.module"
import { PrimaryKey } from "../../data.module"


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
export class CheckboxColumnComponent extends ColumnComponent implements OnInit {
    @ViewChild("defaultContent") protected readonly defaultContent: TemplateRef<any>

    public get content(): TemplateRef<any> {
        return this._content || this.defaultContent
    }
    public set content(val: TemplateRef<any>) {
        this._content = val
    }
    protected _content: TemplateRef<any>

    public ngOnInit() {
        if (this._width.number === -1) {
            this._width = { number: 44, unit: "px" }
        }
    }

    public isChecked(pk: PrimaryKey) {
        // return this.grid.selection.getSelectOrigin(id) !== null
    }
}
