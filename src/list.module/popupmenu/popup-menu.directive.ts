import { Directive, Input, HostListener, Inject, Optional, Self, ViewContainerRef, ElementRef, TemplateRef } from "@angular/core"

import { LayerFactoryDirective, TargetAnchorDirective, LevitateAnchorDirective, LayerService, DropdownLayer } from "../../layer.module"
import { PopupMenuComponent } from "./popup-menu.component"


export class MenuLayer extends DropdownLayer {

}


@Directive({
    selector: "[nzPopupMenu]",
    exportAs: "nzPopupMenu",
    host: {
        "[style.cursor]": "'pointer'"
    }
})
export class PopupMenuDirective extends LayerFactoryDirective {
    @Input()
    public set nzPopupMenu(val: PopupMenuComponent | TemplateRef<any>) {
        if (val instanceof PopupMenuComponent) {
            this._menu = val
        } else {
            this._tpl = val
        }
    }
    protected _menu: PopupMenuComponent
    protected _tpl: TemplateRef<any>

    @Input() public menuLikeAnimation: boolean
    @Input() public nzPopupMenuContext?: { [key: string]: any }

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

        this.nzLayerFactory = this._tpl ? this._tpl : this._menu.layer

        if (this.isVisible) {
            if (this._menu) {
                delete this._menu._layerRef
            }
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
                rounded: 3,
                minWidth: this.targetEl.nativeElement.offsetWidth,
                menuLike: this.menuLikeAnimation
            })
            const ref = this.show(behavior, { ... this.nzPopupMenuContext, $implicit: this })
            if (this._menu) {
                this._menu._layerRef = ref
            }
        }
    }
}
