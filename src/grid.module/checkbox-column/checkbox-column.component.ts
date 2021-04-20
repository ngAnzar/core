import { Component, ViewChild, TemplateRef, OnInit, Inject, ChangeDetectorRef, ElementRef, ViewContainerRef, Optional } from "@angular/core"

import { ColumnComponent } from "../../list-header.module"
import { DataSourceDirective, PrimaryKey, SelectionModel, Model } from "../../data.module"
import { LayerService } from "../../layer.module"
import { OnGridTap } from "../grid/on-grid-tap"


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
export class CheckboxColumnComponent extends ColumnComponent implements OnInit, OnGridTap<Model> {
    @ViewChild("defaultContent", { static: true }) protected readonly defaultContent: TemplateRef<any>

    public constructor(
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(LayerService) layerSvc: LayerService,
        @Inject(ViewContainerRef) vcr: ViewContainerRef,
        @Inject(DataSourceDirective) @Optional() dataSource: DataSourceDirective,
        @Inject(SelectionModel) private readonly selection: SelectionModel) {
        super(cdr, el, layerSvc, vcr, dataSource)
        selection.keyboard.disableMouse = true
    }

    public set content(val: TemplateRef<any>) {
        this._content = val
    }
    public get content(): TemplateRef<any> {
        return this._content || this.defaultContent
    }

    public ngOnInit() {
        if (this._width.number === -1) {
            this._width = { number: 44, unit: "px" }
        }
    }

    public isChecked(pk: PrimaryKey) {
        return this.selection.getSelectOrigin(pk) !== null
    }

    public onGridTap(event: Event, model: Model, row: number, col: number) {
        event.preventDefault()
        this.selection.setSelected(model.pk, this.isChecked(model.pk) ? null : "mouse")
    }
}
