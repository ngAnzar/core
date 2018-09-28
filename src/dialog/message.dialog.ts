import { Component, Inject } from "@angular/core"

import { DIALOG_MESSAGE } from "./dialog.component"


@Component({
    selector: ".nz-dialog-message",
    template: ``,
    host: {
        "class": "nz-dialog-content",
        "[innerHTML]": "message"
    }
})
export class MessageDialog {
    public constructor(@Inject(DIALOG_MESSAGE) public message: string) {

    }
}
