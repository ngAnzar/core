import {
    AfterContentInit,
    Attribute,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ElementRef,
    EventEmitter,
    Host,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    ViewChildren
} from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"

import { NzTouchEvent } from "../../common.module"
import { DataSourceDirective, Model, PrimaryKey, SelectionEvent, SelectionModel } from "../../data.module"
import { ColumnsComponent, ListFilterService } from "../../list-header.module"
import { Destruct, MarginParsed, parseMargin } from "../../util"
import { GridRowDirective } from "./grid-row.directive"
import { OnGridTap } from "./on-grid-tap"

@Component({
    selector: ".nz-grid",
    templateUrl: "./grid.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ListFilterService]
})
export class GridComponent<T extends Model = Model> implements AfterContentInit, OnDestroy, OnInit {
    @ContentChild(ColumnsComponent, { static: true }) public readonly columns: ColumnsComponent<T>
    @ViewChildren(GridRowDirective) public readonly rows: QueryList<GridRowDirective<T>>

    @Input()
    public set padding(val: MarginParsed) {
        this._padding = parseMargin(val as any)
    }
    public get padding(): MarginParsed {
        return this._padding
    }
    public _padding: MarginParsed

    @Input() public updateMinWidth: boolean = true

    @Output() public rowTap = new EventEmitter<T>()

    public get gtRows(): SafeStyle {
        return this._gtRows
    }
    protected _gtRows: SafeStyle = ""

    public get gtRow(): SafeStyle {
        return this._gtRow
    }
    protected _gtRow: SafeStyle = ""

    public readonly destruct = new Destruct(() => {
        this.cdr.detach()
    })
    public _rowHeight: number = 52

    public get displayEmptyText(): boolean {
        return this._canDisplayEmptyText && this.source.storage.lastIndex === 0
    }
    protected _canDisplayEmptyText: boolean

    public displayLoading: boolean = true

    public constructor(
        @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected snitizer: DomSanitizer,
        @Inject(SelectionModel) @Host() public readonly selection: SelectionModel,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective,
        @Inject(ListFilterService) public readonly filterSvc: ListFilterService,
        @Attribute("emptyText") public readonly emptyText: string,
        @Attribute("busyText") public readonly busyText: string
    ) {
        this.padding = 24 as any
        if (!emptyText) {
            this.emptyText = "A lista üres"
        }
        if (!busyText) {
            this.busyText = "elemek betöltése ..."
        }
    }

    public getRow(pk: PrimaryKey): GridRowDirective<T> {
        for (const row of this.rows.toArray()) {
            if (row.model.pk === pk) {
                return row
            }
        }
    }

    public ngOnInit() {
        this.destruct.subscription(this.selection.changes).subscribe(this._onSelectionChange)
        this.destruct.subscription(this.source.storage.invalidated).subscribe(this._update)
        this.destruct.subscription(this.source.storage.items).subscribe(this._update)
        this.destruct.subscription(this.source.storage.busy).subscribe(this._updateLoading)
        this.destruct.subscription(this.filterSvc.changes).subscribe(() => {
            this._update()
        })
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.columns.layoutChanged).subscribe(this._update)
        this.updateGridTemplate()
        this.cdr.markForCheck()
    }

    public reaload() {
        this.source.reload()
    }

    protected updateGridTemplate() {
        if (!this.columns) {
            return
        }

        if (this.source.storage) {
            this._gtRows = this.snitizer.bypassSecurityTrustStyle(
                `repeat(${this.source.storage.lastIndex || 1}, ${this._rowHeight}px) / 1fr`
            )
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

    protected _updateLoading = (busy: boolean) => {
        if (this.destruct.done) {
            return
        }
        this._canDisplayEmptyText = !busy
        this.displayLoading = busy
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

    public onTap(event: NzTouchEvent) {
        if (event.defaultPrevented) {
            return
        }

        const gridEl = this.el.nativeElement
        let el = event.originalEvent.target as HTMLElement
        let row: number
        let col: number

        while (el && el !== gridEl) {
            const data = el.dataset
            if (data["row"] != null && data["col"] != null) {
                row = Number(data["row"])
                col = Number(data["col"])
            } else if (data["row"] != null) {
                row = Number(data["row"])
                break
            }
            el = el.parentElement
        }

        let rowCmp: GridRowDirective<T>
        for (const r of this.rows) {
            if (r.row === row) {
                rowCmp = r
                break
            }
        }

        if (!rowCmp) {
            return
        }

        const model = rowCmp.model

        const columnCmp = this.columns.items.get(col) as any as OnGridTap<T>
        if (columnCmp && columnCmp.onGridTap) {
            columnCmp.onGridTap(event, model, row, col)
            if (event.defaultPrevented) {
                return
            }
        }

        rowCmp.onGridTap(event, model, row, col)
        if (event.defaultPrevented) {
            return
        }
        this.rowTap.next(model)

        event.preventDefault()
        event.stopImmediatePropagation()
    }
}
