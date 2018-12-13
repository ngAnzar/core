import { Directive, Inject } from "@angular/core"

import { DragHandlerService } from "./drag-handler.service"



@Directive({
    selector: "[draggable]",
    providers: [
        { provide: DragHandlerService, useClass: DragHandlerService }
    ]
})
export class DraggableDirective {
    public constructor(@Inject(DragHandlerService) public readonly service: DragHandlerService) {

    }
}
