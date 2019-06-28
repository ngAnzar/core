import {
    Component, ContentChild, Input, Inject, ElementRef, TemplateRef, OnDestroy,
    HostListener, ChangeDetectionStrategy, ChangeDetectorRef, ViewContainerRef, AfterContentInit, HostBinding
} from "@angular/core"
import { Subscription } from "rxjs"
import { startWith } from "rxjs/operators"

import { Destruct } from "../../util"
import { LabelDirective } from "../../common.module"
import { Model, DataSourceDirective } from "../../data.module"
import { LayerFactoryDirective, DropdownLayer, LayerService } from "../../layer.module"
import { ColumnFilter } from "../filter/abstract"


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
export class ColumnComponent<T extends Model = Model> implements AfterContentInit, OnDestroy {
    @ContentChild(LabelDirective, { read: ElementRef }) public readonly label: ElementRef<HTMLElement>
    @ContentChild(ColumnFilter) public readonly filter: ColumnFilter
    @ContentChild("content") public readonly content: TemplateRef<any>
    @ContentChild("editor") public readonly editor: TemplateRef<any>

    @Input()
    public set width(val: NumberWithUnit) { this._width = parseNumber(val) }
    public get width(): NumberWithUnit { return this._width }
    protected _width: NumberWithUnit = { number: -1, unit: "auto" }

    @Input()
    @HostBinding("attr.sortable")
    public set sortable(val: string) {
        if (this._sortable !== val) {
            this._sortable = val

            if (val) {
                if (!this._sorterChangeSub) {
                    this._sorterChangeSub = this.dataSource.sorterChanges
                        .pipe(startWith({ value: this.dataSource.sort }))
                        .subscribe(changes => {
                            let sorter = changes.value as any
                            if (sorter && sorter[this.sortable] != null) {
                                this.sortDirection = sorter[this.sortable]
                            }
                        })
                }
            } else if (this._sorterChangeSub) {
                this._sorterChangeSub.unsubscribe()
                delete this._sorterChangeSub
            }

            this.cdr.markForCheck()
        }
    }
    public get sortable(): string { return this._sortable }
    private _sortable: string
    private _sorterChangeSub: Subscription

    public set sortDirection(val: "asc" | "desc") {
        if (this._sortDirection !== val) {
            this._sortDirection = val
            if (this.sortable) {
                if (val) {
                    this.dataSource.sort = { [this.sortable]: val }
                } else {
                    let sort = this.dataSource.sort as any
                    delete sort[this.sortable]
                    this.dataSource.sort = sort
                }
            }
            this.cdr.detectChanges()
        }
    }
    public get sortDirection(): "asc" | "desc" { return this._sortDirection }
    private _sortDirection: "asc" | "desc"

    public set mouseover(val: boolean) {
        if (this._mouseover !== val) {
            this._mouseover = val
            this.cdr.markForCheck()
        }
    }
    public get mouseover(): boolean { return this._mouseover }
    private _mouseover: boolean

    protected layerFilter: LayerFactoryDirective

    public index: number
    public readonly destruct = new Destruct()

    public constructor(
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>,
        @Inject(LayerService) layerSvc: LayerService,
        @Inject(ViewContainerRef) vcr: ViewContainerRef,
        @Inject(DataSourceDirective) protected readonly dataSource: DataSourceDirective) {
        this.layerFilter = LayerFactoryDirective.create("top left", "bottom left", layerSvc, vcr, el)
    }

    public showFilter() {
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
                    this.cdr.markForCheck()
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

            this.destruct.subscription(this.filter.valueChanges).subscribe(() => {
                this.cdr.markForCheck()
            })
        }
    }

    @HostListener("mouseenter", ["$event"])
    @HostListener("mouseleave", ["$event"])
    public onMouseEnter(event: Event) {
        this.mouseover = event.type === "mouseenter"
    }

    @HostListener("tap", ["$event"])
    public onTap(event: Event) {
        console.log("onTap1", this.sortDirection)
        if (this.sortable) {
            this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
        }
        console.log("onTap2", this.sortDirection)
        event.preventDefault()
    }

    public ngOnDestroy() {
        this.destruct.run()
        this.sortable = null
    }
}
