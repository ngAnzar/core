import { Component } from "@angular/core"

import { TokenFilterValue } from "./abstract"


@Component({
    selector: "nz-token-filter-date",
    templateUrl: "./date.component.pug",
    providers: [
        { provide: TokenFilterValue, useExisting: TokenFilterDateValue }
    ]
})
export class TokenFilterDateValue extends TokenFilterValue {

}
