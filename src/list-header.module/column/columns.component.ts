import {
    Component, ContentChildren, QueryList, AfterContentInit,
    EventEmitter, ElementRef, Inject, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy
} from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { Observable } from "rxjs"
import { startWith } from "rxjs/operators"


import { Destruct } from "../../util"
import { Model } from "../../data.module"

import { ColumnComponent, NumberWithUnit } from "./column.component"


export type ColumnsLayout = Array<{ column: ColumnComponent, width: NumberWithUnit }>;


@Component({
    selector: ".nz-columns",
    templateUrl: "./columns.template.pug",
    exportAs: "nzColumns",
    host: {
        "[style.grid-template]": "gridTemplate"
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnsComponent<T extends Model = Model> implements AfterContentInit, OnDestroy {
    public readonly destruct = new Destruct()

    @ContentChildren(ColumnComponent) public readonly items: QueryList<ColumnComponent<T>>

    // melyik column látszik, milyen sorrendben
    public readonly columnsChanged: Observable<ColumnComponent[]>

    // oszlopok szélessége
    public readonly layoutChanged: Observable<ColumnsLayout> = new EventEmitter()
    public readonly layout: ColumnsLayout = []

    public readonly gridColTemplate: string

    public set gridTemplate(val: SafeStyle) {
        this._gridTemplate = val
        this.cdr.detectChanges()
    }
    public get gridTemplate(): SafeStyle { return this._gridTemplate }
    protected _gridTemplate: SafeStyle

    public constructor(@Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected sanitizer: DomSanitizer) {
    }

    public ngAfterContentInit() {
        this.destruct.subscription(this.items.changes).pipe(startWith(null)).subscribe(change => {
            this.updateLayout(400)
        })
    }

    protected updateLayout(maxWidth: number) {
        this.layout.length = 0
        let col: string[] = []

        this.items.forEach((column, i) => {
            column.index = i
            this.layout.push({
                column: column,
                width: column.width
            })

            if (column.width.unit === "auto") {
                col.push("1fr")
            } else {
                col.push(`${column.width.number}${column.width.unit}`)
            }
        });

        (this as any).gridColTemplate = col.join(" ")
        this.gridTemplate = this.sanitizer.bypassSecurityTrustStyle(`44px / ${this.gridColTemplate}`);
        (this.layoutChanged as EventEmitter<ColumnsLayout>).emit(this.layout)
        console.log(this.gridTemplate)
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}