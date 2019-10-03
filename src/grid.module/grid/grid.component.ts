import {
    Component, Inject, Host, Input, DoCheck, OnInit, Attribute,
    ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChildren, QueryList,
    Output, EventEmitter
} from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"


import { Destruct } from "../../util"
import { DataSourceDirective, SelectionModel, Model, PrimaryKey, SelectionEvent } from "../../data.module"
import { ListFilterService, ColumnsComponent } from "../../list-header.module"

import { GridRowDirective } from "./grid-row.directive"


@Component({
    selector: ".nz-grid",
    templateUrl: "./grid.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ListFilterService]
})
export class GridComponent<T extends Model = Model> implements AfterContentInit, OnDestroy, OnInit {
    @ContentChild(ColumnsComponent) public readonly columns: ColumnsComponent<T>
    @ViewChildren(GridRowDirective) public readonly rows: QueryList<GridRowDirective<T>>

    @Output() public rowTap = new EventEmitter<T>()

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
        @Inject(ListFilterService) public readonly filterSvc: ListFilterService,
        @Attribute("emptyText") public readonly emptyText: string) {
        if (!emptyText) {
            this.emptyText = "A lista üres"
        }
    }

    public getRow(pk: PrimaryKey): GridRowDirective<T> {
        for (let row of this.rows.toArray()) {
            if (row.model.pk === pk) {
                return row
            }
        }
    }

    public ngOnInit() {
        this.destruct.subscription(this.selection.changes).subscribe(this._onSelectionChange)
        this.destruct.subscription(this.source.storage.invalidated).subscribe(this._update)
        this.destruct.subscription(this.source.storage.items).subscribe(this._update)
        this.destruct.subscription(this.filterSvc.changes).subscribe(() => {
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
        if (!this.columns) {
            return
        }

        if (this.source.storage) {
            this._gtRows = this.snitizer.bypassSecurityTrustStyle(`repeat(${this.source.storage.lastIndex || 1}, ${this._rowHeight}px) / 1fr`)
        }

        this._gtRow = this.snitizer.bypassSecurityTrustStyle(`${this._rowHeight}px / ${this.columns.gridColTemplate}`)
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
            const row = this.getRow(add.pk)
            if (row) {
                row.detectChanges()
            }
        }

        for (const remove of changes.removed) {
            const row = this.getRow(remove.pk)
            if (row) {
                row.detectChanges()
            }
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
