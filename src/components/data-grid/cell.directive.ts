import { Component, Input, Inject, OnInit, OnDestroy, ViewChild, ViewContainerRef, AfterViewInit } from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"

import { ColumnComponent } from "./column.component"
import { DataGridComponent } from "./data-grid.component"


@Component({
    selector: ".nz-data-grid-cell",
    template: "<ng-container #vc></ng-container>",
    host: {
        "[style.grid-row]": "row + 1",
        "[style.grid-column]": "col + 1",
        "[class.mouse-over]": "grid.mouseOveredRow==row",
        "(mouseenter)": "grid.mouseOveredRow=row",
        "(mouseleave)": "grid.mouseOveredRow=-1",
    }
})
export class CellDirective<T> implements OnInit, OnDestroy, AfterViewInit {
    @Input() public row: number
    @Input() public col: number
    @Input() public column: ColumnComponent
    @Input() public data: T

    @ViewChild("vc", { read: ViewContainerRef }) protected readonly vc?: ViewContainerRef

    public constructor(@Inject(DataGridComponent) protected grid: DataGridComponent) {

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
}
