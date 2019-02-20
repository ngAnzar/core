import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from "@angular/core"

import { Destruct } from "../../util"
import { ViewportService } from "../viewport.service"


@Component({
    selector: ".nz-navbar",
    templateUrl: "./navbar.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnDestroy {
    public readonly destruct = new Destruct()

    public constructor(
        @Inject(ViewportService) protected readonly vps: ViewportService,
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef) {
        this.destruct.subscription(vps.menuChanges).subscribe(cdr.detectChanges.bind(cdr))
        this.destruct.subscription(vps.navbarChanges).subscribe(cdr.detectChanges.bind(cdr))
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
