import { Component, OnDestroy, OnInit, ElementRef, Inject, HostListener } from "@angular/core"
import { FocusMonitor } from "@angular/cdk/a11y"
import * as autosize from "autosize"

import { InputComponent, InputModel, INPUT_MODEL } from "../abstract"


@Component({
    selector: "input.nz-input:not([type]), input[type='password'].nz-input, input[type='text'].nz-input, input[type='email'].nz-input, input[type='number'].nz-input",
    template: "",
    providers: INPUT_MODEL
})
export class TextFieldComponent extends InputComponent<string> {
    public constructor(
        @Inject(InputModel) model: InputModel<string>,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLInputElement>) {
        super(model)

        this.monitorFocus(el.nativeElement)
    }

    protected _renderValue(value: string) {
        this.el.nativeElement.value = value != null ? value : ""
    }

    @HostListener("input", ["$event"])
    protected _onInput(event: Event) {
        let value = this.el.nativeElement.value
        this.model.emitValue(value ? value : null)
    }
}


@Component({
    selector: "textarea.nz-input",
    template: "",
    providers: INPUT_MODEL
})
export class TextareaComponent extends InputComponent<string> implements OnInit {
    public constructor(
        @Inject(InputModel) model: InputModel<string>,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLInputElement>) {
        super(model)

        this.monitorFocus(el.nativeElement)
    }

    protected _renderValue(value: string) {
        this.el.nativeElement.innerText = value
    }

    @HostListener("input", ["$event"])
    protected _onInput(event: Event) {
        let value = this.el.nativeElement.value
        this.model.emitValue(value ? value : null)
    }

    public ngOnInit() {
        autosize(this.el.nativeElement)
        this.destruct.any(() => autosize.destroy(this.el.nativeElement))
    }
}
