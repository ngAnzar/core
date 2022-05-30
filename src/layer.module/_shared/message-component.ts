import { Component, Inject } from "@angular/core"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"

import { LAYER_MESSAGE } from "./di-tokens"


@Component({
    selector: "div.nz-layer-message",
    template: ``,
    host: { "[innerHTML]": "message" }
})
export class LayerMessageComponent {
    public message: SafeHtml

    public constructor(
        @Inject(DomSanitizer) sanitizer: DomSanitizer,
        @Inject(LAYER_MESSAGE) message: string) {

        this.message = sanitizer.bypassSecurityTrustHtml(message)
    }
}
