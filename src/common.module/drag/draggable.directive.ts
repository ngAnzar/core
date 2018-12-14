import { Directive, Inject } from "@angular/core"

import { DragService } from "./drag.service"



@Directive({
    selector: "[draggable]",
    providers: [
        { provide: DragService, useClass: DragService }
    ]
})
export class DraggableDirective {
    public constructor(@Inject(DragService) public readonly service: DragService) {

    }
}
