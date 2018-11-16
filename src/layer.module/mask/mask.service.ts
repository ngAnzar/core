import { Injectable, Inject } from "@angular/core"

import { Rect, RectMutationService } from "../rect-mutation.service"
import { LayerContainer } from "../layer/layer-container"
import { MaskRef, MaskStyle } from "./mask-ref"


@Injectable()
export class MaskService {
    public constructor(
        @Inject(RectMutationService) protected readonly rectMutation: RectMutationService,
        @Inject(LayerContainer) protected readonly layerContainer: LayerContainer) {
    }

    public show(target: HTMLElement | Window, style: MaskStyle, crop?: HTMLElement | Rect): MaskRef {
        const container = this.layerContainer.getCommonContainer()
        return new MaskRef(this.rectMutation, container, target, style, crop)
    }
}
