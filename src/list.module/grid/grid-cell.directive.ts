import {
    Component, Input, Inject, OnInit, OnDestroy,
    ViewChild, ViewContainerRef, AfterViewInit, ElementRef, HostListener, DoCheck,
    ChangeDetectionStrategy, ChangeDetectorRef, EmbeddedViewRef
} from "@angular/core"

import { ColumnComponent } from "./column.component"
import { GridComponent } from "./grid.component"
import { Model, SelectionModel } from "../../data.module"



@Component({
    selector: ".nz-data-grid-cell",
    template: "<ng-container #vc></ng-container>",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridCellDirective<T extends Model = Model> implements OnInit, OnDestroy, AfterViewInit, DoCheck {
    @Input() public row: number
    @Input() public set col(val: number) {
        val = parseFloat(val as any)
        if (this._col !== val) {
            this._col = Math.round(val)
            this.el.nativeElement.style.gridArea = `1 / ${Math.round(this._col + 1)}`
            this.cdr.markForCheck()
        }
    }
    public get col(): number { return this._col }
    protected _col: number

    @Input() public column: ColumnComponent
    @Input()
    public set data(val: T) {
        this._data = val
        this.redraw()
        this.cdr.markForCheck()
    }
    public get data(): T { return this._data }
    protected _data: T
    protected _redraw: boolean = true

    @ViewChild("vc", { read: ViewContainerRef }) protected readonly vc?: ViewContainerRef

    public constructor(
        @Inject(GridComponent) protected grid: GridComponent,
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(SelectionModel) protected sel: SelectionModel,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef) {
    }

    public ngOnInit() {
    }

    public ngOnDestroy() {
        delete this.grid
        delete this.column
        delete this.data
    }

    public ngAfterViewInit() {
        this.redraw()
    }

    public ngDoCheck() {
        if (this.vc.length) {
            this.vc.get(0).markForCheck()
        }
    }

    @HostListener("click")
    public onClick() {
        this.sel.setSelected(this.data.id, true)
    }

    protected redraw() {
        this.vc.clear()
        this.vc.createEmbeddedView(this.column.content, {
            $implicit: this.data,
            row: this.row,
            col: this.col,
            cell: this
        })
    }
}
