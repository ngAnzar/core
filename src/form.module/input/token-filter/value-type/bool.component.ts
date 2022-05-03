import { Component } from "@angular/core"

import { TokenFilterValue } from "./abstract"


@Component({
    selector: "nz-token-filter-bool",
    templateUrl: "./bool.component.pug",
    providers: [
        { provide: TokenFilterValue, useExisting: TokenFilterBoolValue }
    ]
})
export class TokenFilterBoolValue extends TokenFilterValue {

}
