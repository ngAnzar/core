import { Component, Input, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core"

import { ColumnComponent } from "../../list-header.module"
import { Model } from "../../data.module"


@Component({
    selector: ".nz-data-grid-cell",
    template: `<ng-container [ngTemplateOutlet]="this.column.content" [ngTemplateOutletContext]="this"></ng-container>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridCellDirective<T extends Model = Model> {
    @Input() public column: ColumnComponent
    @Input("data") public $implicit: T
    @Input() public row: number
    @Input() public col: number

    public constructor(@Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef) {
    }
}
