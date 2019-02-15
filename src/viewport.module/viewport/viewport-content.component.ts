import { Component, HostBinding } from "@angular/core"

import { VPContentAnimation } from "./viewport.animation"


@Component({
    selector: "nz-viewport-content",
    template: `<ng-content></ng-content>`,
    // animations: [VPContentAnimation]
})
export class ViewportContentComponent {
    // @HostBinding("@animation") public animation: any;
}
