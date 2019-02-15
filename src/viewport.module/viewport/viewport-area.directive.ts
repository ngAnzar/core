import { Directive, Attribute, Inject, OnDestroy, ChangeDetectorRef, TemplateRef, ViewContainerRef } from "@angular/core"
import { partition } from "rxjs/operators"

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

        // this.outlet = new DomPortalOutlet(el.nativeElement, cmpResolver, appRef, injector)



        // const [toRender, toDestroy] = vps.query(area).pipe(partition(tpl => this.rendered.indexOf(tpl) === -1))

        this.destruct.subscription(vps.query(area)).subscribe(items => {
            let pos = 0
            for (const item of items) {
                if (this.rendered.indexOf(item) === -1) {
                    this.rendered.push(item)
                    item.viewRef = vcr.createEmbeddedView(item.tplRef, null, pos)
                } else {
                    vcr.insert(item.viewRef, pos)
                }
                pos++;
            }
            cdr.markForCheck()
        })

        // toRender.subscribe(tpl => {
        //     console.log("toRender", tpl)
        // })

        // toRender.subscribe(tpl => {
        //     console.log("toRender", tpl)
        // })

        /*
        .pipe()
        .subscribe(items => {


            this.items = items
            cdr.markForCheck()
        })*/
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
