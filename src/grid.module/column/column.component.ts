import { Component, ContentChild, Input, Inject, ElementRef, TemplateRef, forwardRef, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, ViewContainerRef, AfterContentInit } from "@angular/core"

import { LabelDirective } from "../../common.module"
import { Model, ID } from "../../data.module"
import { LayerFactoryDirective, DropdownLayer, LayerService } from "../../layer.module"

import { GridCellDirective } from "../grid/grid-cell.directive"
import { GridComponent } from "../grid/grid.component"
import { ColumnGridFilter } from "../filter/abstract"


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
    templateUrl: "./column.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnComponent<T extends Model = Model> implements AfterContentInit {
    @ContentChild(LabelDirective, { read: ElementRef }) public readonly label: ElementRef<HTMLElement>
    @ContentChild(ColumnGridFilter) public readonly filter: ColumnGridFilter
    @ContentChild("content") public readonly content: TemplateRef<any>
    @ContentChild("editor") public readonly editor: TemplateRef<any>

    @Input()
    public set width(val: NumberWithUnit) { this._width = parseNumber(val) }
    public get width(): NumberWithUnit { return this._width }
    protected _width: NumberWithUnit = { number: -1, unit: "auto" }

    public set mouseover(val: boolean) {
        if (this._mouseover !== val) {
            this._mouseover = val
            this.cdr.detectChanges()
        }
    }
    public get mouseover(): boolean { return this._mouseover }
    private _mouseover: boolean

    protected layerFilter: LayerFactoryDirective

    public index: number

    public constructor(
        @Inject(forwardRef(() => GridComponent)) protected readonly grid: GridComponent<T>,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(LayerService) layerSvc: LayerService,
        @Inject(ViewContainerRef) vcr: ViewContainerRef) {
        this.layerFilter = LayerFactoryDirective.create("top left", "bottom left", layerSvc, vcr, el)
    }

    public getCell(id: ID): GridCellDirective<T> {
        const row = this.grid.getRow(id)
        if (row) {
            return row.cells.toArray()[this.index]
        }
    }

    public showFilter(event: Event) {
        event.preventDefault()
        event.stopImmediatePropagation()

        const layerFilter = this.layerFilter
        this.filter.layerFilter = layerFilter

        if (layerFilter.isVisible) {
            layerFilter.hide()
        } else {
            layerFilter.nzLayerFactory = this.filter.layer
            const behavior = new DropdownLayer({
                minWidth: this.el.nativeElement.offsetWidth,
                initialWidth: this.el.nativeElement.offsetWidth,
                elevation: 10,
                backdrop: {
                    type: "empty",
                    crop: this.el.nativeElement,
                    hideOnClick: true
                }
            })
            let ref = layerFilter.show(behavior, { $implicit: this.filter })

            let s = ref.output.subscribe(event => {
                if (event.type === "") {
                    s.unsubscribe()
                    this.cdr.detectChanges()
                    this.filter.resetValue()
                }
            })
        }
    }

    public ngAfterContentInit() {
        if (this.filter) {
            if (!this.filter.title && this.label) {
                this.filter.title = this.label.nativeElement.innerText
            }
        }
    }

    @HostListener("mouseenter", ["$event"])
    @HostListener("mouseleave", ["$event"])
    public onMouseEnter(event: Event) {
        this.mouseover = event.type === "mouseenter"
    }
}
