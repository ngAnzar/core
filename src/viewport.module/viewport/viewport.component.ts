import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, AfterViewInit, OnInit } from "@angular/core"
import { SafeStyle, DomSanitizer } from "@angular/platform-browser"
import { merge } from "rxjs"

import { Destruct } from "../../util"
import { RectMutationService } from "../../layout.module"
import { CordovaService } from "../../common.module"
import { ViewportService, VPPanelStyle } from "../viewport.service"



@Component({
    selector: ".nz-viewport",
    templateUrl: "./viewport.template.pug",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewportComponent implements AfterViewInit, OnInit {
    public readonly destruct = new Destruct()

    public contentPadding: SafeStyle
    public menuTransform: SafeStyle
    public contentTransform: SafeStyle
    public rightTransform: SafeStyle
    public overlayOpacity = 0
    public overlayDisplay = "none"
    public sidepanelMaxWidth: number

    public constructor(
        @Inject(ViewportService) public readonly vps: ViewportService,
        @Inject(ChangeDetectorRef) protected readonly cdr: ChangeDetectorRef,
        @Inject(DomSanitizer) protected readonly sanitizer: DomSanitizer,
        @Inject(RectMutationService) rectMutation: RectMutationService,
        @Inject(CordovaService) public readonly cordova: CordovaService) {

        this.destruct.subscription(rectMutation.watchViewport()).subscribe(v => {
            this.sidepanelMaxWidth = v.width * 0.8
            cdr.markForCheck()
        })
    }

    public ngOnInit() {
        this._updateLayout()
        this.destruct.subscription(merge(this.vps.menu.changes, this.vps.right.changes))
            .subscribe(this._updateLayout.bind(this))
    }

    public ngAfterViewInit() {
        this._updateLayout()
    }

    private _updateLayout() {
        let overlayVisible = false

        if (this.vps.menu.opened) {
            this.menuTransform = this.sanitizer.bypassSecurityTrustStyle("translateX(0)")

            if (this.vps.menu.style === VPPanelStyle.SLIDE) {
                this.contentTransform = this.sanitizer.bypassSecurityTrustStyle(`translateX(${this.vps.menu.width}px)`)
            } else {
                this.contentTransform = this.sanitizer.bypassSecurityTrustStyle("translateX(0)")
                overlayVisible = true
            }
        } else {
            this.menuTransform = this.sanitizer.bypassSecurityTrustStyle(`translateX(-${this.vps.menu.width + 10}px)`)
            this.contentTransform = this.sanitizer.bypassSecurityTrustStyle("translateX(0)")
        }

        if (this.vps.right.opened) {
            this.rightTransform = this.sanitizer.bypassSecurityTrustStyle("translateX(0)")
            if (this.vps.right.style === VPPanelStyle.OVERLAY) {
                overlayVisible = true
            } else {
                overlayVisible = overlayVisible || false
            }
        } else {
            this.rightTransform = this.sanitizer.bypassSecurityTrustStyle(`translateX(${this.vps.right.width + 10}px)`)
            overlayVisible = overlayVisible || false
        }

        this.overlayOpacity = overlayVisible ? 0.6 : 0
        if (overlayVisible) {
            this.overlayDisplay = "block"
        }

        this.cdr.detectChanges()
    }

    public _recalcContentPadding() {
        let padding = 0

        if (this.vps.menu.opened && this.vps.menu.style === VPPanelStyle.SLIDE) {
            padding += this.vps.menu.width
        }

        if (this.vps.right.opened && this.vps.right.style === VPPanelStyle.SLIDE) {
            padding += this.vps.right.width
        }

        if (this.contentPadding !== padding) {
            this.contentPadding = padding
            this.cdr.detectChanges()
        }
    }

    public _updateOverlayVisibility() {
        let display = this.overlayOpacity === 0 ? "none" : "block"

        if (this.overlayDisplay !== display) {
            this.overlayDisplay = display
            this.cdr.detectChanges()
        }
    }
}
