import { Directive, Attribute, Inject, OnDestroy, ChangeDetectorRef, ViewContainerRef } from "@angular/core"

import { Destruct } from "../../util"
import { ViewportService, VPItem } from "../viewport.service"


@Directive({
    selector: "ng-template[nzViewportArea]"
})
export class ViewportAreaDirective implements OnDestroy {
    public readonly destruct = new Destruct()

    private rendered: Array<VPItem> = []

    public constructor(
        @Attribute("nzViewportArea") public readonly area: string,
        @Inject(ViewportService) vps: ViewportService,
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef,
        @Inject(ViewContainerRef) vcr: ViewContainerRef) {

        this.destruct.subscription(vps.query(area)).subscribe(items => {
            this.rendered = this.rendered.filter(v => v.viewRef && !v.viewRef.destroyed)
            let pos = 0
            for (const item of items) {
                if (this.rendered.indexOf(item) === -1) {
                    this.rendered.push(item)
                    item.viewRef = vcr.createEmbeddedView(item.tplRef, null, pos)
                } else {
                    vcr.insert(item.viewRef, pos)
                }
                pos++
            }
            cdr.markForCheck()
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
