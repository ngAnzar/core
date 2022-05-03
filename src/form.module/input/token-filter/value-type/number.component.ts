import { Component } from "@angular/core"

import { TokenFilterValue } from "./abstract"


@Component({
    selector: "nz-token-filter-number",
    templateUrl: "./number.component.pug",
    providers: [
        { provide: TokenFilterValue, useExisting: TokenFilterNumberValue }
    ]
})
export class TokenFilterNumberValue extends TokenFilterValue {

}
