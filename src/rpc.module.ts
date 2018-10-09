import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"

export { RpcSource, Rpc, RpcFlags, IRpcService, RpcMethod } from "./rpc/rpc-source"
export { RpcTransport } from "./rpc/rpc-transport"
export { ExtjsTransport } from "./rpc/extjs-transport"


@NgModule({
    imports: [
        CommonModule,
        HttpClientModule
    ],
    declarations: [

    ],
    exports: [
        HttpClientModule
    ]
})
export class RpcModule {

}
