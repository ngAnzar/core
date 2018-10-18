import {
    Component, Inject, Host, SkipSelf, Optional, Input, OnInit, NgZone,
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
export class DataGridComponent implements OnInit, AfterContentInit {
    @Input("data-source")
    public source: DataSource<any>
    protected storage: DataStorage<any>

    @ContentChild(ColumnsComponent) public readonly columns: ColumnsComponent

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

        this.subscriptions.add(selection.changes).subscribe(event => {
            this.cdr.detectChanges()
        })
    }

    public ngOnInit() {
        this.storage = new DataStorage(this.source)
        this.subscriptions.add(this.storage.invalidated).subscribe(() => {
            this.updateGridTemplate()
        })
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

        if (this.storage) {
            this._gtRows = this.snitizer.bypassSecurityTrustStyle("repeat(${this.storage.lastIndex}, ${this._rowHeight}px) / 1fr")
        }

        this._gtRow = this.snitizer.bypassSecurityTrustStyle(`${this._rowHeight}px / ${colTemplate}`)

        this.columns.gridTemplate = this.snitizer.bypassSecurityTrustStyle(`40px / ${colTemplate}`)

        this.cdr.detectChanges()
    }
}
