import { Component, Input, Inject, ContentChildren, QueryList, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"

import { SelectableDirective, Model } from "../../data.module"
import { GridCellDirective } from "./grid-cell.directive"


@Component({
    selector: ".nz-data-grid-row",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<ng-content></ng-content>`,
    host: {
        "[style.grid-row]": "row + 1",
        "[style.grid-column]": "1",
    }
})
export class GridRowDirective<T extends Model = Model> {
    @ContentChildren(GridCellDirective) public readonly cells: QueryList<GridCellDirective<T>>
    @Input() public row: number

    public get model(): T { return this.selectable.model }

    public constructor(
        @Inject(SelectableDirective) public readonly selectable: SelectableDirective<T>,
        @Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef) {
    }

    public detectChanges() {
        for (const cell of this.cells.toArray()) {
            cell.cdr.detectChanges()
        }
        this.cdr.markForCheck()
    }

    // public ngOnChanges() {
    //     console.log("row.ngOnChanges", this.row)
    // }
}
