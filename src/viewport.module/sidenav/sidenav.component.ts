import { Component, HostBinding } from "@angular/core"

import { VPSidenavAnimation } from "../viewport/viewport.animation"


@Component({
    selector: ".nz-sidenav",
    template: `<ng-template nzViewportArea="sidenav"></ng-template>`,
    // animations: [VPSidenavAnimation]
})
export class SidenavComponent {
    // @HostBinding("@animation") public animation: any
}
