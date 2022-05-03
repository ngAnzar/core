import { Injectable, Inject } from "@angular/core"
import { AnimationBuilder } from "@angular/animations"

import { Rect } from "../../util"
import { RectMutationService } from "../../layout.module"
import { LayerContainer } from "../layer/layer-container"
import { MaskRef, MaskStyle, SimpleMaskRef, CropMaskRef } from "./mask-ref"


@Injectable()
export class MaskService {
    public constructor(
        @Inject(RectMutationService) protected readonly rectMutation: RectMutationService,
        @Inject(LayerContainer) protected readonly layerContainer: LayerContainer,
        @Inject(AnimationBuilder) protected readonly animationBuilder: AnimationBuilder) {
    }

    public show(target: HTMLElement | Window, style: MaskStyle, crop?: HTMLElement | Rect): MaskRef {
        const container = crop
            ? new CropMaskRef(this.rectMutation, this.animationBuilder, target, style, crop)
            : new SimpleMaskRef(this.rectMutation, this.animationBuilder, target, style)
        this.layerContainer.addLayerContainer(container)
        return container
    }
}
