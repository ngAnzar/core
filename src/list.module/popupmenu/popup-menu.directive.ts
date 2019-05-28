import { Directive, Input, HostListener, Inject, Optional, Self, ViewContainerRef, ElementRef } from "@angular/core"

import { LayerFactoryDirective, TargetAnchorDirective, LevitateAnchorDirective, LayerService, DropdownLayer } from "../../layer.module"
import { PopupMenuComponent } from "./popup-menu.component"


export class MenuLayer extends DropdownLayer {

}


@Directive({
    selector: "[nzPopupMenu]",
    host: {
        "[style.cursor]": "'pointer'"
    }
})
export class PopupMenuDirective extends LayerFactoryDirective {
    @Input()
    public set nzPopupMenu(val: PopupMenuComponent) {
        this._menu = val
    }
    protected _menu: PopupMenuComponent

    public constructor(
        @Inject(LevitateAnchorDirective) @Optional() @Self() levitateAnchor: LevitateAnchorDirective,
        @Inject(TargetAnchorDirective) @Optional() @Self() targetAnchor: TargetAnchorDirective,
        @Inject(LayerService) layerSvc: LayerService,
        @Inject(ViewContainerRef) vcr: ViewContainerRef,
        @Inject(ElementRef) el: ElementRef<HTMLElement>) {
        if (!levitateAnchor) {
            levitateAnchor = new LevitateAnchorDirective("left top")
        }
        if (!targetAnchor) {
            targetAnchor = new TargetAnchorDirective("left bottom")
        }
        super(
            levitateAnchor,
            targetAnchor,
            layerSvc,
            vcr,
            el)
    }

    @HostListener("tap", ["$event"])
    protected onClick(event: MouseEvent) {
        event.preventDefault()

        this.nzLayerFactory = this._menu.layer

        if (this.isVisible) {
            this.hide()
        } else {
            let behavior = new MenuLayer({
                backdrop: {
                    type: "empty",
                    hideOnClick: true,
                    crop: this.targetEl.nativeElement
                },
                elevation: 10,
                minWidth: this.targetEl.nativeElement.offsetWidth
            })
            this.show(behavior, { $implicit: this })
        }
    }
}
