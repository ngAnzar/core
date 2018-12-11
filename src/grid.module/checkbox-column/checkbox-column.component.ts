import { Component, ViewChild, TemplateRef, Inject, ViewContainerRef, ChangeDetectorRef, ElementRef } from "@angular/core"

import { ColumnComponent } from "../column/column.component"
import { GridComponent } from "../grid/grid.component"
import { ID, SelectionModel } from "../../data.module"
import { LayerService } from "../../layer.module"


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
        @Inject(SelectionModel) protected readonly selection: SelectionModel,
        @Inject(GridComponent) grid: GridComponent,
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(LayerService) layerSvc: LayerService,
        @Inject(ViewContainerRef) vcr: ViewContainerRef) {
        super(grid, cdr, el, layerSvc, vcr)

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

    public isChecked(id: ID) {
        return this.selection.getSelectOrigin(id) !== null
    }
}
