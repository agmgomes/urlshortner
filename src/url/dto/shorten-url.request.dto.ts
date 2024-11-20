import { IsNotEmpty } from "class-validator";
import { IsHttpUrl } from "src/common/decorators/is-http-url.decorator";

export class ShortenUrlRequest {
    @IsNotEmpty()
    @IsHttpUrl()
    url: string;
}