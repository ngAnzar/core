import { Component, OnDestroy, OnInit } from "@angular/core"
import * as autosize from "autosize"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"


@Component({
    selector: "input.nz-input:not([type]), input[type='password'].nz-input, input[type='text'].nz-input, input[type='email'].nz-input",
    template: "",
    host: {
        "[attr.id]": "id",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(input)": "_handleInput($event.target.value)"
    },
    providers: [
        { provide: InputComponent, useExisting: TextFieldComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class TextFieldComponent extends InputComponent<string> {
    public get type(): string { return "text" }

    writeValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        this.el.nativeElement.value = normalizedValue
    }

    protected _handleInput(value: string | null) {
        if (!value || value.length === 0) {
            value = null
        }
        return super._handleInput(value)
    }
}


@Component({
    selector: "textarea.nz-input",
    template: "",
    host: {
        "[attr.id]": "id",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(input)": "_handleInput($event.target.value)"
    },
    providers: [
        { provide: InputComponent, useExisting: TextareaComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class TextareaComponent extends InputComponent<string> implements OnDestroy, OnInit {
    public get type(): string { return "text" }

    writeValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        this.el.nativeElement.value = normalizedValue
    }

    public ngOnInit() {
        autosize(this.el.nativeElement)
    }

    public ngOnDestroy() {
        autosize.destroy(this.el.nativeElement)
        super.ngOnDestroy()
    }

    protected _handleInput(value: string | null) {
        if (!value || value.length === 0) {
            value = null
        }
        return super._handleInput(value)
    }
}
