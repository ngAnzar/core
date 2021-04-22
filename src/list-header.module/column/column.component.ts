import {
    Component, ContentChild, Input, Inject, ElementRef, TemplateRef, OnDestroy,
    HostListener, ChangeDetectionStrategy, ChangeDetectorRef, ViewContainerRef, AfterContentInit, HostBinding, Output, EventEmitter, Optional,
    OnInit
} from "@angular/core"
import { Subscription } from "rxjs"
import { startWith, map } from "rxjs/operators"

import { Destruct, getPath } from "../../util"
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
export class ColumnComponent<T extends Model = Model> implements OnInit, AfterContentInit, OnDestroy {
    @ContentChild(LabelDirective, { read: ElementRef, static: true }) public readonly label: ElementRef<HTMLElement>
    @ContentChild(ColumnFilter, { static: true }) public readonly filter: ColumnFilter
    @ContentChild("content", { static: true })
    public set content(val: TemplateRef<any>) {
        if (this._content !== val) {
            this._content = val
        }
    }
    public get content(): TemplateRef<any> { return this._content }
    protected _content: TemplateRef<any>

    @ContentChild("editor", { static: true }) public readonly editor: TemplateRef<any>

    @Input()
    public set width(val: NumberWithUnit) {
        let width = parseNumber(val)
        if (!this._width || !width || this._width.unit !== width.unit || this._width.number !== width.number) {
            this.widthChange.next(this._width = width)
        }
    }
    public get width(): NumberWithUnit { return this._width }
    protected _width: NumberWithUnit = { number: -1, unit: "auto" }

    @Input()
    public set minWidth(val: NumberWithUnit) {
        let width = parseNumber(val)
        if (!this._minWidth || !width || this._minWidth.unit !== width.unit || this._minWidth.number !== width.number) {
            this.widthChange.next(this._minWidth = width)
        }
    }
    public get minWidth(): NumberWithUnit { return this._minWidth }
    private _minWidth: NumberWithUnit

    @Input()
    public set flex(val: number) {
        val = Number(val)
        if (this._flex !== val) {
            this._flex = val
        }
    }
    public get flex(): number { return this._flex }
    private _flex: number

    @Output() public widthChange = new EventEmitter<NumberWithUnit>()

    @Input()
    @HostBinding("attr.sortable")
    public set sortable(val: string) {
        if (!this.dataSource || !this.dataSource.storage) {
            this._pendingSortable = val
            return
        }

        if (this._sortable !== val) {
            this._sortable = val

            if (val) {
                if (!this._sorterChangeSub) {
                    this._sorterChangeSub = this.dataSource.sorterChanges
                        .pipe(
                            startWith({ value: this.dataSource.sort }),
                            map(v => this.dataSource.sort)
                        )
                        .subscribe(sort => {
                            this.sortDirection = sort ? ((sort as any)[this._sortable] || getPath(sort, this._sortable)) : null
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
    private _pendingSortable: string

    public set sortDirection(val: "asc" | "desc") {
        if (this._sortDirection !== val) {
            this._sortDirection = val
            if (this.sortable && this.dataSource) {
                if (val) {
                    this.dataSource.sort = { [this.sortable]: val }
                } else {
                    let sort = this.dataSource.sort as any
                    if (sort) {
                        delete sort[this.sortable]
                        this.dataSource.sort = sort
                    }
                }
            }
            this.cdr.markForCheck()
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
        @Inject(DataSourceDirective) @Optional() protected readonly dataSource: DataSourceDirective) {
        this.layerFilter = LayerFactoryDirective.create("top left", "bottom left", layerSvc, vcr, el)
    }

    public ngOnInit() {
        if (this._pendingSortable) {
            this.sortable = this._pendingSortable
            delete this._pendingSortable
        }
    }

    public showFilter(event: Event) {
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
                rounded: 3,
                backdrop: {
                    type: "empty",
                    crop: event.currentTarget as HTMLElement,
                    hideOnClick: true
                },
                trapFocus: true
            })
            let ref = layerFilter.show(behavior, { $implicit: this.filter })

            let s = ref.output.subscribe(event => {
                if (event.type === "destroy") {
                    s.unsubscribe()
                    this.cdr.markForCheck()
                    this.filter.resetValue()
                } else if (event.type === "shown") {
                    this.filter.writeValue(this.filter.name, (this.dataSource.filter as any)[this.filter.name])
                }
            })
        }
    }

    public ngAfterContentInit() {
        const filter = this.filter
        if (filter) {
            this.destruct.subscription(filter.valueChanges).subscribe(() => {
                if ((!filter.title || filter.title.length === 0) && this.label) {
                    filter.title = this.label.nativeElement.innerText
                }
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
        if (event.defaultPrevented) {
            return
        }
        event.preventDefault()
        this.toggleSorter()
    }

    public toggleSorter() {
        if (this.sortable) {
            this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
        this.sortable = null
    }
}
