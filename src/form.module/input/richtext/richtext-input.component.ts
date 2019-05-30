import { Component, Inject, ViewChild, Optional, ElementRef } from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"
import { LayerService, LayerRef, ComponentLayerRef, DropdownLayer } from "../../../layer.module"
import { RichtextDirective } from "./richtext.directive"
import { RichtextMenu } from "./richtext-menu.component"
import { RichtextStream } from "./richtext-stream"


@Component({
    selector: ".nz-richtext-input",
    templateUrl: "./richtext-input.component.pug",
    providers: [
        { provide: InputComponent, useExisting: RichtextInputComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class RichtextInputComponent extends InputComponent<string> {
    public get type(): string { return "text" }

    @ViewChild("input") public readonly input: RichtextDirective

    public set menuVisible(val: boolean) {
        if (this._menuVisible !== val) {
            this._menuVisible = val
            this[val ? "_showMenu" : "_hideMenu"]()
        }
    }
    public get menuVisible(): boolean { return this._menuVisible }
    private _menuVisible: boolean

    private _menuRef: ComponentLayerRef<RichtextMenu>

    writeValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        this.input.value = normalizedValue
    }

    protected _handleInput(value: string | null) {
        if (!value || value.length === 0) {
            value = null
        } else if (value === "<br>") {
            value = null
            this.input.value = ""
        }

        return super._handleInput(value)
    }

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(ElementRef) el: ElementRef,
        @Inject(LayerService) protected readonly layerSvc: LayerService) {
        super(ngControl, ngModel, el)
    }

    protected _handleFocus(focused: boolean) {
        this.menuVisible = focused || (this._menuRef && this._menuRef.component && this._menuRef.component.instance.mouseIsOver)
        return super._handleFocus(focused)
    }

    protected _showMenu() {
        if (!this._menuRef || !this._menuRef.isVisible) {
            let behavior = new DropdownLayer({
                backdrop: null,
                elevation: 4,
                rounded: 2,
                position: {
                    anchor: {
                        ref: this.el.nativeElement,
                        align: "top left",
                        margin: 10
                    },
                    align: "bottom left"
                }
            })
            this._menuRef = this.layerSvc.createFromComponent(RichtextMenu, behavior, null, [
                { provide: RichtextStream, useValue: this.input.stream }
            ])
            this._menuRef.show()
        }
    }

    protected _hideMenu() {
        if (this._menuRef) {
            this._menuRef.hide()
            delete this._menuRef
        }
    }

    protected _updateMenu() {
        if (this._menuRef && this._menuRef.component) {
            this._menuRef.component.instance.cdr.detectChanges()
        }
    }
}
