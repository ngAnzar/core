import { Component, Input, Inject, OnInit, OnDestroy, ViewChild, ViewContainerRef, AfterViewInit, ElementRef, HostListener } from "@angular/core"

import { ColumnComponent } from "./column.component"
import { DataGridComponent } from "./data-grid.component"
import { Model } from "../../data.module"
import { SelectionModel } from "../../selection.module"


@Component({
    selector: ".nz-data-grid-cell",
    template: "<ng-container #vc></ng-container>"
})
export class DataGridCellDirective<T extends Model = Model> implements OnInit, OnDestroy, AfterViewInit {
    @Input() public row: number
    @Input() public set col(val: number) {
        val = parseFloat(val as any)
        if (this._col !== val) {
            this._col = Math.round(val)
            this.el.nativeElement.style.gridArea = `1 / ${Math.round(this._col + 1)}`
        }
    }
    public get col(): number { return this._col }
    protected _col: number

    @Input() public column: ColumnComponent
    @Input() public data: T

    @ViewChild("vc", { read: ViewContainerRef }) protected readonly vc?: ViewContainerRef

    public constructor(
        @Inject(DataGridComponent) protected grid: DataGridComponent,
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(SelectionModel) protected sel: SelectionModel) {
    }

    public ngOnInit() {
    }

    public ngOnDestroy() {
        delete this.grid
        delete this.column
        delete this.data
    }

    public ngAfterViewInit() {
        let view = this.vc.createEmbeddedView(this.column.content, {
            $implicit: this.data,
            row: this.row,
            col: this.col,
            cell: this
        })

        this.vc.insert(view, 0)
    }

    @HostListener("click")
    public onClick() {
        this.sel.setSelected(this.data.id, true)
    }
}
