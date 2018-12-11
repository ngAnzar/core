import {
    Component, Inject, Host, Input, DoCheck, OnInit, Attribute,
    ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChildren, QueryList
} from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"


import { Destruct } from "../../util"
import { DataSourceDirective, SelectionModel, Model, ID, SelectionEvent } from "../../data.module"

import { ColumnsComponent } from "../column/columns.component"
import { GridFilterService } from "../filter/grid-filter.service"
import { GridRowDirective } from "./grid-row.directive"


@Component({
    selector: ".nz-grid",
    templateUrl: "./grid.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: GridFilterService, useClass: GridFilterService }
    ]
})
export class GridComponent<T extends Model = Model> implements AfterContentInit, OnDestroy, OnInit {
    @ContentChild(ColumnsComponent) public readonly columns: ColumnsComponent<T>
    @ViewChildren(GridRowDirective) public readonly rows: QueryList<GridRowDirective<T>>

    public get gtRows(): SafeStyle { return this._gtRows }
    protected _gtRows: SafeStyle = ""

    public get gtRow(): SafeStyle { return this._gtRow }
    protected _gtRow: SafeStyle = ""

    public readonly destruct = new Destruct(() => {
        this.cdr.detach()
    })
    protected _rowHeight: number = 52

    public get displayEmptyText(): boolean {
        return this._canDisplayEmptyText && this.source.storage.lastIndex === 0
    }
    protected _canDisplayEmptyText: boolean

    // @Inject(DataSource) @Host() public readonly source: DataSource<any>
    public constructor(
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected snitizer: DomSanitizer,
        @Inject(SelectionModel) @Host() public readonly selection: SelectionModel,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective,
        @Inject(GridFilterService) public readonly filterSvc: GridFilterService,
        @Attribute("emptyText") public readonly emptyText: string) {
        if (!emptyText) {
            this.emptyText = "A lista üres"
        }
    }

    public getRow(id: ID): GridRowDirective<T> {
        for (let row of this.rows.toArray()) {
            if (row.model.id === id) {
                return row
            }
        }
    }

    public ngOnInit() {
        this.destruct.subscription(this.selection.changes).subscribe(this._onSelectionChange)
        this.destruct.subscription(this.source.storage.invalidated).subscribe(this._update)
        this.destruct.subscription(this.source.storage.items).subscribe(this._update)
        this.destruct.subscription(this.filterSvc.changes).subscribe(() => {
            console.log("filters changed...")
            this._update()
        })
        this.destruct.subscription(this.source.storage.busy).subscribe((val) => {
            this._canDisplayEmptyText = !val
            this._update()
        })
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.columns.layoutChanged).subscribe(this._update)
        this.updateGridTemplate()
    }

    // public ngDoCheck() {
    //     this.updateGridTemplate()
    // }

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

        if (this.source.storage) {
            this._gtRows = this.snitizer.bypassSecurityTrustStyle(`repeat(${this.source.storage.lastIndex || 1}, ${this._rowHeight}px) / 1fr`)
        }

        this._gtRow = this.snitizer.bypassSecurityTrustStyle(`${this._rowHeight}px / ${colTemplate}`)

        this.columns.gridTemplate = this.snitizer.bypassSecurityTrustStyle(`44px / ${colTemplate}`)
    }

    protected _update = () => {
        if (this.destruct.done) {
            return
        }
        this.updateGridTemplate()
        this.cdr.detectChanges()
    }

    protected _onSelectionChange = (changes: SelectionEvent<T>) => {
        if (this.destruct.done) {
            return
        }

        for (const add of changes) {
            const row = this.getRow(add.id)
            if (row) {
                row.detectChanges()
            }
        }

        for (const remove of changes.removed) {
            const row = this.getRow(remove.id)
            if (row) {
                row.detectChanges()
            }
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
