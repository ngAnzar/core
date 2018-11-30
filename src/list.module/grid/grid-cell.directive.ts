import { Component, Input, ChangeDetectionStrategy } from "@angular/core"

import { ColumnComponent } from "./column.component"
import { Model } from "../../data.module"


@Component({
    selector: ".nz-data-grid-cell",
    template: `<ng-template [ngTemplateOutlet]="this.column.content" [ngTemplateOutletContext]="this"></ng-template>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridCellDirective<T extends Model = Model> {
    @Input() public column: ColumnComponent
    @Input("data") public $implicit: T
    @Input() public row: number
    @Input() public col: number
}


/*
@Component({
    selector: ".nz-data-grid-cell",
    template: "<ng-container #vc></ng-container>",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class _GridCellDirective<T extends Model = Model> implements OnDestroy, AfterViewInit, DoCheck {
    @Input()
    public row: number

    @Input()
    public set col(val: number) {
        val = parseFloat(val as any)
        if (this._col !== val) {
            this._col = Math.round(val)
            this.el.nativeElement.style.gridArea = `1 / ${Math.round(this._col + 1)}`
            this.ngDoCheck()
        }
    }
    public get col(): number { return this._col }
    protected _col: number

    @Input()
    public column: ColumnComponent

    @Input()
    public set data(val: T) {
        this._data = val
        this.redraw()
        this.ngDoCheck()
    }
    public get data(): T { return this._data }
    protected _data: T
    protected _redraw: boolean = true

    @ViewChild("vc", { read: ViewContainerRef }) protected readonly vc?: ViewContainerRef

    public constructor(
        @Inject(GridComponent) protected grid: GridComponent,
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef) {
    }

    public ngAfterViewInit() {
        this.redraw()
    }

    public ngDoCheck() {
        if (this.grid) {
            if (this.vc.length) {
                let view = this.vc.get(0)
                !view.destroyed && view.detectChanges()
            }
        }
    }

    public ngOnDestroy() {
        delete this.grid
        delete this.column
        delete this.data
    }

    protected redraw() {
        if (this.grid) {
            this.vc.clear()
            this.vc.createEmbeddedView(this.column.content, {
                $implicit: this.data,
                row: this.row,
                col: this.col,
                cell: this
            })
        }
    }
}



*/
