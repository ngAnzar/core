import { Component, Inject } from "@angular/core"

import { LAYER_MESSAGE } from "./di-tokens"


@Component({
    selector: "div.nz-layer-message",
    template: ``,
    host: { "[innerHTML]": "message" }
})
export class LayerMessageComponent {
    public constructor(@Inject(LAYER_MESSAGE) public message: string) {

    }
}
