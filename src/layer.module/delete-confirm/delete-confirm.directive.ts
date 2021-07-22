import { Directive, Inject, Input, Output, HostListener, OnDestroy, ElementRef } from "@angular/core"
import { Observable, Subject } from "rxjs"

import { Destruct } from "../../util"
import { LayerService } from "../layer/layer.service"
import { ComponentLayerRef } from "../layer/layer-ref"
import { DropdownLayer } from "../layer/layer-behavior"
import { DialogEvent } from "../dialog/dialog.service"
import { LAYER_MESSAGE, LAYER_BUTTONS } from "../_shared"
import { DeleteConfirmDialogComponent } from "./delete-confirm-dialog.component"


@Directive({
    selector: "[nzDeleteConfirm]"
})
export class DeleteConfirmDirective implements OnDestroy {
    public readonly destruct = new Destruct()

    @Input("nzDeleteConfirm") public message: string
    @Input("nzDeleteConfirmButton") public button: string = "TÖRLÉS"
    @Output("delete") public onDelete: Observable<any> = this.destruct.subject(new Subject())
    @Output("cancel") public onCancel: Observable<any> = this.destruct.subject(new Subject())

    protected layerRef: ComponentLayerRef<DeleteConfirmDialogComponent>

    public constructor(
        @Inject(LayerService) protected readonly layerSvc: LayerService,
        @Inject(ElementRef) protected readonly el: ElementRef<HTMLElement>) {
    }

    @HostListener("tap", ["$event"])
    public onTap(event: Event) {
        event.preventDefault()

        let behavior = new DropdownLayer({
            position: {
                anchor: {
                    ref: this.el.nativeElement,
                    align: "bottom right"
                },
                align: "top right"
            },
            backdrop: { hideOnClick: false, type: "filled" },
            elevation: 10,
            rounded: 3,
            menuLike: true
        })

        this.layerRef = this.layerSvc.createFromComponent(DeleteConfirmDialogComponent, behavior, null, [
            { provide: LAYER_MESSAGE, useValue: this.message },
            { provide: LAYER_BUTTONS, useValue: this.button },
        ])
        this.layerRef.show()
        this.layerRef.subscribe((event: DialogEvent<string>) => {
            if (event.type === "button") {
                if (event.button === "delete") {
                    (this.onDelete as Subject<any>).next(undefined)
                } else {
                    (this.onCancel as Subject<any>).next(undefined)
                }
            }
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
        if (this.layerRef) {
            this.layerRef.hide()
            delete this.layerRef
        }
    }
}
