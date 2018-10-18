import {
    Component, ContentChildren, QueryList, AfterContentInit,
    EventEmitter, ElementRef, Inject, ChangeDetectionStrategy, ChangeDetectorRef
} from "@angular/core"
import { SafeStyle } from "@angular/platform-browser"
import { Observable } from "rxjs"

import { ColumnComponent, NumberWithUnit } from "./column.component"


export type ColumnsLayout = Array<{ column: ColumnComponent, width: NumberWithUnit }>


@Component({
    selector: ".nz-columns",
    templateUrl: "./columns.template.pug",
    host: {
        "[style.grid-template]": "gridTemplate"
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnsComponent implements AfterContentInit {
    @ContentChildren(ColumnComponent) public readonly items: QueryList<ColumnComponent>

    // melyik column látszik, milyen sorrendben
    public readonly columnsChanged: Observable<ColumnComponent[]>

    // oszlopok szélessége
    public readonly layoutChanged: Observable<ColumnsLayout> = new EventEmitter()
    public readonly layout: ColumnsLayout = []

    public set gridTemplate(val: SafeStyle) {
        this._gridTemplate = val
        this.cdr.markForCheck()
    }
    public get gridTemplate(): SafeStyle { return this._gridTemplate }
    protected _gridTemplate: SafeStyle

    public constructor(@Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef) {

    }

    public ngAfterContentInit() {
        this.updateLayout(400)
    }

    protected updateLayout(maxWidth: number) {
        this.layout.length = 0
        this.items.forEach((column, i) => {
            column.index = i
            this.layout.push({
                column: column,
                width: column.width
            })
        });
        (this.layoutChanged as EventEmitter<ColumnsLayout>).emit(this.layout)
    }
}
