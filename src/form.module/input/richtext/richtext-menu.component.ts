import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core"

import { RichtextStream } from "./richtext-stream"


@Component({
    selector: "richtext-menu",
    host: {
        "(mouseenter)": "mouseIsOver=true",
        "(mouseleave)": "mouseIsOver=false",
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./richtext-menu.component.pug"
})
export class RichtextMenu {
    public readonly mouseIsOver: boolean = false

    public constructor(
        @Inject(RichtextStream) protected readonly stream: RichtextStream,
        @Inject(ChangeDetectorRef) public readonly cdr: ChangeDetectorRef) {
    }
}
