import { Component } from "@angular/core"

import { TokenFilterValue } from "./abstract"


@Component({
    selector: "nz-token-filter-text",
    templateUrl: "./text.component.pug",
    providers: [
        { provide: TokenFilterValue, useExisting: TokenFilterTextValue }
    ]
})
export class TokenFilterTextValue extends TokenFilterValue {

}
