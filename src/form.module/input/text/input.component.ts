import { Component, ElementRef, Inject, HostListener, Optional, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, Self } from "@angular/core"
import { merge } from "rxjs"
import { startWith } from "rxjs/operators"
import * as autosize from "autosize"

import { InputComponent, InputModel, INPUT_MODEL } from "../abstract"
import { InputMask } from "../input-mask.service"


@Component({
    selector: "input.nz-input:not([type]), input[type='password'].nz-input, input[type='text'].nz-input, input[type='email'].nz-input",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: INPUT_MODEL
})
export class TextFieldComponent<T = string> extends InputComponent<T> implements AfterViewInit {
    public constructor(
        @Inject(InputModel) model: InputModel<T>,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLInputElement>,
        @Inject(InputMask) @Optional() @Self() private readonly mask: InputMask,
        @Inject(ChangeDetectorRef) private readonly cdr: ChangeDetectorRef) {
        super(model)

        this.monitorFocus(el.nativeElement)
    }

    public ngAfterViewInit() {
        const mask = this.mask
        const el = this.el
        if (mask) {
            mask.connect(this.el.nativeElement)
            this.destruct.subscription(mask.accept).subscribe(mask => {
                this.model.emitValue(this._convertValue(mask.unmaskedValue))
                this.cdr.markForCheck()
            })
        }
        this.destruct.subscription(merge(this.model.focusChanges, this.model.valueChanges))
            .pipe(startWith(null))
            .subscribe(() => {
                if (mask) {
                    if ((mask.options as any).lazy === false) {
                        el.nativeElement.style.opacity = (!this.model.isEmpty || this.model.focused ? "1" : "0")
                    }
                }
            })
    }

    protected _renderValue(value: T) {
        let renderValue = value == null
            ? ""
            : String(value)

        if (this.mask) {
            this.mask.value = renderValue
        } else {
            this.el.nativeElement.value = renderValue
        }
        this.cdr.markForCheck()
    }

    @HostListener("input", ["$event"])
    protected _onInput(event: Event) {
        if (!this.mask) {
            let value = this.el.nativeElement.value

            this.model.emitValue(this._convertValue(this.el.nativeElement.value))
            this.cdr.markForCheck()
        }
    }

    protected _convertValue(value: any): T {
        return value == null ? null : String(value) as any
    }
}


@Component({
    selector: "input[type='number'].nz-input",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: INPUT_MODEL
})
export class NumberFieldComponent extends TextFieldComponent<number> {
    protected _convertValue(value: any): number {
        return value == null ? null : Number(value) as any
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
