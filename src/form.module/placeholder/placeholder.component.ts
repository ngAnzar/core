import { Component, ContentChild } from "@angular/core"

import { InputComponent } from "../input/abstract"


@Component({
    selector: ".nz-placeholder",
    host: {
        "[attr.hidden]": "_input.focused || _inputIsEmpty() ? '' : null",
    },
    templateUrl: "./placeholder.template.pug"
})
export class PlaceholderComponent {
    @ContentChild(InputComponent) protected _input: InputComponent<any>

    protected _inputIsEmpty() {
        let val: any = this._input.value
        if (typeof val === "string") {
            return val.length === 0
        } else if (typeof val === "number" || typeof val === "boolean") {
            return false
        } else if (Array.isArray(val)) {
            return val.length === 0
        }
        return !val
    }
}
