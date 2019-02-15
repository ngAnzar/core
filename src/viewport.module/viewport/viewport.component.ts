import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, AfterViewInit, ViewChild, ElementRef } from "@angular/core"

import { Destruct } from "../../util"
import { ViewportService, VPMenuStyle } from "../viewport.service"
import { VPAnimState, VPSidenavAnimation, VPContentAnimation, VPOverlayAnimation } from "./viewport.animation"



@Component({
    selector: ".nz-viewport",
    templateUrl: "./viewport.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        VPSidenavAnimation,
        VPContentAnimation,
        VPOverlayAnimation
    ]
})
export class ViewportComponent implements AfterViewInit {
    @ViewChild("sidenav", { read: ElementRef }) public readonly sidenav: ElementRef<HTMLElement>

    public readonly destruct = new Destruct()
    public animationState: {
        value: VPAnimState,
        params: {
            sidenavWidth: number
        }
    }

    public constructor(
        @Inject(ViewportService) protected readonly vps: ViewportService,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef) {

        this._updateAnimState()
        this.destruct.subscription(vps.menuChanges).subscribe(this._updateAnimState.bind(this))
    }

    public ngAfterViewInit() {
        this._updateAnimState()
    }

    private _updateAnimState() {
        let value: VPAnimState
        let params: { sidenavWidth: number } = {} as any

        if (this.sidenav) {
            params.sidenavWidth = this.sidenav.nativeElement.offsetWidth
        }

        if (this.vps.menuOpened) {
            value = this.vps.menuStyle === VPMenuStyle.SLIDE
                ? VPAnimState.MENU_OPEN_SLIDE
                : VPAnimState.MENU_OPEN_OVERLAY
        } else {
            value = this.vps.menuStyle === VPMenuStyle.SLIDE
                ? VPAnimState.MENU_CLOSE_SLIDE
                : VPAnimState.MENU_CLOSE_OVERLAY
        }

        this.animationState = { value, params }
        console.log(this.animationState)
        if (this.sidenav) {
            this.cdr.detectChanges()
        }
    }
}
