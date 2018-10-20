import { Injectable, Inject } from "@angular/core"

import { RectMutationService } from "../rect-mutation.service"

import { LevitateRef } from "./levitate-ref"
import { Levitating, Anchor, Constraint } from "./levitate-compute"


@Injectable()
export class LevitateService {
    public constructor(
        @Inject(RectMutationService) protected rectMutation: RectMutationService) {
    }

    public levitate(levitate: Levitating, connect?: Anchor, constraint?: Constraint): LevitateRef {
        return new LevitateRef(this.rectMutation, levitate, connect, constraint)
    }
}
