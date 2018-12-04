import { Component, ContentChild, Input, Inject, ElementRef, TemplateRef, forwardRef } from "@angular/core"

import { LabelDirective } from "../../common.module"
import { Model, ID } from "../../data.module"
import { GridCellDirective } from "./grid-cell.directive"
import { GridComponent } from "./grid.component"


export interface NumberWithUnit {
    number: number,
    unit: string
}


function parseNumber(val: any): NumberWithUnit {
    if (val === "auto") {
        return { number: -1, unit: "auto" }
    } else {
        let m = `${val}`.match(/^(\d+(?:\.\d+)?)\s*(\D+)$/)
        if (m) {
            return { number: parseFloat(m[1]), unit: m[2] }
        } else {
            return { number: parseInt(val, 10), unit: "px" }
        }
    }
}


@Component({
    selector: ".nz-column",
    templateUrl: "./column.template.pug"
})
export class ColumnComponent<T extends Model = Model> {
    @ContentChild(LabelDirective) public readonly label: ElementRef<LabelDirective>
    @ContentChild("content") public readonly content: TemplateRef<any>
    @ContentChild("editor") public readonly editor: TemplateRef<any>

    @Input()
    public set width(val: NumberWithUnit) { this._width = parseNumber(val) }
    public get width(): NumberWithUnit { return this._width }
    protected _width: NumberWithUnit = { number: -1, unit: "auto" }

    public index: number

    public constructor(@Inject(forwardRef(() => GridComponent)) protected readonly grid: GridComponent<T>) {
    }

    public getCell(id: ID): GridCellDirective<T> {
        const row = this.grid.getRow(id)
        if (row) {
            return row.cells.toArray()[this.index]
        }
    }
}
