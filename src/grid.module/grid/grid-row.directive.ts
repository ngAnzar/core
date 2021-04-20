import { Component, Input, Inject, ContentChildren, QueryList, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"

import { SelectableDirective, Model } from "../../data.module"
import { GridCellDirective } from "./grid-cell.directive"
import { OnGridTap } from "./on-grid-tap"


@Component({
    selector: ".nz-data-grid-row",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<ng-content></ng-content><div class="nz-ripple"></div>`,
    host: {
        "[style.grid-row]": "row + 1",
        "[style.grid-column]": "1",
        "[attr.variant]": "selectable.selected ? null : 'filled'",
        "[attr.data-row]": "row",
    }
})
export class GridRowDirective<T extends Model = Model> implements OnGridTap<T> {
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

    public onGridTap(event: Event, model: T, row: number, col: number) {

    }
}
