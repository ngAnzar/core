import { Component, Inject, ViewChild, ElementRef, HostBinding } from "@angular/core"


import { InputComponent, InputModel, INPUT_MODEL, FocusChangeEvent } from "../abstract"
import { RichtextDirective } from "./richtext.directive"
import { RichtextMenuDirective } from "./richtext-menu.component"
import { RichtextStream } from "./core/richtext-stream"
import { RICHTEXT_AUTO_COMPLETE_EL } from "./core/autocomplete"
import { SelectionService } from "./core/selection"


@Component({
    selector: ".nz-richtext-input",
    templateUrl: "./richtext-input.component.pug",
    providers: INPUT_MODEL
})
export class RichtextInputComponent extends InputComponent<string> {
    @ViewChild("input", { read: RichtextDirective, static: true }) public readonly input: RichtextDirective
    @ViewChild("input", { read: RichtextMenuDirective, static: true }) public readonly menu: RichtextMenuDirective
    @ViewChild("input", { read: SelectionService, static: true }) public readonly selection: SelectionService
    @ViewChild("scroller", { read: ElementRef, static: true }) public readonly scrollerEl: ElementRef

    @HostBinding("attr.tabindex")
    public readonly tabIndexAttr = -1

    private _checkScrollRaf: any

    public constructor(
        @Inject(InputModel) model: InputModel<string>,
        @Inject(ElementRef) el: ElementRef) {
        super(model)

        this.monitorFocus(el.nativeElement, true)
        this.destruct.subscription(model.focusChanges).subscribe(this.handleFocus.bind(this))
    }

    protected _renderValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        this.input.value = normalizedValue
    }

    public _handleInput(stream: RichtextStream) {
        let value = stream.contentTpl
        if (!value || value.length === 0) {
            value = null
        }
        this.model.emitValue(value)
    }

    protected handleFocus(event: FocusChangeEvent) {
        const focused = event.current

        if (!focused && !this.menu.isMouseOver) {
            this.menu.hide()
        }
    }

    public _onCursorMove() {
        if (this.selection.current.type === "Range" || this.menu.canShowByState()) {
            if (!this.input.stream.getState(RICHTEXT_AUTO_COMPLETE_EL)) {
                this.menu.show()
            }
        } else {
            this.menu.hide()
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
