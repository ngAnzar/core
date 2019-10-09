import { Component, Inject, ViewChild, ElementRef, NgZone, HostBinding } from "@angular/core"


import { InputComponent, InputModel, INPUT_MODEL, FocusChangeEvent } from "../abstract"
import { RichtextDirective } from "./richtext.directive"
import { RichtextMenuDirective } from "./richtext-menu.component"
import { RichtextStream } from "./core/richtext-stream"
import { RICHTEXT_AUTO_COMPLETE_EL } from "./core/autocomplete"


@Component({
    selector: ".nz-richtext-input",
    templateUrl: "./richtext-input.component.pug",
    providers: INPUT_MODEL
})
export class RichtextInputComponent extends InputComponent<string> {
    @ViewChild("input", { read: RichtextDirective, static: true }) public readonly input: RichtextDirective
    @ViewChild("input", { read: RichtextMenuDirective, static: true }) public readonly menu: RichtextMenuDirective
    @ViewChild("scroller", { read: ElementRef, static: true }) public readonly scrollerEl: ElementRef

    @HostBinding("attr.tabindex")
    public readonly tabIndexAttr = -1

    private _checkScrollRaf: any
    private _scrollHack: () => void

    public constructor(
        @Inject(InputModel) model: InputModel<string>,
        @Inject(ElementRef) el: ElementRef,
        @Inject(NgZone) private readonly zone: NgZone) {
        super(model)

        this.monitorFocus(el.nativeElement, true)
        this.destruct.subscription(model.focusChanges).subscribe(this._handleFocus.bind(this))


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

    protected _renderValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        this.input.value = normalizedValue
    }

    protected _handleInput(stream: RichtextStream) {
        let value = stream.contentTpl
        if (!value || value.length === 0) {
            value = null
        }
        this.model.emitValue(value)
    }

    protected _handleFocus(event: FocusChangeEvent) {
        const focused = event.current

        if (focused) {
            this._startScrollHack()
            if (!this.input.stream.getState(RICHTEXT_AUTO_COMPLETE_EL)) {
                this.menu.show()
            }
        } else {
            this._stopScrollHack()
            if (!this.menu.isMouseOver) {
                this.menu.hide()
            }
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
        return super.ngOnDestroy()
    }
}
