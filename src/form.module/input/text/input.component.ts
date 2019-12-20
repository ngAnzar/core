import { Component, ElementRef, Inject, HostListener, Optional, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from "@angular/core"
import * as autosize from "autosize"

import { InputComponent, InputModel, INPUT_MODEL } from "../abstract"
import { InputMask } from "../input-mask.service"


@Component({
    selector: "input.nz-input:not([type]), input[type='password'].nz-input, input[type='text'].nz-input, input[type='email'].nz-input, input[type='number'].nz-input",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: INPUT_MODEL,
    host: {
        "[style.opacity]": "mask && mask.options.lazy === false ? (model.value || model.focused ? '1' : '0') : '1'"
    }
})
export class TextFieldComponent extends InputComponent<string> implements AfterViewInit {
    public constructor(
        @Inject(InputModel) model: InputModel<string>,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLInputElement>,
        @Inject(InputMask) @Optional() private readonly mask: InputMask,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
        super(model)

        this.monitorFocus(el.nativeElement)
        this.destruct.subscription(this._focus).subscribe(this.cdr.detectChanges.bind(this.cdr))
    }

    public ngAfterViewInit() {
        if (this.mask) {
            this.mask.connect(this.el.nativeElement)
        }
    }

    protected _renderValue(value: string) {
        if (this.mask) {
            this.mask.value = value
        } else {
            this.el.nativeElement.value = value != null ? value : ""
        }
        this.cdr.markForCheck()
    }

    @HostListener("input", ["$event"])
    protected _onInput(event: Event) {
        let value = this.el.nativeElement.value
        if (this.mask) {
            this.mask.value = value
            value = this.mask.unmaskedValue
        }

        this.model.emitValue(value ? value : null)
        this.cdr.markForCheck()
    }
}


@Component({
    selector: "textarea.nz-input",
    template: "",
    providers: INPUT_MODEL
})
export class TextareaComponent extends InputComponent<string> {
    public constructor(
        @Inject(InputModel) model: InputModel<string>,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLTextAreaElement>) {
        super(model)

        this.monitorFocus(el.nativeElement)
    }

    protected _renderValue(value: string) {
        this.el.nativeElement.value = value
    }

    @HostListener("input", ["$event"])
    protected _onInput(event: Event) {
        let value = this.el.nativeElement.value
        this.model.emitValue(value ? value : null)
    }

    public ngOnInit() {
        super.ngOnInit()
        autosize(this.el.nativeElement)
        this.destruct.any(() => autosize.destroy(this.el.nativeElement))
    }
}
