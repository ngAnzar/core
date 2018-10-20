import { Component } from "@angular/core"
import { format } from "date-fns"

import { InputComponent, INPUT_VALUE_ACCESSOR } from "../input/input.component"


@Component({
    selector: "input[type=date].nz-input",
    templateUrl: "./date-input.template.pug",
    host: {
        "[attr.id]": "id",
        "[attr.valueAsDate]": "''",
        "[class.nz-has-value]": "!!value",
        "(focus)": "_handleFocus(true)",
        "(blur)": "_handleFocus(false)",
        "(input)": "_handleInput($event.target.value)"
    },
    providers: [
        { provide: InputComponent, useExisting: DateInputComponent },
        INPUT_VALUE_ACCESSOR
    ]
})
export class DateInputComponent extends InputComponent<Date> {
    public get type(): string { return "text" }

    public writeValue(obj: Date): void {
        (this.el.nativeElement as HTMLInputElement).value = format(obj, "YYYY-MM-DD")
    }
}
