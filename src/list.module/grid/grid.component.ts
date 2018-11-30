import {
    Component, Inject, Host, Input, DoCheck,
    ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy
} from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"

import { ColumnsComponent } from "./columns.component"

import { DataSourceDirective, SelectionModel } from "../../data.module"
import { Destruct } from "../../util"



@Component({
    selector: ".nz-grid",
    templateUrl: "./grid.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridComponent implements AfterContentInit, DoCheck, OnDestroy {
    @ContentChild(ColumnsComponent) public readonly columns: ColumnsComponent

    // @Input("data-source")
    // public set source(val: DataSource<any>) {
    //     if (this._source !== val) {
    //         this._source = val
    //         this.storage = val ? new DataStorage(val) : null
    //         this._update()
    //     }
    // }
    // public get source(): DataSource<any> { return this._source }
    // protected _source: DataSource<any>

    // public set storage(val: DataStorage<any>) {
    //     if (this._storage !== val) {
    //         this._storage = val
    //         if (val) {
    //             this.destruct.subscription(val.invalidated).subscribe(this._update)
    //             this.destruct.subscription(val.items).subscribe(this._update)
    //         }
    //         this._update()
    //     }
    // }
    // public get storage(): DataStorage<any> { return this._storage }
    // protected _storage: DataStorage<any>

    // @Input()
    // public set filter(val: any) { this.storage.filter.set(val) }
    // public get filter(): any { return this.storage.filter.get() }

    // @Input()
    // public set sorter(val: any) { this.storage.sorter.set(val) }
    // public get sorter(): any { return this.storage.sorter.get() }

    public get gtRows(): SafeStyle { return this._gtRows }
    protected _gtRows: SafeStyle = ""

    public get gtRow(): SafeStyle { return this._gtRow }
    protected _gtRow: SafeStyle = ""

    public readonly destruct = new Destruct(() => {
        this.cdr.detach()
    })
    protected _rowHeight: number = 52
    protected _contentInited: boolean = false


    // @Inject(DataSource) @Host() public readonly source: DataSource<any>
    public constructor(
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected snitizer: DomSanitizer,
        @Inject(SelectionModel) @Host() public readonly selection: SelectionModel,
        @Inject(DataSourceDirective) @Host() public readonly source: DataSourceDirective) {
        selection.maintainSelection = true

        this.destruct.subscription(selection.changes).subscribe(this._update)
    }

    public ngAfterContentInit() {
        this._contentInited = true
        this.destruct.subscription(this.columns.layoutChanged).subscribe(this._update)
        this.updateGridTemplate()
    }

    public ngDoCheck() {
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

        if (this.source.storage && this.source.storage.lastIndex) {
            this._gtRows = this.snitizer.bypassSecurityTrustStyle(`repeat(${this.source.storage.lastIndex}, ${this._rowHeight}px) / 1fr`)
        }

        this._gtRow = this.snitizer.bypassSecurityTrustStyle(`${this._rowHeight}px / ${colTemplate}`)

        this.columns.gridTemplate = this.snitizer.bypassSecurityTrustStyle(`40px / ${colTemplate}`)
    }

    protected _update = () => {
        if (this.destruct.done) {
            return
        }
        if (this._contentInited) {
            this.cdr.detectChanges()
        } else {
            this.cdr.markForCheck()
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
