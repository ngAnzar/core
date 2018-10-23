import {
    Component, Inject, Host, SkipSelf, Optional, Input, OnInit, NgZone, DoCheck,
    ContentChild, AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef
} from "@angular/core"
import { DomSanitizer, SafeStyle } from "@angular/platform-browser"

import { ColumnsComponent } from "./columns.component"

import { DataSource, DataStorage, Model } from "../../data"
import { Subscriptions } from "../../util"
import { SelectionModel, SingleSelection } from "../../selection.module"


@Component({
    selector: ".nz-data-grid",
    templateUrl: "./data-grid.template.pug",
    // providers: [
    //     {
    //         provide: SelectionModel,
    //         // deps: [new Host(), new Optional(), new SkipSelf(), SingleSelection],
    //         useFactory() {
    //             return new SingleSelection()
    //         },
    //         useExisting: SelectionModel
    //     }
    // ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataGridComponent implements AfterContentInit, DoCheck {
    @ContentChild(ColumnsComponent) public readonly columns: ColumnsComponent

    @Input("data-source")
    public set source(val: DataSource<any>) {
        if (this._source !== val) {
            this._source = val
            this.storage = val ? new DataStorage(val) : null
            this.cdr.markForCheck()
        }
    }
    public get source(): DataSource<any> { return this._source }
    protected _source: DataSource<any>

    public set storage(val: DataStorage<any>) {
        if (this._storage !== val) {
            this._storage = val
            if (val) {
                this.subscriptions.add(val.invalidated).subscribe(this._update)
                this.subscriptions.add(val.items).subscribe(this._update)
            }
            this._update()
        }
    }
    public get storage(): DataStorage<any> { return this._storage }
    protected _storage: DataStorage<any>

    @Input()
    public set filter(val: any) { this.storage.filter.set(val) }
    public get filter(): any { return this.storage.filter.get() }

    @Input()
    public set sorter(val: any) { this.storage.sorter.set(val) }
    public get sorter(): any { return this.storage.sorter.get() }

    public get gtRows(): SafeStyle { return this._gtRows }
    protected _gtRows: SafeStyle = ""

    public get gtRow(): SafeStyle { return this._gtRow }
    protected _gtRow: SafeStyle = ""

    protected subscriptions: Subscriptions = new Subscriptions()
    protected _rowHeight: number = 52


    // @Inject(DataSource) @Host() public readonly source: DataSource<any>
    public constructor(@Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected snitizer: DomSanitizer,
        @Inject(SelectionModel) @Host() public readonly selection: SelectionModel) {
        selection.maintainSelection = true

        this.subscriptions.add(selection.changes).subscribe(this._update)
    }

    public ngAfterContentInit() {
        this.subscriptions.add(this.columns.layoutChanged).subscribe(this._update)
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

        if (this.storage && this.storage.lastIndex) {
            this._gtRows = this.snitizer.bypassSecurityTrustStyle(`repeat(${this.storage.lastIndex}, ${this._rowHeight}px) / 1fr`)
        }

        this._gtRow = this.snitizer.bypassSecurityTrustStyle(`${this._rowHeight}px / ${colTemplate}`)

        this.columns.gridTemplate = this.snitizer.bypassSecurityTrustStyle(`40px / ${colTemplate}`)
    }

    protected _update = () => {
        this.cdr.detectChanges()
    }
}
