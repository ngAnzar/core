import { Component, ElementRef, Inject, HostListener, Optional, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, Self } from "@angular/core"
import { merge } from "rxjs"
import { startWith } from "rxjs/operators"
import * as autosize from "autosize"

import { InputComponent, InputModel, INPUT_MODEL } from "../abstract"
import { InputMask } from "../input-mask.service"


@Component({
    selector: "input.nz-input:not([type]), input[type='password'].nz-input, input[type='text'].nz-input, input[type='email'].nz-input, input[type='number'].nz-input",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: INPUT_MODEL
})
export class TextFieldComponent extends InputComponent<string> implements AfterViewInit {
    public constructor(
        @Inject(InputModel) model: InputModel<string>,
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
                const value = mask.unmaskedValue
                this.model.emitValue(value ? value : null)
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
        if (!this.mask) {
            let value = this.el.nativeElement.value
            this.model.emitValue(value ? value : null)
            this.cdr.markForCheck()
        }
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
