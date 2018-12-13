import { Directive, Inject } from "@angular/core"

import { DragHandlerService } from "./drag-handler.service"


@Directive({
    selector: "[nzDragHandle]"
})
export class DragHandleDirective {
    public constructor(@Inject(DragHandlerService) public readonly service: DragHandlerService) {

    }
}
