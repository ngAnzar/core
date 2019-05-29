import { Component, Inject, ViewChild } from "@angular/core"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../abstract"
import { RichtextDirective } from "./richtext.directive"


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


    writeValue(value: any): void {
        const normalizedValue = value == null ? "" : value
        this.input.value = normalizedValue
    }

    protected _handleInput(value: string | null) {
        if (!value || value.length === 0) {
            value = null
        } else if (value === "<br>") {
            value = null
            this.input.el.innerHTML = ""
        }

        return super._handleInput(value)
    }
}
