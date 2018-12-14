import { Directive, Inject, ElementRef, ChangeDetectorRef, OnDestroy } from "@angular/core"

import { Destruct } from "../../util"
import { DragService } from "./drag.service"


@Directive({
    selector: "[nzDragHandle]",
    host: {
        "[style.user-select]": "'none'",
        "[style.-moz-user-select]": "'none'",
        "[style.-ms-user-select]": "'none'",
        "[style.cursor]": "isDragging ? 'move' : 'grab'",
        "[attr.unselectable]": "'on'"
    }
})
export class DragHandleDirective implements OnDestroy {
    public readonly destruct = new Destruct()
    public readonly isDragging: boolean = false

    public constructor(
        @Inject(ElementRef) el: ElementRef<HTMLElement>,
        @Inject(DragService) service: DragService,
        @Inject(ChangeDetectorRef) cdr: ChangeDetectorRef) {
        service.handle = el.nativeElement

        this.destruct.subscription(service.dragging).subscribe(event => {
            (this as any).isDragging = event.type === "drag"
            cdr.detectChanges()
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
