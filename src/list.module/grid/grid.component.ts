import {
    Component, Inject, Host, Input, DoCheck, OnInit, Attribute,
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
export class GridComponent implements AfterContentInit, OnDestroy, OnInit {
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
        @Attribute("emptyText") public readonly emptyText: string) {
        if (!emptyText) {
            this.emptyText = "A lista üres"
        }
    }

    public ngOnInit() {
        this.destruct.subscription(this.selection.changes).subscribe(this._update)
        this.destruct.subscription(this.source.storage.invalidated).subscribe(this._update)
        this.destruct.subscription(this.source.storage.items).subscribe(this._update)
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

        this.columns.gridTemplate = this.snitizer.bypassSecurityTrustStyle(`40px / ${colTemplate}`)
    }

    protected _update = () => {
        if (this.destruct.done) {
            return
        }
        this.updateGridTemplate()
        this.cdr.markForCheck()
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
