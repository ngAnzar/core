import {
    Component, ContentChild, TemplateRef, Inject, Optional, ElementRef, Renderer2, Input,
    ViewChild, AfterContentInit, AfterViewInit, ViewContainerRef,
    ChangeDetectionStrategy, ChangeDetectorRef, Attribute
} from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"

import { SelectionModel, SingleSelection, SelectionEvent } from "../../selection.module"
import { DataSource, DataStorage, Range, Model, ID } from "../../data"
import { InputComponent, INPUT_VALUE_ACCESSOR } from "../input/input.component"
import { LayerService, LayerRef, DropdownLayer, DropdownLayerOptions } from "../../layer.module"
import { FormFieldComponent } from "../form-field/form-field.component"
import { DropdownComponent, DROPDOWN_ITEM_TPL } from "./dropdown.component"
import { Subscriptions } from "../../util/subscriptions"


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
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        LayerService,
        { provide: InputComponent, useExisting: SelectComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class SelectComponent<T extends Model> extends InputComponent<ID[]> implements AfterContentInit, AfterViewInit {
    public get type(): string { return "select" }

    @ContentChild("selected", { read: TemplateRef }) public readonly selectedTpl: SelectTemplateRef<T>
    @ContentChild("item", { read: TemplateRef }) public readonly itemTpl: SelectTemplateRef<T>

    @ViewChild("hidden", { read: ElementRef }) protected readonly hidden: ElementRef<HTMLElement>
    @ViewChild("default_selected_single", { read: TemplateRef }) protected readonly defaultSelectedSingleTpl: SelectTemplateRef<T>
    @ViewChild("default_selected_multi", { read: TemplateRef }) protected readonly defaultSelectedMultiTpl: SelectTemplateRef<T>
    @ViewChild("default_item", { read: TemplateRef }) protected readonly defaultItemTpl: SelectTemplateRef<T>
    @ViewChild("dropdown", { read: TemplateRef }) protected readonly dropdownTpl: SelectTemplateRef<T>

    @Input("data-source") public readonly dataSource: DataSource<T>
    public readonly storage: DataStorage<T>
    public readonly displayField: string

    @Input()
    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
            this._updateDropDown()
            this.cdr.markForCheck()
        }
    }
    public get opened(): boolean { return this._opened }
    protected _opened: boolean = false

    // public get submitValue(): string {
    //     return
    // }

    public get selected(): T[] {
        return this.selection.items
    }

    protected ddLayer: LayerRef
    protected s = new Subscriptions()

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(Renderer2) _renderer: Renderer2,
        @Inject(ElementRef) el: ElementRef,
        @Inject(SelectionModel) @Optional() protected readonly selection: SelectionModel<T>,
        @Inject(LayerService) protected readonly layer: LayerService,
        @Inject(FormFieldComponent) @Optional() protected readonly ffc: FormFieldComponent,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Attribute("display-field") displayField: string) {
        super(ngControl, ngModel, _renderer, el)

        if (!selection) {
            this.selection = new SingleSelection()
        }

        this.selection.maintainSelection = true
        this.s.add(this.selection.changes).subscribe(selected => {
            if (this.selection.type !== "multi") {
                this.opened = false
            }
            this.value = selected.map(item => item.id)
            this.cdr.markForCheck()
        })

        this.displayField = displayField || "label"
    }

    public toggle() {
        this.opened = !this.opened
        this.cdr.markForCheck()
    }

    public writeValue(obj: ID[]): void {
        if (this.hidden) {
            this._renderer.setAttribute(this.hidden.nativeElement, "value", obj ? obj.join(",") : "")
        }
    }

    public ngAfterContentInit() {
        (this as any).storage = new DataStorage(this.dataSource)
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
                    minWidth: targetEl.offsetWidth + 32,
                    minHeight: targetEl.offsetHeight,
                    initialWidth: targetEl.offsetWidth + 32,
                    initialHeight: targetEl.offsetHeight,
                    elevation: 10
                }
                this.ddLayer = this.layer.createFromComponent(
                    DropdownComponent,
                    new DropdownLayer(options),
                    null,
                    [
                        { provide: SelectionModel, useValue: this.selection },
                        { provide: DataStorage, useValue: this.storage },
                        { provide: DROPDOWN_ITEM_TPL, useValue: this.itemTpl }
                    ])

                let s = this.ddLayer.output.subscribe(event => {
                    if (event.type === "hiding") {
                        this.opened = false
                        s.unsubscribe()
                    }
                })
            }
            this.ddLayer.show()
        } else if (this.ddLayer) {
            this.ddLayer.hide()
            this.ddLayer = null
        }
    }

    protected _handleClick() {
        this.opened = !this.opened
    }

    protected _handleFocus(f: boolean) {
        super._handleFocus(f)
    }
}
