import { Directive, Inject, Input, Attribute, TemplateRef, ViewContainerRef, OnDestroy } from "@angular/core"

import { ViewportService, VPItem } from "../viewport.service"


@Directive({
    selector: "ng-template[nzViewportItem]"
})
export class ViewportItemDirective implements OnDestroy {
    public readonly area: string
    public readonly order: number
    public readonly item: VPItem

    public constructor(
        @Attribute("nzViewportItem") nzViewportItem: string,
        @Inject(ViewportService) protected readonly vps: ViewportService,
        @Inject(TemplateRef) tpl: TemplateRef<any>,
        @Inject(ViewContainerRef) vcr: ViewContainerRef) {

        let parts = nzViewportItem.split(/\s*:\s*/)
        this.area = parts[0]
        this.order = Number(parts[1])

        // console.log("nzViewportItem", { area: this.area, order: this.order }, vps)

        this.item = vps.addItem(this.area, this.order, tpl)
    }

    public ngOnDestroy() {
        this.vps.delItem(this.item)
    }
}
