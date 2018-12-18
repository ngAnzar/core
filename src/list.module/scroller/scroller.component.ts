import { Component, Inject } from "@angular/core"

import { ScrollerService } from "./scroller.service"



@Component({
    selector: ".nz-scroller",
    templateUrl: "./scroller.template.pug",
    providers: [
        { provide: ScrollerService, useClass: ScrollerService }
    ]
})
export class ScrollerComponent {
    public constructor(@Inject(ScrollerService) public readonly scroller: ScrollerService) {

    }
}
