import { Component, Inject } from "@angular/core"

import { DIALOG_MESSAGE } from "../dialog/dialog.component"


@Component({
    template: ``,
    host: {
        "[innerHTML]": "message"
    }
})
export class ToastMessageComponent {
    public constructor(@Inject(DIALOG_MESSAGE) public message: string) { }
}
