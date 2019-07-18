import { StaticSource, Model, Field } from "../../data.module"


export class Operator extends Model {
    @Field({ primary: true }) public id: string
    @Field() public label: string
}


export const textOperators = new StaticSource(Operator, [
    { id: "eq", label: "=" },
    { id: "neq", label: "≠" },
    { id: "contains", label: "tartalmazza" },
    { id: "startsWith", label: "eleje" },
    { id: "endsWith", label: "vége" },
])
