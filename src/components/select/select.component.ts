import {
    Component, ContentChild, TemplateRef, Inject, Optional, ElementRef, Renderer2, Input,
    ViewChild, AfterContentInit, AfterViewInit, ViewContainerRef
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"

import { SelectionModel, SingleSelection } from "../../selection.module"
import { DataSource, DataView, Range } from "../../data"
import { InputComponent, INPUT_VALUE_ACCESSOR } from "../input/input.component"
import { LayerService, LayerRef, DropdownLayer, DropdownLayerOptions } from "../../layer.module"
import { FormFieldComponent } from "../form-field/form-field.component"
import { DropdownComponent, DROPDOWN_ITEM_TPL } from "./dropdown.component"


export class SelectTplContext<T> {
    $implicit: T
}

export type SelectTemplateRef<T> = TemplateRef<SelectTplContext<T>>



@Component({
    selector: ".nz-select",
    templateUrl: "./select.template.pug",
    host: {
        "[attr.id]": "id",
        "[attr.tabindex]": "tabIndex",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(click)": "_handleClick($event)"
    },
    providers: [
        LayerService,
        { provide: InputComponent, useExisting: SelectComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class SelectComponent<T> extends InputComponent<T> implements AfterContentInit, AfterViewInit {
    public get type(): string { return "select" }

    @ContentChild("selected", { read: TemplateRef }) public readonly selectedTpl: SelectTemplateRef<T>
    @ContentChild("item", { read: TemplateRef }) public readonly itemTpl: SelectTemplateRef<T>

    @ViewChild("default_selected_single", { read: TemplateRef }) protected readonly defaultSelectedSingleTpl: SelectTemplateRef<T>
    @ViewChild("default_selected_multi", { read: TemplateRef }) protected readonly defaultSelectedMultiTpl: SelectTemplateRef<T>
    @ViewChild("default_item", { read: TemplateRef }) protected readonly defaultItemTpl: SelectTemplateRef<T>
    @ViewChild("dropdown", { read: TemplateRef }) protected readonly dropdownTpl: SelectTemplateRef<T>

    @Input("data-source") public readonly dataSource: DataSource<T>
    public readonly dataView: DataView<T>

    @Input()
    public set opened(val: boolean) {
        console.log("set opened", val)
        if (this._opened !== val) {
            this._opened = val
            this._updateDropDown()
        }
    }
    public get opened(): boolean { return this._opened }
    protected _opened: boolean = false

    protected ddLayer: LayerRef

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(Renderer2) _renderer: Renderer2,
        @Inject(ElementRef) el: ElementRef,
        @Inject(SelectionModel) @Optional() protected readonly selection: SelectionModel,
        @Inject(LayerService) protected readonly layer: LayerService,
        @Inject(FormFieldComponent) @Optional() protected readonly ffc: FormFieldComponent) {
        super(ngControl, ngModel, _renderer, el)

        if (!selection) {
            this.selection = new SingleSelection()
        }
    }

    public writeValue(obj: T): void {
        throw new Error("Method not implemented.")
    }

    public ngAfterContentInit() {
        (this as any).dataView = new DataView(this.dataSource)
        this.dataView.itemsChanged.subscribe(event => {
            if (this.dataView.items.length && this.ddLayer) {
                this.ddLayer.show()
            }
        })
    }

    public ngAfterViewInit() {
        if (!this.selectedTpl) {
            if (this.selection.type === "multi") {
                (this as any).selectedTpl = this.defaultSelectedMultiTpl
            } else {
                (this as any).selectedTpl = this.defaultSelectedSingleTpl
            }
        }

        if (!this.itemTpl) {
            (this as any).itemTpl = this.defaultItemTpl
        }
    }

    protected _updateDropDown() {
        if (this.opened) {
            // Promise.resolve(this.ddLayer ? this.ddLayer.hide() :)
            if (!this.ddLayer) {
                let targetEl = (this.ffc ? this.ffc.el : this.el).nativeElement
                let options: DropdownLayerOptions = {
                    position: {
                        align: "left",
                        valign: "top",
                        connect: {
                            ref: targetEl,
                            align: "left",
                            valign: "top",
                            margin: { left: -16, right: -16 },
                        }
                    },
                    backdrop: {
                        type: "empty",
                        hideOnClick: true
                    },
                    minWidth: targetEl.offsetWidth,
                    minHeight: targetEl.offsetHeight,
                    initialWidth: targetEl.offsetWidth + 32,
                    initialHeight: targetEl.offsetHeight
                }
                this.ddLayer = this.layer.createFromComponent(
                    DropdownComponent,
                    new DropdownLayer(options),
                    null,
                    [
                        { provide: SelectionModel, useValue: this.selection },
                        { provide: DataView, useValue: this.dataView },
                        { provide: DROPDOWN_ITEM_TPL, useValue: this.itemTpl }
                    ])
            }

            console.log("request...")
            this.dataView.requestRange(new Range(0, 20))
        } else if (this.ddLayer) {
            this.ddLayer.hide()
            this.ddLayer = null
        }
    }

    protected _handleClick() {
        console.log("click")
        this.opened = !this.opened
    }

    protected _handleFocus(f: boolean) {
        super._handleFocus(f)
        console.log({ _handleFocus: f })
    }
}
