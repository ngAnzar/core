import { Component, Inject, Host, Input, OnInit, ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"

import { ColumnsComponent } from "./columns.component"

import { DataSource } from "../../data/data-source"
import { DataView } from "../../data/data-view"
import { Range } from "../../data/range"
import { Subscriptions } from "../../util"


@Component({
    selector: ".nz-data-grid",
    templateUrl: "./data-grid.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataGridComponent implements OnInit, AfterContentInit {
    @Input("data-source") public source: DataSource<any>
    protected dataView: DataView<any>

    @ContentChild(ColumnsComponent) public readonly columns: ColumnsComponent

    public get headerGridTemplate(): { [key: string]: string } { return this._headerGridTemplate }
    protected _headerGridTemplate: { [key: string]: string } = {}

    public get rowsGridTemplate(): { [key: string]: string } { return this._rowsGridTemplate }
    protected _rowsGridTemplate: { [key: string]: string } = {}

    protected subscriptions: Subscriptions = new Subscriptions()
    protected _rowHeight: number = 52

    public set mouseOveredRow(val: number) {
        this._mouseOveredRow = val
    }
    public get mouseOveredRow(): number {
        return this._mouseOveredRow
    }
    protected _mouseOveredRow: number = -1


    // @Inject(DataSource) @Host() public readonly source: DataSource<any>
    public constructor(@Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected snitizer: DomSanitizer) {
    }

    public ngOnInit() {
        this.dataView = new DataView(this.source)
        this.subscriptions.add(this.dataView.itemsChanged).subscribe(() => {
            this.updateGridTemplate()
        })
        this.dataView.requestRange(new Range(0, 40))
    }

    public ngAfterContentInit() {
        this.subscriptions.add(this.columns.layoutChanged).subscribe((layout) => {
            this.updateGridTemplate()
        })
        this.updateGridTemplate()
    }

    protected updateGridTemplate() {
        let col = []
        for (const l of this.columns.layout) {
            if (l.width.unit === "auto") {
                col.push(`1fr`)
            } else {
                col.push(`${l.width.number}${l.width.unit}`)
            }
        }

        let colTemplate = col.join(" ")

        if (this.dataView) {
            this._rowsGridTemplate["grid-template-columns"] = colTemplate
            this._rowsGridTemplate["grid-template-rows"] = `repeat(${this.dataView.lastIndex}, ${this._rowHeight}px)`
        }

        this.columns.gridTemplate = {
            "grid-template-columns": colTemplate,
            "grid-template-rows": "40px"
        }

        this.cdr.markForCheck()
    }
}
