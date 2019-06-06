import { Component, Inject, ViewChild, Optional, ElementRef, NgZone, OnDestroy, HostListener } from "@angular/core"
import { NgControl, NgModel } from "@angular/forms"
import { Observable } from "rxjs"


import { Destruct } from "../../../util"
import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"
import { LayerService, LayerRef, ComponentLayerRef, DropdownLayer } from "../../../layer.module"
import { RichtextDirective } from "./richtext.directive"
import { RichtextMenu } from "./richtext-menu.component"
import { RichtextStream } from "./richtext-stream"
import { ScrollerComponent } from "../../../list.module"


@Component({
    selector: ".nz-richtext-input",
    templateUrl: "./richtext-input.component.pug",
    providers: [
        { provide: InputComponent, useExisting: RichtextInputComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class RichtextInputComponent extends InputComponent<string> implements OnDestroy {
    public destruct = new Destruct()

    public get type(): string { return "text" }

    @ViewChild("input") public readonly input: RichtextDirective
    @ViewChild("scroller", { read: ElementRef }) public readonly scrollerEl: ElementRef


    public set menuVisible(val: boolean) {
        if (this._menuVisible !== val) {
            this._menuVisible = val
            this[val ? "_showMenu" : "_hideMenu"]()
        }
    }
    public get menuVisible(): boolean { return this._menuVisible }
    private _menuVisible: boolean

    private _menuRef: ComponentLayerRef<RichtextMenu>
    private _checkScrollRaf: any
    private _scrollHack: () => void

    public constructor(
        @Inject(NgControl) @Optional() ngControl: NgControl,
        @Inject(NgModel) @Optional() ngModel: NgModel,
        @Inject(ElementRef) el: ElementRef,
        @Inject(LayerService) protected readonly layerSvc: LayerService,
        @Inject(NgZone) protected readonly zone: NgZone) {
        super(ngControl, ngModel, el)


        // XXX: Atom heck, content editable, always try to scroll scroller element, when overflow...
        zone.runOutsideAngular(() => {
            this._scrollHack = () => {
                let el = this.scrollerEl ? this.scrollerEl.nativeElement : null
                if (el) {
                    if (el.scrollTop !== 0) {
                        el.scrollTop = 0
                    }
                    if (el.scrollLeft !== 0) {
                        el.scrollLeft = 0
                    }
                }
                this._checkScrollRaf = requestAnimationFrame(this._scrollHack)
            }
        })
    }

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

        // this.menuVisible = !this.input.stream.state.autocomplete.enabled

        return super._handleInput(value)
    }

    protected _handleFocus(focused: boolean) {
        this.menuVisible = !this.input.stream.state.autocomplete.enabled && (
            focused
            || (this._menuRef && this._menuRef.component && this._menuRef.component.instance.mouseIsOver)
        )
        if (focused) {
            this._startScrollHack()
        } else {
            this._stopScrollHack()
        }
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
        let ac = this.input.stream.state.autocomplete
        this.menuVisible = !ac.enabled
        if (this._menuRef && this._menuRef.component) {
            this._menuRef.component.instance.cdr.detectChanges()
        }
    }

    private _startScrollHack() {
        if (!this._checkScrollRaf) {
            this.zone.runOutsideAngular(this._scrollHack)
        }
    }

    private _stopScrollHack() {
        if (this._checkScrollRaf) {
            cancelAnimationFrame(this._checkScrollRaf)
            delete this._checkScrollRaf
        }
    }

    public ngOnDestroy() {
        this._stopScrollHack()
        this._hideMenu()
        this.destruct.run()
        return super.ngOnDestroy()
    }
}
