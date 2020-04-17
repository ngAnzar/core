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

    @Input() public menuLikeAnimation: boolean

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
        this.menuLikeAnimation = true
    }

    @HostListener("tap", ["$event"])
    protected onClick(event: MouseEvent) {
        event.preventDefault()

        this.nzLayerFactory = this._menu.layer

        if (this.isVisible) {
            delete this._menu._layerRef
            this.hide()
        } else {
            let behavior = new MenuLayer({
                closeable: true,
                backdrop: {
                    type: "empty",
                    hideOnClick: true,
                    crop: this.targetEl.nativeElement
                },
                trapFocus: true,
                elevation: 10,
                minWidth: this.targetEl.nativeElement.offsetWidth,
                menuLike: this.menuLikeAnimation
            })
            this._menu._layerRef = this.show(behavior, { $implicit: this })
        }
    }
}
